"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeNote from "@/lib/database/models/lifeNote.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { verifyPin } from "@/lib/life/crypto";
import { createInAppNotification } from "@/lib/actions/lifeNotification.actions";
import LifeRequest from "@/lib/database/models/lifeRequest.model";
import { NoteType, NoteStatus, ILifeNote, IFutureNoteItem } from "@/types";

/**
 * Checks if the caller has permission to view a specific note in the Notes section.
 * STRICT CORE RULE: The Notes/LifeNote Section must NEVER contain a Locked Note.
 * Any note that appears in the user's Notes Section must already be released and fully viewable.
 */
function canViewNote(
  note: any,
  auth: { isOwner: boolean; isAdmin: boolean; personId?: string; role?: string }
): { allowed: boolean; maskSecret: boolean } {
  if (auth.isOwner || auth.role === "super_admin") {
    return { allowed: true, maskSecret: false };
  }

  const isAssigned =
    Boolean(auth.personId) &&
    String(note.assignedPersonId?._id || note.assignedPersonId) === String(auth.personId);

  // Internal admin notes are never visible to normal users
  if (note.noteType === "internal_admin") {
    return { allowed: auth.isAdmin, maskSecret: false };
  }

  // If user is not assigned and not admin/owner, deny
  if (!isAssigned && !auth.isAdmin) {
    return { allowed: false, maskSecret: false };
  }

  // Admin sees all notes in manage mode
  if (auth.isAdmin) {
    return { allowed: true, maskSecret: false };
  }

  // Non-admin assigned users: MUST be released!
  // Future/locked notes belong strictly to the Request Center workflow.
  if (!note.isReleased) {
    return { allowed: false, maskSecret: false };
  }

  return { allowed: true, maskSecret: false };
}

/**
 * Automatically checks and releases any notes whose scheduled release date or
 * waiting period countdown has expired without being rejected.
 * Also synchronizes the linked LifeRequest if one exists.
 */
export async function checkAndAutoReleaseNotes() {
  await connectToDatabase();
  const now = new Date();

  // Find all unreleased notes that are ready to release
  const eligibleNotes = await LifeNote.find({
    isArchived: false,
    isReleased: false,
    $or: [
      {
        noteType: "scheduled_release",
        scheduledReleaseDate: { $lte: now },
      },
      {
        status: { $in: ["countdown_active", "unlock_requested"] },
        unlockDeadline: { $lte: now },
      },
    ],
  }).populate("assignedPersonId", "name email");

  for (const note of eligibleNotes) {
    note.isReleased = true;
    note.status = "released";
    note.releasedAt = now;
    note.releasedBy =
      note.noteType === "scheduled_release"
        ? "Scheduled Release Date Passed"
        : "Auto-Released (Waiting Period Expired)";

    note.history = note.history || [];
    note.history.push({
      changedAt: now,
      changedBy: "System (Auto-Release)",
      action: "auto_released",
    });

    await note.save();

    // Auto-approve linked LifeRequest in Request Center if any
    try {
      await LifeRequest.updateMany(
        {
          relatedRecordId: String(note._id),
          relatedRecordType: "LifeNote",
          status: { $in: ["pending", "in_review"] },
        },
        {
          $set: {
            status: "approved",
            adminResponse: "Automatically approved upon waiting period completion.",
            resolvedBy: "System (Auto-Release)",
            resolvedAt: now,
          },
          $inc: { unreadByUser: 1 },
        }
      );
    } catch (e) {
      console.error("Error updating linked requests for auto-released note:", e);
    }

    // Send in-app notification to assigned user
    const assigned = note.assignedPersonId as any;
    if (assigned?.email) {
      await createInAppNotification({
        recipientEmail: assigned.email,
        recipientPersonId: String(assigned._id || note.assignedPersonId),
        title: "Note Released",
        message: `Your note "${note.title}" has been released and is now available in your Notes section.`,
        type: "note_released",
        link: "/lifenote",
      });
    }

    await logLifeActivity({
      action: "FUTURE_NOTE_AUTO_RELEASED",
      resourceType: "note",
      resourceId: String(note._id),
      resourceName: note.title,
      details: `Note "${note.title}" automatically released after waiting period/scheduled release.`,
    });
  }
}

/**
 * Retrieves notes for a given person.
 * For non-admins, returns ONLY released notes (locked notes are handled via Request Center).
 */
export async function getPersonNotes(personId: string): Promise<ILifeNote[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  // IDOR check: non-admin can only access own notes
  if (!auth.isOwner && !auth.isAdmin && String(auth.personId) !== String(personId)) {
    return [];
  }

  // Check & process any auto-releases first
  await checkAndAutoReleaseNotes();

  const query: Record<string, any> = {
    assignedPersonId: personId,
    isArchived: false,
  };

  // STRICT: Non-admins only see released notes in notes views!
  if (!auth.isOwner && !auth.isAdmin) {
    query.isReleased = true;
  }

  const notes = await LifeNote.find(query)
    .populate("assignedPersonId", "name email relation role")
    .sort({ isPinned: -1, createdAt: -1 })
    .lean();

  const results: any[] = [];
  for (const n of notes as any[]) {
    const { allowed } = canViewNote(n, auth);
    if (!allowed) continue;
    results.push(n);
  }

  return JSON.parse(JSON.stringify(results));
}

/**
 * Creates a new note for an assigned person.
 */
export async function createNote(data: {
  title: string;
  content: string;
  noteType: NoteType;
  assignedPersonId: string;
  priority?: "low" | "medium" | "high" | "critical";
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  waitingPeriodHours?: number;
  scheduledReleaseDate?: string;
  securityPin?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  // Re-verify Master PIN if creating a Secret Note
  if (data.noteType === "secret_emergency") {
    if (!data.securityPin) {
      throw new Error("Master PIN verification required to create a Secret Note.");
    }
    const settings = (await LifeSettings.findOne().lean()) as any;
    const pinHash = settings?.masterPinHash;
    const isValid = verifyPin(data.securityPin, pinHash);
    if (!isValid) {
      throw new Error("Incorrect Master PIN. Secret Note creation cancelled.");
    }
  }

  const assignedPerson = (await LifePerson.findById(data.assignedPersonId).lean()) as any;
  if (!assignedPerson) throw new Error("Assigned person not found.");

  const isReleasedByDefault =
    data.noteType === "always_visible" || data.noteType === "internal_admin";

  const initialStatus: NoteStatus =
    data.noteType === "secret_emergency"
      ? "locked"
      : isReleasedByDefault
      ? "released"
      : "locked";

  const note = await LifeNote.create({
    title: data.title.trim(),
    content: data.content,
    noteType: data.noteType,
    assignedPersonId: data.assignedPersonId,
    assignedPersonName: assignedPerson.name,
    createdBy: auth.email,
    createdByName: auth.name,
    priority: data.priority || "medium",
    category: data.category || "General",
    tags: data.tags || [],
    isPinned: Boolean(data.isPinned),
    status: initialStatus,
    waitingPeriodHours: data.waitingPeriodHours || 48,
    scheduledReleaseDate: data.scheduledReleaseDate
      ? new Date(data.scheduledReleaseDate)
      : undefined,
    isReleased: isReleasedByDefault,
    releasedAt: isReleasedByDefault ? new Date() : undefined,
    releasedBy: isReleasedByDefault ? auth.email : undefined,
    history: [
      {
        changedAt: new Date(),
        changedBy: `${auth.name} (${auth.email})`,
        action: "created",
        newContent: data.content,
        newNoteType: data.noteType,
        newWaitingPeriod: data.waitingPeriodHours || 48,
      },
    ],
  });

  // Notify assigned user if shared and visible
  if (data.noteType === "always_visible" && assignedPerson.email) {
    await createInAppNotification({
      recipientEmail: assignedPerson.email,
      recipientPersonId: String(assignedPerson._id),
      title: "New Note Shared with You",
      message: `${auth.name} shared a note: "${data.title}"`,
      type: "note_shared",
      link: `/people/${assignedPerson._id}?tab=notes`,
    });
  }

  await logLifeActivity({
    action: "CREATE_NOTE",
    resourceType: "note",
    resourceId: String(note._id),
    resourceName: note.title,
    details: `Created ${data.noteType} note "${note.title}" for ${assignedPerson.name}`,
    metadata: { noteType: data.noteType, assignedPersonId: data.assignedPersonId },
  });

  revalidatePath(`/people/${data.assignedPersonId}`);
  return JSON.parse(JSON.stringify(note));
}

/**
 * Updates a note, preserving version history.
 */
export async function updateNote(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    priority: "low" | "medium" | "high" | "critical";
    category: string;
    tags: string[];
    isPinned: boolean;
    noteType: NoteType;
    waitingPeriodHours: number;
    scheduledReleaseDate?: string;
  }>,
  securityPin?: string
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const note = await LifeNote.findById(id);
  if (!note) throw new Error("Note not found.");

  // PIN re-verification if editing Secret Note
  if (note.noteType === "secret_emergency" || data.noteType === "secret_emergency") {
    if (!securityPin) {
      throw new Error("Master PIN required to modify a Secret Note.");
    }
    const settings = (await LifeSettings.findOne().lean()) as any;
    const isValid = verifyPin(securityPin, settings?.masterPinHash);
    if (!isValid) throw new Error("Incorrect Master PIN.");
  }

  // Preserve history
  const historyEntry = {
    changedAt: new Date(),
    changedBy: `${auth.name} (${auth.email})`,
    action: "edited",
    previousContent: note.content,
    newContent: data.content !== undefined ? data.content : note.content,
    previousNoteType: note.noteType,
    newNoteType: data.noteType || note.noteType,
    previousWaitingPeriod: note.waitingPeriodHours,
    newWaitingPeriod: data.waitingPeriodHours || note.waitingPeriodHours,
  };

  note.history = note.history || [];
  note.history.push(historyEntry);

  if (data.title !== undefined) note.title = data.title.trim();
  if (data.content !== undefined) note.content = data.content;
  if (data.priority !== undefined) note.priority = data.priority;
  if (data.category !== undefined) note.category = data.category.trim();
  if (data.tags !== undefined) note.tags = data.tags;
  if (data.isPinned !== undefined) note.isPinned = data.isPinned;
  if (data.noteType !== undefined) note.noteType = data.noteType;
  if (data.waitingPeriodHours !== undefined) note.waitingPeriodHours = data.waitingPeriodHours;
  if (data.scheduledReleaseDate !== undefined) {
    note.scheduledReleaseDate = data.scheduledReleaseDate
      ? new Date(data.scheduledReleaseDate)
      : undefined;
  }
  note.lastEditedBy = auth.email;

  await note.save();

  await logLifeActivity({
    action: "UPDATE_NOTE",
    resourceType: "note",
    resourceId: id,
    resourceName: note.title,
    details: `Updated note "${note.title}"`,
    previousValue: historyEntry.previousContent,
    newValue: historyEntry.newContent,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
  return JSON.parse(JSON.stringify(note));
}

/**
 * Initiates an Unlock Request for a Secret Note (§8, §9).
 */
export async function requestNoteUnlock(noteId: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const note = await LifeNote.findById(noteId);
  if (!note) throw new Error("Note not found.");

  if (note.noteType !== "secret_emergency") {
    throw new Error("Unlock requests only apply to Secret Notes.");
  }

  if (note.isReleased) {
    throw new Error("This note is already unlocked.");
  }

  const hours = note.waitingPeriodHours || 48;
  const now = new Date();
  const deadline = new Date(now.getTime() + hours * 3600 * 1000);

  note.status = "countdown_active";
  note.unlockRequestedAt = now;
  note.unlockRequestedBy = `${auth.name} (${auth.email})`;
  note.unlockDeadline = deadline;

  note.history = note.history || [];
  note.history.push({
    changedAt: now,
    changedBy: `${auth.name} (${auth.email})`,
    action: "unlock_requested",
    previousWaitingPeriod: hours,
    newWaitingPeriod: hours,
  });

  await note.save();

  // Notify Super Admin
  const adminDoc = (await LifePerson.findOne({ role: { $in: ["super_admin", "owner"] } }).lean()) as any;
  if (adminDoc?.email) {
    await createInAppNotification({
      recipientEmail: adminDoc.email,
      title: "Secret Note Unlock Request",
      message: `${auth.name} has requested unlock for Secret Note "${note.title}". Waiting period: ${hours}h.`,
      type: "unlock_request",
      link: `/people/${note.assignedPersonId}?tab=notes`,
    });
  }

  await logLifeActivity({
    action: "SECRET_NOTE_UNLOCK_REQUESTED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Unlock requested by ${auth.name} for "${note.title}". Waiting deadline: ${deadline.toISOString()}`,
    isCritical: true,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
  return JSON.parse(JSON.stringify(note));
}

/**
 * Approves and immediately releases a Secret Note.
 */
export async function approveNoteUnlock(noteId: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can approve unlock requests.");
  }

  const note = await LifeNote.findById(noteId);
  if (!note) throw new Error("Note not found.");

  const now = new Date();
  note.status = "approved";
  note.isReleased = true;
  note.releasedAt = now;
  note.releasedBy = `${auth.name} (${auth.email})`;

  note.history = note.history || [];
  note.history.push({
    changedAt: now,
    changedBy: `${auth.name} (${auth.email})`,
    action: "approved",
  });

  await note.save();

  // Sync linked LifeRequest in Request Center if exists
  try {
    await LifeRequest.updateMany(
      {
        relatedRecordId: noteId,
        relatedRecordType: "LifeNote",
        status: { $in: ["pending", "in_review"] },
      },
      {
        $set: {
          status: "approved",
          resolvedBy: auth.name,
          resolvedAt: now,
        },
        $inc: { unreadByUser: 1 },
      }
    );
  } catch (e) {
    console.error("Error updating linked request on note approval:", e);
  }

  // Notify assigned user
  const assigned = (await LifePerson.findById(note.assignedPersonId).lean()) as any;
  if (assigned?.email) {
    await createInAppNotification({
      recipientEmail: assigned.email,
      recipientPersonId: String(assigned._id),
      title: "Note Request Approved",
      message: `Your access request for "${note.title}" was approved. The note is now available in your Notes section.`,
      type: "note_released",
      link: "/lifenote",
    });
  }

  await logLifeActivity({
    action: "NOTE_APPROVED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Approved and unlocked note "${note.title}" by ${auth.name}`,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
  revalidatePath("/lifenote");
  revalidatePath("/requests");
  return JSON.parse(JSON.stringify(note));
}

/**
 * Rejects an Unlock Request.
 */
export async function rejectNoteUnlock(noteId: string, reason: string = "") {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can reject unlock requests.");
  }

  const note = await LifeNote.findById(noteId);
  if (!note) throw new Error("Note not found.");

  const now = new Date();
  note.status = "request_rejected";
  note.isReleased = false;

  note.history = note.history || [];
  note.history.push({
    changedAt: now,
    changedBy: `${auth.name} (${auth.email})`,
    action: `rejected: ${reason || "No reason specified"}`,
  });

  await note.save();

  // Sync linked LifeRequest in Request Center if exists
  try {
    await LifeRequest.updateMany(
      {
        relatedRecordId: noteId,
        relatedRecordType: "LifeNote",
        status: { $in: ["pending", "in_review"] },
      },
      {
        $set: {
          status: "rejected",
          adminResponse: reason || "Access request rejected.",
          resolvedBy: auth.name,
          resolvedAt: now,
        },
        $inc: { unreadByUser: 1 },
      }
    );
  } catch (e) {
    console.error("Error updating linked request on note rejection:", e);
  }

  // Notify assigned user
  const assigned = (await LifePerson.findById(note.assignedPersonId).lean()) as any;
  if (assigned?.email) {
    await createInAppNotification({
      recipientEmail: assigned.email,
      recipientPersonId: String(assigned._id),
      title: "Unlock Request Rejected",
      message: `Your unlock request for "${note.title}" was rejected. Reason: ${reason || "Security policy"}.`,
      type: "request_rejected",
      link: "/requests",
    });
  }

  await logLifeActivity({
    action: "NOTE_ACCESS_REJECTED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Rejected unlock request for "${note.title}" by ${auth.name}. Reason: ${reason}`,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
  revalidatePath("/lifenote");
  revalidatePath("/requests");
  return JSON.parse(JSON.stringify(note));
}

/**
 * Cancels an Unlock Request (can be done by Super Admin OR by requesting User).
 */
export async function cancelNoteUnlock(noteId: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const note = await LifeNote.findById(noteId);
  if (!note) throw new Error("Note not found.");

  const isAssigned =
    Boolean(auth.personId) && String(note.assignedPersonId) === String(auth.personId);

  if (!auth.isOwner && !auth.isAdmin && !isAssigned) {
    throw new Error("Forbidden: You cannot cancel this unlock request.");
  }

  const now = new Date();
  note.status = "request_cancelled";
  note.unlockDeadline = undefined;

  note.history = note.history || [];
  note.history.push({
    changedAt: now,
    changedBy: `${auth.name} (${auth.email})`,
    action: "cancelled",
  });

  await note.save();

  // Sync linked LifeRequest in Request Center if exists
  try {
    await LifeRequest.updateMany(
      {
        relatedRecordId: noteId,
        relatedRecordType: "LifeNote",
        status: { $in: ["pending", "in_review"] },
      },
      {
        $set: {
          status: "cancelled",
          resolvedBy: auth.name,
          resolvedAt: now,
        },
      }
    );
  } catch (e) {
    console.error("Error updating linked request on note cancellation:", e);
  }

  await logLifeActivity({
    action: "NOTE_REQUEST_CANCELLED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Cancelled unlock request for "${note.title}" by ${auth.name}`,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
  revalidatePath("/lifenote");
  revalidatePath("/requests");
  return JSON.parse(JSON.stringify(note));
}

/**
 * Extends the waiting-period countdown deadline for a Secret Note.
 */
export async function extendNoteUnlock(noteId: string, additionalHours: number) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can extend waiting periods.");
  }

  const note = await LifeNote.findById(noteId);
  if (!note) throw new Error("Note not found.");

  if (!note.unlockDeadline) {
    throw new Error("No active unlock countdown to extend.");
  }

  const currentDeadline = new Date(note.unlockDeadline);
  const newDeadline = new Date(currentDeadline.getTime() + additionalHours * 3600 * 1000);
  note.unlockDeadline = newDeadline;

  note.history = note.history || [];
  note.history.push({
    changedAt: new Date(),
    changedBy: `${auth.name} (${auth.email})`,
    action: `extended_countdown_+${additionalHours}h`,
  });

  await note.save();

  await logLifeActivity({
    action: "SECRET_NOTE_EXTENDED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Extended unlock countdown for "${note.title}" by ${additionalHours} hours to ${newDeadline.toISOString()}`,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
  return JSON.parse(JSON.stringify(note));
}

/**
 * Re-locks a released Secret Note (§10, §11). Restricted to Owner/Super Admin.
 */
export async function relockNote(noteId: string, securityPin?: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && auth.role !== "super_admin")) {
    throw new Error("Forbidden: Only Owner or Super Admin can re-lock sensitive information.");
  }

  if (securityPin) {
    const settings = (await LifeSettings.findOne().lean()) as any;
    const isValid = verifyPin(securityPin, settings?.masterPinHash);
    if (!isValid) throw new Error("Incorrect Master PIN. Re-lock cancelled.");
  }

  const note = await LifeNote.findById(noteId);
  if (!note) throw new Error("Note not found.");

  const now = new Date();
  note.status = "relocked";
  note.isReleased = false;
  note.relockedAt = now;
  note.relockedBy = `${auth.name} (${auth.email})`;
  note.unlockDeadline = undefined;

  note.history = note.history || [];
  note.history.push({
    changedAt: now,
    changedBy: `${auth.name} (${auth.email})`,
    action: "relocked",
  });

  await note.save();

  await logLifeActivity({
    action: "SECRET_NOTE_RELOCKED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Re-locked sensitive note "${note.title}" by ${auth.name}`,
    isCritical: true,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
  return JSON.parse(JSON.stringify(note));
}

/**
 * Records an interactive follow-up action on a released note/instruction (§12).
 * Actions: 'read', 'acknowledge', 'followup', 'completed', 'response'.
 */
export async function recordNoteUserAction(
  noteId: string,
  action: "read" | "acknowledge" | "followup" | "completed" | "response",
  responseMessage?: string
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const note = await LifeNote.findById(noteId);
  if (!note) throw new Error("Note not found.");

  const now = new Date();
  note.userActions = note.userActions || {};

  if (action === "read") {
    note.userActions.readAt = now;
  } else if (action === "acknowledge") {
    note.userActions.acknowledgedAt = now;
  } else if (action === "followup") {
    note.userActions.followUpRequired = !note.userActions.followUpRequired;
  } else if (action === "completed") {
    note.userActions.completedAt = now;
  } else if (action === "response") {
    if (!responseMessage?.trim()) throw new Error("Response message cannot be empty.");
    note.userActions.responses = note.userActions.responses || [];
    note.userActions.responses.push({
      respondedAt: now,
      respondedBy: `${auth.name} (${auth.email})`,
      message: responseMessage.trim(),
    });
  }

  await note.save();

  await logLifeActivity({
    action: `NOTE_ACTION_${action.toUpperCase()}`,
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `User action "${action}" recorded on note "${note.title}" by ${auth.name}`,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
  return JSON.parse(JSON.stringify(note));
}

/**
 * Archives a note.
 */
export async function archiveNote(noteId: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can archive notes.");
  }

  const note = await LifeNote.findByIdAndUpdate(
    noteId,
    { $set: { isArchived: true, status: "archived" } },
    { new: true }
  );

  if (note) {
    await logLifeActivity({
      action: "ARCHIVE_NOTE",
      resourceType: "note",
      resourceId: noteId,
      resourceName: note.title,
      details: `Archived note "${note.title}"`,
    });
    revalidatePath(`/people/${note.assignedPersonId}`);
    revalidatePath("/lifenote");
  }

  return { success: true };
}

/**
 * Retrieves all notes accessible to the current user across all people for /lifenote.
 * STRICT RULE: The Notes/LifeNote Section must never contain a Locked Note.
 * Any Note that appears in the user's Notes Section must already be released and fully viewable.
 */
export async function getAllNotes(): Promise<ILifeNote[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  // Run auto-release engine so newly expired waiting periods are released
  await checkAndAutoReleaseNotes();

  const query: Record<string, unknown> = {
    isArchived: false,
  };

  // If not owner or admin, restrict to notes assigned to current person AND strictly isReleased: true
  if (!auth.isOwner && !auth.isAdmin) {
    if (!auth.personId) return [];
    query.assignedPersonId = auth.personId;
    query.isReleased = true; // Strict separation: only released notes in Notes section!
  }

  const notes = await LifeNote.find(query)
    .populate("assignedPersonId", "name email relation role profilePhoto avatarUrl")
    .sort({ isPinned: -1, createdAt: -1 })
    .lean();

  const results: any[] = [];
  for (const n of notes as any[]) {
    const { allowed } = canViewNote(n, auth);
    if (!allowed) continue;
    results.push(n);
  }

  return JSON.parse(JSON.stringify(results));
}

/**
 * Records that a user has opened and viewed an assigned Note for the first time.
 * Triggers a "Seen" notification to the Owner.
 */
export async function markNoteSeen(noteId: string) {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const note = await LifeNote.findById(noteId);
    if (!note) return { success: false, error: "Note not found." };

    // If owner or super admin opens it, don't generate seen notification to themselves
    if (auth.isOwner || auth.role === "super_admin") {
      return { success: true, alreadySeen: true };
    }

    // Check if already seen
    if (note.userActions?.readAt) {
      return { success: true, alreadySeen: true };
    }

    const now = new Date();
    note.userActions = note.userActions || {};
    note.userActions.readAt = now;
    await note.save();

    // Find Owner / Super Admin email
    const ownerDoc = (await LifePerson.findOne({
      role: { $in: ["owner", "super_admin"] },
      status: { $ne: "archived" },
    }).lean()) as any;

    if (ownerDoc?.email) {
      await createInAppNotification({
        recipientEmail: ownerDoc.email,
        title: `Note Viewed: ${note.title}`,
        message: `${auth.name} has opened and viewed "${note.title}".`,
        type: "note_seen",
        link: `/lifenote`,
      });
    }

    await logLifeActivity({
      action: "NOTE_SEEN",
      resourceType: "note",
      resourceId: noteId,
      resourceName: note.title,
      details: `${auth.name} opened note "${note.title}" for the first time.`,
    });

    return { success: true, readAt: now };
  } catch (error: any) {
    console.error("Error in markNoteSeen:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Provides a "Need Help" action when viewing a note.
 * Sends a message to the Owner containing the relevant Note Reference
 * so the Owner knows exactly which Note the user needs help with.
 */
export async function requestNoteHelp(noteId: string, helpMessage: string) {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) throw new Error("Unauthorized");

    const note = await LifeNote.findById(noteId);
    if (!note) throw new Error("Note not found.");

    const desc =
      helpMessage?.trim() ||
      `User requested assistance with note "${note.title}".`;

    const request = await LifeRequest.create({
      submittedByPersonId: auth.personId || undefined,
      submittedByUserId: auth.userId,
      submittedByName: auth.name,
      submittedByEmail: auth.email.toLowerCase().trim(),
      submittedByRole: auth.role,
      category: "note_access",
      title: `Need Help: ${note.title}`,
      description: desc,
      relatedRecordId: String(note._id),
      relatedRecordType: "LifeNote",
      relatedRecordName: note.title,
      status: "pending",
      messages: [
        {
          senderId: auth.userId,
          senderName: auth.name,
          senderRole: auth.role,
          message: desc,
          isRead: false,
          createdAt: new Date(),
        },
      ],
      unreadByAdmin: 1,
      unreadByUser: 0,
      isNewForAdmin: true,
    });

    // Notify Owner / Super Admins
    const ownerDoc = (await LifePerson.findOne({
      role: { $in: ["owner", "super_admin"] },
      status: { $ne: "archived" },
    }).lean()) as any;

    if (ownerDoc?.email) {
      await createInAppNotification({
        recipientEmail: ownerDoc.email,
        title: `Assistance Requested: ${note.title}`,
        message: `${auth.name} requested help regarding note "${note.title}": "${desc.slice(0, 100)}${desc.length > 100 ? "..." : ""}"`,
        type: "new_request",
        link: `/requests?id=${request._id}`,
      });
    }

    // Post directly into User <-> Super Admin conversation with Note reference
    try {
      const { postNoteHelpToConversation } = await import(
        "@/lib/actions/lifeConversation.actions"
      );
      await postNoteHelpToConversation({
        noteId: String(note._id),
        noteTitle: note.title,
        helpMessage: desc,
      });
    } catch (convErr) {
      console.error("Error posting note help to conversation:", convErr);
    }

    await logLifeActivity({
      action: "NOTE_HELP_REQUESTED",
      resourceType: "note",
      resourceId: noteId,
      resourceName: note.title,
      details: `${auth.name} requested help for note "${note.title}": ${desc}`,
    });

    revalidatePath("/requests");
    revalidatePath("/lifenote");
    return { success: true, requestId: String(request._id) };
  } catch (error: any) {
    console.error("Error in requestNoteHelp:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves limited metadata for future/scheduled notes assigned to the current user
 * for display in the Request Center.
 * CRITICAL PRIVACY RULE: Before release, User can ONLY see:
 * - Note Title
 * - That the note is assigned to them
 * - Current Status
 * - Request Access button
 * Protected note content, messages, documents, attachments are NEVER returned!
 */
export async function getFutureNotesForUser(): Promise<IFutureNoteItem[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  // Run auto-release check first
  await checkAndAutoReleaseNotes();

  const isPrivileged = auth.isOwner || auth.isAdmin;

  const query: Record<string, any> = {
    isArchived: false,
    isReleased: false,
  };

  if (!isPrivileged) {
    if (!auth.personId) return [];
    query.assignedPersonId = auth.personId;
    query.noteType = { $ne: "internal_admin" };
  }

  // Only project safe metadata! DO NOT select content, attachments, tags, etc.
  const notes = await LifeNote.find(query)
    .select("_id title assignedPersonName status waitingPeriodHours unlockRequestedAt unlockDeadline scheduledReleaseDate noteType")
    .sort({ createdAt: -1 })
    .lean();

  if (!notes.length) return [];

  // Find linked requests in Request Center
  const noteIds = notes.map((n: any) => String(n._id));
  const linkedRequests = await LifeRequest.find({
    relatedRecordId: { $in: noteIds },
    relatedRecordType: "LifeNote",
    ...(isPrivileged ? {} : { submittedByEmail: auth.email.toLowerCase().trim() }),
  })
    .select("_id relatedRecordId status")
    .lean();

  const requestMap = new Map<string, any>();
  linkedRequests.forEach((req: any) => {
    requestMap.set(req.relatedRecordId, req);
  });

  return notes.map((n: any) => {
    const linkedReq = requestMap.get(String(n._id));
    return {
      noteId: String(n._id),
      title: n.title,
      assignedPersonName: n.assignedPersonName,
      status: n.status,
      waitingPeriodHours: n.waitingPeriodHours || 48,
      unlockRequestedAt: n.unlockRequestedAt,
      unlockDeadline: n.unlockDeadline,
      scheduledReleaseDate: n.scheduledReleaseDate,
      noteType: n.noteType,
      linkedRequestId: linkedReq?._id ? String(linkedReq._id) : undefined,
      requestStatus: linkedReq?.status,
      hasAccessRequested: Boolean(linkedReq || n.status === "countdown_active" || n.status === "unlock_requested"),
    };
  });
}

/**
 * Initiates an Access Request for a Future Note from the Request Center.
 * 1. Creates/links a LifeRequest in Request Center.
 * 2. Starts configured waiting period countdown on the note.
 * 3. Notifies Owner / Super Admin.
 * 4. Logs activity.
 */
export async function requestFutureNoteAccess(noteId: string, reason?: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const note = await LifeNote.findById(noteId);
  if (!note) throw new Error("Note not found.");

  if (note.isReleased) {
    throw new Error("This note is already released and available in your Notes section.");
  }

  const isAssigned =
    Boolean(auth.personId) && String(note.assignedPersonId) === String(auth.personId);

  if (!auth.isOwner && !auth.isAdmin && !isAssigned) {
    throw new Error("You are not authorized to request access to this note.");
  }

  const hours = note.waitingPeriodHours || 48;
  const now = new Date();
  const deadline = new Date(now.getTime() + hours * 3600 * 1000);

  note.status = "countdown_active";
  note.unlockRequestedAt = now;
  note.unlockRequestedBy = `${auth.name} (${auth.email})`;
  note.unlockDeadline = deadline;

  note.history = note.history || [];
  note.history.push({
    changedAt: now,
    changedBy: `${auth.name} (${auth.email})`,
    action: "access_requested_via_request_center",
    previousWaitingPeriod: hours,
    newWaitingPeriod: hours,
  });

  await note.save();

  // Create or update LifeRequest in Request Center
  let request = await LifeRequest.findOne({
    relatedRecordId: noteId,
    relatedRecordType: "LifeNote",
    submittedByEmail: auth.email.toLowerCase().trim(),
    status: { $in: ["pending", "in_review"] },
  });

  if (!request) {
    request = await LifeRequest.create({
      submittedByPersonId: auth.personId || undefined,
      submittedByUserId: auth.userId,
      submittedByName: auth.name,
      submittedByEmail: auth.email.toLowerCase().trim(),
      submittedByRole: auth.role,
      category: "note_access",
      title: `Access Request: ${note.title}`,
      description:
        reason?.trim() ||
        `Access requested for future note "${note.title}". Configured waiting period: ${hours} hours.`,
      relatedRecordId: String(note._id),
      relatedRecordType: "LifeNote",
      relatedRecordName: note.title,
      status: "pending",
      messages: [],
      unreadByAdmin: 1,
      unreadByUser: 0,
      isNewForAdmin: true,
    });
  }

  // Notify Owner / Super Admin
  const ownerPerson = (await LifePerson.findOne({
    role: { $in: ["super_admin", "owner"] },
  }).lean()) as any;

  if (ownerPerson?.email) {
    await createInAppNotification({
      recipientEmail: ownerPerson.email,
      title: "Note Access Requested",
      message: `${auth.name} requested access to "${note.title}". Waiting period: ${hours}h.`,
      type: "unlock_request",
      link: `/requests?id=${request._id}`,
    });
  }

  await logLifeActivity({
    action: "FUTURE_NOTE_ACCESS_REQUESTED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Access requested by ${auth.name} for "${note.title}". Configured waiting period: ${hours}h. Deadline: ${deadline.toISOString()}`,
    isCritical: true,
  });

  revalidatePath("/requests");
  revalidatePath("/lifenote");
  revalidatePath("/");
  return { success: true, requestId: String(request._id) };
}
