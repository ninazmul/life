"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeNote from "@/lib/database/models/lifeNote.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { verifyPin } from "@/lib/life/crypto";
import { createInAppNotification } from "@/lib/actions/lifeNotification.actions";
import { NoteType, NoteStatus, ILifeNote } from "@/types";

/**
 * Checks if the caller has permission to view a specific note.
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

  // Always visible notes
  if (note.noteType === "always_visible") {
    return { allowed: true, maskSecret: false };
  }

  // Manual release
  if (note.noteType === "manual_release") {
    if (note.isReleased) return { allowed: true, maskSecret: false };
    if (auth.isAdmin) return { allowed: true, maskSecret: false };
    return { allowed: false, maskSecret: false };
  }

  // Scheduled release
  if (note.noteType === "scheduled_release") {
    const isPastSchedule =
      note.scheduledReleaseDate && new Date(note.scheduledReleaseDate) <= new Date();
    if (note.isReleased || isPastSchedule) return { allowed: true, maskSecret: false };
    if (auth.isAdmin) return { allowed: true, maskSecret: false };
    return { allowed: false, maskSecret: false };
  }

  // Secret note / Delayed emergency release
  if (note.noteType === "secret_emergency") {
    if (note.isReleased) return { allowed: true, maskSecret: false };
    if (auth.isAdmin) return { allowed: true, maskSecret: false };
    // Assigned user is allowed to know it exists, but content is masked!
    if (isAssigned) return { allowed: true, maskSecret: true };
    return { allowed: false, maskSecret: false };
  }

  return { allowed: auth.isAdmin || isAssigned, maskSecret: false };
}

/**
 * Retrieves notes for a given person, with automatic deadline resolution and masking.
 */
export async function getPersonNotes(personId: string): Promise<ILifeNote[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  // IDOR check: non-admin can only access own notes
  if (!auth.isOwner && !auth.isAdmin && String(auth.personId) !== String(personId)) {
    return [];
  }

  const notes = await LifeNote.find({
    assignedPersonId: personId,
    isArchived: false,
  })
    .populate("assignedPersonId", "name email relation role")
    .sort({ isPinned: -1, createdAt: -1 })
    .lean();

  const now = new Date();
  const results: any[] = [];

  for (const n of notes as any[]) {
    // Check auto-release conditions:
    // 1. Scheduled release date passed
    if (
      n.noteType === "scheduled_release" &&
      !n.isReleased &&
      n.scheduledReleaseDate &&
      new Date(n.scheduledReleaseDate) <= now
    ) {
      await LifeNote.updateOne(
        { _id: n._id },
        {
          $set: {
            isReleased: true,
            status: "released",
            releasedAt: now,
            releasedBy: "Scheduled Auto-Release",
          },
        }
      );
      n.isReleased = true;
      n.status = "released";
    }

    // 2. Secret Note waiting period countdown elapsed without rejection/cancellation
    if (
      n.noteType === "secret_emergency" &&
      !n.isReleased &&
      (n.status === "countdown_active" || n.status === "unlock_requested") &&
      n.unlockDeadline &&
      new Date(n.unlockDeadline) <= now
    ) {
      await LifeNote.updateOne(
        { _id: n._id },
        {
          $set: {
            isReleased: true,
            status: "released",
            releasedAt: now,
            releasedBy: "Waiting Period Expiry (Auto-Released)",
          },
        }
      );
      n.isReleased = true;
      n.status = "released";
      n.releasedAt = now;

      // Notify assigned user
      const assigned = n.assignedPersonId as any;
      if (assigned?.email) {
        await createInAppNotification({
          recipientEmail: assigned.email,
          recipientPersonId: String(assigned._id || personId),
          title: "Secret Note Released",
          message: `The waiting period for "${n.title}" has completed. Your note is now unlocked.`,
          type: "note_released",
          link: `/people/${personId}?tab=notes`,
        });
      }
    }

    const { allowed, maskSecret } = canViewNote(n, auth);
    if (!allowed) continue;

    if (maskSecret) {
      results.push({
        ...n,
        content: "•••••••• [Protected Secret Note — Unlock Required]",
        isMasked: true,
      });
    } else {
      results.push(n);
    }
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

  // Notify assigned user
  const assigned = (await LifePerson.findById(note.assignedPersonId).lean()) as any;
  if (assigned?.email) {
    await createInAppNotification({
      recipientEmail: assigned.email,
      recipientPersonId: String(assigned._id),
      title: "Secret Note Request Approved",
      message: `Your unlock request for "${note.title}" was approved. The note is now available.`,
      type: "note_released",
      link: `/people/${assigned._id}?tab=notes`,
    });
  }

  await logLifeActivity({
    action: "SECRET_NOTE_APPROVED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Approved and unlocked Secret Note "${note.title}" by ${auth.name}`,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
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

  // Notify assigned user
  const assigned = (await LifePerson.findById(note.assignedPersonId).lean()) as any;
  if (assigned?.email) {
    await createInAppNotification({
      recipientEmail: assigned.email,
      recipientPersonId: String(assigned._id),
      title: "Unlock Request Rejected",
      message: `Your unlock request for "${note.title}" was rejected. Reason: ${reason || "Security policy"}.`,
      type: "request_rejected",
      link: `/people/${assigned._id}?tab=notes`,
    });
  }

  await logLifeActivity({
    action: "SECRET_NOTE_REJECTED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Rejected unlock request for "${note.title}" by ${auth.name}. Reason: ${reason}`,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
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

  await logLifeActivity({
    action: "SECRET_NOTE_REQUEST_CANCELLED",
    resourceType: "note",
    resourceId: noteId,
    resourceName: note.title,
    details: `Cancelled unlock request for "${note.title}" by ${auth.name}`,
  });

  revalidatePath(`/people/${note.assignedPersonId}`);
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
 */
export async function getAllNotes(): Promise<ILifeNote[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {
    isArchived: false,
  };

  // If not owner or admin, restrict to notes assigned to current person
  if (!auth.isOwner && !auth.isAdmin) {
    if (!auth.personId) return [];
    query.assignedPersonId = auth.personId;
  }

  const notes = await LifeNote.find(query)
    .populate("assignedPersonId", "name email relation role profilePhoto avatarUrl")
    .sort({ isPinned: -1, createdAt: -1 })
    .lean();

  const now = new Date();
  const results: any[] = [];

  for (const n of notes as any[]) {
    // Scheduled release auto-trigger
    if (
      n.noteType === "scheduled_release" &&
      !n.isReleased &&
      n.scheduledReleaseDate &&
      new Date(n.scheduledReleaseDate) <= now
    ) {
      await LifeNote.updateOne(
        { _id: n._id },
        {
          $set: {
            isReleased: true,
            status: "released",
            releasedAt: now,
            releasedBy: "Scheduled Release Date Passed",
          },
        }
      );
      n.isReleased = true;
      n.status = "released";
      n.releasedAt = now;
    }

    // Emergency unlock countdown auto-expiry
    if (
      n.noteType === "secret_emergency" &&
      !n.isReleased &&
      (n.status === "countdown_active" || n.status === "unlock_requested") &&
      n.unlockDeadline &&
      new Date(n.unlockDeadline) <= now
    ) {
      await LifeNote.updateOne(
        { _id: n._id },
        {
          $set: {
            isReleased: true,
            status: "released",
            releasedAt: now,
            releasedBy: "Waiting Period Expiry (Auto-Released)",
          },
        }
      );
      n.isReleased = true;
      n.status = "released";
      n.releasedAt = now;

      const assigned = n.assignedPersonId as any;
      if (assigned?.email) {
        await createInAppNotification({
          recipientEmail: assigned.email,
          recipientPersonId: String(assigned._id || n.assignedPersonId),
          title: "Secret Note Released",
          message: `The waiting period for "${n.title}" has completed. Your note is now unlocked.`,
          type: "note_released",
          link: "/lifenote",
        });
      }
    }

    const { allowed, maskSecret } = canViewNote(n, auth);
    if (!allowed) continue;

    if (maskSecret) {
      results.push({
        ...n,
        content: "•••••••• [Protected Secret Note — Unlock Required]",
        isMasked: true,
      });
    } else {
      results.push(n);
    }
  }

  return JSON.parse(JSON.stringify(results));
}
