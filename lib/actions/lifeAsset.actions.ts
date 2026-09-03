"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeAsset from "@/lib/database/models/lifeAsset.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { ILifeAsset, AssetCategory } from "@/types";

export async function getAssets(params?: {
  category?: AssetCategory;
}): Promise<ILifeAsset[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};
  if (params?.category) query.category = params.category;

  const assets = await LifeAsset.find(query)
    .populate("relatedPersonId", "name relation")
    .populate("relatedBusinessId", "name")
    .sort({ value: -1 })
    .lean();

  return JSON.parse(JSON.stringify(assets));
}

export async function createAsset(data: {
  name: string;
  category: AssetCategory;
  value: number;
  currency?: string;
  ownershipPercentage?: number;
  location?: string;
  relatedPersonId?: string;
  relatedBusinessId?: string;
  documents?: string[];
  notes?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can add assets.");
  }

  const cleanPersonId =
    data.relatedPersonId && data.relatedPersonId !== "none"
      ? data.relatedPersonId
      : undefined;
  const cleanBusinessId =
    data.relatedBusinessId && data.relatedBusinessId !== "none"
      ? data.relatedBusinessId
      : undefined;

  const asset = await LifeAsset.create({
    name: data.name,
    category: data.category || "other",
    value: Number(data.value) || 0,
    currency: data.currency || "BDT",
    ownershipPercentage: Number(data.ownershipPercentage) || 100,
    location: data.location || "",
    relatedPersonId: cleanPersonId,
    relatedBusinessId: cleanBusinessId,
    documents: data.documents || [],
    notes: data.notes || "",
    status: "active",
  });

  await logLifeActivity({
    action: "CREATE_ASSET",
    resourceType: "asset",
    resourceId: String(asset._id),
    resourceName: asset.name,
    details: `Added new asset: "${asset.name}" valued at ৳${asset.value.toLocaleString()}`,
  });

  revalidatePath("/assets");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(asset));
}

export async function updateAsset(
  id: string,
  data: Partial<ILifeAsset>
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden");
  }

  const payload: Record<string, unknown> = { ...data };
  if (data.relatedPersonId) {
    payload.relatedPersonId = data.relatedPersonId === "none" ? null : data.relatedPersonId;
  }
  if (data.relatedBusinessId) {
    payload.relatedBusinessId = data.relatedBusinessId === "none" ? null : data.relatedBusinessId;
  }

  const updated = (await LifeAsset.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true }
  ).lean()) as (ILifeAsset & { _id: unknown }) | null;

  if (updated) {
    await logLifeActivity({
      action: "UPDATE_ASSET",
      resourceType: "asset",
      resourceId: id,
      resourceName: updated.name,
      details: `Updated asset details: "${updated.name}"`,
    });
  }

  revalidatePath("/assets");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteAsset(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden");
  }

  const deleted = (await LifeAsset.findByIdAndDelete(id).lean()) as (ILifeAsset & { _id: unknown }) | null;
  if (deleted) {
    await logLifeActivity({
      action: "DELETE_ASSET",
      resourceType: "asset",
      resourceId: id,
      resourceName: deleted.name,
      details: `Deleted asset: "${deleted.name}"`,
    });
  }

  revalidatePath("/assets");
  revalidatePath("/");
  return { success: true };
}
