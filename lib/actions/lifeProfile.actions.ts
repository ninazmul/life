"use server";

import { revalidatePath } from "next/cache";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import LifePerson from "@/lib/database/models/lifePerson.model";
import Admin from "@/lib/database/models/admin.model";
import LifeAsset from "@/lib/database/models/lifeAsset.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeContact from "@/lib/database/models/lifeContact.model";
import LifeRecordPermission from "@/lib/database/models/lifeRecordPermission.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { getClerkAvatar } from "@/lib/life/clerk-avatar";

// In-memory verification code cache with 10-minute expiry
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export interface MedicalHistoryItem {
  id: string;
  title: string;
  condition: string;
  dateRange: string;
  hospitalOrDoctor?: string;
  notes?: string;
  linkedReportId?: string;
}

export interface HealthReportItem {
  _id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  issueDate?: string;
  issuingAuthority?: string;
  doctor?: string;
  notes?: string;
  createdAt: string;
}

export interface EmergencyContactItem {
  _id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  isPrimary: boolean;
  priority: number;
}

export interface PrivacyPermissionItem {
  _id: string;
  recordType: string;
  assignedPersonId: string;
  personName: string;
  personRelation?: string;
  personAvatar?: string;
  visibilityMode: string;
  releaseCondition?: string;
  canView: boolean;
  expiryDate?: string;
}

export interface ActiveSessionItem {
  id: string;
  device: string;
  browser: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecurityData {
  email: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
  recoveryEmail?: string;
  activeSessions: ActiveSessionItem[];
}

export interface AvailablePersonItem {
  _id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

export interface ProfileData {
  personId?: string;
  name: string;
  preferredName?: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified?: boolean;
  dateOfBirth: string;
  nationality: string;
  address: string;
  permanentAddress: string;
  about: string;
  avatarUrl: string;
  role: string;
  accountStatus: string;
  workspaceName: string;
  isOwner: boolean;

  // Health Profile
  bloodGroup: string;
  allergies: string;
  hasNoAllergies: boolean;
  medicalConditions: string;
  currentMedicines: string;
  medicalHistory: MedicalHistoryItem[];
  healthReports: HealthReportItem[];

  // Emergency Contacts
  emergencyContacts: EmergencyContactItem[];

  // Privacy & Sharing
  privacySummary: {
    personalStatus: string;
    healthStatus: string;
    emergencyStatus: string;
    personalSharedCount: number;
    healthSharedCount: number;
    emergencySharedCount: number;
    permissions: PrivacyPermissionItem[];
  };

  // Security
  securityData: SecurityData;

  // Available People for Linking
  availablePeople: AvailablePersonItem[];

  // Backward compatibility
  financialSummary: {
    propertyValue: number;
    totalExpense: number;
    totalBalance: number;
    totalLoan: number;
    currencySymbol: string;
  };
  stats?: {
    documentsCount: number;
    contactsCount: number;
  };
}

export async function getProfileData(): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) {
      return { success: false, error: "Unauthorized" };
    }

    // 1. Resolve owner / person
    let person: any = null;
    if (auth.personId) {
      person = await LifePerson.findById(auth.personId).lean();
    }
    if (!person && auth.email) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${auth.email.trim()}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      }).lean();
    }

    // 2. Resolve admin doc if available
    let adminDoc: any = null;
    if (auth.email) {
      adminDoc = await Admin.findOne({
        email: new RegExp(`^${auth.email.trim()}$`, "i"),
      }).lean();
    }

    // 3. Avatar resolution
    const resolvedAvatar =
      person?.avatarUrl ||
      person?.profilePhoto ||
      auth.avatarUrl ||
      (await getClerkAvatar({
        email: person?.email || auth.email,
        clerkUserId: auth.userId,
      })) ||
      "";

    // 4. Resolve Clerk User data for true verification status & security
    let clerkUser: any = null;
    try {
      clerkUser = await currentUser();
    } catch (e) {
      console.warn("Could not retrieve Clerk user in getProfileData:", e);
    }

    const emailToMatch = (person?.email || auth.email || "").toLowerCase().trim();
    const primaryEmailObj = clerkUser?.emailAddresses?.find(
      (e: any) =>
        e.id === clerkUser.primaryEmailAddressId ||
        e.emailAddress.toLowerCase().trim() === emailToMatch
    );

    const emailVerified = primaryEmailObj?.verification?.status === "verified";
    const twoFactorEnabled = !!clerkUser?.twoFactorEnabled;
    const hasPassword = !!clerkUser?.passwordEnabled;

    // 5. Active Sessions
    let activeSessions: ActiveSessionItem[] = [];
    try {
      const client = await clerkClient();
      const sessions = await client.sessions.getSessionList({ userId: auth.userId });
      if (Array.isArray(sessions?.data) && sessions.data.length > 0) {
        activeSessions = sessions.data.map((s: any) => {
          const deviceType = s.latestActivity?.deviceType || "Current Device";
          const browserName = s.latestActivity?.browserName || "Web Browser";
          const lastActiveStr = s.lastActiveAt
            ? new Date(s.lastActiveAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Active now";
          return {
            id: s.id,
            device: deviceType,
            browser: browserName,
            lastActive: lastActiveStr,
            isCurrent: s.status === "active",
          };
        });
      }
    } catch {
      // Fallback
    }

    if (activeSessions.length === 0) {
      activeSessions = [
        {
          id: "current_session",
          device: "Current Device",
          browser: "Chrome / Web",
          lastActive: "Active now",
          isCurrent: true,
        },
      ];
    }

    // 6. Medical Reports from LifeDocument
    const healthDocQuery: any = {
      category: "medical",
      status: { $ne: "archived" },
    };
    if (person?._id) {
      healthDocQuery.$or = [
        { relatedPersonId: person._id },
        { assignedToPersonIds: person._id },
      ];
    }

    const healthReportDocs = await LifeDocument.find(healthDocQuery)
      .sort({ createdAt: -1 })
      .lean();

    const healthReports: HealthReportItem[] = healthReportDocs.map((doc: any) => ({
      _id: String(doc._id),
      title: doc.title || "Medical Report",
      category: doc.category || "medical",
      fileUrl: doc.fileUrl || "",
      fileType: doc.fileType || "application/pdf",
      fileSize: doc.fileSize || 0,
      issueDate: doc.issueDate ? new Date(doc.issueDate).toISOString().split("T")[0] : "",
      issuingAuthority: doc.issuingAuthority || "",
      notes: doc.notes || "",
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    }));

    // 7. Emergency Contacts from LifePerson
    const emergencyPeople = await LifePerson.find({
      isEmergencyContact: true,
      status: { $ne: "archived" },
    })
      .sort({ isEmergencyPrimary: -1, emergencyPriority: 1, name: 1 })
      .lean();

    const emergencyContacts: EmergencyContactItem[] = emergencyPeople.map((ep: any) => ({
      _id: String(ep._id),
      name: ep.name || "Unknown",
      relation: ep.emergencyRelationship || ep.relation || "Emergency Contact",
      phone: ep.phone || "",
      email: ep.email || "",
      avatarUrl: ep.avatarUrl || ep.profilePhoto || "",
      isPrimary: !!ep.isEmergencyPrimary,
      priority: ep.emergencyPriority || (ep.isEmergencyPrimary ? 1 : 2),
    }));

    // 8. Privacy & Permissions
    const privacyPerms = await LifeRecordPermission.find({
      recordType: { $in: ["profile_personal", "profile_health", "profile_emergency"] },
    })
      .populate("assignedPersonId", "name relation avatarUrl profilePhoto")
      .lean();

    const permissions: PrivacyPermissionItem[] = privacyPerms.map((perm: any) => ({
      _id: String(perm._id),
      recordType: perm.recordType,
      assignedPersonId: perm.assignedPersonId?._id ? String(perm.assignedPersonId._id) : String(perm.assignedPersonId),
      personName: perm.assignedPersonId?.name || "Shared Contact",
      personRelation: perm.assignedPersonId?.relation || "",
      personAvatar: perm.assignedPersonId?.avatarUrl || perm.assignedPersonId?.profilePhoto || "",
      visibilityMode: perm.visibilityMode || "available_now",
      releaseCondition: perm.releaseCondition || "",
      canView: perm.canView !== false,
      expiryDate: perm.expiryDate ? new Date(perm.expiryDate).toISOString().split("T")[0] : undefined,
    }));

    const personalPerms = permissions.filter((p) => p.recordType === "profile_personal");
    const healthPerms = permissions.filter((p) => p.recordType === "profile_health");
    const emergencyPerms = permissions.filter((p) => p.recordType === "profile_emergency");

    const personalStatus =
      personalPerms.length === 0
        ? "Only me"
        : `Shared with ${personalPerms.length} ${personalPerms.length === 1 ? "person" : "people"}`;
    const healthStatus =
      healthPerms.length === 0
        ? "Only me"
        : `Selected records shared with ${healthPerms.length} ${healthPerms.length === 1 ? "person" : "people"}`;
    const emergencyStatus =
      emergencyPerms.length === 0
        ? "Only me"
        : `Shared with ${emergencyPerms.length} ${emergencyPerms.length === 1 ? "person" : "people"}`;

    // 9. Available People (excluding self) for Emergency Linking and Sharing
    const availablePeopleDocs = await LifePerson.find({
      status: { $ne: "archived" },
      ...(person?._id ? { _id: { $ne: person._id } } : {}),
    })
      .sort({ name: 1 })
      .lean();

    const availablePeople: AvailablePersonItem[] = availablePeopleDocs.map((ap: any) => ({
      _id: String(ap._id),
      name: ap.name || "",
      relation: ap.relation || "",
      phone: ap.phone || "",
      email: ap.email || "",
      avatarUrl: ap.avatarUrl || ap.profilePhoto || "",
    }));

    // 10. Financial calculations (retained for backward compatibility)
    const settings = (await LifeSettings.findOne().lean()) as any;
    const currencySymbol = settings?.currencySymbol || "৳";

    const [propertyValueAgg, liquidAssetAgg, documentsCount, contactsCount] = await Promise.all([
      LifeAsset.aggregate([
        { $match: { status: { $ne: "archived" } } },
        { $group: { _id: null, total: { $sum: "$value" } } },
      ]),
      LifeAsset.aggregate([
        {
          $match: {
            status: { $ne: "archived" },
            category: { $in: ["bank_account", "cash", "crypto", "digital"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$value" } } },
      ]),
      LifeDocument.countDocuments({ status: { $ne: "archived" } }).catch(() => 0),
      LifeContact.countDocuments({ status: { $ne: "archived" } }).catch(() => 0),
    ]);

    const propertyValue = propertyValueAgg[0]?.total || 0;
    const totalBalance = liquidAssetAgg[0]?.total || 0;

    const profileData: ProfileData = {
      personId: person?._id ? String(person._id) : auth.personId,
      name: person?.name || adminDoc?.name || auth.name || "Shahidul Islam",
      preferredName: person?.preferredName || person?.displayName || "",
      displayName: person?.displayName || person?.username || (auth.name ? auth.name.split(" ")[0] : "Shahidul"),
      email: person?.email || adminDoc?.email || auth.email || "",
      emailVerified,
      phone: person?.phone || "",
      phoneVerified: !!person?.phone,
      dateOfBirth: person?.dateOfBirth || "",
      nationality: person?.nationality || "",
      address: person?.address || "",
      permanentAddress: person?.permanentAddress || "",
      about: person?.about || person?.shortNote || "",
      avatarUrl: resolvedAvatar,
      role: auth.isOwner ? "Owner" : auth.role || "Owner",
      accountStatus: person?.accountStatus || person?.status || "active",
      workspaceName: "Personal workspace",
      isOwner: auth.isOwner,

      // Health
      bloodGroup: person?.bloodGroup || "",
      allergies: person?.allergies || "",
      hasNoAllergies: !!person?.hasNoAllergies,
      medicalConditions: person?.medicalConditions || "",
      currentMedicines: person?.currentMedicines || "",
      medicalHistory: Array.isArray(person?.medicalHistory) ? person.medicalHistory : [],
      healthReports,

      // Emergency Contacts
      emergencyContacts,

      // Privacy
      privacySummary: {
        personalStatus,
        healthStatus,
        emergencyStatus,
        personalSharedCount: personalPerms.length,
        healthSharedCount: healthPerms.length,
        emergencySharedCount: emergencyPerms.length,
        permissions,
      },

      // Security
      securityData: {
        email: emailToMatch,
        emailVerified,
        twoFactorEnabled,
        hasPassword,
        activeSessions,
      },

      availablePeople,

      // Legacy compatibility
      financialSummary: {
        propertyValue,
        totalExpense: 0,
        totalBalance,
        totalLoan: 0,
        currencySymbol,
      },
      stats: {
        documentsCount,
        contactsCount,
      },
    };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(profileData)),
    };
  } catch (err: any) {
    console.error("Error in getProfileData:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch profile data",
    };
  }
}

// ─── 1. Edit Profile: Basic Information ─────────────────────────────────────
export async function updateBasicProfile(payload: {
  name: string;
  preferredName?: string;
  phone?: string;
  email?: string;
  about?: string;
  avatarUrl?: string;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const cleanName = payload.name.trim();
    if (!cleanName) return { success: false, error: "Full name is required" };

    const cleanPreferredName = payload.preferredName?.trim() || "";
    const cleanPhone = payload.phone?.trim() || "";
    const cleanEmail = payload.email?.toLowerCase().trim() || auth.email.toLowerCase().trim();
    const cleanAbout = payload.about?.trim() || "";
    if (cleanAbout.length > 200) {
      return { success: false, error: "About section cannot exceed 200 characters" };
    }
    const cleanAvatarUrl = payload.avatarUrl?.trim() || "";

    let person: any = null;
    if (auth.personId) person = await LifePerson.findById(auth.personId);
    if (!person && cleanEmail) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${cleanEmail}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    const updateFields: Record<string, any> = {
      name: cleanName,
      preferredName: cleanPreferredName,
      displayName: cleanPreferredName || cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      about: cleanAbout,
    };

    if (cleanAvatarUrl !== undefined) {
      updateFields.avatarUrl = cleanAvatarUrl;
      updateFields.profilePhoto = cleanAvatarUrl;
    }

    if (person) {
      Object.assign(person, updateFields);
      if (!person.clerkUserId && auth.userId) person.clerkUserId = auth.userId;
      await person.save();
    } else {
      person = await LifePerson.create({
        ...updateFields,
        relation: "Self / Owner",
        role: "super_admin",
        userRole: "super_admin",
        status: "active",
        accountStatus: "active",
        isLoginEnabled: true,
        clerkUserId: auth.userId,
      });
    }

    // Sync Admin collection
    if (cleanEmail) {
      await Admin.findOneAndUpdate(
        { email: new RegExp(`^${cleanEmail}$`, "i") },
        { $set: { name: cleanName, email: cleanEmail, isActive: true } },
        { upsert: true }
      ).catch(() => {});
    }

    // Sync Clerk profile
    if (auth.userId) {
      try {
        const client = await clerkClient();
        const parts = cleanName.split(" ").filter(Boolean);
        const firstName = parts[0] || cleanName;
        const lastName = parts.slice(1).join(" ") || "";
        await client.users.updateUser(auth.userId, { firstName, lastName });
      } catch (clerkErr) {
        console.warn("Could not sync name to Clerk account:", clerkErr);
      }
    }

    await logLifeActivity({
      action: "UPDATE_PROFILE",
      resourceType: "profile",
      resourceId: person?._id ? String(person._id) : undefined,
      resourceName: cleanName,
      details: `Updated basic profile: "${cleanName}"`,
    }).catch(() => {});

    revalidatePath("/profile");
    revalidatePath("/");
    revalidatePath("/people");

    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in updateBasicProfile:", err);
    return { success: false, error: err.message || "Failed to update profile" };
  }
}

// ─── 2. Personal Details: View & Edit ───────────────────────────────────────
export async function updatePersonalDetails(payload: {
  name: string;
  preferredName?: string;
  displayName?: string;
  dateOfBirth?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  address?: string;
  permanentAddress?: string;
  avatarUrl?: string;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const cleanName = payload.name.trim();
    if (!cleanName) return { success: false, error: "Full name is required" };

    const cleanPreferredName = payload.preferredName?.trim() || "";
    const cleanDateOfBirth = payload.dateOfBirth?.trim() || "";
    const cleanNationality = payload.nationality?.trim() || "";
    const cleanPhone = payload.phone?.trim() || "";
    const cleanEmail = payload.email?.toLowerCase().trim() || auth.email.toLowerCase().trim();
    const cleanAddress = payload.address?.trim() || "";
    const cleanPermanentAddress = payload.permanentAddress?.trim() || "";

    let person: any = null;
    if (auth.personId) person = await LifePerson.findById(auth.personId);
    if (!person && cleanEmail) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${cleanEmail}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    const updateFields: Record<string, any> = {
      name: cleanName,
      preferredName: cleanPreferredName,
      displayName: cleanPreferredName || cleanName,
      dateOfBirth: cleanDateOfBirth,
      nationality: cleanNationality,
      phone: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      permanentAddress: cleanPermanentAddress,
    };

    if (person) {
      Object.assign(person, updateFields);
      await person.save();
    } else {
      person = await LifePerson.create({
        ...updateFields,
        relation: "Self / Owner",
        role: "super_admin",
        status: "active",
        clerkUserId: auth.userId,
      });
    }

    // Sync Admin & Clerk
    if (cleanEmail) {
      await Admin.findOneAndUpdate(
        { email: new RegExp(`^${cleanEmail}$`, "i") },
        { $set: { name: cleanName, email: cleanEmail } }
      ).catch(() => {});
    }

    if (auth.userId) {
      try {
        const client = await clerkClient();
        const parts = cleanName.split(" ").filter(Boolean);
        await client.users.updateUser(auth.userId, {
          firstName: parts[0] || cleanName,
          lastName: parts.slice(1).join(" ") || "",
        });
      } catch (clerkErr) {
        console.warn("Could not sync name to Clerk account:", clerkErr);
      }
    }

    await logLifeActivity({
      action: "UPDATE_PERSONAL_DETAILS",
      resourceType: "profile",
      resourceId: person?._id ? String(person._id) : undefined,
      resourceName: cleanName,
      details: `Updated personal identity details for "${cleanName}"`,
    }).catch(() => {});

    revalidatePath("/profile");
    revalidatePath("/");

    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in updatePersonalDetails:", err);
    return { success: false, error: err.message || "Failed to update personal details" };
  }
}

// ─── 3. Health Profile: Key Information ─────────────────────────────────────
export async function updateHealthOverview(payload: {
  bloodGroup?: string;
  allergies?: string;
  hasNoAllergies?: boolean;
  medicalConditions?: string;
  currentMedicines?: string;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    let person: any = null;
    if (auth.personId) person = await LifePerson.findById(auth.personId);
    if (!person && auth.email) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${auth.email.trim()}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    if (!person) return { success: false, error: "Person profile not found" };

    person.bloodGroup = payload.bloodGroup?.trim() || "";
    person.allergies = payload.allergies?.trim() || "";
    person.hasNoAllergies = !!payload.hasNoAllergies;
    person.medicalConditions = payload.medicalConditions?.trim() || "";
    person.currentMedicines = payload.currentMedicines?.trim() || "";

    await person.save();

    await logLifeActivity({
      action: "UPDATE_HEALTH_PROFILE",
      resourceType: "profile",
      resourceId: String(person._id),
      resourceName: person.name,
      details: `Updated health profile: Blood Group="${person.bloodGroup}", Allergies="${person.allergies}"`,
    }).catch(() => {});

    revalidatePath("/profile");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in updateHealthOverview:", err);
    return { success: false, error: err.message || "Failed to update health information" };
  }
}

// ─── 4. Health Profile: Medical History ──────────────────────────────────────
export async function addMedicalHistoryEntry(payload: {
  title: string;
  condition: string;
  dateRange: string;
  hospitalOrDoctor?: string;
  notes?: string;
  linkedReportId?: string;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    if (!payload.title.trim()) return { success: false, error: "Title is required" };

    let person: any = null;
    if (auth.personId) person = await LifePerson.findById(auth.personId);
    if (!person && auth.email) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${auth.email.trim()}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    if (!person) return { success: false, error: "Person profile not found" };

    if (!Array.isArray(person.medicalHistory)) {
      person.medicalHistory = [];
    }

    const newEntry = {
      id: "med_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      title: payload.title.trim(),
      condition: payload.condition.trim(),
      dateRange: payload.dateRange.trim(),
      hospitalOrDoctor: payload.hospitalOrDoctor?.trim() || "",
      notes: payload.notes?.trim() || "",
      linkedReportId: payload.linkedReportId?.trim() || "",
    };

    person.medicalHistory.unshift(newEntry);
    await person.save();

    await logLifeActivity({
      action: "ADD_MEDICAL_HISTORY",
      resourceType: "profile",
      resourceId: String(person._id),
      resourceName: newEntry.title,
      details: `Added medical history entry: "${newEntry.title}"`,
    }).catch(() => {});

    revalidatePath("/profile");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in addMedicalHistoryEntry:", err);
    return { success: false, error: err.message || "Failed to add medical history entry" };
  }
}

export async function updateMedicalHistoryEntry(payload: {
  id: string;
  title: string;
  condition: string;
  dateRange: string;
  hospitalOrDoctor?: string;
  notes?: string;
  linkedReportId?: string;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    let person: any = null;
    if (auth.personId) person = await LifePerson.findById(auth.personId);
    if (!person && auth.email) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${auth.email.trim()}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    if (!person) return { success: false, error: "Person profile not found" };

    const entry = (person.medicalHistory || []).find((m: any) => m.id === payload.id);
    if (!entry) return { success: false, error: "Medical history entry not found" };

    entry.title = payload.title.trim();
    entry.condition = payload.condition.trim();
    entry.dateRange = payload.dateRange.trim();
    entry.hospitalOrDoctor = payload.hospitalOrDoctor?.trim() || "";
    entry.notes = payload.notes?.trim() || "";
    entry.linkedReportId = payload.linkedReportId?.trim() || "";

    person.markModified("medicalHistory");
    await person.save();

    revalidatePath("/profile");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in updateMedicalHistoryEntry:", err);
    return { success: false, error: err.message || "Failed to update medical history entry" };
  }
}

export async function deleteMedicalHistoryEntry(entryId: string): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    let person: any = null;
    if (auth.personId) person = await LifePerson.findById(auth.personId);
    if (!person && auth.email) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${auth.email.trim()}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    if (!person) return { success: false, error: "Person profile not found" };

    person.medicalHistory = (person.medicalHistory || []).filter((m: any) => m.id !== entryId);
    person.markModified("medicalHistory");
    await person.save();

    await logLifeActivity({
      action: "DELETE_MEDICAL_HISTORY",
      resourceType: "profile",
      resourceId: String(person._id),
      resourceName: entryId,
      details: `Removed medical history entry [${entryId}]`,
    }).catch(() => {});

    revalidatePath("/profile");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in deleteMedicalHistoryEntry:", err);
    return { success: false, error: err.message || "Failed to delete medical history entry" };
  }
}

// ─── 5. Health Profile: Medical Reports ─────────────────────────────────────
export async function addHealthReport(payload: {
  title: string;
  category?: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  issueDate?: string;
  issuingAuthority?: string;
  doctor?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const cleanTitle = payload.title.trim();
    if (!cleanTitle) return { success: false, error: "Report title is required" };
    if (!payload.fileUrl) return { success: false, error: "File attachment is required" };

    let person: any = null;
    if (auth.personId) person = await LifePerson.findById(auth.personId);
    if (!person && auth.email) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${auth.email.trim()}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    const doc = await LifeDocument.create({
      title: cleanTitle,
      category: "medical",
      fileUrl: payload.fileUrl,
      fileType: payload.fileType || "application/pdf",
      fileSize: payload.fileSize || 0,
      relatedPersonId: person?._id,
      issuingAuthority: payload.issuingAuthority?.trim() || payload.doctor?.trim() || "",
      issueDate: payload.issueDate ? new Date(payload.issueDate) : new Date(),
      notes: payload.notes?.trim() || "",
      visibility: "visible_now",
    });

    await logLifeActivity({
      action: "ADD_HEALTH_REPORT",
      resourceType: "document",
      resourceId: String(doc._id),
      resourceName: cleanTitle,
      details: `Added health report: "${cleanTitle}"`,
    }).catch(() => {});

    revalidatePath("/profile");
    revalidatePath("/documents");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in addHealthReport:", err);
    return { success: false, error: err.message || "Failed to add health report" };
  }
}

export async function deleteHealthReport(reportId: string): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const doc = await LifeDocument.findById(reportId);
    if (!doc) return { success: false, error: "Report document not found" };

    await LifeDocument.findByIdAndDelete(reportId);

    await logLifeActivity({
      action: "DELETE_HEALTH_REPORT",
      resourceType: "document",
      resourceId: reportId,
      resourceName: doc.title,
      details: `Deleted health report: "${doc.title}"`,
    }).catch(() => {});

    revalidatePath("/profile");
    revalidatePath("/documents");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in deleteHealthReport:", err);
    return { success: false, error: err.message || "Failed to delete health report" };
  }
}

// ─── 6. Emergency Contacts ──────────────────────────────────────────────────
export async function addEmergencyContact(payload: {
  personId: string;
  relationship: string;
  phone?: string;
  isPrimary?: boolean;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const person = await LifePerson.findById(payload.personId);
    if (!person) return { success: false, error: "Person not found" };

    // If making this contact primary, demote existing primary contact to backup
    if (payload.isPrimary) {
      await LifePerson.updateMany(
        { isEmergencyContact: true, isEmergencyPrimary: true },
        { $set: { isEmergencyPrimary: false, emergencyPriority: 2 } }
      );
    }

    person.isEmergencyContact = true;
    person.isEmergencyPrimary = !!payload.isPrimary;
    person.emergencyPriority = payload.isPrimary ? 1 : 2;
    if (payload.relationship?.trim()) {
      person.emergencyRelationship = payload.relationship.trim();
    }
    if (payload.phone?.trim()) {
      person.phone = payload.phone.trim();
    }

    await person.save();

    await logLifeActivity({
      action: "ADD_EMERGENCY_CONTACT",
      resourceType: "people",
      resourceId: String(person._id),
      resourceName: person.name,
      details: `Added "${person.name}" as emergency contact (${payload.isPrimary ? "Primary" : "Backup"})`,
    }).catch(() => {});

    revalidatePath("/profile");
    revalidatePath("/people");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in addEmergencyContact:", err);
    return { success: false, error: err.message || "Failed to add emergency contact" };
  }
}

export async function setPrimaryEmergencyContact(personId: string): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    // Demote any current primary
    await LifePerson.updateMany(
      { isEmergencyContact: true, isEmergencyPrimary: true },
      { $set: { isEmergencyPrimary: false, emergencyPriority: 2 } }
    );

    // Promote target
    const target = await LifePerson.findByIdAndUpdate(
      personId,
      { $set: { isEmergencyContact: true, isEmergencyPrimary: true, emergencyPriority: 1 } },
      { new: true }
    );

    if (!target) return { success: false, error: "Person not found" };

    await logLifeActivity({
      action: "SET_PRIMARY_EMERGENCY_CONTACT",
      resourceType: "people",
      resourceId: personId,
      resourceName: target.name,
      details: `Designated "${target.name}" as Primary Emergency Contact`,
    }).catch(() => {});

    revalidatePath("/profile");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in setPrimaryEmergencyContact:", err);
    return { success: false, error: err.message || "Failed to set primary contact" };
  }
}

export async function removeEmergencyContact(personId: string): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const person = await LifePerson.findById(personId);
    if (!person) return { success: false, error: "Person not found" };

    const wasPrimary = !!person.isEmergencyPrimary;

    person.isEmergencyContact = false;
    person.isEmergencyPrimary = false;
    person.emergencyPriority = 0;
    await person.save();

    // If primary was removed, promote the first remaining backup if available
    if (wasPrimary) {
      const nextInLine = await LifePerson.findOne({
        isEmergencyContact: true,
        status: { $ne: "archived" },
      }).sort({ emergencyPriority: 1, name: 1 });

      if (nextInLine) {
        nextInLine.isEmergencyPrimary = true;
        nextInLine.emergencyPriority = 1;
        await nextInLine.save();
      }
    }

    await logLifeActivity({
      action: "REMOVE_EMERGENCY_CONTACT",
      resourceType: "people",
      resourceId: personId,
      resourceName: person.name,
      details: `Removed "${person.name}" from emergency contacts (profile retained)`,
    }).catch(() => {});

    revalidatePath("/profile");
    revalidatePath("/people");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in removeEmergencyContact:", err);
    return { success: false, error: err.message || "Failed to remove emergency contact" };
  }
}

// ─── 7. Profile Privacy: Selective Sharing ──────────────────────────────────
export async function shareProfileSection(payload: {
  section: "personal" | "health" | "emergency";
  personId: string;
  selectedRecords?: string[];
  permission?: "view" | "edit";
  expiryDate?: string;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const recordTypeMap = {
      personal: "profile_personal",
      health: "profile_health",
      emergency: "profile_emergency",
    };

    const targetRecordType = recordTypeMap[payload.section];
    if (!targetRecordType) return { success: false, error: "Invalid section" };

    const assignedPerson = await LifePerson.findById(payload.personId);
    if (!assignedPerson) return { success: false, error: "Person to share with not found" };

    const releaseCondition = Array.isArray(payload.selectedRecords) && payload.selectedRecords.length > 0
      ? payload.selectedRecords.join(", ")
      : "all_details";

    await LifeRecordPermission.findOneAndUpdate(
      {
        recordId: targetRecordType,
        recordType: targetRecordType,
        assignedPersonId: payload.personId,
      },
      {
        $set: {
          recordId: targetRecordType,
          recordType: targetRecordType,
          assignedPersonId: payload.personId,
          visibilityMode: "available_now",
          releaseCondition,
          canView: true,
          canEdit: payload.permission === "edit",
          expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
          isReleased: true,
        },
      },
      { upsert: true, new: true }
    );

    await logLifeActivity({
      action: "SHARE_PROFILE_SECTION",
      resourceType: "profile",
      resourceId: targetRecordType,
      resourceName: assignedPerson.name,
      details: `Shared ${payload.section} profile with "${assignedPerson.name}" (${releaseCondition})`,
    }).catch(() => {});

    revalidatePath("/profile");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in shareProfileSection:", err);
    return { success: false, error: err.message || "Failed to share section" };
  }
}

export async function revokeProfileSectionAccess(permissionId: string): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const perm = await LifeRecordPermission.findByIdAndDelete(permissionId);

    if (perm) {
      await logLifeActivity({
        action: "REVOKE_PROFILE_ACCESS",
        resourceType: "profile",
        resourceId: permissionId,
        resourceName: perm.recordType,
        details: `Revoked access for [${perm.recordType}]`,
      }).catch(() => {});
    }

    revalidatePath("/profile");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    console.error("Error in revokeProfileSectionAccess:", err);
    return { success: false, error: err.message || "Failed to revoke access" };
  }
}

// ─── 8. Account Security: Verification Code & Security Helpers ───────────────
export async function requestVerificationCode(reason?: string): Promise<{
  success: boolean;
  code?: string;
  maskedDestination?: string;
  error?: string;
}> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    verificationCodes.set(auth.email.toLowerCase(), { code, expiresAt });

    const parts = auth.email.split("@");
    const namePart = parts[0] || "user";
    const maskedName = namePart.length > 3 ? namePart.slice(0, 2) + "***" + namePart.slice(-1) : namePart[0] + "***";
    const maskedDestination = `${maskedName}@${parts[1] || "domain.com"}`;

    await logLifeActivity({
      action: "REQUEST_VERIFICATION_CODE",
      resourceType: "security",
      resourceName: auth.email,
      details: `Generated security verification code for ${reason || "identity verification"}`,
    }).catch(() => {});

    return {
      success: true,
      code, // returned so client can demonstrate or auto-fill for developer convenience
      maskedDestination,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send code" };
  }
}

export async function verifyAccountCode(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const entry = verificationCodes.get(auth.email.toLowerCase());
    if (!entry) {
      // Demo fallback: accept "123456" for convenience if none generated
      if (code.trim() === "123456") return { success: true };
      return { success: false, error: "Verification code expired or not requested" };
    }

    if (Date.now() > entry.expiresAt) {
      verificationCodes.delete(auth.email.toLowerCase());
      return { success: false, error: "Verification code has expired. Please request a new one." };
    }

    if (entry.code !== code.trim()) {
      return { success: false, error: "Incorrect verification code. Please check and try again." };
    }

    // Success
    verificationCodes.delete(auth.email.toLowerCase());

    await logLifeActivity({
      action: "VERIFY_ACCOUNT_CODE",
      resourceType: "security",
      resourceName: auth.email,
      details: "Successfully verified security code",
    }).catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Verification failed" };
  }
}

export async function removeProfilePhoto(): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    let person: any = null;
    if (auth.personId) person = await LifePerson.findById(auth.personId);
    if (!person && auth.email) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${auth.email.trim()}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    if (person) {
      person.avatarUrl = "";
      person.profilePhoto = "";
      await person.save();
    }

    await logLifeActivity({
      action: "REMOVE_PROFILE_PHOTO",
      resourceType: "profile",
      resourceId: person?._id ? String(person._id) : undefined,
      resourceName: person?.name || "Owner",
      details: "Removed profile photo",
    }).catch(() => {});

    revalidatePath("/profile");
    revalidatePath("/");
    const refreshed = await getProfileData();
    return { success: true, data: refreshed.data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove photo" };
  }
}

// Backward compatibility alias
export const updateProfileData = updatePersonalDetails;
