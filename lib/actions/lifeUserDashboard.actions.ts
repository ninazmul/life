"use server";

import { connectToDatabase } from "@/lib/database";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { revalidatePath } from "next/cache";
import LifeNote from "@/lib/database/models/lifeNote.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeSettlement from "@/lib/database/models/lifeSettlement.model";
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifeInstallment from "@/lib/database/models/lifeInstallment.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeResponsibility from "@/lib/database/models/lifeResponsibility.model";
import LifeRequest from "@/lib/database/models/lifeRequest.model";
import LifeRecordPermission from "@/lib/database/models/lifeRecordPermission.model";
import LifeNotification from "@/lib/database/models/lifeNotification.model";
import { createRequest } from "./lifeRequest.actions";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface UserDashboardUpdate {
  id: string;
  type: "note" | "responsibility" | "document" | "request_reply" | "loan" | "support" | "secure_item";
  priority: "action_required" | "important" | "info";
  priorityLabel: string;
  title: string;
  description: string;
  deadline?: string;
  recordId: string;
  leftButtonLabel: string;
  leftButtonState: "mark_viewed" | "viewed" | "viewed_pending";
  rightButtonLabel: string;
  rightButtonAction: string;
  createdAt: string;
  isViewed?: boolean;
}

export interface UserDashboardData {
  updates: UserDashboardUpdate[];
  overview: {
    loanTotal: number;
    loanLabel: string;
    hasLoan: boolean;
    supportTotal: number;
    supportLabel: string;
    hasSupport: boolean;
    documentsCount: number;
    hasDocuments: boolean;
    responsibilitiesPending: number;
    responsibilitiesOngoing: number;
    hasResponsibilities: boolean;
  };
  badges: {
    notesNew: number;
    secureNew: number;
    requestsNew: number;
  };
  notificationCount: number;
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD DATA AGGREGATOR
// ─────────────────────────────────────────────
export async function getUserDashboardData(): Promise<{
  success: boolean;
  data?: UserDashboardData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) {
      return { success: false, error: "Unauthorized" };
    }
    const personId = auth.personId;

    // Parallel queries for all dashboard sections
    const [
      notes,
      responsibilities,
      loanRecords,
      supportRecords,
      documents,
      requests,
      secureItems,
      notifications,
    ] = await Promise.all([
      // Notes assigned to this user that are released
      LifeNote.find({
        assignedPersonId: personId,
        noteType: { $nin: ["internal_admin"] },
        $or: [
          { noteType: "always_visible" },
          { noteType: { $in: ["manual_release", "scheduled_release", "secret_emergency"] }, isReleased: true },
        ],
        isArchived: { $ne: true },
      })
        .select("title noteType priority status userActions attachments createdAt updatedAt isUpdated deliveryType category")
        .sort({ createdAt: -1 })
        .lean(),

      // Responsibilities assigned to this user
      LifeResponsibility.find({
        assignedPersonId: personId,
        visibilityMode: { $nin: ["owner_only", "hidden_draft", "revoked_archived"] },
      })
        .select("title priority completionStatus userResponse startDate deadline visibilityMode createdAt")
        .sort({ createdAt: -1 })
        .lean(),

      // Loan records (money given BY owner TO this person)
      LifeMoneyRecord.find({
        personId,
        type: "given",
      })
        .select("amount paidAmount remainingAmount status date expectedReturnDate purpose currency notes")
        .sort({ date: -1 })
        .lean(),

      // Financial support for this person
      LifeFinancialSupport.find({
        recipientPersonId: personId,
        visibilityMode: { $nin: ["owner_only", "hidden_draft", "revoked_archived"] },
      })
        .select("title supportType totalAmount totalRepaid remainingBalance status currency installmentFrequency recipientVisibleNote givenDate visibilityMode")
        .sort({ createdAt: -1 })
        .lean(),

      // Documents shared with this person
      LifeDocument.find({
        assignedToPersonIds: personId,
        visibility: "visible_now",
        isDeleted: { $ne: true },
      })
        .select("title category fileUrl fileType fileSize notes createdAt isShared")
        .sort({ createdAt: -1 })
        .lean(),

      // This user's requests with unread replies
      LifeRequest.find({
        $or: [
          { submittedByPersonId: personId },
          { submittedByUserId: auth.userId },
        ],
      })
        .select("title category status unreadByUser messages createdAt updatedAt relatedRecordId relatedRecordType relatedRecordName adminResponse")
        .sort({ updatedAt: -1 })
        .lean(),

      // Secure & Future items (discoverable locked items)
      LifeRecordPermission.find({
        assignedPersonId: personId,
        visibilityMode: { $nin: ["owner_only", "hidden_draft", "revoked_archived"] },
        canView: true,
      })
        .select("recordId recordType visibilityMode releaseCondition isReleased effectiveDate expiryDate canDownload")
        .sort({ createdAt: -1 })
        .lean(),

      // Notification count
      LifeNotification.countDocuments({
        recipientEmail: auth.email.toLowerCase(),
        isRead: false,
      }),
    ]);

    // ── Build Updates ──
    const updates: UserDashboardUpdate[] = [];

    // Unread notes → updates
    for (const note of notes) {
      const n: any = note;
      const isRead = !!n.userActions?.readAt;
      if (!isRead || n.isUpdated) {
        updates.push({
          id: `note_${n._id}`,
          type: "note",
          priority: n.priority === "critical" || n.priority === "emergency" ? "action_required" : "info",
          priorityLabel: n.isUpdated ? "Updated" : "New",
          title: n.title,
          description: n.noteType === "always_visible"
            ? "A message shared with you."
            : `A ${n.noteType?.replace(/_/g, " ")} note requires your attention.`,
          recordId: String(n._id),
          leftButtonLabel: isRead ? "Viewed" : "Mark as Viewed",
          leftButtonState: isRead ? "viewed" : "mark_viewed",
          rightButtonLabel: "Read Note",
          rightButtonAction: "notes",
          createdAt: n.createdAt?.toISOString?.() || String(n.createdAt),
          isViewed: isRead,
        });
      }
    }

    // Pending responsibilities → updates
    for (const resp of responsibilities) {
      const r: any = resp;
      if (!r.userResponse || r.userResponse === "" || r.userResponse === "read") {
        updates.push({
          id: `resp_${r._id}`,
          type: "responsibility",
          priority: "action_required",
          priorityLabel: "Action Required",
          title: "A responsibility needs your response",
          description: r.title,
          deadline: r.deadline ? new Date(r.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : undefined,
          recordId: String(r._id),
          leftButtonLabel: "Mark as Viewed",
          leftButtonState: r.userResponse === "read" ? "viewed_pending" : "mark_viewed",
          rightButtonLabel: "Review & Accept",
          rightButtonAction: "responsibilities",
          createdAt: r.createdAt?.toISOString?.() || String(r.createdAt),
          isViewed: r.userResponse === "read",
        });
      }
    }

    // Requests with unread replies → updates
    for (const req of requests) {
      const q: any = req;
      if (q.unreadByUser > 0) {
        updates.push({
          id: `req_${q._id}`,
          type: "request_reply",
          priority: "important",
          priorityLabel: "Reply Available",
          title: "Response to your request",
          description: q.title,
          recordId: String(q._id),
          leftButtonLabel: "Viewed",
          leftButtonState: "viewed",
          rightButtonLabel: "View Response",
          rightButtonAction: "requests",
          createdAt: q.updatedAt?.toISOString?.() || String(q.updatedAt),
          isViewed: false,
        });
      }
    }

    // Sort by priority then date
    const priorityOrder = { action_required: 0, important: 1, info: 2 };
    updates.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // ── Build Overview ──
    const loanTotal = loanRecords.reduce((sum: number, r: any) => sum + (r.remainingAmount || 0), 0);
    const supportTotal = supportRecords.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
    const pendingResps = responsibilities.filter((r: any) => !r.userResponse || r.userResponse === "" || r.userResponse === "read");
    const ongoingResps = responsibilities.filter((r: any) => r.userResponse === "accept" && r.completionStatus !== "completed");

    // Build support label
    let supportLabel = "No active support";
    if (supportRecords.length === 1) {
      const s: any = supportRecords[0];
      const freq = s.installmentFrequency;
      supportLabel = freq === "monthly" ? "Monthly support" : freq === "yearly" ? "Yearly support" : "One-time support";
    } else if (supportRecords.length > 1) {
      supportLabel = `${supportRecords.length} support records`;
    }

    // ── Build Badges ──
    const notesNew = notes.filter((n: any) => !n.userActions?.readAt).length;
    const secureNew = secureItems.filter((s: any) => !s.isReleased).length;
    const requestsNew = requests.filter((r: any) => r.unreadByUser > 0).length;

    const data: UserDashboardData = {
      updates,
      overview: {
        loanTotal,
        loanLabel: loanRecords.length > 0 ? "Outstanding" : "No loans",
        hasLoan: loanRecords.length > 0,
        supportTotal,
        supportLabel,
        hasSupport: supportRecords.length > 0,
        documentsCount: documents.length,
        hasDocuments: documents.length > 0,
        responsibilitiesPending: pendingResps.length,
        responsibilitiesOngoing: ongoingResps.length,
        hasResponsibilities: responsibilities.length > 0,
      },
      badges: {
        notesNew,
        secureNew,
        requestsNew,
      },
      notificationCount: notifications,
    };

    return { success: true, data };
  } catch (err: any) {
    console.error("getUserDashboardData error:", err);
    return { success: false, error: err.message || "Failed to load dashboard data" };
  }
}

// ─────────────────────────────────────────────
// GET USER NOTES
// ─────────────────────────────────────────────
export async function getUserNotes(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const notes = await LifeNote.find({
      assignedPersonId: auth.personId,
      noteType: { $nin: ["internal_admin"] },
      $or: [
        { noteType: "always_visible" },
        { noteType: { $in: ["manual_release", "scheduled_release", "secret_emergency"] }, isReleased: true },
      ],
      isArchived: { $ne: true },
    })
      .select("title content instructions noteType priority status attachments userActions createdAt updatedAt isUpdated deliveryType category createdByName confirmReadRequired")
      .sort({ createdAt: -1 })
      .lean();

    // Strip internal fields, sanitize
    const sanitized = notes.map((n: any) => ({
      _id: String(n._id),
      title: n.title,
      content: n.content,
      instructions: n.instructions || "",
      noteType: n.noteType,
      priority: n.priority,
      category: n.category || "General",
      attachments: n.attachments || [],
      isRead: !!n.userActions?.readAt,
      readAt: n.userActions?.readAt || null,
      isUpdated: n.isUpdated || false,
      confirmReadRequired: n.confirmReadRequired || false,
      sharedBy: n.createdByName || "Owner",
      sharedDate: n.createdAt,
    }));

    return { success: true, data: JSON.parse(JSON.stringify(sanitized)) };
  } catch (err: any) {
    console.error("getUserNotes error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// MARK NOTE AS READ
// ─────────────────────────────────────────────
export async function markNoteAsRead(noteId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const note = await LifeNote.findOne({
      _id: noteId,
      assignedPersonId: auth.personId,
    });
    if (!note) return { success: false, error: "Note not found" };

    // Only mark as read if not already read
    if (!note.userActions?.readAt) {
      await LifeNote.updateOne(
        { _id: noteId },
        {
          $set: {
            "userActions.readAt": new Date(),
            isUpdated: false,
          },
        }
      );
    }

    await logLifeActivity({
      action: "NOTE_READ",
      resourceType: "note",
      resourceId: noteId,
      resourceName: note.title,
      details: `${auth.name} marked note "${note.title}" as read`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("markNoteAsRead error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// GET USER LOANS
// ─────────────────────────────────────────────
export async function getUserLoans(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const loans = await LifeMoneyRecord.find({
      personId: auth.personId,
      type: "given",
    })
      .select("amount paidAmount remainingAmount status date expectedReturnDate purpose currency")
      .sort({ date: -1 })
      .lean();

    // Get settlements for each loan
    const loanIds = loans.map((l: any) => l._id);
    const settlements = await LifeSettlement.find({
      moneyRecordId: { $in: loanIds },
    })
      .select("moneyRecordId amount date paymentMethod notes")
      .sort({ date: -1 })
      .lean();

    const settlementMap: Record<string, any[]> = {};
    for (const s of settlements) {
      const key = String((s as any).moneyRecordId);
      if (!settlementMap[key]) settlementMap[key] = [];
      settlementMap[key].push(s);
    }

    const sanitized = loans.map((l: any) => ({
      _id: String(l._id),
      amount: l.amount,
      paidAmount: l.paidAmount || 0,
      remainingAmount: l.remainingAmount || 0,
      forgiven: 0, // Calculated if gift conversion exists
      status: l.status,
      date: l.date,
      expectedReturnDate: l.expectedReturnDate || null,
      purpose: l.purpose || "",
      currency: l.currency || "BDT",
      settlements: (settlementMap[String(l._id)] || []).map((s: any) => ({
        amount: s.amount,
        date: s.date,
        paymentMethod: s.paymentMethod,
      })),
    }));

    return { success: true, data: JSON.parse(JSON.stringify(sanitized)) };
  } catch (err: any) {
    console.error("getUserLoans error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// GET USER SUPPORT
// ─────────────────────────────────────────────
export async function getUserSupport(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const support = await LifeFinancialSupport.find({
      recipientPersonId: auth.personId,
      visibilityMode: { $nin: ["owner_only", "hidden_draft", "revoked_archived"] },
    })
      .select("title supportType totalAmount totalRepaid remainingBalance status currency installmentFrequency installmentAmount recipientVisibleNote givenDate giftConversions")
      .sort({ createdAt: -1 })
      .lean();

    // Get installments
    const supportIds = support.map((s: any) => s._id);
    const installments = await LifeInstallment.find({
      financialSupportId: { $in: supportIds },
    })
      .select("financialSupportId installmentNumber dueDate expectedAmount paidAmount status")
      .sort({ dueDate: 1 })
      .lean();

    const installmentMap: Record<string, any[]> = {};
    for (const inst of installments) {
      const key = String((inst as any).financialSupportId);
      if (!installmentMap[key]) installmentMap[key] = [];
      installmentMap[key].push(inst);
    }

    // Strip owner-private data
    const sanitized = support.map((s: any) => {
      const forgiven = (s.giftConversions || []).reduce((sum: number, g: any) => sum + (g.amount || 0), 0);
      return {
        _id: String(s._id),
        title: s.title,
        supportType: s.supportType,
        totalAmount: s.totalAmount,
        totalRepaid: s.totalRepaid || 0,
        remainingBalance: s.remainingBalance || 0,
        forgiven,
        status: s.status,
        currency: s.currency || "BDT",
        frequency: s.installmentFrequency || "one_time",
        installmentAmount: s.installmentAmount || 0,
        recipientNote: s.recipientVisibleNote || "",
        givenDate: s.givenDate,
        installments: (installmentMap[String(s._id)] || []).map((inst: any) => ({
          number: inst.installmentNumber,
          dueDate: inst.dueDate,
          amount: inst.expectedAmount,
          paidAmount: inst.paidAmount || 0,
          status: inst.status,
        })),
      };
    });

    return { success: true, data: JSON.parse(JSON.stringify(sanitized)) };
  } catch (err: any) {
    console.error("getUserSupport error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// GET USER DOCUMENTS
// ─────────────────────────────────────────────
export async function getUserDocuments(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const documents = await LifeDocument.find({
      assignedToPersonIds: auth.personId,
      visibility: "visible_now",
      isDeleted: { $ne: true },
    })
      .select("title category fileUrl fileType fileSize notes createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Check download permissions from RecordPermission
    const docIds = documents.map((d: any) => String(d._id));
    const permissions = await LifeRecordPermission.find({
      recordId: { $in: docIds },
      recordType: "document",
      assignedPersonId: auth.personId,
    })
      .select("recordId canDownload")
      .lean();

    const permMap: Record<string, boolean> = {};
    for (const p of permissions) {
      permMap[(p as any).recordId] = (p as any).canDownload || false;
    }

    const sanitized = documents.map((d: any) => ({
      _id: String(d._id),
      title: d.title,
      category: d.category,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      fileSize: d.fileSize || 0,
      notes: d.notes || "",
      canDownload: permMap[String(d._id)] ?? false,
      sharedDate: d.createdAt,
    }));

    return { success: true, data: JSON.parse(JSON.stringify(sanitized)) };
  } catch (err: any) {
    console.error("getUserDocuments error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// GET USER RESPONSIBILITIES
// ─────────────────────────────────────────────
export async function getUserResponsibilities(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const responsibilities = await LifeResponsibility.find({
      assignedPersonId: auth.personId,
      visibilityMode: { $nin: ["owner_only", "hidden_draft", "revoked_archived"] },
    })
      .select("title detailedInstruction priority startDate deadline completionStatus userResponse userResponseNote responseDate visibilityMode releaseCondition relatedDocumentId createdAt")
      .populate("relatedDocumentId", "title fileUrl fileType")
      .sort({ createdAt: -1 })
      .lean();

    // Strip ownerNote, return only user-visible fields
    const sanitized = responsibilities.map((r: any) => ({
      _id: String(r._id),
      title: r.title,
      instructions: r.detailedInstruction,
      priority: r.priority,
      startDate: r.startDate || null,
      deadline: r.deadline || null,
      status: r.completionStatus,
      userResponse: r.userResponse || "",
      userResponseNote: r.userResponseNote || "",
      responseDate: r.responseDate || null,
      relatedDocument: r.relatedDocumentId ? {
        _id: String(r.relatedDocumentId._id || r.relatedDocumentId),
        title: r.relatedDocumentId.title || "",
        fileUrl: r.relatedDocumentId.fileUrl || "",
        fileType: r.relatedDocumentId.fileType || "",
      } : null,
      createdAt: r.createdAt,
    }));

    return { success: true, data: JSON.parse(JSON.stringify(sanitized)) };
  } catch (err: any) {
    console.error("getUserResponsibilities error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// RESPOND TO RESPONSIBILITY
// ─────────────────────────────────────────────
export async function respondToResponsibility(
  responsibilityId: string,
  response: "accept" | "cannot_perform" | "need_clarification",
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const resp = await LifeResponsibility.findOne({
      _id: responsibilityId,
      assignedPersonId: auth.personId,
    });
    if (!resp) return { success: false, error: "Responsibility not found" };

    const updates: Record<string, any> = {
      userResponse: response,
      responseDate: new Date(),
      responseDevice: "web",
    };
    if (note) updates.userResponseNote = note;

    // If accepted, move status to in_progress
    if (response === "accept") {
      if (resp.completionStatus === "not_started") {
        updates.completionStatus = "in_progress";
      }
    }

    await LifeResponsibility.updateOne({ _id: responsibilityId }, { $set: updates });

    const actionLabel = response === "accept" ? "accepted" : response === "cannot_perform" ? "declined" : "requested clarification for";
    await logLifeActivity({
      action: "RESPONSIBILITY_RESPONSE",
      resourceType: "responsibility",
      resourceId: responsibilityId,
      resourceName: resp.title,
      details: `${auth.name} ${actionLabel} responsibility "${resp.title}"`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("respondToResponsibility error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// SUBMIT RESPONSIBILITY UPDATE
// ─────────────────────────────────────────────
export async function submitResponsibilityUpdate(
  responsibilityId: string,
  message: string,
  isComplete?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const resp = await LifeResponsibility.findOne({
      _id: responsibilityId,
      assignedPersonId: auth.personId,
    });
    if (!resp) return { success: false, error: "Responsibility not found" };

    const updates: Record<string, any> = {
      userResponseNote: message,
      responseDate: new Date(),
    };

    if (isComplete) {
      updates.completionStatus = "waiting"; // Waiting for owner review
    }

    await LifeResponsibility.updateOne({ _id: responsibilityId }, { $set: updates });

    // Create a request for the owner to track
    await createRequest({
      category: "responsibility_request",
      title: `Update on: ${resp.title}`,
      description: message + (isComplete ? "\n\n✅ User believes this work is complete." : ""),
      relatedRecordId: responsibilityId,
      relatedRecordType: "responsibility",
      relatedRecordName: resp.title,
    });

    await logLifeActivity({
      action: "RESPONSIBILITY_UPDATE",
      resourceType: "responsibility",
      resourceId: responsibilityId,
      resourceName: resp.title,
      details: `${auth.name} submitted an update for "${resp.title}"${isComplete ? " (marked as complete)" : ""}`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("submitResponsibilityUpdate error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// GET SECURE & FUTURE ITEMS
// ─────────────────────────────────────────────
export async function getUserSecureItems(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    // Get all record permissions that are discoverable (not owner_only or hidden_draft)
    const permissions = await LifeRecordPermission.find({
      assignedPersonId: auth.personId,
      visibilityMode: { $nin: ["owner_only", "hidden_draft", "revoked_archived"] },
      canView: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    // For locked items, return only safe metadata
    const items = permissions.map((p: any) => {
      const isAvailable = p.isReleased ||
        p.visibilityMode === "available_now" ||
        p.visibilityMode === "visible_now";

      return {
        _id: String(p._id),
        recordId: p.recordId,
        recordType: p.recordType,
        visibilityMode: p.visibilityMode,
        releaseCondition: p.releaseCondition || "",
        isReleased: isAvailable,
        effectiveDate: p.effectiveDate || null,
        expiryDate: p.expiryDate || null,
        canDownload: p.canDownload || false,
        // Safe display info - NOT the real title/content for locked items
        status: isAvailable ? "available" : "locked",
        statusLabel: isAvailable
          ? "Access approved"
          : p.visibilityMode === "scheduled_release"
            ? "Scheduled"
            : p.visibilityMode === "manual_release" || p.visibilityMode === "admin_can_release"
              ? "Approval needed"
              : "Locked",
      };
    });

    // Get titles for available (released) items only
    const availableItems = items.filter((i) => i.isReleased);
    const noteIds = availableItems.filter((i) => i.recordType === "document" || i.recordType === "instruction").map((i) => i.recordId);

    // Enrich available items with their actual titles
    const noteDocs = noteIds.length > 0
      ? await LifeNote.find({ _id: { $in: noteIds } }).select("title").lean()
      : [];
    const docDocs = noteIds.length > 0
      ? await LifeDocument.find({ _id: { $in: noteIds } }).select("title").lean()
      : [];

    const titleMap: Record<string, string> = {};
    for (const nd of [...noteDocs, ...docDocs]) {
      titleMap[String((nd as any)._id)] = (nd as any).title;
    }

    const enriched = items.map((item) => ({
      ...item,
      displayTitle: item.isReleased
        ? titleMap[item.recordId] || `${item.recordType.replace(/_/g, " ")} record`
        : `A secure ${item.recordType.replace(/_/g, " ")} for you`,
    }));

    return { success: true, data: JSON.parse(JSON.stringify(enriched)) };
  } catch (err: any) {
    console.error("getUserSecureItems error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// REQUEST ACCESS TO LOCKED ITEM
// ─────────────────────────────────────────────
export async function requestAccessToItem(
  permissionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const perm = await LifeRecordPermission.findOne({
      _id: permissionId,
      assignedPersonId: auth.personId,
    });
    if (!perm) return { success: false, error: "Item not found" };

    // Check for existing active request
    const existingReq = await LifeRequest.findOne({
      submittedByPersonId: auth.personId,
      relatedRecordId: perm.recordId,
      status: { $in: ["pending", "in_review"] },
    });
    if (existingReq) {
      return { success: false, error: "You already have a pending request for this item." };
    }

    await createRequest({
      category: "access_request",
      title: `Access request for secure item`,
      description: reason,
      relatedRecordId: perm.recordId,
      relatedRecordType: perm.recordType,
      relatedRecordName: `Secure ${perm.recordType.replace(/_/g, " ")}`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("requestAccessToItem error:", err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────
// ASK QUESTION ABOUT A NOTE
// ─────────────────────────────────────────────
export async function askQuestionAboutNote(
  noteId: string,
  question: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || !auth.personId) return { success: false, error: "Unauthorized" };

    const note = await LifeNote.findOne({
      _id: noteId,
      assignedPersonId: auth.personId,
    });
    if (!note) return { success: false, error: "Note not found" };

    await createRequest({
      category: "general_inquiry",
      title: `Question about: ${note.title}`,
      description: question,
      relatedRecordId: noteId,
      relatedRecordType: "note",
      relatedRecordName: note.title,
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("askQuestionAboutNote error:", err);
    return { success: false, error: err.message };
  }
}
