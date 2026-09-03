"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeContact from "@/lib/database/models/lifeContact.model";
import LifeInformation from "@/lib/database/models/lifeInformation.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { ILifePerson, PersonStatus, LifeRole } from "@/types";

export async function getPeople(params?: {
  search?: string;
  relation?: string;
  status?: PersonStatus;
}): Promise<ILifePerson[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};

  if (params?.status) {
    query.status = params.status;
  } else {
    query.status = { $ne: "archived" };
  }

  if (params?.relation) {
    query.relation = params.relation;
  }

  if (params?.search) {
    const regex = new RegExp(params.search.trim(), "i");
    query.$or = [{ name: regex }, { relation: regex }, { phone: regex }, { email: regex }];
  }

  // If user is an individual (e.g. Sabbir), only return their own profile unless granted personal view
  if (!auth.isOwner && !auth.isAdmin && auth.personId) {
    if (!auth.permissions.canViewPersonal) {
      query._id = auth.personId;
    }
  }

  const people = await LifePerson.find(query)
    .sort({ emergencyPriority: -1, createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(people));
}

export async function getPersonById(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return null;

  // Individual privacy check
  if (!auth.isOwner && !auth.isAdmin && auth.personId && auth.personId !== id) {
    if (!auth.permissions.canViewPersonal) {
      throw new Error("Forbidden: You are not authorized to view this person's private profile.");
    }
  }

  const person = await LifePerson.findById(id).lean();
  if (!person) return null;

  // Fetch related records linked to this person
  const [moneyRecords, documents, contacts, notes] = await Promise.all([
    LifeMoneyRecord.find({ personId: id }).sort({ date: -1 }).lean(),
    LifeDocument.find({
      $or: [{ relatedPersonId: id }, { assignedToPersonIds: id }],
    }).lean(),
    LifeContact.find({ relatedPersonId: id }).lean(),
    LifeInformation.find({ relatedPersonId: id }).lean(),
  ]);

  return {
    person: JSON.parse(JSON.stringify(person)),
    moneyRecords: JSON.parse(JSON.stringify(moneyRecords)),
    documents: JSON.parse(JSON.stringify(documents)),
    contacts: JSON.parse(JSON.stringify(contacts)),
    notes: JSON.parse(JSON.stringify(notes)),
  };
}

export async function createPerson(data: {
  name: string;
  relation: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  role?: LifeRole;
  status?: PersonStatus;
  personalMessage?: string;
  responsibilities?: string[];
  businessInstructions?: string[];
  notes?: string;
  emergencyPriority?: number;
  permissions?: Record<string, boolean>;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can add new People profiles.");
  }

  const person = await LifePerson.create({
    name: data.name,
    relation: data.relation,
    phone: data.phone || "",
    whatsapp: data.whatsapp || data.phone || "",
    email: data.email?.toLowerCase() || "",
    role: data.role || "individual",
    status: data.status || "active",
    personalMessage: data.personalMessage || "",
    responsibilities: data.responsibilities || [],
    businessInstructions: data.businessInstructions || [],
    notes: data.notes || "",
    emergencyPriority: data.emergencyPriority || 0,
    permissions: data.permissions || {
      canViewPersonal: false,
      canViewBusiness: false,
      canViewFinancial: false,
      canViewSensitive: false,
      canRevealVault: false,
      canManageAccess: false,
      canAccessEmergency: false,
    },
  });

  await logLifeActivity({
    action: "CREATE_PERSON",
    resourceType: "people",
    resourceId: String(person._id),
    resourceName: person.name,
    details: `Added new person profile: ${person.name} (${person.relation})`,
  });

  revalidatePath("/people");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(person));
}

export async function updatePerson(
  id: string,
  data: Partial<{
    name: string;
    relation: string;
    phone: string;
    whatsapp: string;
    email: string;
    role: LifeRole;
    status: PersonStatus;
    personalMessage: string;
    responsibilities: string[];
    businessInstructions: string[];
    notes: string;
    emergencyPriority: number;
    permissions: Record<string, boolean>;
  }>
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can modify People profiles.");
  }

  const updated = (await LifePerson.findByIdAndUpdate(id, { $set: data }, { new: true }).lean()) as (ILifePerson & { _id: unknown }) | null;
  if (!updated) throw new Error("Person not found.");

  await logLifeActivity({
    action: "UPDATE_PERSON",
    resourceType: "people",
    resourceId: id,
    resourceName: updated.name,
    details: `Updated person profile: ${updated.name}`,
  });

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  revalidatePath("/");
  return JSON.parse(JSON.stringify(updated));
}

export async function archivePerson(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can archive People profiles.");
  }

  const archived = (await LifePerson.findByIdAndUpdate(
    id,
    { status: "archived" },
    { new: true }
  ).lean()) as (ILifePerson & { _id: unknown }) | null;

  if (archived) {
    await logLifeActivity({
      action: "ARCHIVE_PERSON",
      resourceType: "people",
      resourceId: id,
      resourceName: archived.name,
      details: `Archived person profile: ${archived.name}`,
    });
  }

  revalidatePath("/people");
  revalidatePath("/");
  return { success: true };
}
