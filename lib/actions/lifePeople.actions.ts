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
import LifeAsset from "@/lib/database/models/lifeAsset.model";
import Admin from "@/lib/database/models/admin.model";
import {
  getLifeAuthContext,
  logLifeActivity,
  DEFAULT_OWNER_PERMS,
} from "@/lib/life/auth";
import { createInAppNotification } from "./lifeNotification.actions";
import {
  ILifePerson,
  PersonStatus,
  LifeRole,
  AccountStatus,
  LifePermission,
} from "@/types";

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
    query.$or = [
      { name: regex },
      { relation: regex },
      { phone: regex },
      { email: regex },
    ];
  }

  if (!auth.isOwner && !auth.isAdmin) {
    const allowedIds: string[] = [];
    if (auth.personId) allowedIds.push(String(auth.personId));
    if (auth.permissions?.allowedPersonIds?.length) {
      allowedIds.push(...auth.permissions.allowedPersonIds.map(String));
    }
    if (allowedIds.length === 0) return [];
    query._id = { $in: allowedIds };
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
      throw new Error(
        "Forbidden: You are only authorized to access your own private profile.",
      );
    }
  }

  const person = (await LifePerson.findById(id).lean()) as any;
  if (!person) return null;

  const isOwnerOrSuper =
    person.role === "owner" || person.role === "super_admin";
  const canViewOwnerDetails = auth.isOwner || auth.isAdmin;

  // Fetch related records linked strictly to this person (or comprehensive owner records if viewing owner)
  const [
    financialCare,
    moneyRecords,
    documents,
    contacts,
    notes,
    instructions,
    responsibilities,
    messages,
    assets,
  ] = await Promise.all([
    LifeFinancialSupport.find(
      isOwnerOrSuper && canViewOwnerDetails ? {} : { recipientPersonId: id },
    )
      .sort({ givenDate: -1 })
      .lean(),
    LifeMoneyRecord.find(
      isOwnerOrSuper && canViewOwnerDetails ? {} : { personId: id },
    )
      .sort({ date: -1 })
      .lean(),
    LifeDocument.find(
      isOwnerOrSuper && canViewOwnerDetails
        ? {}
        : { $or: [{ relatedPersonId: id }, { assignedToPersonIds: id }] },
    ).lean(),
    LifeContact.find(
      isOwnerOrSuper && canViewOwnerDetails ? {} : { relatedPersonId: id },
    ).lean(),
    LifeInformation.find(
      isOwnerOrSuper && canViewOwnerDetails
        ? {
            $or: [
              { relatedPersonId: id },
              { category: { $in: ["personal", "emergency", "instruction"] } },
            ],
          }
        : { relatedPersonId: id },
    ).lean(),
    LifeInstruction.find(
      isOwnerOrSuper && canViewOwnerDetails
        ? {}
        : { $or: [{ assignedPersonId: id }, { backupPersonId: id }] },
    ).lean(),
    LifeResponsibility.find(
      isOwnerOrSuper && canViewOwnerDetails
        ? {}
        : { $or: [{ assignedPersonId: id }, { backupPersonId: id }] },
    ).lean(),
    isOwnerOrSuper && canViewOwnerDetails
      ? LifeLegacyMessage.find().lean()
      : LifeLegacyMessage.find({ recipientPersonId: id }).lean(),
    isOwnerOrSuper && canViewOwnerDetails
      ? LifeAsset.find({ status: { $ne: "disposed" } }).lean()
      : LifeAsset.find({ relatedPersonId: id }).lean(),
  ]);

  // If caller is an individual, filter unreleased legacy messages
  const filteredMessages =
    !auth.isOwner && !auth.isAdmin
      ? messages.filter(
          (m: any) => m.isReleased || m.visibility === "visible_now",
        )
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
    assets: JSON.parse(JSON.stringify(assets || [])),
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
  isRecordOnly?: boolean;
  permissions?: Record<string, boolean>;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error(
      "Forbidden: Only Owners/Admins can add new People profiles.",
    );
  }

  const isSuper = data.role === "super_admin" || data.role === "owner";
  const finalRole = data.role || "individual";
  const isRecordOnly = Boolean(data.isRecordOnly);
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
    email: isRecordOnly ? "" : data.email?.toLowerCase().trim() || "",
    role: finalRole,
    userRole: finalRole,
    status: data.status || "active",
    accountStatus: data.accountStatus || "active",
    isLoginEnabled: isRecordOnly ? false : (data.isLoginEnabled ?? true),
    isRecordOnly,
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
      { upsert: true },
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
    socialLinks: {
      facebook?: string;
      messenger?: string;
      instagram?: string;
      tiktok?: string;
      telegram?: string;
      linkedin?: string;
      youtube?: string;
      website?: string;
    };
  }>,
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const isOwnerOrAdmin = auth.isOwner || auth.isAdmin;
  const isSelf = auth.personId && String(auth.personId) === String(id);

  if (!isOwnerOrAdmin && !isSelf) {
    throw new Error(
      "Forbidden: You are not authorized to modify this profile.",
    );
  }

  // If self-user (non-owner/admin), only allow updating contact and social links
  const updateData: Record<string, unknown> = {};
  if (isOwnerOrAdmin) {
    Object.assign(updateData, data);
    const isSuper = data.role === "super_admin" || data.role === "owner";
    if (data.role) {
      updateData.userRole = data.role;
      if (isSuper) {
        updateData.permissions = DEFAULT_OWNER_PERMS;
      }
    }
  } else {
    // Only permit safe contact and social fields for self
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
    if (data.socialLinks !== undefined)
      updateData.socialLinks = data.socialLinks;
  }

  const updated = (await LifePerson.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true },
  ).lean()) as (ILifePerson & { _id: unknown }) | null;
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
        { upsert: true },
      ).catch(() => {});
    } else if (
      data.role &&
      data.role !== "super_admin" &&
      data.role !== "admin"
    ) {
      await Admin.findOneAndUpdate(
        { email: new RegExp(`^${targetEmail}$`, "i") },
        { $set: { isActive: false } },
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
    throw new Error(
      "Forbidden: Only Owners/Admins can archive People profiles.",
    );
  }

  const archived = (await LifePerson.findByIdAndUpdate(
    id,
    { status: "archived", accountStatus: "archived", isLoginEnabled: false },
    { new: true },
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
  newStatus: AccountStatus,
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
    { new: true },
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

/**
 * Updates full profile & access permissions with diff tracking (§5).
 */
export async function updatePersonAccessAndPermissions(
  personId: string,
  data: {
    name?: string;
    relation?: string;
    designation?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    role: LifeRole;
    status?: PersonStatus;
    accountStatus?: AccountStatus;
    isLoginEnabled?: boolean;
    isRecordOnly?: boolean;
    emergencyPriority?: number;
    allowedBusinessIds?: string[];
    allowedCategoryKeys?: string[];
    allowedSubcategoryIds?: string[];
    permissions: LifePermission;
    addedDiffSummary?: string[];
    removedDiffSummary?: string[];
  },
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can modify permissions.");
  }

  const person = await LifePerson.findById(personId);
  if (!person) throw new Error("Person profile not found.");

  // Super Admin cannot modify Owner's account unless caller is Owner
  const isTargetOwner =
    person.role === "owner" || person.role === "super_admin";
  if (isTargetOwner && !auth.isOwner) {
    throw new Error(
      "Forbidden: Super Admins cannot modify Owner-level control.",
    );
  }

  const isSuper = data.role === "super_admin" || data.role === "owner";
  const finalPerms: LifePermission = isSuper
    ? DEFAULT_OWNER_PERMS
    : {
        ...data.permissions,
        allowedBusinessIds: data.allowedBusinessIds || [],
        allowedCategoryKeys: data.allowedCategoryKeys || [],
        allowedSubcategoryIds: data.allowedSubcategoryIds || [],
      };

  const isRecordOnly = Boolean(data.isRecordOnly);
  const isLoginEnabled = isRecordOnly ? false : (data.isLoginEnabled ?? true);

  const prevRole = person.role;
  const updateFields: Record<string, unknown> = {
    role: data.role,
    userRole: data.role,
    permissions: finalPerms,
    isRecordOnly,
    isLoginEnabled,
  };

  if (data.name !== undefined) updateFields.name = data.name.trim();
  if (data.relation !== undefined) updateFields.relation = data.relation.trim();
  if (data.designation !== undefined)
    updateFields.designation = data.designation.trim();
  if (data.phone !== undefined) updateFields.phone = data.phone.trim();
  if (data.whatsapp !== undefined) updateFields.whatsapp = data.whatsapp.trim();
  if (data.email !== undefined)
    updateFields.email = isRecordOnly ? "" : data.email.toLowerCase().trim();
  if (data.status !== undefined) updateFields.status = data.status;
  if (data.accountStatus !== undefined)
    updateFields.accountStatus = data.accountStatus;
  if (data.emergencyPriority !== undefined)
    updateFields.emergencyPriority = Number(data.emergencyPriority) || 0;

  const updated = (await LifePerson.findByIdAndUpdate(
    personId,
    { $set: updateFields },
    { new: true },
  ).lean()) as (ILifePerson & { _id: unknown }) | null;

  if (!updated) throw new Error("Failed to update person.");

  // Sync with Admin collection if role is admin or super_admin
  const targetEmail = (updated.email || "").toLowerCase().trim();
  if (targetEmail) {
    if (updated.role === "super_admin" || updated.role === "admin") {
      await Admin.findOneAndUpdate(
        { email: new RegExp(`^${targetEmail}$`, "i") },
        {
          $set: {
            email: targetEmail,
            name: updated.name,
            role: updated.role === "super_admin" ? "super_admin" : "admin",
            isActive:
              updated.status === "active" && updated.isLoginEnabled !== false,
          },
        },
        { upsert: true },
      ).catch(() => {});
    } else {
      await Admin.findOneAndUpdate(
        { email: new RegExp(`^${targetEmail}$`, "i") },
        { $set: { isActive: false } },
      ).catch(() => {});
    }
  }

  const addedStr = (data.addedDiffSummary || []).join(", ") || "None";
  const removedStr = (data.removedDiffSummary || []).join(", ") || "None";

  // Audit log with detailed diff
  await logLifeActivity({
    action: "UPDATE_USER_PERMISSIONS_DIFF",
    resourceType: "people",
    resourceId: personId,
    resourceName: updated.name,
    details: `Updated permissions for ${updated.name} (Role: ${prevRole} -> ${data.role}). Added: [${addedStr}]. Removed: [${removedStr}].`,
    previousValue: `Role: ${prevRole}`,
    newValue: `Role: ${data.role} | Added: [${addedStr}] | Removed: [${removedStr}]`,
    isCritical: true,
  });

  // In-app notification to the affected user if they have login access
  if (updated.email && !isRecordOnly) {
    await createInAppNotification({
      recipientEmail: updated.email,
      recipientPersonId: personId,
      title: "Your Account Permissions Updated",
      message: `Your Life role is now "${data.role}". Access permissions have been updated by ${auth.name}.`,
      type: "access_changed",
      link: `/people/${personId}`,
    });
  }

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  revalidatePath("/access");
  revalidatePath("/");

  return {
    success: true,
    person: JSON.parse(JSON.stringify(updated)),
  };
}
