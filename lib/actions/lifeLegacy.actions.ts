"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeLegacyMessage from "@/lib/database/models/lifeLegacyMessage.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { ILifeLegacyMessage, ILifePerson, LifeVisibility } from "@/types";

export async function getLegacyMessages(): Promise<ILifeLegacyMessage[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};

  // If normal user (not owner/admin), they can ONLY see letters intended specifically for them and released
  if (!auth.isOwner && !auth.isAdmin) {
    if (auth.personId) {
      query.recipientPersonId = auth.personId;
      query.$or = [{ isReleased: true }, { visibility: "visible_now" }];
    } else {
      return [];
    }
  }

  const messages = await LifeLegacyMessage.find(query)
    .populate("recipientPersonId", "name relation avatarUrl")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(messages));
}

export async function createLegacyMessage(data: {
  title: string;
  recipientPersonId: string;
  message: string;
  visibility?: LifeVisibility;
  releaseCondition?: string;
  scheduledDate?: string;
  attachments?: string[];
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners can compose Legacy Messages.");
  }

  const person = (await LifePerson.findById(data.recipientPersonId).lean()) as (ILifePerson & { _id: unknown }) | null;
  if (!person) throw new Error("Recipient person not found.");

  const legacy = await LifeLegacyMessage.create({
    title: data.title,
    recipientPersonId: person._id,
    recipientName: person.name,
    message: data.message,
    visibility: data.visibility || "admin_can_release",
    releaseCondition: data.releaseCondition || "",
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
    attachments: data.attachments || [],
    isReleased: data.visibility === "visible_now",
  });

  await logLifeActivity({
    action: "CREATE_LEGACY_MESSAGE",
    resourceType: "legacy",
    resourceId: String(legacy._id),
    resourceName: legacy.title,
    details: `Composed legacy message for ${person.name} (${person.relation})`,
  });

  revalidatePath("/legacy");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(legacy));
}

export async function toggleLegacyRelease(id: string, isReleased: boolean) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden");
  }

  const updated = (await LifeLegacyMessage.findByIdAndUpdate(
    id,
    {
      isReleased,
      releasedAt: isReleased ? new Date() : undefined,
      releasedBy: isReleased ? auth.email : "",
    },
    { new: true }
  ).lean()) as (ILifeLegacyMessage & { _id: unknown }) | null;

  if (updated) {
    await logLifeActivity({
      action: isReleased ? "RELEASE_LEGACY_MESSAGE" : "CONCEAL_LEGACY_MESSAGE",
      resourceType: "legacy",
      resourceId: id,
      resourceName: updated.title,
      details: `${isReleased ? "Released" : "Concealed"} legacy message for ${updated.recipientName}`,
    });
  }

  revalidatePath("/legacy");
  revalidatePath("/");
  return { success: true };
}

export async function deleteLegacyMessage(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) throw new Error("Forbidden");

  const deleted = (await LifeLegacyMessage.findByIdAndDelete(id).lean()) as (ILifeLegacyMessage & { _id: unknown }) | null;
  if (deleted) {
    await logLifeActivity({
      action: "DELETE_LEGACY_MESSAGE",
      resourceType: "legacy",
      resourceId: id,
      resourceName: deleted.title,
      details: `Deleted legacy message: "${deleted.title}"`,
    });
  }

  revalidatePath("/legacy");
  revalidatePath("/");
  return { success: true };
}
