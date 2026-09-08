"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeEmergencyRequest from "@/lib/database/models/lifeEmergencyRequest.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import LifeGuardian from "@/lib/database/models/lifeGuardian.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import { getLifeAuthContext, requireOwnerOrAdmin, logLifeActivity } from "@/lib/life/auth";
import { EmergencyReason } from "@/types";

export async function createEmergencyRequest({
  reason,
  reasonDetails,
  supportingDocuments = [],
}: {
  reason: EmergencyReason;
  reasonDetails: string;
  supportingDocuments?: string[];
}) {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized: Please log in.");

    // Must be either Owner, Admin, or an active Guardian
    if (!context.isOwner && !context.isAdmin && !context.isGuardian) {
      throw new Error("Only designated Trusted Guardians or Administrators can initiate an Emergency Release.");
    }

    await connectToDatabase();

    const personId = context.personId;
    if (!personId && !context.isOwner) {
      throw new Error("No person profile associated with your account.");
    }

    const config = await LifeEmergencyAccess.findOne();
    const waitingHours = config?.defaultWaitingPeriodHours || 72;

    const request = await LifeEmergencyRequest.create({
      requestedByPersonId: personId || undefined,
      requestedByName: context.name,
      requestedByEmail: context.email,
      reason,
      reasonDetails,
      supportingDocuments,
      status: "pending_approval",
      approvals: [],
      ownerAlertSent: true,
    });

    await logLifeActivity({
      action: "EMERGENCY_REQUEST_CREATED",
      resourceType: "emergency_request",
      resourceId: String(request._id),
      details: `Emergency request initiated by ${context.name}. Reason: ${reason}`,
      isCritical: true,
    });

    revalidatePath("/guardians");
    revalidatePath("/access");
    return { success: true, request: JSON.parse(JSON.stringify(request)) };
  } catch (error: any) {
    console.error("Error in createEmergencyRequest:", error);
    return { success: false, error: error.message };
  }
}

export async function approveEmergencyRequest(requestId: string, note: string = "") {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    await connectToDatabase();
    const request = await LifeEmergencyRequest.findById(requestId);
    if (!request) throw new Error("Emergency request not found.");

    if (request.status !== "pending_approval" && request.status !== "partially_approved") {
      throw new Error(`Cannot approve request in status: ${request.status}`);
    }

    // §7, §30 Item 7: GUARDIAN CANNOT SELF-APPROVE OWN REQUEST!
    if (
      context.personId &&
      String(request.requestedByPersonId) === String(context.personId) &&
      !context.isOwner
    ) {
      throw new Error("Security Violation: A Guardian cannot approve their own Emergency Release request. Another Guardian must approve it.");
    }

    // Check if already approved by this person
    const alreadyApproved = request.approvals.some(
      (a: any) => a.guardianPersonId && String(a.guardianPersonId) === String(context.personId)
    );
    if (alreadyApproved) {
      throw new Error("You have already recorded an approval for this request.");
    }

    request.approvals.push({
      guardianPersonId: context.personId || undefined,
      guardianName: context.name,
      guardianEmail: context.email,
      action: "approve",
      date: new Date(),
      note,
    });

    const config = await LifeEmergencyAccess.findOne();
    const rule = config?.guardianApprovalRule || "any_two_of_three";
    const waitingHours = config?.defaultWaitingPeriodHours || 72;

    const totalApprovals = request.approvals.filter((a: any) => a.action === "approve").length;
    let requiredCount = 2;
    if (rule === "one_guardian") requiredCount = 1;
    if (rule === "two_guardians" || rule === "any_two_of_three") requiredCount = 2;

    if (totalApprovals >= requiredCount) {
      // Transition to waiting period
      request.status = "waiting_period";
      request.waitingPeriodStart = new Date();
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + waitingHours);
      request.waitingPeriodEnd = endTime;

      // Update emergency access document state
      await LifeEmergencyAccess.findOneAndUpdate(
        {},
        {
          activeRequestId: request._id,
          ownerSafetyStatus: "emergency",
        }
      );
    } else {
      request.status = "partially_approved";
    }

    await request.save();

    await logLifeActivity({
      action: "EMERGENCY_REQUEST_APPROVED",
      resourceType: "emergency_request",
      resourceId: String(request._id),
      details: `Emergency request approved by ${context.name}. Total approvals: ${totalApprovals}`,
      isCritical: true,
    });

    revalidatePath("/guardians");
    revalidatePath("/access");
    return { success: true, request: JSON.parse(JSON.stringify(request)) };
  } catch (error: any) {
    console.error("Error in approveEmergencyRequest:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectEmergencyRequest(requestId: string, reason: string = "") {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    await connectToDatabase();
    const request = await LifeEmergencyRequest.findById(requestId);
    if (!request) throw new Error("Emergency request not found.");

    request.status = "rejected";
    request.approvals.push({
      guardianPersonId: context.personId || undefined,
      guardianName: context.name,
      guardianEmail: context.email,
      action: "reject",
      date: new Date(),
      note: reason,
    });

    await request.save();

    await logLifeActivity({
      action: "EMERGENCY_REQUEST_REJECTED",
      resourceType: "emergency_request",
      resourceId: String(request._id),
      details: `Emergency request rejected by ${context.name}. Reason: ${reason}`,
      isCritical: true,
    });

    revalidatePath("/guardians");
    revalidatePath("/access");
    return { success: true };
  } catch (error: any) {
    console.error("Error in rejectEmergencyRequest:", error);
    return { success: false, error: error.message };
  }
}

export async function cancelEmergencyRequest(requestId: string) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const request = await LifeEmergencyRequest.findById(requestId);
    if (!request) throw new Error("Emergency request not found.");

    request.status = "cancelled";
    request.ownerCancelledAt = new Date();
    await request.save();

    // Reset emergency access
    await LifeEmergencyAccess.findOneAndUpdate(
      {},
      {
        isEmergencyActive: false,
        activeRequestId: null,
        ownerSafetyStatus: "safe",
        lastSafetyCheckIn: new Date(),
      }
    );

    await logLifeActivity({
      action: "EMERGENCY_REQUEST_CANCELLED_BY_OWNER",
      resourceType: "emergency_request",
      resourceId: String(request._id),
      details: `Emergency protocol cancelled by Owner (${context.name}). System returned to normal.`,
      isCritical: true,
    });

    revalidatePath("/guardians");
    revalidatePath("/access");
    return { success: true };
  } catch (error: any) {
    console.error("Error in cancelEmergencyRequest:", error);
    return { success: false, error: error.message };
  }
}

export async function activateEmergencyNow(requestId: string) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const request = await LifeEmergencyRequest.findById(requestId);
    if (!request) throw new Error("Request not found.");

    request.status = "activated";
    await request.save();

    await LifeEmergencyAccess.findOneAndUpdate(
      {},
      {
        isEmergencyActive: true,
        activatedBy: context.name,
        activatedAt: new Date(),
        activeRequestId: request._id,
        ownerSafetyStatus: "emergency",
      }
    );

    await logLifeActivity({
      action: "EMERGENCY_MODE_ACTIVATED",
      resourceType: "emergency_access",
      resourceId: String(request._id),
      details: `Emergency Mode officially ACTIVATED by ${context.name}.`,
      isCritical: true,
    });

    revalidatePath("/guardians");
    revalidatePath("/access");
    return { success: true };
  } catch (error: any) {
    console.error("Error in activateEmergencyNow:", error);
    return { success: false, error: error.message };
  }
}

export async function getEmergencyHistory() {
  try {
    await connectToDatabase();
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    const requests = await LifeEmergencyRequest.find()
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(requests));
  } catch (error: any) {
    console.error("Error in getEmergencyHistory:", error);
    return [];
  }
}
