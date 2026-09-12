"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeContact from "@/lib/database/models/lifeContact.model";
import LifeInformation from "@/lib/database/models/lifeInformation.model";
import LifeInstruction from "@/lib/database/models/lifeInstruction.model";
import LifeResponsibility from "@/lib/database/models/lifeResponsibility.model";
import LifeLegacyMessage from "@/lib/database/models/lifeLegacyMessage.model";
import Admin from "@/lib/database/models/admin.model";
import { getLifeAuthContext, logLifeActivity, DEFAULT_OWNER_PERMS } from "@/lib/life/auth";
import { ILifePerson, PersonStatus, LifeRole, AccountStatus } from "@/types";

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

  // Strict tenant scoping: If caller is not Owner or Admin, they can ONLY retrieve their own profile
  if (!auth.isOwner && !auth.isAdmin) {
    if (!auth.personId) return [];
    query._id = auth.personId;
  }

  const people = await LifePerson.find(query)
    .sort({ emergencyPriority: -1, createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(people));
}

export async function getPersonById(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  // Strict IDOR mitigation: Individual user can NEVER inspect another person's private profile
  if (!auth.isOwner && !auth.isAdmin) {
    if (!auth.personId || String(auth.personId) !== String(id)) {
      throw new Error("Forbidden: You are only authorized to access your own private profile.");
    }
  }

  const person = await LifePerson.findById(id).lean();
  if (!person) return null;

  // Fetch related records linked strictly to this person
  const [financialCare, moneyRecords, documents, contacts, notes, instructions, responsibilities, messages] =
    await Promise.all([
      LifeFinancialSupport.find({ recipientPersonId: id }).sort({ givenDate: -1 }).lean(),
      LifeMoneyRecord.find({ personId: id }).sort({ date: -1 }).lean(),
      LifeDocument.find({
        $or: [{ relatedPersonId: id }, { assignedToPersonIds: id }],
      }).lean(),
      LifeContact.find({ relatedPersonId: id }).lean(),
      LifeInformation.find({ relatedPersonId: id }).lean(),
      LifeInstruction.find({
        $or: [{ assignedPersonId: id }, { backupPersonId: id }],
      }).lean(),
      LifeResponsibility.find({
        $or: [{ assignedPersonId: id }, { backupPersonId: id }],
      }).lean(),
      LifeLegacyMessage.find({ recipientPersonId: id }).lean(),
    ]);

  // If caller is an individual, filter unreleased legacy messages
  const filteredMessages = (!auth.isOwner && !auth.isAdmin)
    ? messages.filter((m: any) => m.isReleased || m.visibility === "visible_now")
    : messages;

  return {
    person: JSON.parse(JSON.stringify(person)),
    financialCare: JSON.parse(JSON.stringify(financialCare)),
    moneyRecords: JSON.parse(JSON.stringify(moneyRecords)),
    documents: JSON.parse(JSON.stringify(documents)),
    contacts: JSON.parse(JSON.stringify(contacts)),
    notes: JSON.parse(JSON.stringify(notes)),
    instructions: JSON.parse(JSON.stringify(instructions)),
    responsibilities: JSON.parse(JSON.stringify(responsibilities)),
    messages: JSON.parse(JSON.stringify(filteredMessages)),
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
  accountStatus?: AccountStatus;
  isLoginEnabled?: boolean;
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

  const isSuper = data.role === "super_admin" || data.role === "owner";
  const finalRole = data.role || "individual";
  const finalPerms = isSuper
    ? DEFAULT_OWNER_PERMS
    : data.permissions || {
        canViewPersonal: false,
        canViewBusiness: false,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
      };

  const person = await LifePerson.create({
    name: data.name,
    relation: data.relation,
    phone: data.phone || "",
    whatsapp: data.whatsapp || data.phone || "",
    email: data.email?.toLowerCase().trim() || "",
    role: finalRole,
    userRole: finalRole,
    status: data.status || "active",
    accountStatus: data.accountStatus || "active",
    isLoginEnabled: data.isLoginEnabled ?? true,
    personalMessage: data.personalMessage || "",
    responsibilities: data.responsibilities || [],
    businessInstructions: data.businessInstructions || [],
    notes: data.notes || "",
    emergencyPriority: data.emergencyPriority || 0,
    permissions: finalPerms,
  });

  if (isSuper && person.email) {
    const targetEmail = person.email.toLowerCase().trim();
    await Admin.findOneAndUpdate(
      { email: new RegExp(`^${targetEmail}$`, "i") },
      {
        $set: {
          email: targetEmail,
          name: person.name,
          role: "super_admin",
          isActive: true,
        },
      },
      { upsert: true }
    ).catch(() => {});
  }

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
    accountStatus: AccountStatus;
    isLoginEnabled: boolean;
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

  const isSuper = data.role === "super_admin" || data.role === "owner";
  const updateData: Record<string, unknown> = { ...data };
  if (data.role) {
    updateData.userRole = data.role;
    if (isSuper) {
      updateData.permissions = DEFAULT_OWNER_PERMS;
    }
  }

  const updated = (await LifePerson.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean()) as (ILifePerson & { _id: unknown }) | null;
  if (!updated) throw new Error("Person not found.");

  if (updated.email) {
    const targetEmail = updated.email.toLowerCase().trim();
    if (updated.role === "super_admin" || updated.role === "admin") {
      await Admin.findOneAndUpdate(
        { email: new RegExp(`^${targetEmail}$`, "i") },
        {
          $set: {
            email: targetEmail,
            name: updated.name,
            role: updated.role === "super_admin" ? "super_admin" : "admin",
            isActive: updated.status === "active",
          },
        },
        { upsert: true }
      ).catch(() => {});
    } else if (data.role && data.role !== "super_admin" && data.role !== "admin") {
      await Admin.findOneAndUpdate(
        { email: new RegExp(`^${targetEmail}$`, "i") },
        { $set: { isActive: false } }
      ).catch(() => {});
    }
  }

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
    { status: "archived", accountStatus: "archived", isLoginEnabled: false },
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

export async function setPersonAccountStatus(
  id: string,
  newStatus: AccountStatus
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can change account status.");
  }

  const validStatuses: AccountStatus[] = [
    "active",
    "locked",
    "temporarily_locked",
    "disabled",
    "archived",
  ];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid account status: ${newStatus}`);
  }

  const isLoginEnabled = newStatus === "active";

  const updated = (await LifePerson.findByIdAndUpdate(
    id,
    {
      accountStatus: newStatus,
      ...(newStatus === "archived" ? { status: "archived" } : {}),
      isLoginEnabled,
    },
    { new: true }
  ).lean()) as (ILifePerson & { _id: unknown }) | null;

  if (!updated) throw new Error("Person not found.");

  await logLifeActivity({
    action: "ACCOUNT_STATUS_CHANGE",
    resourceType: "people",
    resourceId: id,
    resourceName: updated.name,
    details: `Changed account status for "${updated.name}" to "${newStatus}" (login ${isLoginEnabled ? "enabled" : "disabled"})`,
    isCritical: newStatus !== "active",
  });

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  return { success: true, accountStatus: newStatus };
}
