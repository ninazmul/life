"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/database";
import LifeResponsibility from "@/lib/database/models/lifeResponsibility.model";
import { getLifeAuthContext, requireOwnerOrAdmin, logLifeActivity } from "@/lib/life/auth";
import {
  ResponsibilityPriority,
  ResponsibilityStatus,
  UserResponsibilityResponse,
  VisibilityMode,
} from "@/types";

export async function getResponsibilities(filterPersonId?: string) {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    await connectToDatabase();

    const query: Record<string, any> = {};

    if (!context.isOwner && !context.isAdmin) {
      if (!context.personId) return [];
      query.$or = [
        { assignedPersonId: context.personId },
        { backupPersonId: context.personId },
      ];
    } else if (filterPersonId) {
      query.$or = [
        { assignedPersonId: filterPersonId },
        { backupPersonId: filterPersonId },
      ];
    }

    const items = await LifeResponsibility.find(query)
      .populate("assignedPersonId", "name relation phone email")
      .populate("backupPersonId", "name relation")
      .populate("relatedBusinessId", "name")
      .populate("relatedContactId", "name phone role")
      .populate("relatedDocumentId", "title fileUrl")
      .populate("relatedVaultItemId", "title")
      .sort({ priority: -1, deadline: 1 })
      .lean();

    return JSON.parse(JSON.stringify(items));
  } catch (error: any) {
    console.error("Error in getResponsibilities:", error);
    return [];
  }
}

export async function createResponsibility(data: {
  title: string;
  detailedInstruction: string;
  relatedBusinessId?: string;
  assignedPersonId: string;
  backupPersonId?: string;
  priority: ResponsibilityPriority;
  startDate?: Date | string;
  deadline?: Date | string;
  relatedContactId?: string;
  relatedDocumentId?: string;
  relatedVaultItemId?: string;
  ownerNote?: string;
  visibilityMode?: VisibilityMode;
  releaseCondition?: string;
}) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const item = await LifeResponsibility.create({
      ...data,
      completionStatus: "not_started",
      visibilityMode: data.visibilityMode || "available_now",
    });

    await logLifeActivity({
      action: "CREATE_RESPONSIBILITY",
      resourceType: "responsibility",
      resourceId: String(item._id),
      resourceName: data.title,
      details: `Assigned responsibility "${data.title}"`,
    });

    revalidatePath("/instructions");
    revalidatePath(`/people/${data.assignedPersonId}`);
    return { success: true, item: JSON.parse(JSON.stringify(item)) };
  } catch (error: any) {
    console.error("Error in createResponsibility:", error);
    return { success: false, error: error.message };
  }
}

export async function updateResponsibilityStatus(
  id: string,
  completionStatus: ResponsibilityStatus,
  ownerNote?: string
) {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    await connectToDatabase();
    const item = await LifeResponsibility.findById(id);
    if (!item) throw new Error("Responsibility not found");

    item.completionStatus = completionStatus;
    if (ownerNote !== undefined && (context.isOwner || context.isAdmin)) {
      item.ownerNote = ownerNote;
    }
    await item.save();

    await logLifeActivity({
      action: "UPDATE_RESPONSIBILITY_STATUS",
      resourceType: "responsibility",
      resourceId: id,
      resourceName: item.title,
      details: `Status updated to ${completionStatus} by ${context.name}`,
    });

    revalidatePath("/instructions");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateResponsibilityStatus:", error);
    return { success: false, error: error.message };
  }
}

/**
 * User submits response acknowledging responsibility (§6).
 * Audit trail records timestamp, user, and device.
 */
export async function submitResponsibilityResponse(
  id: string,
  userResponse: UserResponsibilityResponse,
  userResponseNote: string = ""
) {
  try {
    const context = await getLifeAuthContext();
    if (!context) throw new Error("Unauthorized");

    await connectToDatabase();
    const item = await LifeResponsibility.findById(id);
    if (!item) throw new Error("Responsibility not found");

    const reqHeaders = await headers();
    const userAgent = reqHeaders.get("user-agent") || "unknown";

    item.userResponse = userResponse;
    item.userResponseNote = userResponseNote;
    item.responseDate = new Date();
    item.responseDevice = userAgent;
    await item.save();

    await logLifeActivity({
      action: "SUBMIT_RESPONSIBILITY_RESPONSE",
      resourceType: "responsibility",
      resourceId: id,
      resourceName: item.title,
      details: `${context.name} recorded response: "${userResponse}". Device: ${userAgent.slice(0, 100)}`,
    });

    revalidatePath("/instructions");
    return { success: true };
  } catch (error: any) {
    console.error("Error in submitResponsibilityResponse:", error);
    return { success: false, error: error.message };
  }
}
