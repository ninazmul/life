"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeGuardian from "@/lib/database/models/lifeGuardian.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import { getLifeAuthContext, requireOwnerOrAdmin, logLifeActivity } from "@/lib/life/auth";
import { GuardianType, ApprovalRule } from "@/types";

export async function getGuardians() {
  try {
    await connectToDatabase();
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    const guardians = await LifeGuardian.find()
      .populate("personId")
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(guardians));
  } catch (error: any) {
    console.error("Error in getGuardians:", error);
    return [];
  }
}

export async function assignGuardian(
  personId: string,
  guardianType: GuardianType = "primary",
  notes: string = ""
) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const person = await LifePerson.findById(personId);
    if (!person) throw new Error("Person not found");

    // Upsert guardian record
    let guardian = await LifeGuardian.findOne({ personId });
    if (guardian) {
      guardian.guardianType = guardianType;
      guardian.isActive = true;
      guardian.notes = notes;
      await guardian.save();
    } else {
      guardian = await LifeGuardian.create({
        personId,
        guardianType,
        isActive: true,
        assignedDate: new Date(),
        notes,
      });
    }

    // Update LifePerson guardianStatus and guardianType
    person.guardianStatus = true;
    person.guardianType = guardianType;
    if (person.role !== "owner") {
      person.role = "guardian";
      person.userRole = "guardian";
    }
    await person.save();

    await logLifeActivity({
      action: "ASSIGN_GUARDIAN",
      resourceType: "guardian",
      resourceId: String(guardian._id),
      resourceName: person.name,
      details: `Assigned ${person.name} as ${guardianType} guardian.`,
      newValue: guardianType,
      isCritical: true,
    });

    revalidatePath("/guardians");
    revalidatePath("/access");
    revalidatePath(`/people/${personId}`);
    return { success: true, guardian: JSON.parse(JSON.stringify(guardian)) };
  } catch (error: any) {
    console.error("Error in assignGuardian:", error);
    return { success: false, error: error.message };
  }
}

export async function removeGuardian(personId: string) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const person = await LifePerson.findById(personId);
    await LifeGuardian.deleteOne({ personId });

    if (person) {
      person.guardianStatus = false;
      person.guardianType = "";
      if (person.role === "guardian") {
        person.role = "individual";
        person.userRole = "responsible_person";
      }
      await person.save();
    }

    await logLifeActivity({
      action: "REMOVE_GUARDIAN",
      resourceType: "guardian",
      resourceId: personId,
      resourceName: person?.name || "Guardian",
      details: `Removed guardian status for ${person?.name || personId}.`,
      isCritical: true,
    });

    revalidatePath("/guardians");
    revalidatePath("/access");
    revalidatePath(`/people/${personId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in removeGuardian:", error);
    return { success: false, error: error.message };
  }
}

export async function getGuardianConfig() {
  try {
    await connectToDatabase();
    let emergency: any = await LifeEmergencyAccess.findOne().lean();
    if (!emergency) {
      const created = await LifeEmergencyAccess.create({
        guardianApprovalRule: "any_two_of_three",
        defaultWaitingPeriodHours: 72,
        ownerAlertChannels: ["email"],
        isEmergencyActive: false,
      });
      emergency = created.toObject();
    }
    return JSON.parse(JSON.stringify(emergency));
  } catch (error: any) {
    console.error("Error in getGuardianConfig:", error);
    return null;
  }
}

export async function updateGuardianConfig({
  approvalRule,
  defaultWaitingPeriodHours,
  ownerAlertChannels,
}: {
  approvalRule: ApprovalRule;
  defaultWaitingPeriodHours: number;
  ownerAlertChannels: string[];
}) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const updated = await LifeEmergencyAccess.findOneAndUpdate(
      {},
      {
        guardianApprovalRule: approvalRule,
        defaultWaitingPeriodHours,
        ownerAlertChannels,
      },
      { new: true, upsert: true }
    );

    await logLifeActivity({
      action: "UPDATE_GUARDIAN_CONFIG",
      resourceType: "emergency_config",
      details: `Updated Guardian approval rules: ${approvalRule}, waiting period: ${defaultWaitingPeriodHours}h.`,
      newValue: JSON.stringify({ approvalRule, defaultWaitingPeriodHours, ownerAlertChannels }),
      isCritical: true,
    });

    revalidatePath("/guardians");
    revalidatePath("/access");
    return { success: true, config: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("Error in updateGuardianConfig:", error);
    return { success: false, error: error.message };
  }
}
