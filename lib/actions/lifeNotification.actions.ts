"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeNotification from "@/lib/database/models/lifeNotification.model";
import { getLifeAuthContext } from "@/lib/life/auth";
import { NotificationType, ILifeNotification } from "@/types";

/**
 * Creates an in-app notification.
 */
export async function createInAppNotification(data: {
  recipientEmail: string;
  recipientPersonId?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) {
  try {
    await connectToDatabase();
    if (!data.recipientEmail?.trim()) return null;

    const notif = await LifeNotification.create({
      recipientEmail: data.recipientEmail.toLowerCase().trim(),
      recipientPersonId: data.recipientPersonId,
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type,
      link: data.link || "",
      isRead: false,
    });

    return JSON.parse(JSON.stringify(notif));
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
    return null;
  }
}

/**
 * Retrieves the current user's unread and recent notifications.
 */
export async function getMyNotifications(): Promise<{
  notifications: ILifeNotification[];
  unreadCount: number;
}> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return { notifications: [], unreadCount: 0 };

  const emails = [auth.email.toLowerCase().trim()];
  const query: Record<string, unknown> = {
    $or: [
      { recipientEmail: { $in: emails } },
      ...(auth.personId ? [{ recipientPersonId: auth.personId }] : []),
    ],
  };

  const [notifications, unreadCount] = await Promise.all([
    LifeNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    LifeNotification.countDocuments({ ...query, isRead: false }),
  ]);

  return {
    notifications: JSON.parse(JSON.stringify(notifications)),
    unreadCount,
  };
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return { success: false };

  await LifeNotification.findByIdAndUpdate(id, { $set: { isRead: true } });
  revalidatePath("/");
  return { success: true };
}

/**
 * Marks all notifications for current user as read.
 */
export async function markAllNotificationsAsRead() {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return { success: false };

  const emails = [auth.email.toLowerCase().trim()];
  await LifeNotification.updateMany(
    {
      $or: [
        { recipientEmail: { $in: emails } },
        ...(auth.personId ? [{ recipientPersonId: auth.personId }] : []),
      ],
      isRead: false,
    },
    { $set: { isRead: true } }
  );

  revalidatePath("/");
  return { success: true };
}
