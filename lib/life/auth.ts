import { currentUser, auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/database";
import Admin from "@/lib/database/models/admin.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeActivityLog from "@/lib/database/models/lifeActivityLog.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import { LifeRole, LifePermission, CrudAreaKey } from "@/types";

export interface LifeAuthContext {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: LifeRole;
  isOwner: boolean;
  isAdmin: boolean;
  isGuardian: boolean;
  guardianType?: "primary" | "secondary" | "independent" | "";
  personId?: string;
  permissions: LifePermission;
}

export const DEFAULT_OWNER_PERMS: LifePermission = {
  canViewPersonal: true,
  canViewBusiness: true,
  canViewFinancial: true,
  canViewSensitive: true,
  canRevealVault: true,
  canManageAccess: true,
  canAccessEmergency: true,
  allowedCategoryKeys: [
    "financial_care",
    "estate_wasiyyah",
    "roles_responsibilities",
    "emergency_contacts",
    "security_access",
    "instructions_messages",
  ],
  crud: {
    categories: { view: true, add: true, edit: true, delete: true },
    profiles: { view: true, add: true, edit: true, delete: true },
    business: { view: true, add: true, edit: true, delete: true },
    financial: { view: true, add: true, edit: true, delete: true },
    documents: { view: true, add: true, edit: true, delete: true },
    notes: { view: true, add: true, edit: true, delete: true },
    instructions: { view: true, add: true, edit: true, delete: true },
    emergency: { view: true, add: true, edit: true, delete: true },
    vault: { view: true, add: true, edit: true, delete: true },
  },
  notesAccessScope: "all",
  canManageSecretNotes: true,
};

/**
 * Returns customized default permissions according to specification for each role (§4).
 */
export function getDefaultPermissionsForRole(role: LifeRole): LifePermission {
  switch (role) {
    case "owner":
    case "super_admin":
      return { ...DEFAULT_OWNER_PERMS };

    case "admin":
    case "administrator":
      return {
        canViewPersonal: true,
        canViewBusiness: true,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: true,
        allowedCategoryKeys: [
          "roles_responsibilities",
          "emergency_contacts",
          "instructions_messages",
        ],
        crud: {
          categories: { view: true, add: false, edit: false, delete: false },
          profiles: { view: true, add: true, edit: true, delete: false },
          business: { view: true, add: false, edit: false, delete: false },
          financial: { view: false, add: false, edit: false, delete: false },
          documents: { view: true, add: true, edit: false, delete: false },
          notes: { view: true, add: true, edit: true, delete: false },
          instructions: { view: true, add: true, edit: true, delete: false },
          emergency: { view: true, add: true, edit: false, delete: false },
          vault: { view: false, add: false, edit: false, delete: false },
        },
        notesAccessScope: "assigned_only",
        canManageSecretNotes: false,
      };

    case "guardian":
      return {
        canViewPersonal: true,
        canViewBusiness: false,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: true,
        allowedCategoryKeys: [
          "emergency_contacts",
          "instructions_messages",
          "roles_responsibilities",
        ],
        crud: {
          categories: { view: true, add: false, edit: false, delete: false },
          profiles: { view: true, add: false, edit: false, delete: false },
          business: { view: false, add: false, edit: false, delete: false },
          financial: { view: false, add: false, edit: false, delete: false },
          documents: { view: true, add: false, edit: false, delete: false },
          notes: { view: true, add: false, edit: false, delete: false },
          instructions: { view: true, add: false, edit: false, delete: false },
          emergency: { view: true, add: false, edit: false, delete: false },
          vault: { view: false, add: false, edit: false, delete: false },
        },
        notesAccessScope: "assigned_only",
        canManageSecretNotes: false,
      };

    case "business_staff":
      return {
        canViewPersonal: false,
        canViewBusiness: true,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
        allowedCategoryKeys: ["roles_responsibilities"],
        crud: {
          categories: { view: false, add: false, edit: false, delete: false },
          profiles: { view: false, add: false, edit: false, delete: false },
          business: { view: true, add: false, edit: false, delete: false },
          financial: { view: false, add: false, edit: false, delete: false },
          documents: { view: false, add: false, edit: false, delete: false },
          notes: { view: true, add: true, edit: false, delete: false },
          instructions: { view: true, add: false, edit: false, delete: false },
          emergency: { view: false, add: false, edit: false, delete: false },
          vault: { view: false, add: false, edit: false, delete: false },
        },
        notesAccessScope: "assigned_only",
        canManageSecretNotes: false,
      };

    case "business":
    case "business_partner":
      return {
        canViewPersonal: false,
        canViewBusiness: true,
        canViewFinancial: true,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
        allowedCategoryKeys: ["roles_responsibilities", "financial_care"],
        crud: {
          categories: { view: false, add: false, edit: false, delete: false },
          profiles: { view: false, add: false, edit: false, delete: false },
          business: { view: true, add: false, edit: false, delete: false },
          financial: { view: true, add: false, edit: false, delete: false },
          documents: { view: true, add: false, edit: false, delete: false },
          notes: { view: true, add: false, edit: false, delete: false },
          instructions: { view: true, add: false, edit: false, delete: false },
          emergency: { view: false, add: false, edit: false, delete: false },
          vault: { view: false, add: false, edit: false, delete: false },
        },
        notesAccessScope: "assigned_only",
        canManageSecretNotes: false,
      };

    case "individual":
    case "responsible_person":
    case "beneficiary":
      return {
        canViewPersonal: true,
        canViewBusiness: false,
        canViewFinancial: true,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
        allowedCategoryKeys: [
          "financial_care",
          "roles_responsibilities",
          "instructions_messages",
        ],
        crud: {
          categories: { view: true, add: false, edit: false, delete: false },
          profiles: { view: true, add: false, edit: false, delete: false },
          business: { view: false, add: false, edit: false, delete: false },
          financial: { view: true, add: false, edit: false, delete: false },
          documents: { view: true, add: false, edit: false, delete: false },
          notes: { view: true, add: false, edit: false, delete: false },
          instructions: { view: true, add: false, edit: false, delete: false },
          emergency: { view: false, add: false, edit: false, delete: false },
          vault: { view: false, add: false, edit: false, delete: false },
        },
        notesAccessScope: "assigned_only",
        canManageSecretNotes: false,
      };

    case "read_only":
    default:
      return {
        canViewPersonal: true,
        canViewBusiness: false,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
        allowedCategoryKeys: [],
        crud: {
          categories: { view: true, add: false, edit: false, delete: false },
          profiles: { view: true, add: false, edit: false, delete: false },
          business: { view: false, add: false, edit: false, delete: false },
          financial: { view: false, add: false, edit: false, delete: false },
          documents: { view: true, add: false, edit: false, delete: false },
          notes: { view: true, add: false, edit: false, delete: false },
          instructions: { view: true, add: false, edit: false, delete: false },
          emergency: { view: false, add: false, edit: false, delete: false },
          vault: { view: false, add: false, edit: false, delete: false },
        },
        notesAccessScope: "assigned_only",
        canManageSecretNotes: false,
      };
  }
}

/**
 * Checks if caller has granular CRUD permission for a specific area.
 */
export function hasCrudAccess(
  context: LifeAuthContext | null,
  area: CrudAreaKey,
  action: "view" | "add" | "edit" | "delete"
): boolean {
  if (!context) return false;
  if (context.isOwner || context.role === "super_admin") return true;
  if (action !== "view" && context.role === "read_only") return false;
  const areaPerms = context.permissions?.crud?.[area];
  if (areaPerms && areaPerms[action] !== undefined) {
    return Boolean(areaPerms[action]);
  }
  if (action === "view") {
    if (area === "financial") return Boolean(context.permissions?.canViewFinancial);
    if (area === "business") return Boolean(context.permissions?.canViewBusiness);
    if (area === "vault") return Boolean(context.permissions?.canRevealVault);
    if (area === "emergency") return Boolean(context.permissions?.canAccessEmergency);
    return Boolean(context.permissions?.canViewPersonal);
  }
  return context.isAdmin;
}

/**
 * Resolves the authenticated user and their Life authorization profile server-side.
 */
export async function getLifeAuthContext(): Promise<LifeAuthContext | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    await connectToDatabase();

    const emails = (clerkUser.emailAddresses || [])
      .map((e) => e.emailAddress?.toLowerCase().trim())
      .filter(Boolean);
    const email = emails[0] || "";
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      email.split("@")[0] ||
      "User";
    const avatarUrl = clerkUser.imageUrl;

    const emailRegexes = emails.map((e) => new RegExp(`^${e}$`, "i"));

    // Check if any admin exists in system; if 0, auto-promote first user as Owner / super_admin
    const totalAdmins = await Admin.countDocuments();
    let adminDoc = await Admin.findOne({
      email: { $in: emailRegexes.length > 0 ? emailRegexes : [email] },
    });

    if (!adminDoc && totalAdmins === 0 && email) {
      adminDoc = await Admin.create({
        email,
        name,
        role: "super_admin",
        isActive: true,
      });
    }

    if (adminDoc && adminDoc.isActive) {
      const isSuper = adminDoc.role === "super_admin";

      let adminPerson = await LifePerson.findOne({
        $or: [
          ...(emailRegexes.length > 0 ? [{ email: { $in: emailRegexes } }] : email ? [{ email: new RegExp(`^${email}$`, "i") }] : []),
          { clerkUserId: userId },
          ...(isSuper ? [{ role: { $in: ["owner", "super_admin"] } }] : []),
        ],
        status: { $ne: "archived" },
      });

      if (!adminPerson && isSuper && email) {
        adminPerson = await LifePerson.create({
          name: adminDoc.name || name,
          relation: "Self / Owner",
          email: email.toLowerCase().trim(),
          role: "super_admin",
          userRole: "super_admin",
          status: "active",
          accountStatus: "active",
          isLoginEnabled: true,
          clerkUserId: userId,
          permissions: DEFAULT_OWNER_PERMS,
        }).catch(() => null);
      }

      return {
        userId,
        email,
        name: adminDoc.name || adminPerson?.name || name,
        avatarUrl: adminPerson?.profilePhoto || adminPerson?.avatarUrl || avatarUrl,
        role: isSuper ? "super_admin" : "administrator",
        isOwner: true,
        isAdmin: true,
        isGuardian: false,
        personId: adminPerson?._id ? String(adminPerson._id) : undefined,
        permissions: DEFAULT_OWNER_PERMS,
      };
    }

    // Check if this user is linked as a designated LifePerson
    const personDoc = await LifePerson.findOne({
      $or: [
        ...(emailRegexes.length > 0 ? [{ email: { $in: emailRegexes } }] : email ? [{ email: new RegExp(`^${email}$`, "i") }] : []),
        { clerkUserId: userId },
      ],
      status: { $ne: "archived" },
      accountStatus: { $nin: ["archived", "disabled"] },
    });

    if (
      personDoc &&
      (personDoc.status === "locked" ||
        personDoc.accountStatus === "temporarily_locked" ||
        personDoc.accountStatus === "disabled" ||
        personDoc.isLoginEnabled === false ||
        personDoc.isRecordOnly === true)
    ) {
      throw new Error("Your access to Life has been locked or configured as Record-Only. Login is not permitted.");
    }

    if (personDoc) {
      const updates: Record<string, unknown> = { lastActivity: new Date() };
      if (!personDoc.clerkUserId) {
        updates.clerkUserId = userId;
      }
      if (!personDoc.lastLogin) {
        updates.lastLogin = new Date();
      }
      await LifePerson.updateOne({ _id: personDoc._id }, { $set: updates });
    }

    // Check Emergency Protocol state and designated emergency delegation
    const emergencyDoc = await LifeEmergencyAccess.findOne();
    const primary = (emergencyDoc?.primaryAdminEmail || "").toLowerCase().trim();
    const secondary = (emergencyDoc?.secondaryAdminEmail || "").toLowerCase().trim();
    const isDesignatedEmergencyAdmin = Boolean(
      emails.some((e) => e === primary || e === secondary)
    );

    const isGuardian = Boolean(
      personDoc?.guardianStatus ||
      personDoc?.role === "guardian" ||
      personDoc?.userRole === "guardian"
    );
    const guardianType = (personDoc?.guardianType || "") as "primary" | "secondary" | "independent" | "";

    // DYNAMIC ELEVATION:
    // If Emergency Mode is active AND caller is a designated emergency admin (Primary or Secondary),
    // they inherit full continuity access!
    if (emergencyDoc?.isEmergencyActive && isDesignatedEmergencyAdmin) {
      const isPrimary = emails.includes(primary);
      return {
        userId,
        email,
        name: personDoc?.name || name,
        avatarUrl: personDoc?.avatarUrl || avatarUrl,
        role: isPrimary ? "owner" : "administrator",
        isOwner: isPrimary,
        isAdmin: true,
        isGuardian,
        guardianType,
        personId: personDoc ? String(personDoc._id) : undefined,
        permissions: DEFAULT_OWNER_PERMS,
      };
    }

    if (personDoc) {
      const rawRole = personDoc.role || "";
      const rawUserRole = personDoc.userRole || "";
      const isSuperAdmin = rawRole === "super_admin" || rawUserRole === "super_admin";
      const isOwnerRole = rawRole === "owner" || rawUserRole === "owner";
      const isSuperUser = isSuperAdmin || isOwnerRole;

      // Sync role & userRole if one was super_admin but the other wasn't
      if (isSuperAdmin && (rawRole !== "super_admin" || rawUserRole !== "super_admin")) {
        await LifePerson.updateOne(
          { _id: personDoc._id },
          { $set: { role: "super_admin", userRole: "super_admin", permissions: DEFAULT_OWNER_PERMS } }
        ).catch(() => {});
      }

      // Also ensure Admin collection has this super_admin active
      if (isSuperAdmin && (personDoc.email || email)) {
        const targetEmail = (personDoc.email || email).toLowerCase().trim();
        await Admin.findOneAndUpdate(
          { email: new RegExp(`^${targetEmail}$`, "i") },
          {
            $set: {
              email: targetEmail,
              name: personDoc.name || name,
              role: "super_admin",
              isActive: true,
            },
          },
          { upsert: true }
        ).catch(() => {});
      }

      const role = (isSuperAdmin ? "super_admin" : isOwnerRole ? "owner" : (personDoc.userRole || personDoc.role || "responsible_person")) as LifeRole;
      const isOwner = isSuperUser;
      const isAdmin = isSuperUser || role === "admin" || role === "administrator";

      const defaultPerms = getDefaultPermissionsForRole(role);
      const perms: LifePermission = isSuperUser
        ? DEFAULT_OWNER_PERMS
        : {
            ...defaultPerms,
            ...(personDoc.permissions || {}),
            ...(isDesignatedEmergencyAdmin || isGuardian ? { canAccessEmergency: true } : {}),
          };

      return {
        userId,
        email,
        name: personDoc.name || name,
        avatarUrl: personDoc.avatarUrl || avatarUrl,
        role,
        isOwner,
        isAdmin,
        isGuardian,
        guardianType,
        personId: String(personDoc._id),
        permissions: perms,
      };
    }

    // If designated emergency delegate but not yet created in LifePerson directory
    if (isDesignatedEmergencyAdmin) {
      return {
        userId,
        email,
        name,
        avatarUrl,
        role: "individual",
        isOwner: false,
        isAdmin: false,
        isGuardian: false,
        permissions: {
          canViewPersonal: false,
          canViewBusiness: false,
          canViewFinancial: false,
          canViewSensitive: false,
          canRevealVault: false,
          canManageAccess: false,
          canAccessEmergency: true,
        },
      };
    }

    // Default restricted context
    return {
      userId,
      email,
      name,
      avatarUrl,
      role: "read_only",
      isOwner: false,
      isAdmin: false,
      isGuardian: false,
      permissions: {
        canViewPersonal: false,
        canViewBusiness: false,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
      },
    };
  } catch (error) {
    console.error("Error in getLifeAuthContext:", error);
    return null;
  }
}

/**
 * Enforces that caller is either the Owner or an Administrator.
 */
export async function requireOwnerOrAdmin(): Promise<LifeAuthContext> {
  const context = await getLifeAuthContext();
  if (!context) {
    throw new Error("Unauthorized: You must be logged in.");
  }
  if (!context.isOwner && !context.isAdmin) {
    throw new Error("Forbidden: This action is restricted to Life Administrators.");
  }
  return context;
}

/**
 * Logs an activity into the LifeActivityLog audit trail.
 */
export async function logLifeActivity({
  action,
  resourceType,
  resourceId,
  resourceName,
  details,
  previousValue,
  newValue,
  result = "success",
  isCritical = false,
  metadata,
}: {
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  result?: "success" | "failure" | "denied";
  isCritical?: boolean;
  metadata?: Record<string, unknown>;
}) {
  try {
    await connectToDatabase();
    const context = await getLifeAuthContext();
    if (!context) return;

    let ipAddress = "";
    let userAgent = "";
    try {
      const headerList = await headers();
      ipAddress =
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headerList.get("x-real-ip") ||
        "";
      userAgent = headerList.get("user-agent") || "";
    } catch {
      // headers() may not be available outside HTTP request context
    }

    await LifeActivityLog.create({
      actorEmail: context.email,
      actorName: context.name,
      actorRole: context.role,
      action,
      resourceType,
      resourceId: resourceId || "",
      resourceName: resourceName || "",
      details,
      previousValue: previousValue || "",
      newValue: newValue || "",
      result,
      isCritical,
      metadata: metadata || {},
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to write LifeActivityLog:", error);
  }
}
