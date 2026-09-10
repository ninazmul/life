import { currentUser, auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import Admin from "@/lib/database/models/admin.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeActivityLog from "@/lib/database/models/lifeActivityLog.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import { LifeRole, LifePermission } from "@/types";

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
};

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
      return {
        userId,
        email,
        name: adminDoc.name || name,
        avatarUrl,
        role: isSuper ? "super_admin" : "administrator",
        isOwner: true,
        isAdmin: true,
        isGuardian: false,
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
        personDoc.accountStatus === "disabled")
    ) {
      throw new Error("Your access to Life has been locked. Please contact the Owner.");
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

      const perms: LifePermission = isSuperUser
        ? DEFAULT_OWNER_PERMS
        : {
            ...(personDoc.permissions || {
              canViewPersonal: false,
              canViewBusiness: role === "business" || role === "business_partner",
              canViewFinancial: false,
              canViewSensitive: false,
              canRevealVault: false,
              canManageAccess: false,
              canAccessEmergency: isGuardian,
            }),
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
    });
  } catch (error) {
    console.error("Failed to write LifeActivityLog:", error);
  }
}
