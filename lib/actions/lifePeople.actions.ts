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
import LifeGuardian from "@/lib/database/models/lifeGuardian.model";
import LifeNote from "@/lib/database/models/lifeNote.model";
import LifeInvitation from "@/lib/database/models/lifeInvitation.model";
import LifeBusiness from "@/lib/database/models/lifeBusiness.model";
import LifeRecordPermission from "@/lib/database/models/lifeRecordPermission.model";
import Admin from "@/lib/database/models/admin.model";
import {
  getLifeAuthContext,
  logLifeActivity,
  DEFAULT_OWNER_PERMS,
} from "@/lib/life/auth";
import { sendPersonInvitation } from "./lifeInvitation.actions";
import { createInAppNotification } from "./lifeNotification.actions";
import {
  ILifePerson,
  PersonStatus,
  LifeRole,
  AccountStatus,
  LifePermission,
} from "@/types";
import {
  enrichWithClerkAvatars,
  getClerkAvatar,
  syncClerkUsersWithPeople,
} from "@/lib/life/clerk-avatar";

export async function getPeople(params?: {
  search?: string;
  relation?: string;
  category?: string;
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

  if (params?.category) {
    query.category = params.category;
  }

  if (params?.search) {
    const regex = new RegExp(params.search.trim(), "i");
    query.$or = [
      { name: regex },
      { relation: regex },
      { category: regex },
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

  const people = (await LifePerson.find(query)
    .sort({ emergencyPriority: -1, createdAt: -1 })
    .lean()) as any[];

  if (!people || people.length === 0) return [];

  const enriched = await enrichWithClerkAvatars(people);
  const personIds = enriched.map((p) => String(p._id));
  const personObjIds = enriched.map((p) => p._id);

  // Compute counts in parallel across domain collections
  const [
    notesByPerson,
    instructionsByPerson,
    responsibilitiesByPerson,
    moneyByPerson,
    financialSupportByPerson,
    documentsByPerson,
  ] = await Promise.all([
    LifeNote.aggregate([
      { $match: { assignedPersonId: { $in: personObjIds }, isArchived: { $ne: true } } },
      { $group: { _id: "$assignedPersonId", count: { $sum: 1 } } },
    ]).catch(() => []),
    LifeInstruction.aggregate([
      {
        $match: {
          $or: [
            { assignedPersonId: { $in: personIds } },
            { backupPersonId: { $in: personIds } },
          ],
        },
      },
      { $group: { _id: "$assignedPersonId", count: { $sum: 1 } } },
    ]).catch(() => []),
    LifeResponsibility.aggregate([
      {
        $match: {
          $or: [
            { assignedPersonId: { $in: personIds } },
            { backupPersonId: { $in: personIds } },
          ],
        },
      },
      { $group: { _id: "$assignedPersonId", count: { $sum: 1 } } },
    ]).catch(() => []),
    LifeMoneyRecord.aggregate([
      { $match: { personId: { $in: personIds } } },
      { $group: { _id: "$personId", count: { $sum: 1 } } },
    ]).catch(() => []),
    LifeFinancialSupport.aggregate([
      { $match: { recipientPersonId: { $in: personIds } } },
      { $group: { _id: "$recipientPersonId", count: { $sum: 1 } } },
    ]).catch(() => []),
    LifeDocument.aggregate([
      {
        $match: {
          $or: [
            { relatedPersonId: { $in: personIds } },
            { assignedToPersonIds: { $in: personIds } },
          ],
        },
      },
      { $group: { _id: "$relatedPersonId", count: { $sum: 1 } } },
    ]).catch(() => []),
  ]);

  const noteMap = new Map<string, number>();
  for (const item of notesByPerson) {
    if (item._id) noteMap.set(String(item._id), item.count);
  }

  const instMap = new Map<string, number>();
  for (const item of instructionsByPerson) {
    if (item._id) instMap.set(String(item._id), item.count);
  }

  const respMap = new Map<string, number>();
  for (const item of responsibilitiesByPerson) {
    if (item._id) respMap.set(String(item._id), item.count);
  }

  const moneyMap = new Map<string, number>();
  for (const item of moneyByPerson) {
    if (item._id) moneyMap.set(String(item._id), item.count);
  }

  const fsMap = new Map<string, number>();
  for (const item of financialSupportByPerson) {
    if (item._id) fsMap.set(String(item._id), item.count);
  }

  const docMap = new Map<string, number>();
  for (const item of documentsByPerson) {
    if (item._id) docMap.set(String(item._id), item.count);
  }

  const result = enriched.map((p) => {
    const idStr = String(p._id);
    const nNotes = noteMap.get(idStr) || 0;
    const nDuties = (instMap.get(idStr) || 0) + (respMap.get(idStr) || 0);
    const nLoans = (moneyMap.get(idStr) || 0) + (fsMap.get(idStr) || 0);
    const nFiles = docMap.get(idStr) || 0;

    // Resolve accurate registration status
    let regStatus = p.registrationStatus;
    if (p.status === "disabled" || p.accountStatus === "disabled") {
      regStatus = "disabled";
    } else if (p.clerkUserId) {
      regStatus = "active_user";
    } else if (
      p.invitationExpiresAt &&
      new Date() > new Date(p.invitationExpiresAt) &&
      p.registrationStatus === "invitation_sent"
    ) {
      regStatus = "invite_expired";
    } else if (!regStatus) {
      regStatus = "not_invited";
    }

    // Default category if absent
    let cat = p.category;
    if (!cat) {
      const rel = (p.relation || "").toLowerCase();
      if (
        [
          "wife",
          "husband",
          "son",
          "daughter",
          "brother",
          "sister",
          "father",
          "mother",
          "parents",
          "cousin",
          "relative",
        ].some((r) => rel.includes(r))
      ) {
        cat = "Family Member";
      } else if (["staff", "assistant", "employee", "driver"].some((r) => rel.includes(r))) {
        cat = "Staff";
      } else if (["partner", "business", "colleague"].some((r) => rel.includes(r))) {
        cat = "Business Partner";
      } else if (["guardian"].some((r) => rel.includes(r))) {
        cat = "Guardian";
      } else if (["friend"].some((r) => rel.includes(r))) {
        cat = "Friend";
      } else {
        cat = "Family Member";
      }
    }

    // Determine multiple connections
    let connections: string[] = Array.isArray(p.connections) && p.connections.length > 0 ? [...p.connections] : [];
    if (connections.length === 0) {
      if (cat) {
        if (cat === "Family Member") connections.push("Family");
        else connections.push(cat);
      }
      if (Array.isArray(p.tags)) {
        for (const t of p.tags) {
          if (!connections.includes(t)) connections.push(t);
        }
      }
    }

    // Determine account connection status
    let accountStatusType: "connected" | "invite_pending" | "contact_only" = "contact_only";
    if (p.clerkUserId || regStatus === "active_user") {
      accountStatusType = "connected";
    } else if (regStatus === "invitation_sent") {
      accountStatusType = "invite_pending";
    }

    // Determine concise indicator only when relevant info exists (no 0 counters!)
    let conciseIndicator = "";
    if (nDuties > 0) {
      conciseIndicator = `${nDuties} responsibilit${nDuties === 1 ? "y" : "ies"}`;
    } else if (nLoans > 0) {
      conciseIndicator = "SiS Care linked";
    } else if (connections.includes("Staff") || cat === "Staff") {
      conciseIndicator = "1 employment record";
    } else if (nFiles > 0) {
      conciseIndicator = `${nFiles} shared document${nFiles === 1 ? "" : "s"}`;
    } else if (nNotes > 0) {
      conciseIndicator = `${nNotes} instruction${nNotes === 1 ? "" : "s"}`;
    }

    return {
      ...p,
      category: cat,
      connections,
      accountStatusType,
      conciseIndicator,
      registrationStatus: regStatus,
      notesCount: nNotes,
      dutiesCount: nDuties,
      loansCount: nLoans,
      sharedFilesCount: nFiles,
    };
  });

  return JSON.parse(JSON.stringify(result));
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

  const rawPerson = (await LifePerson.findById(id).lean()) as any;
  if (!rawPerson) return null;

  const [person] = await enrichWithClerkAvatars([rawPerson]);

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
    guardianRecord,
    businessRecords,
    recordPermissions,
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
    LifeGuardian.findOne({ personId: id, isActive: true }).lean(),
    LifeBusiness.find({
      $or: [
        { "partners.personId": id },
        { "engineerContact.personId": id },
      ],
    }).lean(),
    LifeRecordPermission.find({ assignedPersonId: id }).lean(),
  ]);

  // If caller is an individual, filter unreleased legacy messages
  const filteredMessages =
    !auth.isOwner && !auth.isAdmin
      ? messages.filter(
          (m: any) => m.isReleased || m.visibility === "visible_now",
        )
      : messages;

  // Resolve accurate registration status
  let regStatus = person.registrationStatus;
  if (person.status === "disabled" || person.accountStatus === "disabled") {
    regStatus = "disabled";
  } else if (person.clerkUserId) {
    regStatus = "active_user";
  } else if (
    person.invitationExpiresAt &&
    new Date() > new Date(person.invitationExpiresAt) &&
    person.registrationStatus === "invitation_sent"
  ) {
    regStatus = "invite_expired";
  } else if (!regStatus) {
    regStatus = "not_invited";
  }

  let cat = person.category;
  if (!cat) {
    const rel = (person.relation || "").toLowerCase();
    if (
      [
        "wife",
        "husband",
        "son",
        "daughter",
        "brother",
        "sister",
        "father",
        "mother",
        "parents",
        "cousin",
        "relative",
      ].some((r) => rel.includes(r))
    ) {
      cat = "Family Member";
    } else if (["staff", "assistant", "employee", "driver"].some((r) => rel.includes(r))) {
      cat = "Staff";
    } else if (["partner", "business", "colleague"].some((r) => rel.includes(r))) {
      cat = "Business Partner";
    } else if (["guardian"].some((r) => rel.includes(r))) {
      cat = "Guardian";
    } else if (["friend"].some((r) => rel.includes(r))) {
      cat = "Friend";
    } else {
      cat = "Family Member";
    }
  }

  // Determine multiple connections
  let connections: string[] = Array.isArray(person.connections) && person.connections.length > 0 ? [...person.connections] : [];
  if (connections.length === 0) {
    if (cat) {
      if (cat === "Family Member") connections.push("Family");
      else connections.push(cat);
    }
    if (Array.isArray(person.tags)) {
      for (const t of person.tags) {
        if (!connections.includes(t)) connections.push(t);
      }
    }
  }

  // Determine account connection status
  let accountStatusType: "connected" | "invite_pending" | "contact_only" = "contact_only";
  if (person.clerkUserId || regStatus === "active_user") {
    accountStatusType = "connected";
  } else if (regStatus === "invitation_sent") {
    accountStatusType = "invite_pending";
  }

  const enrichedPerson = {
    ...person,
    category: cat,
    connections,
    accountStatusType,
    registrationStatus: regStatus,
    notesCount: notes.length,
    dutiesCount: instructions.length + responsibilities.length,
    loansCount: financialCare.length + moneyRecords.length,
    sharedFilesCount: documents.length,
  };

  return {
    person: JSON.parse(JSON.stringify(enrichedPerson)),
    financialCare: JSON.parse(JSON.stringify(financialCare)),
    moneyRecords: JSON.parse(JSON.stringify(moneyRecords)),
    documents: JSON.parse(JSON.stringify(documents)),
    contacts: JSON.parse(JSON.stringify(contacts)),
    notes: JSON.parse(JSON.stringify(notes)),
    instructions: JSON.parse(JSON.stringify(instructions)),
    responsibilities: JSON.parse(JSON.stringify(responsibilities)),
    messages: JSON.parse(JSON.stringify(filteredMessages)),
    assets: JSON.parse(JSON.stringify(assets || [])),
    guardianRecord: guardianRecord ? JSON.parse(JSON.stringify(guardianRecord)) : null,
    businessRecords: JSON.parse(JSON.stringify(businessRecords || [])),
    recordPermissions: JSON.parse(JSON.stringify(recordPermissions || [])),
  };
}

export async function checkPersonDuplicate(params: {
  name?: string;
  email?: string;
  phone?: string;
  excludeId?: string;
}): Promise<{
  hasPotentialMatch: boolean;
  matches: Array<{ _id: string; name: string; email?: string; phone?: string; relation?: string }>;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { hasPotentialMatch: false, matches: [] };

    const conditions: any[] = [];
    const cleanName = params.name?.trim();
    const cleanEmail = params.email?.trim().toLowerCase();
    const cleanPhone = params.phone?.trim();

    if (cleanName && cleanName.length >= 2) {
      conditions.push({ name: { $regex: new RegExp(`^${cleanName}$`, "i") } });
    }
    if (cleanEmail) {
      conditions.push({ email: cleanEmail });
    }
    if (cleanPhone && cleanPhone.length >= 6) {
      conditions.push({ phone: cleanPhone });
    }

    if (conditions.length === 0) {
      return { hasPotentialMatch: false, matches: [] };
    }

    const query: any = {
      $or: conditions,
      isDeleted: { $ne: true },
    };
    if (params.excludeId) {
      query._id = { $ne: params.excludeId };
    }

    const found = await LifePerson.find(query)
      .select("name email phone relation category connections")
      .limit(3)
      .lean();

    return {
      hasPotentialMatch: found.length > 0,
      matches: JSON.parse(JSON.stringify(found)),
    };
  } catch (err) {
    console.error("checkPersonDuplicate error:", err);
    return { hasPotentialMatch: false, matches: [] };
  }
}

export async function createPerson(data: {
  name: string;
  category?: string;
  relation?: string;
  connections?: string[];
  ownerNote?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  location?: string;
  dateOfBirth?: string;
  shortNote?: string;
  tags?: string[];
  isImportant?: boolean;
  isEmergencyContact?: boolean;
  inviteAsUser?: boolean;
  profilePhoto?: string;
  avatarUrl?: string;
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
  forceCreate?: boolean;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  duplicateFound?: boolean;
  existingPerson?: any;
  inviteSent?: boolean;
  inviteMessage?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return {
        success: false,
        error: "Forbidden: Only Owners/Admins can add new People profiles.",
      };
    }

    const cleanEmail = data.email?.toLowerCase().trim() || "";

    // Duplicate check for existing email
    if (cleanEmail && !data.forceCreate) {
      const existing = await LifePerson.findOne({
        email: cleanEmail,
        isDeleted: { $ne: true },
      });
      if (existing) {
        return {
          success: false,
          error: `A person profile with the email "${cleanEmail}" already exists in your directory.`,
          duplicateFound: true,
          existingPerson: {
            _id: String(existing._id),
            name: existing.name,
            email: existing.email,
            relation: existing.relation,
          },
        };
      }
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

    let clerkAvatar: string | undefined;
    try {
      clerkAvatar = cleanEmail
        ? await getClerkAvatar({ email: cleanEmail })
        : undefined;
    } catch {
      clerkAvatar = undefined;
    }

    const photo = data.profilePhoto || data.avatarUrl || clerkAvatar || "";

    // Multiple connections determination — ensure all items are strings
    const finalConnections: string[] = (
      Array.isArray(data.connections) && data.connections.length > 0
        ? data.connections
        : data.category
        ? [data.category]
        : ["Family"]
    ).filter((c): c is string => typeof c === "string" && c.trim().length > 0);

    if (finalConnections.length === 0) finalConnections.push("Family");

    const person = await LifePerson.create({
      name: data.name.trim(),
      category: finalConnections[0] || "Family",
      connections: finalConnections,
      relation: (data.relation || "").trim(),
      phone: data.phone?.trim() || "",
      whatsapp: data.whatsapp?.trim() || data.phone?.trim() || "",
      email: cleanEmail,
      address: (data.address || data.location || "").trim(),
      dateOfBirth: data.dateOfBirth?.trim() || "",
      shortNote: data.shortNote?.trim() || "",
      ownerNote: (data.ownerNote || data.shortNote || "").trim(),
      tags: data.tags || finalConnections,
      isImportant: Boolean(data.isImportant),
      isEmergencyContact: Boolean(data.isEmergencyContact),
      registrationStatus: "not_invited",
      avatarUrl: photo,
      profilePhoto: photo,
      role: finalRole,
      userRole: finalRole,
      status: data.status || "active",
      accountStatus: data.accountStatus || "active",
      isLoginEnabled: isRecordOnly ? false : (data.isLoginEnabled ?? true),
      isRecordOnly,
      personalMessage: data.personalMessage || "",
      responsibilities: data.responsibilities || [],
      businessInstructions: data.businessInstructions || [],
      notes: data.notes || data.ownerNote || data.shortNote || "",
      emergencyPriority: data.isEmergencyContact ? 1 : (data.emergencyPriority || 0),
      permissions: finalPerms,
    });

    // ── Post-creation steps: wrapped individually so none can crash the action ──

    // If Invite as User toggle is enabled, send invitation separately
    let inviteSent = false;
    let inviteMessage = "";
    if (data.inviteAsUser && cleanEmail) {
      try {
        const inviteRes = await sendPersonInvitation(String(person._id), cleanEmail);
        inviteSent = inviteRes.success;
        inviteMessage = inviteRes.message || "";
      } catch (err: any) {
        inviteSent = false;
        inviteMessage = err.message || "Failed to deliver email invitation";
      }
    }

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

    try {
      await logLifeActivity({
        action: "CREATE_PERSON",
        resourceType: "people",
        resourceId: String(person._id),
        resourceName: person.name,
        details: `Added new person profile: ${person.name} (${finalConnections.join(", ")})${data.inviteAsUser ? " with invitation" : ""}`,
      });
    } catch {
      // Activity logging must never crash the action
    }

    try {
      revalidatePath("/people");
    } catch {
      // Revalidation must never crash the action
    }

    // Build enriched data matching the shape PeopleClient expects
    const accountStatusType = person.clerkUserId
      ? "connected"
      : person.registrationStatus === "invitation_sent"
      ? "invite_pending"
      : "contact_only";

    const serialized = JSON.parse(JSON.stringify(person));

    return {
      success: true,
      data: {
        ...serialized,
        connections: finalConnections,
        accountStatusType,
        conciseIndicator: "",
        registrationStatus: serialized.registrationStatus || "not_invited",
        notesCount: 0,
        dutiesCount: 0,
        loansCount: 0,
        sharedFilesCount: 0,
      },
      inviteSent,
      inviteMessage,
    };
  } catch (err: any) {
    console.error("createPerson error:", err);
    if (err.code === 11000) {
      return {
        success: false,
        error: "A person with this email already exists in the directory.",
      };
    }
    return {
      success: false,
      error: err.message || "Failed to create person profile.",
    };
  }
}

export async function updatePerson(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    relation: string;
    connections: string[];
    ownerNote: string;
    dateOfBirth: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    location: string;
    shortNote: string;
    tags: string[];
    isImportant: boolean;
    isEmergencyContact: boolean;
    profilePhoto: string;
    avatarUrl: string;
    registrationStatus:
      | "not_invited"
      | "invitation_sent"
      | "invite_expired"
      | "active_user"
      | "disabled";
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
    if (data.connections && data.connections.length > 0) {
      updateData.connections = data.connections;
      updateData.category = data.connections[0];
      updateData.tags = data.connections;
    }
    if (data.ownerNote !== undefined) {
      updateData.ownerNote = data.ownerNote;
      updateData.shortNote = data.ownerNote;
    }
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth;
    }
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

  if (data.email) {
    const cleanEmail = data.email.toLowerCase().trim();
    const clerkAvatar = await getClerkAvatar({ email: cleanEmail });
    if (clerkAvatar) {
      updateData.avatarUrl = clerkAvatar;
      updateData.profilePhoto = clerkAvatar;
    }
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

export async function checkPersonArchiveSummary(id: string): Promise<{
  success: boolean;
  dutiesCount: number;
  financialCount: number;
  activeResponsibilitiesCount: number;
  isGuardian: boolean;
  hasSharedAccess: boolean;
  isConnectedUser: boolean;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return {
        success: false,
        dutiesCount: 0,
        financialCount: 0,
        activeResponsibilitiesCount: 0,
        isGuardian: false,
        hasSharedAccess: false,
        isConnectedUser: false,
      };
    }

    const [respCount, finSupportCount, moneyCount, guardian, permCount, person] = await Promise.all([
      LifeResponsibility.countDocuments({
        assignedPersonId: id,
        completionStatus: { $ne: "completed" },
      }),
      LifeFinancialSupport.countDocuments({ recipientPersonId: id }),
      LifeMoneyRecord.countDocuments({ personId: id }),
      LifeGuardian.findOne({ personId: id, isActive: true }),
      LifeRecordPermission.countDocuments({ assignedPersonId: id, canView: true }),
      LifePerson.findById(id).select("clerkUserId registrationStatus"),
    ]);

    const totalFin = finSupportCount + moneyCount;

    return {
      success: true,
      dutiesCount: respCount,
      financialCount: totalFin,
      activeResponsibilitiesCount: respCount,
      isGuardian: Boolean(guardian),
      hasSharedAccess: permCount > 0,
      isConnectedUser: Boolean(person?.clerkUserId || person?.registrationStatus === "active_user"),
    };
  } catch (err) {
    console.error("checkPersonArchiveSummary error:", err);
    return {
      success: false,
      dutiesCount: 0,
      financialCount: 0,
      activeResponsibilitiesCount: 0,
      isGuardian: false,
      hasSharedAccess: false,
      isConnectedUser: false,
    };
  }
}

export async function disconnectPersonAccount(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    const person = await LifePerson.findById(id);
    if (!person) return { success: false, error: "Person not found" };

    await LifePerson.findByIdAndUpdate(id, {
      $unset: { clerkUserId: 1 },
      $set: {
        registrationStatus: "not_invited",
        isLoginEnabled: false,
      },
    });

    await logLifeActivity({
      action: "DISCONNECT_ACCOUNT",
      resourceType: "people",
      resourceId: id,
      resourceName: person.name,
      details: `Disconnected verified account link for ${person.name}`,
    });

    revalidatePath("/people");
    revalidatePath(`/people/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to disconnect account" };
  }
}

export async function cancelPersonInvitation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    const person = await LifePerson.findById(id);
    if (!person) return { success: false, error: "Person not found" };

    await LifePerson.findByIdAndUpdate(id, {
      $set: {
        registrationStatus: "not_invited",
      },
      $unset: {
        invitationToken: 1,
        invitationExpiresAt: 1,
      },
    });

    await logLifeActivity({
      action: "CANCEL_INVITATION",
      resourceType: "people",
      resourceId: id,
      resourceName: person.name,
      details: `Cancelled invitation for ${person.name}`,
    });

    revalidatePath("/people");
    revalidatePath(`/people/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to cancel invitation" };
  }
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

// ─────────────────────────────────────────────
// PEOPLE & SUPPORT ROLES (Section 6 & 7)
// Guardian, Trusted People, Advisors, Caregivers
// ─────────────────────────────────────────────

export async function getSupportRoleCounts(): Promise<{
  guardian: number;
  trustedPeople: number;
  advisors: number;
  caregivers: number;
  totalUniquePeople: number;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) {
      return { guardian: 0, trustedPeople: 0, advisors: 0, caregivers: 0, totalUniquePeople: 0 };
    }

    const baseQuery: Record<string, any> = {
      status: { $ne: "archived" },
      isDeleted: { $ne: true },
    };

    // Total unique people count in central directory
    const totalUniquePeople = await LifePerson.countDocuments(baseQuery);

    // Active guardian documents from LifeGuardian
    const guardianDocs = await LifeGuardian.find({ isActive: true }).select("personId").lean();
    const guardianPersonIds = guardianDocs.map((g: any) => String(g.personId));

    const [guardianCount, trustedCount, advisorsCount, caregiversCount] = await Promise.all([
      LifePerson.countDocuments({
        ...baseQuery,
        $or: [
          { _id: { $in: guardianPersonIds } },
          { supportRoles: "guardian" },
          { guardianStatus: true },
          { role: "guardian" },
          { userRole: "guardian" },
        ],
      }),
      LifePerson.countDocuments({
        ...baseQuery,
        supportRoles: "trusted_person",
      }),
      LifePerson.countDocuments({
        ...baseQuery,
        $or: [
          { supportRoles: "advisor" },
          { designation: { $regex: /^(advisor|lawyer|advocate|counsel)$/i } },
          { relation: { $regex: /^(advisor|lawyer|advocate|counsel)$/i } },
        ],
      }),
      LifePerson.countDocuments({
        ...baseQuery,
        supportRoles: "caregiver",
      }),
    ]);

    return {
      guardian: guardianCount,
      trustedPeople: trustedCount,
      advisors: advisorsCount,
      caregivers: caregiversCount,
      totalUniquePeople,
    };
  } catch (error) {
    console.error("Error in getSupportRoleCounts:", error);
    return { guardian: 0, trustedPeople: 0, advisors: 0, caregivers: 0, totalUniquePeople: 0 };
  }
}

export async function getPeopleBySupportRole(role: string): Promise<ILifePerson[]> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return [];

    const baseQuery: Record<string, any> = {
      status: { $ne: "archived" },
      isDeleted: { $ne: true },
    };

    let roleQuery: Record<string, any> = {};

    if (role === "guardian") {
      const guardianDocs = await LifeGuardian.find({ isActive: true }).select("personId").lean();
      const guardianPersonIds = guardianDocs.map((g: any) => String(g.personId));
      roleQuery = {
        $or: [
          { _id: { $in: guardianPersonIds } },
          { supportRoles: "guardian" },
          { guardianStatus: true },
          { role: "guardian" },
          { userRole: "guardian" },
        ],
      };
    } else if (role === "trusted_person") {
      roleQuery = { supportRoles: "trusted_person" };
    } else if (role === "advisor") {
      roleQuery = {
        $or: [
          { supportRoles: "advisor" },
          { designation: { $regex: /^(advisor|lawyer|advocate|counsel)$/i } },
          { relation: { $regex: /^(advisor|lawyer|advocate|counsel)$/i } },
        ],
      };
    } else if (role === "caregiver") {
      roleQuery = { supportRoles: "caregiver" };
    }

    const people = await LifePerson.find({ ...baseQuery, ...roleQuery })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await enrichWithClerkAvatars(people);
    return JSON.parse(JSON.stringify(enriched));
  } catch (error) {
    console.error("Error in getPeopleBySupportRole:", error);
    return [];
  }
}

export async function assignSupportRole(
  personId: string,
  role: "guardian" | "trusted_person" | "advisor" | "caregiver"
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Forbidden: Owner or Admin required." };
    }

    await connectToDatabase();
    const person = await LifePerson.findById(personId);
    if (!person) return { success: false, error: "Person not found." };

    // Add role without duplicating
    await LifePerson.findByIdAndUpdate(personId, {
      $addToSet: { supportRoles: role },
      ...(role === "guardian" ? { guardianStatus: true } : {}),
    });

    if (role === "guardian") {
      await LifeGuardian.findOneAndUpdate(
        { personId: person._id },
        {
          $set: {
            personId: person._id,
            guardianType: "primary",
            isActive: true,
            assignedDate: new Date(),
          },
        },
        { upsert: true }
      );
    }

    await logLifeActivity({
      action: "ASSIGN_SUPPORT_ROLE",
      resourceType: "people",
      resourceId: personId,
      resourceName: person.name,
      details: `Assigned role "${role}" to ${person.name}.`,
    });

    revalidatePath("/");
    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in assignSupportRole:", error);
    return { success: false, error: error.message };
  }
}

export async function removeSupportRole(
  personId: string,
  role: "guardian" | "trusted_person" | "advisor" | "caregiver"
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Forbidden: Owner or Admin required." };
    }

    await connectToDatabase();
    const person = await LifePerson.findById(personId);
    if (!person) return { success: false, error: "Person not found." };

    await LifePerson.findByIdAndUpdate(personId, {
      $pull: { supportRoles: role },
      ...(role === "guardian" ? { guardianStatus: false } : {}),
    });

    if (role === "guardian") {
      await LifeGuardian.findOneAndUpdate(
        { personId: person._id },
        { $set: { isActive: false } }
      );
    }

    await logLifeActivity({
      action: "REMOVE_SUPPORT_ROLE",
      resourceType: "people",
      resourceId: personId,
      resourceName: person.name,
      details: `Removed role "${role}" from ${person.name}.`,
    });

    revalidatePath("/");
    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in removeSupportRole:", error);
    return { success: false, error: error.message };
  }
}

export async function getPeopleCount(): Promise<number> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return 0;

  const query: Record<string, unknown> = {
    status: { $ne: "archived" },
    isDeleted: { $ne: true },
  };

  if (!auth.isOwner && !auth.isAdmin) {
    const allowedIds: string[] = [];
    if (auth.personId) allowedIds.push(String(auth.personId));
    if (auth.permissions?.allowedPersonIds?.length) {
      allowedIds.push(...auth.permissions.allowedPersonIds.map(String));
    }
    if (allowedIds.length === 0) return 0;
    query._id = { $in: allowedIds };
  }

  return LifePerson.countDocuments(query);
}

