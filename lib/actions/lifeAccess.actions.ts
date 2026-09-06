"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import Admin from "@/lib/database/models/admin.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { ILifeEmergencyAccess, ILifePerson, LifeRole, LifePermission } from "@/types";

export async function getEmergencyAccessState(): Promise<ILifeEmergencyAccess> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();

  let state = await LifeEmergencyAccess.findOne().lean();
  if (!state) {
    state = await LifeEmergencyAccess.create({
      isEmergencyActive: false,
      primaryAdminEmail: auth?.email || "owner@life.local",
      secondaryAdminEmail: "",
      instructions:
        "Emergency protocol active. Trusted family and partners can access assigned continuity instructions and emergency documents.",
    });
  }

  return JSON.parse(JSON.stringify(state));
}

export async function toggleEmergencyMode(isActive: boolean, reason?: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized: Please sign in.");

  let state = await LifeEmergencyAccess.findOne();
  if (!state) {
    state = await LifeEmergencyAccess.create({
      isEmergencyActive: false,
      primaryAdminEmail: "",
      secondaryAdminEmail: "",
    });
  }

  const callerEmail = auth.email.toLowerCase().trim();
  const primaryEmail = (state.primaryAdminEmail || "").toLowerCase().trim();
  const secondaryEmail = (state.secondaryAdminEmail || "").toLowerCase().trim();

  const isDesignated =
    Boolean(primaryEmail && callerEmail === primaryEmail) ||
    Boolean(secondaryEmail && callerEmail === secondaryEmail);

  const hasEmergencyPerm = Boolean(auth.permissions?.canAccessEmergency);

  // RULE 1: If attempting to ACTIVATE emergency mode:
  // The Main User (Vault Owner) CANNOT trigger the emergency button.
  // Emergency Mode is strictly reserved for the scenario where the main user is no more / unavailable,
  // and must be activated exclusively by designated emergency persons.
  if (isActive) {
    if (auth.isOwner) {
      throw new Error(
        "Forbidden: The Main User cannot trigger Emergency Mode. Emergency Mode is designed to be triggered exclusively by your designated Emergency Contacts in the event you are no longer available."
      );
    }

    if (!isDesignated && !hasEmergencyPerm && !auth.isAdmin) {
      throw new Error(
        "Forbidden: Only designated Emergency Contacts (or authorized emergency trustees) can trigger Emergency Mode."
      );
    }
  } else {
    // RULE 2: If attempting to DEACTIVATE / RESET emergency mode:
    // The designated emergency person can reset it at any time.
    // System admins and the returning owner can also reset it.
    if (!isDesignated && !hasEmergencyPerm && !auth.isOwner && !auth.isAdmin) {
      throw new Error(
        "Forbidden: You are not authorized to reset Emergency Mode."
      );
    }
  }

  state.isEmergencyActive = isActive;
  state.activatedBy = auth.email;
  state.activatedAt = isActive ? new Date() : undefined;
  if (reason) state.reason = reason;
  await state.save();

  // Audit log
  await logLifeActivity({
    action: isActive ? "EMERGENCY_MODE_ACTIVATED" : "EMERGENCY_MODE_RESET",
    resourceType: "emergency",
    resourceId: String(state._id),
    resourceName: "Emergency Protocol",
    details: `${isActive ? "ACTIVATED" : "RESET / DEACTIVATED"} Emergency Mode by ${auth.email} (${
      isDesignated ? "Designated Emergency Person" : auth.role
    }). Reason: ${reason || (isActive ? "Main user unavailable / Emergency triggered" : "Emergency protocol reset")}`,
  });

  revalidatePath("/access");
  revalidatePath("/");
  return { success: true, isEmergencyActive: isActive };
}

export async function updateEmergencyProtocol(data: {
  primaryAdminEmail: string;
  secondaryAdminEmail?: string;
  instructions?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners can modify emergency protocols.");
  }

  const state = await LifeEmergencyAccess.findOneAndUpdate(
    {},
    { $set: data },
    { new: true, upsert: true }
  ).lean();

  if (!state) throw new Error("Failed to update emergency protocol.");

  await logLifeActivity({
    action: "UPDATE_EMERGENCY_PROTOCOL",
    resourceType: "emergency",
    resourceId: String((state as { _id: unknown })._id),
    resourceName: "Emergency Delegation",
    details: `Updated emergency primary (${data.primaryAdminEmail}) and secondary (${
      data.secondaryAdminEmail || "None"
    }) delegates`,
  });

  revalidatePath("/access");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(state));
}

export async function updatePersonRoleAndPermissions(
  personId: string,
  role: LifeRole,
  permissions: LifePermission
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners can change roles and permissions.");
  }

  const person = (await LifePerson.findByIdAndUpdate(
    personId,
    { $set: { role, permissions } },
    { new: true }
  ).lean()) as (ILifePerson & { _id: unknown }) | null;

  if (person) {
    // Also sync with Admin collection if role is elevated to admin/super_admin
    if ((role === "super_admin" || role === "admin") && person.email) {
      await Admin.findOneAndUpdate(
        { email: person.email.toLowerCase() },
        {
          $set: {
            name: person.name,
            role: role === "super_admin" ? "super_admin" : "admin",
            isActive: true,
          },
        },
        { upsert: true }
      );
    }

    await logLifeActivity({
      action: "UPDATE_PERMISSIONS",
      resourceType: "access",
      resourceId: personId,
      resourceName: person.name,
      details: `Updated role to "${role}" and modified resource permissions for ${person.name}`,
    });
  }

  revalidatePath("/access");
  revalidatePath("/people");
  revalidatePath("/");
  return { success: true };
}
