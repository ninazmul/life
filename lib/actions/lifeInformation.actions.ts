"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeInformation from "@/lib/database/models/lifeInformation.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { ILifeInformation, LifeInfoCategory, LifePriority, LifeVisibility } from "@/types";

export async function getInformationList(params?: {
  category?: LifeInfoCategory;
  priority?: LifePriority;
  search?: string;
}): Promise<ILifeInformation[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};

  if (params?.category) {
    query.category = params.category;
  }

  if (params?.priority) {
    query.priority = params.priority;
  }

  if (params?.search) {
    const regex = new RegExp(params.search.trim(), "i");
    query.$or = [{ title: regex }, { summary: regex }, { tags: regex }];
  }

  // RBAC: If individual user, filter out records unless assigned or business allowed
  if (!auth.isOwner && !auth.isAdmin) {
    if (auth.personId) {
      query.$or = [
        { relatedPersonId: auth.personId },
        { visibility: "visible_now" },
        ...(auth.permissions.canViewBusiness ? [{ category: "business" }] : []),
      ];
    } else {
      query.visibility = "visible_now";
    }
  }

  const items = await LifeInformation.find(query)
    .populate("relatedPersonId", "name relation")
    .populate("relatedBusinessId", "name")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(items));
}

export async function createInformation(data: {
  title: string;
  summary?: string;
  content: string;
  category: LifeInfoCategory;
  relatedPersonId?: string;
  relatedBusinessId?: string;
  priority?: LifePriority;
  visibility?: LifeVisibility;
  scheduledReleaseDate?: string;
  isEmergency?: boolean;
  attachments?: string[];
  tags?: string[];
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const cleanPersonId = data.relatedPersonId && data.relatedPersonId !== "none" ? data.relatedPersonId : undefined;
  const cleanBusinessId = data.relatedBusinessId && data.relatedBusinessId !== "none" ? data.relatedBusinessId : undefined;

  const item = await LifeInformation.create({
    title: data.title,
    summary: data.summary || "",
    content: data.content,
    category: data.category || "personal",
    relatedPersonId: cleanPersonId,
    relatedBusinessId: cleanBusinessId,
    priority: data.priority || "medium",
    visibility: data.visibility || "visible_now",
    scheduledReleaseDate: data.scheduledReleaseDate ? new Date(data.scheduledReleaseDate) : undefined,
    isEmergency: data.isEmergency || false,
    attachments: data.attachments || [],
    tags: data.tags || [],
  });

  await logLifeActivity({
    action: "CREATE_INFO",
    resourceType: "information",
    resourceId: String(item._id),
    resourceName: item.title,
    details: `Added new note/information: "${item.title}" [${item.category}]`,
  });

  revalidatePath("/information");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(item));
}

export async function updateInformation(
  id: string,
  data: Partial<{
    title: string;
    summary: string;
    content: string;
    category: LifeInfoCategory;
    relatedPersonId: string;
    relatedBusinessId: string;
    priority: LifePriority;
    visibility: LifeVisibility;
    scheduledReleaseDate?: string;
    isEmergency: boolean;
    attachments: string[];
    tags: string[];
  }>
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const payload: Record<string, unknown> = { ...data };
  if (data.relatedPersonId) {
    payload.relatedPersonId = data.relatedPersonId === "none" ? null : data.relatedPersonId;
  }
  if (data.relatedBusinessId) {
    payload.relatedBusinessId = data.relatedBusinessId === "none" ? null : data.relatedBusinessId;
  }
  if (data.scheduledReleaseDate) {
    payload.scheduledReleaseDate = new Date(data.scheduledReleaseDate);
  }

  const updated = (await LifeInformation.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true }
  ).lean()) as (ILifeInformation & { _id: unknown }) | null;

  if (updated) {
    await logLifeActivity({
      action: "UPDATE_INFO",
      resourceType: "information",
      resourceId: id,
      resourceName: updated.title,
      details: `Updated note/information: "${updated.title}"`,
    });
  }

  revalidatePath("/information");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteInformation(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can delete information.");
  }

  const deleted = (await LifeInformation.findByIdAndDelete(id).lean()) as (ILifeInformation & { _id: unknown }) | null;
  if (deleted) {
    await logLifeActivity({
      action: "DELETE_INFO",
      resourceType: "information",
      resourceId: id,
      resourceName: deleted.title,
      details: `Deleted note/information: "${deleted.title}"`,
    });
  }

  revalidatePath("/information");
  revalidatePath("/");
  return { success: true };
}
