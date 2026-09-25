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

    // Notify submitter
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

    await logLifeActivity({
      action: "REQUEST_STATUS_UPDATED",
      resourceType: "request",
      resourceId: requestId,
      resourceName: request.title,
      details: `${auth.name} changed request status from "${prevStatus}" to "${status}"${adminResponse ? `. Response: ${adminResponse}` : ""}`,
    });

    revalidatePath("/requests");
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

    if (auth.isOwner || auth.isAdmin) {
      // Admin: count new/unread requests & unread messages
      const [requestsCount, messagesCount] = await Promise.all([
        LifeRequest.countDocuments({ isNewForAdmin: true }),
        LifeRequest.countDocuments({ unreadByAdmin: { $gt: 0 } }),
      ]);
      return { requestsCount, messagesCount };
    } else {
      // Regular user
      const email = auth.email.toLowerCase().trim();
      const [requestsCount, messagesCount] = await Promise.all([
        LifeRequest.countDocuments({
          submittedByEmail: email,
          status: { $in: ["pending", "in_review"] },
        }),
        LifeRequest.countDocuments({
          submittedByEmail: email,
          unreadByUser: { $gt: 0 },
        }),
      ]);
      return { requestsCount, messagesCount };
    }
  } catch (error) {
    console.error("Error in getRequestBadgeCounts:", error);
    return { requestsCount: 0, messagesCount: 0 };
  }
}
