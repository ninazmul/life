"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { ILifeDocument, DocumentCategory, LifeVisibility } from "@/types";

export async function getDocuments(params?: {
  category?: DocumentCategory;
}): Promise<ILifeDocument[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};
  if (params?.category) query.category = params.category;

  // RBAC for documents
  if (!auth.isOwner && !auth.isAdmin) {
    if (auth.personId) {
      query.$or = [
        { relatedPersonId: auth.personId },
        { assignedToPersonIds: auth.personId },
        { visibility: "visible_now" },
      ];
    } else {
      query.visibility = "visible_now";
    }
  }

  const documents = await LifeDocument.find(query)
    .populate("relatedPersonId", "name relation")
    .populate("relatedBusinessId", "name")
    .populate("assignedToPersonIds", "name relation")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(documents));
}

export async function createDocument(data: {
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  relatedPersonId?: string;
  relatedBusinessId?: string;
  assignedToPersonIds?: string[];
  visibility?: LifeVisibility;
  notes?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can upload documents.");
  }

  const cleanPersonId =
    data.relatedPersonId && data.relatedPersonId !== "none"
      ? data.relatedPersonId
      : undefined;
  const cleanBusinessId =
    data.relatedBusinessId && data.relatedBusinessId !== "none"
      ? data.relatedBusinessId
      : undefined;

  const doc = await LifeDocument.create({
    title: data.title,
    category: data.category || "other",
    fileUrl: data.fileUrl,
    fileType: data.fileType || "application/pdf",
    fileSize: data.fileSize || 0,
    relatedPersonId: cleanPersonId,
    relatedBusinessId: cleanBusinessId,
    assignedToPersonIds: data.assignedToPersonIds || [],
    visibility: data.visibility || "visible_now",
    notes: data.notes || "",
  });

  await logLifeActivity({
    action: "UPLOAD_DOCUMENT",
    resourceType: "document",
    resourceId: String(doc._id),
    resourceName: doc.title,
    details: `Added document: "${doc.title}" [${doc.category}]`,
  });

  revalidatePath("/documents");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(doc));
}

export async function deleteDocument(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden");
  }

  const deleted = (await LifeDocument.findByIdAndDelete(id).lean()) as (ILifeDocument & { _id: unknown }) | null;
  if (deleted) {
    await logLifeActivity({
      action: "DELETE_DOCUMENT",
      resourceType: "document",
      resourceId: id,
      resourceName: deleted.title,
      details: `Deleted document: "${deleted.title}"`,
    });
  }

  revalidatePath("/documents");
  revalidatePath("/");
  return { success: true };
}
