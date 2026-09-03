import { currentUser, auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import Admin from "@/lib/database/models/admin.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeActivityLog from "@/lib/database/models/lifeActivityLog.model";
import { LifeRole, LifePermission } from "@/types";

export interface LifeAuthContext {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: LifeRole;
  isOwner: boolean;
  isAdmin: boolean;
  personId?: string;
  permissions: LifePermission;
}

const DEFAULT_OWNER_PERMS: LifePermission = {
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

    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() || "";
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      email.split("@")[0] ||
      "User";
    const avatarUrl = clerkUser.imageUrl;

    // Check if any admin exists in system; if 0, auto-promote first user as Owner / super_admin
    const totalAdmins = await Admin.countDocuments();
    let adminDoc = await Admin.findOne({ email });

    if (!adminDoc && totalAdmins === 0 && email) {
      adminDoc = await Admin.create({
        email,
        name,
        role: "super_admin",
        isActive: true,
      });
    }

    if (adminDoc && adminDoc.isActive) {
      const isOwner = adminDoc.role === "super_admin" || adminDoc.role === "admin";
      return {
        userId,
        email,
        name: adminDoc.name || name,
        avatarUrl,
        role: adminDoc.role === "super_admin" ? "owner" : "admin",
        isOwner,
        isAdmin: true,
        permissions: DEFAULT_OWNER_PERMS,
      };
    }

    // Check if this user is linked as a designated LifePerson
    const personDoc = await LifePerson.findOne({
      $or: [{ email }, { clerkUserId: userId }],
      status: { $ne: "archived" },
    });

    if (personDoc) {
      if (personDoc.status === "locked") {
        throw new Error("Your access to Life has been locked. Please contact the Owner.");
      }

      // Sync clerkUserId if missing
      if (!personDoc.clerkUserId) {
        personDoc.clerkUserId = userId;
        await personDoc.save();
      }

      const role = (personDoc.role || "individual") as LifeRole;
      const isOwner = role === "owner";
      const isAdmin = isOwner || role === "super_admin" || role === "admin";

      return {
        userId,
        email,
        name: personDoc.name || name,
        avatarUrl: personDoc.avatarUrl || avatarUrl,
        role,
        isOwner,
        isAdmin,
        personId: String(personDoc._id),
        permissions: isOwner
          ? DEFAULT_OWNER_PERMS
          : personDoc.permissions || {
              canViewPersonal: false,
              canViewBusiness: role === "business",
              canViewFinancial: false,
              canViewSensitive: false,
              canRevealVault: false,
              canManageAccess: false,
              canAccessEmergency: false,
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
  metadata,
}: {
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: string;
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
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Failed to write LifeActivityLog:", error);
  }
}
