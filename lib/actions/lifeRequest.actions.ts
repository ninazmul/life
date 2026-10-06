"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeRequest from "@/lib/database/models/lifeRequest.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { createInAppNotification } from "@/lib/actions/lifeNotification.actions";
import Admin from "@/lib/database/models/admin.model";
import {
  ILifeRequest,
  RequestCategory,
  RequestStatus,
} from "@/types";
import LifeNote from "@/lib/database/models/lifeNote.model";
import LifeConversation from "@/lib/database/models/lifeConversation.model";
import { checkAndAutoReleaseNotes } from "@/lib/actions/lifeNote.actions";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function getAdminEmails(): Promise<string[]> {
  await connectToDatabase();
  const admins = await Admin.find({ isActive: true }).select("email").lean();
  return admins.map((a: any) => a.email.toLowerCase().trim());
}

// ─────────────────────────────────────────────
// CREATE REQUEST (any user)
// ─────────────────────────────────────────────
export async function createRequest(data: {
  category: RequestCategory;
  title: string;
  description: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
  relatedRecordName?: string;
}) {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) throw new Error("Unauthorized: Please sign in.");

    await connectToDatabase();

    const request = await LifeRequest.create({
      submittedByPersonId: auth.personId || undefined,
      submittedByUserId: auth.userId,
      submittedByName: auth.name,
      submittedByEmail: auth.email.toLowerCase().trim(),
      submittedByRole: auth.role,
      category: data.category,
      title: data.title.trim(),
      description: data.description.trim(),
      relatedRecordId: data.relatedRecordId || "",
      relatedRecordType: data.relatedRecordType || "",
      relatedRecordName: data.relatedRecordName || "",
      status: "pending",
      messages: [],
      unreadByAdmin: 0,
      unreadByUser: 0,
      isNewForAdmin: true,
    });

    // Notify all admins
    const adminEmails = await getAdminEmails();
    for (const email of adminEmails) {
      await createInAppNotification({
        recipientEmail: email,
        title: `New Request: ${data.title}`,
        message: `${auth.name} submitted a new ${data.category.replace(/_/g, " ")} request.`,
        type: "new_request",
        link: `/requests?id=${request._id}`,
      });
    }

    await logLifeActivity({
      action: "REQUEST_CREATED",
      resourceType: "request",
      resourceId: String(request._id),
      resourceName: data.title,
      details: `${auth.name} submitted a new request: "${data.title}" (${data.category})`,
    });

    revalidatePath("/requests");
    revalidatePath("/");
    return { success: true, request: JSON.parse(JSON.stringify(request)) };
  } catch (error: any) {
    console.error("Error in createRequest:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// GET MY REQUESTS (caller's own; admin gets all)
// ─────────────────────────────────────────────
export async function getMyRequests(): Promise<ILifeRequest[]> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return [];

    await connectToDatabase();

    // Run auto-release check so any expired waiting periods are released
    await checkAndAutoReleaseNotes();

    let query: Record<string, any> = {};
    if (!auth.isOwner && !auth.isAdmin) {
      query = { submittedByEmail: auth.email.toLowerCase().trim() };
    }

    const requests = await LifeRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(requests));
  } catch (error) {
    console.error("Error in getMyRequests:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// GET SINGLE REQUEST (with auth check)
// ─────────────────────────────────────────────
export async function getRequestById(id: string): Promise<ILifeRequest | null> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return null;

    await connectToDatabase();
    const request = await LifeRequest.findById(id).lean() as any;
    if (!request) return null;

    // Non-admin can only see their own request
    if (!auth.isOwner && !auth.isAdmin) {
      if (request.submittedByEmail !== auth.email.toLowerCase().trim()) {
        return null;
      }
    }

    return JSON.parse(JSON.stringify(request));
  } catch (error) {
    console.error("Error in getRequestById:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// SEND MESSAGE IN REQUEST THREAD
// ─────────────────────────────────────────────
export async function sendRequestMessage(
  requestId: string,
  message: string
) {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) throw new Error("Unauthorized");

    await connectToDatabase();
    const request = await LifeRequest.findById(requestId);
    if (!request) throw new Error("Request not found.");

    // Auth check: only submitter or admin can message
    const isSubmitter =
      request.submittedByEmail === auth.email.toLowerCase().trim();
    if (!auth.isOwner && !auth.isAdmin && !isSubmitter) {
      throw new Error("You are not authorized to message on this request.");
    }

    const isAdminSender = auth.isOwner || auth.isAdmin;

    const newMsg = {
      senderId: auth.userId,
      senderName: auth.name,
      senderRole: auth.role,
      message: message.trim(),
      isRead: false,
    };

    request.messages.push(newMsg as any);

    // Update unread counts
    if (isAdminSender) {
      request.unreadByUser += 1;
    } else {
      request.unreadByAdmin += 1;
      request.isNewForAdmin = true;
    }

    await request.save();

    // Notify the other party
    if (isAdminSender) {
      await createInAppNotification({
        recipientEmail: request.submittedByEmail,
        recipientPersonId: request.submittedByPersonId?.toString(),
        title: `Response to your request: ${request.title}`,
        message: `Admin responded to your request "${request.title}".`,
        type: "new_message",
        link: `/requests?id=${requestId}`,
      });
    } else {
      const adminEmails = await getAdminEmails();
      for (const email of adminEmails) {
        await createInAppNotification({
          recipientEmail: email,
          title: `New message on request: ${request.title}`,
          message: `${auth.name} sent a new message on request "${request.title}".`,
          type: "new_message",
          link: `/requests?id=${requestId}`,
        });
      }
    }

    await logLifeActivity({
      action: "REQUEST_MESSAGE_SENT",
      resourceType: "request",
      resourceId: requestId,
      resourceName: request.title,
      details: `${auth.name} sent a message on request "${request.title}"`,
    });

    revalidatePath("/requests");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in sendRequestMessage:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// MARK REQUEST MESSAGES AS READ
// ─────────────────────────────────────────────
export async function markRequestMessagesAsRead(requestId: string) {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false };

    await connectToDatabase();
    const request = await LifeRequest.findById(requestId);
    if (!request) return { success: false };

    const isAdminReader = auth.isOwner || auth.isAdmin;
    const isSubmitter =
      request.submittedByEmail === auth.email.toLowerCase().trim();

    if (!isAdminReader && !isSubmitter) {
      return { success: false, error: "Unauthorized" };
    }

    // Mark only the messages from the OTHER side as read
    let changed = false;
    for (const msg of request.messages) {
      const msgIsFromAdmin =
        msg.senderRole === "owner" ||
        msg.senderRole === "super_admin" ||
        msg.senderRole === "admin" ||
        msg.senderRole === "administrator";

      if (isAdminReader && !msgIsFromAdmin && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = new Date();
        changed = true;
      } else if (!isAdminReader && msgIsFromAdmin && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = new Date();
        changed = true;
      }
    }

    if (changed) {
      if (isAdminReader) {
        request.unreadByAdmin = 0;
        request.isNewForAdmin = false;
      } else {
        request.unreadByUser = 0;
      }
      await request.save();
    }

    revalidatePath("/requests");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in markRequestMessagesAsRead:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// UPDATE REQUEST STATUS (Admin only)
// ─────────────────────────────────────────────
export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  adminResponse?: string
) {
  try {
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      throw new Error("Forbidden: Only admins can update request status.");
    }

    await connectToDatabase();
    const request = await LifeRequest.findById(requestId);
    if (!request) throw new Error("Request not found.");

    const prevStatus = request.status;
    request.status = status;
    if (adminResponse) request.adminResponse = adminResponse.trim();
    if (["approved", "rejected", "completed"].includes(status)) {
      request.resolvedBy = auth.name;
      request.resolvedAt = new Date();
    }
    // When admin updates status, increase unread for user
    request.unreadByUser += 1;

    await request.save();

    // Sync linked LifeNote if this is a note access request
    if (request.relatedRecordType === "LifeNote" && request.relatedRecordId) {
      try {
        const note = await LifeNote.findById(request.relatedRecordId);
        if (note) {
          if (status === "approved") {
            note.isReleased = true;
            note.status = "released";
            note.releasedAt = new Date();
            note.releasedBy = `${auth.name} (${auth.email})`;
            note.history = note.history || [];
            note.history.push({
              changedAt: new Date(),
              changedBy: `${auth.name} (${auth.email})`,
              action: "approved_via_request_center",
            });
            await note.save();

            // Notify user that note is released and in their notes section
            await createInAppNotification({
              recipientEmail: request.submittedByEmail,
              recipientPersonId: request.submittedByPersonId?.toString(),
              title: `Note Released: ${note.title}`,
              message: `Your request for "${note.title}" has been approved. The note is now available in your Notes section.`,
              type: "note_released",
              link: "/lifenote",
            });
          } else if (status === "rejected") {
            note.status = "request_rejected";
            note.isReleased = false;
            note.history = note.history || [];
            note.history.push({
              changedAt: new Date(),
              changedBy: `${auth.name} (${auth.email})`,
              action: `rejected_via_request_center: ${adminResponse || "No reason"}`,
            });
            await note.save();
          } else if (status === "cancelled") {
            note.status = "request_cancelled";
            note.isReleased = false;
            await note.save();
          }
        }
      } catch (e) {
        console.error("Error syncing linked LifeNote on request status update:", e);
      }
    }

    // Notify submitter (if not already notified for note release above)
    if (request.relatedRecordType !== "LifeNote" || status !== "approved") {
      const notifType =
        status === "approved"
          ? "request_approved"
          : status === "rejected"
          ? "request_rejected"
          : "request_status_changed";

      await createInAppNotification({
        recipientEmail: request.submittedByEmail,
        recipientPersonId: request.submittedByPersonId?.toString(),
        title: `Request ${status}: ${request.title}`,
        message:
          adminResponse ||
          `Your request "${request.title}" has been ${status}.`,
        type: notifType as any,
        link: `/requests?id=${requestId}`,
      });
    }

    await logLifeActivity({
      action: "REQUEST_STATUS_UPDATED",
      resourceType: "request",
      resourceId: requestId,
      resourceName: request.title,
      details: `${auth.name} changed request status from "${prevStatus}" to "${status}"${adminResponse ? `. Response: ${adminResponse}` : ""}`,
    });

    revalidatePath("/requests");
    revalidatePath("/lifenote");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateRequestStatus:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// CANCEL REQUEST (submitter cancels own)
// ─────────────────────────────────────────────
export async function cancelRequest(requestId: string) {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) throw new Error("Unauthorized");

    await connectToDatabase();
    const request = await LifeRequest.findById(requestId);
    if (!request) throw new Error("Request not found.");

    const isSubmitter =
      request.submittedByEmail === auth.email.toLowerCase().trim();
    if (!auth.isOwner && !auth.isAdmin && !isSubmitter) {
      throw new Error("You can only cancel your own requests.");
    }

    if (!["pending", "in_review"].includes(request.status)) {
      throw new Error(`Cannot cancel a request in "${request.status}" status.`);
    }

    request.status = "cancelled";
    await request.save();

    // Sync linked LifeNote if any
    if (request.relatedRecordType === "LifeNote" && request.relatedRecordId) {
      try {
        await LifeNote.updateOne(
          { _id: request.relatedRecordId },
          { $set: { status: "request_cancelled", isReleased: false } }
        );
      } catch (e) {
        console.error("Error updating LifeNote on request cancellation:", e);
      }
    }

    await logLifeActivity({
      action: "REQUEST_CANCELLED",
      resourceType: "request",
      resourceId: requestId,
      resourceName: request.title,
      details: `${auth.name} cancelled request "${request.title}"`,
    });

    revalidatePath("/requests");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in cancelRequest:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// GET BADGE COUNTS (for dashboard icons)
// ─────────────────────────────────────────────
export async function getRequestBadgeCounts(): Promise<{
  requestsCount: number;
  messagesCount: number;
}> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return { requestsCount: 0, messagesCount: 0 };

    await connectToDatabase();

    const isSuper = auth.isOwner || auth.isAdmin || auth.role === "super_admin";

    if (isSuper) {
      // Admin: count new/unread requests & unread messages across requests & conversations
      const [requestsCount, reqMsgCount, convMsgDocs] = await Promise.all([
        LifeRequest.countDocuments({ isNewForAdmin: true }),
        LifeRequest.countDocuments({ unreadByAdmin: { $gt: 0 } }),
        LifeConversation.aggregate([
          { $group: { _id: null, total: { $sum: "$unreadByAdmin" } } },
        ]),
      ]);
      const convMsgCount = convMsgDocs[0]?.total || 0;
      return { requestsCount, messagesCount: reqMsgCount + convMsgCount };
    } else {
      // Regular user: their own pending requests and unread conversation/request messages
      const email = auth.email.toLowerCase().trim();
      const [requestsCount, reqMsgCount, userConv] = await Promise.all([
        LifeRequest.countDocuments({
          submittedByEmail: email,
          status: { $in: ["pending", "in_review"] },
        }),
        LifeRequest.countDocuments({
          submittedByEmail: email,
          unreadByUser: { $gt: 0 },
        }),
        LifeConversation.findOne({ userEmail: email }).select("unreadByUser").lean(),
      ]);
      const convMsgCount = (userConv as any)?.unreadByUser || 0;
      return { requestsCount, messagesCount: reqMsgCount + convMsgCount };
    }
  } catch (error) {
    console.error("Error in getRequestBadgeCounts:", error);
    return { requestsCount: 0, messagesCount: 0 };
  }
}

// ─────────────────────────────────────────────
// AUTO-RELEASE CHECK FOR ACCESS REQUESTS
// ─────────────────────────────────────────────
export async function checkAndAutoReleaseRequests() {
  try {
    await connectToDatabase();
    const now = new Date();

    const expiredRequests = await LifeRequest.find({
      status: { $in: ["pending", "in_review"] },
      autoRelease: true,
      expiresAt: { $lte: now },
    });

    for (const req of expiredRequests) {
      req.status = "approved";
      req.isAutoReleased = true;
      req.isAcknowledged = false;
      req.autoReleasedAt = now;
      req.resolvedBy = "System (Auto-Release)";
      req.resolvedAt = now;
      req.adminResponse = "Automatically released upon deadline expiration.";
      req.unreadByUser += 1;
      await req.save();

      // Sync linked LifeNote if applicable
      if (req.relatedRecordType === "LifeNote" && req.relatedRecordId) {
        try {
          const note = await LifeNote.findById(req.relatedRecordId);
          if (note) {
            note.isReleased = true;
            note.status = "released";
            note.releasedAt = now;
            note.releasedBy = "System (Auto-Release)";
            note.history = note.history || [];
            note.history.push({
              changedAt: now,
              changedBy: "System (Auto-Release)",
              action: "auto_released_via_request_center",
            });
            await note.save();
          }
        } catch (e) {
          console.error("Error updating note in auto-release:", e);
        }
      }

      await createInAppNotification({
        recipientEmail: req.submittedByEmail,
        recipientPersonId: req.submittedByPersonId?.toString(),
        title: `Information Released: ${req.title}`,
        message: `Your requested access to "${req.requestedScope || req.title}" has been automatically released.`,
        type: "request_approved",
        link: `/requests?id=${req._id}`,
      });

      await logLifeActivity({
        action: "REQUEST_AUTO_RELEASED",
        resourceType: "request",
        resourceId: String(req._id),
        resourceName: req.title,
        details: `Access to "${req.requestedScope || req.title}" automatically released to ${req.submittedByName} after review deadline passed.`,
      });
    }

    if (expiredRequests.length > 0) {
      revalidatePath("/");
      revalidatePath("/requests");
    }
  } catch (e) {
    console.error("Error in checkAndAutoReleaseRequests:", e);
  }
}

// ─────────────────────────────────────────────
// GET PENDING ACTION REQUESTS FOR DASHBOARD
// ─────────────────────────────────────────────
export async function getPendingActionRequests(): Promise<{
  pendingRequests: ILifeRequest[];
  releasedUpdates: ILifeRequest[];
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { pendingRequests: [], releasedUpdates: [] };

    // Run auto-release check first so server deadlines are strictly enforced
    await checkAndAutoReleaseRequests();
    await checkAndAutoReleaseNotes();

    const isPrivileged = auth.isOwner || auth.isAdmin;
    let query: Record<string, any> = {
      status: { $in: ["pending", "in_review"] },
    };

    if (!isPrivileged) {
      query = {
        submittedByEmail: auth.email.toLowerCase().trim(),
        status: { $in: ["pending", "in_review"] },
      };
    }

    const pendingDocs = await LifeRequest.find(query)
      .sort({ expiresAt: 1, createdAt: -1 })
      .lean();

    // Get unacknowledged auto-released updates for owner/admin
    let releasedDocs: any[] = [];
    if (isPrivileged) {
      releasedDocs = await LifeRequest.find({
        isAutoReleased: true,
        isAcknowledged: false,
      })
        .sort({ autoReleasedAt: -1 })
        .limit(5)
        .lean();
    }

    return {
      pendingRequests: JSON.parse(JSON.stringify(pendingDocs)),
      releasedUpdates: JSON.parse(JSON.stringify(releasedDocs)),
    };
  } catch (error) {
    console.error("Error in getPendingActionRequests:", error);
    return { pendingRequests: [], releasedUpdates: [] };
  }
}

// ─────────────────────────────────────────────
// REVIEW ACCESS REQUEST (Approve / Reject decision)
// ─────────────────────────────────────────────
export async function reviewAccessRequest(
  requestId: string,
  decision: "approve" | "reject",
  responseReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Forbidden: Only admins can decide requests." };
    }

    await connectToDatabase();
    const request = await LifeRequest.findById(requestId);
    if (!request) return { success: false, error: "Request not found." };

    if (request.status !== "pending" && request.status !== "in_review") {
      return {
        success: false,
        error: `Request has already been ${request.status}.`,
      };
    }

    const newStatus = decision === "approve" ? "approved" : "rejected";
    request.status = newStatus;
    request.adminResponse = responseReason ? responseReason.trim() : (
      decision === "approve" ? "Approved by workspace owner." : "Rejected by workspace owner."
    );
    request.resolvedBy = auth.name;
    request.resolvedAt = new Date();
    request.unreadByUser += 1;

    await request.save();

    // Synchronize linked LifeNote if applicable
    if (request.relatedRecordType === "LifeNote" && request.relatedRecordId) {
      try {
        const note = await LifeNote.findById(request.relatedRecordId);
        if (note) {
          if (decision === "approve") {
            note.isReleased = true;
            note.status = "released";
            note.releasedAt = new Date();
            note.releasedBy = `${auth.name} (${auth.email})`;
            note.history = note.history || [];
            note.history.push({
              changedAt: new Date(),
              changedBy: `${auth.name} (${auth.email})`,
              action: "approved_via_action_required",
            });
            await note.save();
          } else {
            note.status = "request_rejected";
            note.isReleased = false;
            note.history = note.history || [];
            note.history.push({
              changedAt: new Date(),
              changedBy: `${auth.name} (${auth.email})`,
              action: `rejected_via_action_required: ${responseReason || "No reason specified"}`,
            });
            await note.save();
          }
        }
      } catch (e) {
        console.error("Error synchronizing linked note on review:", e);
      }
    }

    // Notify submitter
    await createInAppNotification({
      recipientEmail: request.submittedByEmail,
      recipientPersonId: request.submittedByPersonId?.toString(),
      title: `Request ${decision === "approve" ? "Approved" : "Rejected"}: ${request.title}`,
      message: request.adminResponse || `Your request was ${newStatus}.`,
      type: decision === "approve" ? "request_approved" : "request_rejected",
      link: `/requests?id=${requestId}`,
    });

    await logLifeActivity({
      action: decision === "approve" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
      resourceType: "request",
      resourceId: requestId,
      resourceName: request.title,
      details: `${auth.name} ${decision}d access request for "${request.requestedScope || request.title}" submitted by ${request.submittedByName}.`,
    });

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/lifenote");
    return { success: true };
  } catch (error: any) {
    console.error("Error in reviewAccessRequest:", error);
    return { success: false, error: error.message || "Failed to submit decision." };
  }
}

// ─────────────────────────────────────────────
// ACKNOWLEDGE AUTO-RELEASED UPDATE
// ─────────────────────────────────────────────
export async function acknowledgeReleasedRequest(requestId: string): Promise<{ success: boolean }> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false };

    await connectToDatabase();
    await LifeRequest.findByIdAndUpdate(requestId, {
      $set: { isAcknowledged: true },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error in acknowledgeReleasedRequest:", error);
    return { success: false };
  }
}

// ─────────────────────────────────────────────
// SEED OR TOGGLE SAMPLE ACTION REQUEST (For Verification & Demo)
// ─────────────────────────────────────────────
export async function seedSampleActionRequest(): Promise<{ success: boolean; request?: any; error?: string }> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Forbidden: Owner/Admin required." };
    }

    await connectToDatabase();

    // Check if an existing sample request is already pending
    const existing = await LifeRequest.findOne({
      title: "Emergency instructions",
      status: { $in: ["pending", "in_review"] },
    });

    if (existing) {
      return { success: true, request: JSON.parse(JSON.stringify(existing)) };
    }

    // Create realistic sample matching design reference:
    // "Sabbir requested access" • "Emergency instructions" • "6h left to review" • "Auto-release enabled for this item"
    const sixHoursLater = new Date(Date.now() + 6 * 3600 * 1000);

    const newReq = await LifeRequest.create({
      submittedByName: "Sabbir",
      submittedByEmail: "sabbir@example.com",
      submittedByUserId: "user_sabbir_demo",
      submittedByRole: "guardian",
      category: "access_request",
      title: "Emergency instructions",
      requestedScope: "Emergency instructions",
      description: "Requesting limited access to operational emergency instructions as designated continuity guardian.",
      status: "pending",
      autoRelease: true,
      expiresAt: sixHoursLater,
      durationHours: 6,
      isAutoReleased: false,
      isAcknowledged: true,
      isNewForAdmin: true,
      unreadByAdmin: 1,
      unreadByUser: 0,
      messages: [],
    });

    revalidatePath("/");
    revalidatePath("/requests");
    return { success: true, request: JSON.parse(JSON.stringify(newReq)) };
  } catch (error: any) {
    console.error("Error in seedSampleActionRequest:", error);
    return { success: false, error: error.message };
  }
}

