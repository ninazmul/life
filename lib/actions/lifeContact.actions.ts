"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeContact from "@/lib/database/models/lifeContact.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { ILifeContact, ContactCategory } from "@/types";

export async function getContacts(params?: {
  category?: ContactCategory;
  search?: string;
}): Promise<ILifeContact[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};
  if (params?.category) query.category = params.category;
  if (params?.search) {
    const regex = new RegExp(params.search.trim(), "i");
    query.$or = [{ name: regex }, { phone: regex }, { email: regex }, { company: regex }];
  }

  if (!auth.isOwner && !auth.isAdmin) {
    if (!auth.permissions.canViewPersonal) return [];

    const allowedPersonIds: string[] = [];
    if (auth.personId) allowedPersonIds.push(String(auth.personId));
    if (auth.permissions?.allowedPersonIds?.length) {
      allowedPersonIds.push(...auth.permissions.allowedPersonIds.map(String));
    }

    const businessOr: any[] = [];
    if (auth.personId) {
      businessOr.push({ "partners.personId": auth.personId });
      businessOr.push({ "engineerContact.personId": auth.personId });
    }
    if (auth.permissions?.allowedBusinessIds?.length) {
      businessOr.push({ _id: { $in: auth.permissions.allowedBusinessIds } });
    }

    let allowedBusinessIds: string[] = [];
    if (businessOr.length > 0) {
      try {
        const LifeBusiness = (await import("@/lib/database/models/lifeBusiness.model")).default;
        const connected = await LifeBusiness.find({ $or: businessOr }).select("_id").lean();
        allowedBusinessIds = connected.map((b: any) => String(b._id));
      } catch (e) {
        console.error("Error querying connected businesses for contacts:", e);
      }
    }

    const contactOr: any[] = [];
    if (allowedPersonIds.length > 0) {
      contactOr.push({ relatedPersonId: { $in: allowedPersonIds } });
    }
    if (allowedBusinessIds.length > 0) {
      contactOr.push({ relatedBusinessId: { $in: allowedBusinessIds } });
    }
    if (contactOr.length === 0) return [];

    if (query.$or) {
      query.$and = [query.$or ? { $or: query.$or } : {}, { $or: contactOr }];
      delete query.$or;
    } else {
      query.$or = contactOr;
    }
  }

  const contacts = await LifeContact.find(query)
    .populate("relatedPersonId", "name relation")
    .populate("relatedBusinessId", "name")
    .sort({ name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(contacts));
}

export async function createContact(data: {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  role?: string;
  category: ContactCategory;
  notes?: string;
  whenToContact?: string;
  relatedPersonId?: string;
  relatedBusinessId?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const cleanPersonId =
    data.relatedPersonId && data.relatedPersonId !== "none"
      ? data.relatedPersonId
      : undefined;
  const cleanBusinessId =
    data.relatedBusinessId && data.relatedBusinessId !== "none"
      ? data.relatedBusinessId
      : undefined;

  const contact = await LifeContact.create({
    name: data.name,
    phone: data.phone,
    whatsapp: data.whatsapp || data.phone,
    email: data.email?.toLowerCase() || "",
    company: data.company || "",
    role: data.role || "",
    category: data.category || "other",
    notes: data.notes || "",
    whenToContact: data.whenToContact || "",
    relatedPersonId: cleanPersonId,
    relatedBusinessId: cleanBusinessId,
  });

  await logLifeActivity({
    action: "CREATE_CONTACT",
    resourceType: "contact",
    resourceId: String(contact._id),
    resourceName: contact.name,
    details: `Added new contact: "${contact.name}" (${contact.phone})`,
  });

  revalidatePath("/contacts");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(contact));
}

export async function updateContact(id: string, data: Partial<ILifeContact>) {
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

  const updated = (await LifeContact.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true }
  ).lean()) as (ILifeContact & { _id: unknown }) | null;

  if (updated) {
    await logLifeActivity({
      action: "UPDATE_CONTACT",
      resourceType: "contact",
      resourceId: id,
      resourceName: updated.name,
      details: `Updated contact: "${updated.name}"`,
    });
  }

  revalidatePath("/contacts");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteContact(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) throw new Error("Forbidden");

  const deleted = (await LifeContact.findByIdAndDelete(id).lean()) as (ILifeContact & { _id: unknown }) | null;
  if (deleted) {
    await logLifeActivity({
      action: "DELETE_CONTACT",
      resourceType: "contact",
      resourceId: id,
      resourceName: deleted.name,
      details: `Deleted contact: "${deleted.name}"`,
    });
  }

  revalidatePath("/contacts");
  revalidatePath("/");
  return { success: true };
}
