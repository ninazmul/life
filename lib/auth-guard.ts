import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import Admin from "@/lib/database/models/admin.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeActivityLog from "@/lib/database/models/lifeActivityLog.model";
import {
  AdminRole,
  AppModule,
  PermissionLevel,
  IAdminUser,
} from "@/types";

import {
  ALL_APP_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  resolveEffectivePermissions,
  hasPermissionLevel,
} from "@/lib/rbac-utils";

export {
  ALL_APP_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  resolveEffectivePermissions,
  hasPermissionLevel,
};

/**
 * Fetches the currently authenticated profile with resolved effective permissions.
 * Auto-promotes the first user in the database to super_admin / Owner.
 */
export async function getCurrentAdminProfile(): Promise<IAdminUser | null> {
  try {
    await connectToDatabase();
    const user = await currentUser();
    if (!user) return null;

    const primaryEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (!primaryEmail) return null;

    // Check total admins
    const totalAdmins = await Admin.countDocuments();
    let adminDoc = await Admin.findOne({ email: primaryEmail });

    // Auto-create initial super_admin if DB is empty
    if (!adminDoc && totalAdmins === 0) {
      adminDoc = await Admin.create({
        email: primaryEmail,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || primaryEmail.split("@")[0],
        role: "super_admin",
        isActive: true,
        permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
      });
    }

    if (adminDoc && adminDoc.isActive) {
      const effective = resolveEffectivePermissions(
        adminDoc.role as AdminRole,
        adminDoc.permissions
      );

      return {
        _id: String(adminDoc._id),
        email: adminDoc.email,
        name: adminDoc.name || "",
        role: adminDoc.role as AdminRole,
        permissions: effective,
        isActive: adminDoc.isActive,
        createdAt: adminDoc.createdAt,
        updatedAt: adminDoc.updatedAt,
      };
    }

    // Check if user is a designated Life Person
    const personDoc = await LifePerson.findOne({
      $or: [{ email: primaryEmail }, { clerkUserId: user.id }],
      status: { $ne: "archived" },
    });

    if (personDoc && personDoc.status === "active") {
      const role = (personDoc.role === "owner" || personDoc.role === "super_admin")
        ? "super_admin"
        : (personDoc.role === "admin" ? "admin" : "viewer");

      return {
        _id: String(personDoc._id),
        email: personDoc.email || primaryEmail,
        name: personDoc.name,
        role: role as AdminRole,
        permissions: DEFAULT_ROLE_PERMISSIONS[role as AdminRole] || DEFAULT_ROLE_PERMISSIONS.viewer,
        isActive: true,
        createdAt: personDoc.createdAt,
        updatedAt: personDoc.updatedAt,
      };
    }

    return null;
  } catch (error) {
    console.error("Error in getCurrentAdminProfile:", error);
    return null;
  }
}

/**
 * Enforces permission requirements on server actions. Throws an error if unauthorized.
 */
export async function requirePermission(
  module: AppModule,
  requiredLevel: PermissionLevel = "write"
): Promise<IAdminUser> {
  const profile = await getCurrentAdminProfile();
  if (!profile) {
    throw new Error("Unauthorized: Access is restricted to authorized users.");
  }

  if (profile.role === "super_admin") {
    return profile;
  }

  const effective = resolveEffectivePermissions(profile.role, profile.permissions);
  if (!hasPermissionLevel(effective, module, requiredLevel)) {
    throw new Error(
      `Forbidden: You do not have ${requiredLevel} permission for the "${module}" module.`
    );
  }

  return profile;
}

/**
 * Logs an administrative activity to the LifeActivityLog audit trail.
 */
export async function logActivityAndNotify({
  actor,
  action,
  module,
  resourceId,
  resourceName,
  details,
  metadata,
}: {
  actor?: IAdminUser;
  action: string;
  module: AppModule | "system";
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, unknown>;
  link?: string;
}) {
  try {
    await connectToDatabase();
    const currentActor = actor || (await getCurrentAdminProfile());
    if (!currentActor) return;

    await LifeActivityLog.create({
      actorEmail: currentActor.email,
      actorName: currentActor.name,
      actorRole: currentActor.role,
      action,
      resourceType: module,
      resourceId: resourceId || "",
      resourceName: resourceName || "",
      details,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
