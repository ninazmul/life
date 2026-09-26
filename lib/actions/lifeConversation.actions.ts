"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeConversation from "@/lib/database/models/lifeConversation.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { createInAppNotification } from "@/lib/actions/lifeNotification.actions";
import {
  ILifeConversation,
  IConversationListItem,
  IConversationAttachment,
} from "@/types";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function isSuperAdminUser(auth: any): boolean {
  if (!auth) return false;
  return (
    auth.isOwner === true ||
    auth.role === "super_admin" ||
    auth.role === "owner" ||
    auth.isAdmin === true
  );
}

async function getSuperAdminEmails(): Promise<string[]> {
  await connectToDatabase();
  const admins = await LifePerson.find({
    role: { $in: ["owner", "super_admin", "admin"] },
    status: { $ne: "archived" },
  })
    .select("email")
    .lean();

  const emails = admins
    .map((a: any) => a.email?.toLowerCase().trim())
    .filter(Boolean);

  if (emails.length === 0) {
    emails.push("nazmulsaw@gmail.com");
  }
  return Array.from(new Set(emails));
}

// ─────────────────────────────────────────────
// GET USER CONVERSATION (Regular user's private thread)
// Strict RBAC: Non-admin can ONLY view their own conversation
// ─────────────────────────────────────────────
export async function getUserConversation(): Promise<ILifeConversation | null> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) throw new Error("Unauthorized");

    await connectToDatabase();
    const email = auth.email.toLowerCase().trim();

    let conversation = await LifeConversation.findOne({ userEmail: email });

    if (!conversation) {
      // Find person doc if exists
      const person = await LifePerson.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
      })
        .select("_id role userRole")
        .lean();

      conversation = await LifeConversation.create({
        userId: auth.userId,
        userEmail: email,
        userName: auth.name,
        userRole: (person as any)?.userRole || (person as any)?.role || auth.role || "individual",
        personId: person ? (person as any)._id : undefined,
        messages: [],
        unreadByAdmin: 0,
        unreadByUser: 0,
        lastMessageText: "",
        lastMessageAt: new Date(),
      });
    }

    return JSON.parse(JSON.stringify(conversation));
  } catch (error) {
    console.error("Error in getUserConversation:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// GET ADMIN CONVERSATIONS DIRECTORY (Super Admin only)
// Returns list of all user threads with unread counts
// ─────────────────────────────────────────────
export async function getAdminConversations(): Promise<IConversationListItem[]> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth || !isSuperAdminUser(auth)) {
      throw new Error("Forbidden: Only Super Admin can access conversation list.");
    }

    await connectToDatabase();

    // 1. Fetch all conversations
    const conversations = await LifeConversation.find()
      .sort({ unreadByAdmin: -1, lastMessageAt: -1 })
      .lean();

    // 2. Fetch all registered users from LifePerson to allow starting chat with anyone
    const people = await LifePerson.find({
      status: { $ne: "archived" },
      role: { $nin: ["owner", "super_admin"] },
    })
      .select("name email role userRole avatarUrl _id")
      .lean();

    const conversationMap = new Map<string, any>();
    for (const c of conversations) {
      conversationMap.set(c.userEmail.toLowerCase().trim(), c);
    }

    const items: IConversationListItem[] = [];

    // Add existing conversations first
    for (const c of conversations) {
      const email = c.userEmail.toLowerCase().trim();
      const person = people.find(
        (p: any) => p.email?.toLowerCase().trim() === email
      );

      items.push({
        _id: String(c._id),
        userId: c.userId,
        userEmail: c.userEmail,
        userName: c.userName || (person ? (person as any).name : c.userEmail),
        userRole: c.userRole || (person ? (person as any).role : "individual"),
        personId: c.personId ? String(c.personId) : person ? String((person as any)._id) : undefined,
        avatarUrl: person ? (person as any).avatarUrl : undefined,
        unreadCount: c.unreadByAdmin || 0,
        lastMessageText: c.lastMessageText || "",
        lastMessageAt: c.lastMessageAt,
        lastMessageSenderRole: c.lastMessageSenderRole,
        totalMessages: c.messages ? c.messages.length : 0,
      });
    }

    // Add users from LifePerson who don't have a conversation yet
    for (const p of people) {
      const email = (p as any).email?.toLowerCase().trim();
      if (!email || conversationMap.has(email)) continue;

      items.push({
        _id: `new_${p._id}`,
        userId: String(p._id),
        userEmail: email,
        userName: (p as any).name || email,
        userRole: (p as any).userRole || (p as any).role || "individual",
        personId: String(p._id),
        avatarUrl: (p as any).avatarUrl,
        unreadCount: 0,
        lastMessageText: "No messages yet",
        lastMessageAt: undefined,
        totalMessages: 0,
      });
    }

    // Sort by: unread count > last message time > name
    items.sort((a, b) => {
      if ((b.unreadCount || 0) !== (a.unreadCount || 0)) {
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      }
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return a.userName.localeCompare(b.userName);
    });

    return JSON.parse(JSON.stringify(items));
  } catch (error) {
    console.error("Error in getAdminConversations:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// GET CONVERSATION BY ID OR USER EMAIL (Admin access to a specific user)
// Strict access control: Non-admins can NEVER view another user's conversation
// ─────────────────────────────────────────────
export async function getConversationForAdmin(
  targetEmail: string
): Promise<ILifeConversation | null> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) throw new Error("Unauthorized");

    const email = targetEmail.toLowerCase().trim();

    // Strict security check: If not admin, the targetEmail MUST be their own
    if (!isSuperAdminUser(auth) && auth.email.toLowerCase().trim() !== email) {
      throw new Error("Forbidden: You cannot access another user's conversation.");
    }

    await connectToDatabase();

    let conversation = await LifeConversation.findOne({ userEmail: email });

    if (!conversation) {
      const person = await LifePerson.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
      }).lean();

      conversation = await LifeConversation.create({
        userId: person ? String((person as any)._id) : email,
        userEmail: email,
        userName: person ? (person as any).name : email,
        userRole: (person as any)?.userRole || (person as any)?.role || "individual",
        personId: person ? (person as any)._id : undefined,
        messages: [],
        unreadByAdmin: 0,
        unreadByUser: 0,
        lastMessageText: "",
        lastMessageAt: new Date(),
      });
    }

    return JSON.parse(JSON.stringify(conversation));
  } catch (error) {
    console.error("Error in getConversationForAdmin:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────
export async function sendConversationMessage(data: {
  targetUserEmail?: string;
  conversationId?: string;
  message: string;
  attachments?: IConversationAttachment[];
  noteRef?: { noteId: string; noteTitle: string };
}): Promise<{ success: boolean; error?: string; conversation?: ILifeConversation }> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const isAdmin = isSuperAdminUser(auth);
    const text = data.message?.trim() || "";
    const attachments = Array.isArray(data.attachments) ? data.attachments : [];

    if (!text && attachments.length === 0 && !data.noteRef) {
      return { success: false, error: "Message or attachment is required." };
    }

    await connectToDatabase();

    let conversation: any = null;

    if (isAdmin) {
      // Super admin can specify targetUserEmail or conversationId
      if (data.conversationId && !data.conversationId.startsWith("new_")) {
        conversation = await LifeConversation.findById(data.conversationId);
      }
      if (!conversation && data.targetUserEmail) {
        const targetEmail = data.targetUserEmail.toLowerCase().trim();
        conversation = await LifeConversation.findOne({ userEmail: targetEmail });
        if (!conversation) {
          const person = await LifePerson.findOne({
            email: { $regex: new RegExp(`^${targetEmail}$`, "i") },
          }).lean();

          conversation = await LifeConversation.create({
            userId: person ? String((person as any)._id) : targetEmail,
            userEmail: targetEmail,
            userName: person ? (person as any).name : targetEmail,
            userRole: (person as any)?.userRole || (person as any)?.role || "individual",
            personId: person ? (person as any)._id : undefined,
            messages: [],
            unreadByAdmin: 0,
            unreadByUser: 0,
          });
        }
      }
    } else {
      // Regular user: ALWAYS strictly scoped to their own email
      const myEmail = auth.email.toLowerCase().trim();
      conversation = await LifeConversation.findOne({ userEmail: myEmail });
      if (!conversation) {
        const person = await LifePerson.findOne({
          email: { $regex: new RegExp(`^${myEmail}$`, "i") },
        }).lean();

        conversation = await LifeConversation.create({
          userId: auth.userId,
          userEmail: myEmail,
          userName: auth.name,
          userRole: auth.role || "individual",
          personId: person ? (person as any)._id : undefined,
          messages: [],
          unreadByAdmin: 0,
          unreadByUser: 0,
        });
      }
    }

    if (!conversation) {
      return { success: false, error: "Conversation not found." };
    }

    // Verify non-admin cannot write to another's thread
    if (!isAdmin && conversation.userEmail.toLowerCase().trim() !== auth.email.toLowerCase().trim()) {
      return { success: false, error: "Forbidden: Cross-user messaging is prohibited." };
    }

    const newMessage: any = {
      senderId: auth.userId,
      senderEmail: auth.email.toLowerCase().trim(),
      senderName: auth.name,
      senderRole: auth.role,
      message: text,
      attachments: attachments,
      isRead: false,
      noteRef: data.noteRef || undefined,
      createdAt: new Date(),
    };

    conversation.messages.push(newMessage);
    conversation.lastMessageText = text || (attachments.length ? `[Attachment: ${attachments[0].name}]` : "Message");
    conversation.lastMessageAt = new Date();
    conversation.lastMessageSenderRole = auth.role;

    if (isAdmin) {
      conversation.unreadByUser = (conversation.unreadByUser || 0) + 1;
    } else {
      conversation.unreadByAdmin = (conversation.unreadByAdmin || 0) + 1;
    }

    await conversation.save();

    // In-app notifications
    if (isAdmin) {
      // Notify the recipient user
      await createInAppNotification({
        recipientEmail: conversation.userEmail,
        title: "New Message from Super Admin",
        message: text
          ? text.slice(0, 120)
          : attachments.length
          ? "Sent you an attachment"
          : "New message received",
        type: "new_message",
        link: "/requests?tab=messages",
      });
    } else {
      // Notify Super Admins / Owner
      const adminEmails = await getSuperAdminEmails();
      for (const adminEmail of adminEmails) {
        await createInAppNotification({
          recipientEmail: adminEmail,
          title: `Message from ${auth.name}`,
          message: text
            ? text.slice(0, 120)
            : attachments.length
            ? `Sent an attachment: ${attachments[0].name}`
            : "Sent a new message",
          type: "new_message",
          link: `/requests?tab=messages&user=${encodeURIComponent(conversation.userEmail)}`,
        });
      }
    }

    // Activity log
    await logLifeActivity({
      action: "CONVERSATION_MESSAGE_SENT",
      resourceType: "Conversation",
      resourceId: String(conversation._id),
      resourceName: `Conversation with ${conversation.userName}`,
      details: `${auth.name} sent message: "${text.slice(0, 60)}"`,
      result: "success",
    });

    revalidatePath("/requests");
    return {
      success: true,
      conversation: JSON.parse(JSON.stringify(conversation)),
    };
  } catch (error: any) {
    console.error("Error in sendConversationMessage:", error);
    return { success: false, error: error.message || "Failed to send message." };
  }
}

// ─────────────────────────────────────────────
// MARK CONVERSATION AS READ
// Strict access control: Non-admin can only mark their own conversation as read
// ─────────────────────────────────────────────
export async function markConversationAsRead(
  conversationIdOrEmail: string
): Promise<{ success: boolean }> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false };

    await connectToDatabase();
    const isAdmin = isSuperAdminUser(auth);

    let conversation: any = null;
    if (conversationIdOrEmail.includes("@")) {
      conversation = await LifeConversation.findOne({
        userEmail: conversationIdOrEmail.toLowerCase().trim(),
      });
    } else {
      conversation = await LifeConversation.findById(conversationIdOrEmail);
    }

    if (!conversation) return { success: false };

    // Strict RBAC: Non-admin can ONLY mark their own conversation as read
    if (!isAdmin && conversation.userEmail.toLowerCase().trim() !== auth.email.toLowerCase().trim()) {
      throw new Error("Forbidden: Cannot mark another user's conversation as read.");
    }

    let modified = false;
    const now = new Date();

    if (isAdmin) {
      // Mark all incoming messages from user as read
      for (const msg of conversation.messages) {
        if (!msg.isRead && msg.senderEmail.toLowerCase() === conversation.userEmail.toLowerCase()) {
          msg.isRead = true;
          msg.readAt = now;
          modified = true;
        }
      }
      if (conversation.unreadByAdmin > 0) {
        conversation.unreadByAdmin = 0;
        modified = true;
      }
    } else {
      // Regular user: Mark all incoming messages from admin as read
      for (const msg of conversation.messages) {
        if (!msg.isRead && msg.senderEmail.toLowerCase() !== auth.email.toLowerCase().trim()) {
          msg.isRead = true;
          msg.readAt = now;
          modified = true;
        }
      }
      if (conversation.unreadByUser > 0) {
        conversation.unreadByUser = 0;
        modified = true;
      }
    }

    if (modified) {
      await conversation.save();
    }

    revalidatePath("/requests");
    return { success: true };
  } catch (error) {
    console.error("Error in markConversationAsRead:", error);
    return { success: false };
  }
}

// ─────────────────────────────────────────────
// POST "NEED HELP" TO CONVERSATION WITH NOTE REF
// Integrates with LifeNote directive help requests
// ─────────────────────────────────────────────
export async function postNoteHelpToConversation(data: {
  noteId: string;
  noteTitle: string;
  helpMessage?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const email = auth.email.toLowerCase().trim();
    const desc =
      data.helpMessage?.trim() ||
      `I requested assistance regarding note "${data.noteTitle}".`;

    return await sendConversationMessage({
      targetUserEmail: email,
      message: desc,
      noteRef: {
        noteId: data.noteId,
        noteTitle: data.noteTitle,
      },
    });
  } catch (error: any) {
    console.error("Error in postNoteHelpToConversation:", error);
    return { success: false, error: error.message || "Failed to post note help request." };
  }
}

// ─────────────────────────────────────────────
// GET MESSAGING BADGE COUNT (Used for icons and badges)
// ─────────────────────────────────────────────
export async function getMessagingBadgeCount(): Promise<number> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return 0;

    await connectToDatabase();
    if (isSuperAdminUser(auth)) {
      const result = await LifeConversation.aggregate([
        { $group: { _id: null, totalUnread: { $sum: "$unreadByAdmin" } } },
      ]);
      return result[0]?.totalUnread || 0;
    } else {
      const email = auth.email.toLowerCase().trim();
      const conv = await LifeConversation.findOne({ userEmail: email }).select("unreadByUser").lean();
      return (conv as any)?.unreadByUser || 0;
    }
  } catch (error) {
    console.error("Error in getMessagingBadgeCount:", error);
    return 0;
  }
}
