"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeInstruction from "@/lib/database/models/lifeInstruction.model";
import { getLifeAuthContext, requireOwnerOrAdmin, logLifeActivity } from "@/lib/life/auth";
import { InstructionType, ResponsibilityPriority, VisibilityMode } from "@/types";

export async function getInstructions(filterPersonId?: string) {
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

    const items = await LifeInstruction.find(query)
      .populate("assignedPersonId", "name relation phone")
      .populate("backupPersonId", "name relation")
      .populate("relatedBusinessId", "name")
      .populate("relatedContactId", "name phone role")
      .populate("relatedDocumentId", "title fileUrl")
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(items));
  } catch (error: any) {
    console.error("Error in getInstructions:", error);
    return [];
  }
}

export async function createInstruction(data: {
  title: string;
  detailedInstruction: string;
  instructionType: InstructionType;
  assignedPersonId?: string;
  backupPersonId?: string;
  priority?: ResponsibilityPriority;
  relatedBusinessId?: string;
  relatedContactId?: string;
  relatedDocumentId?: string;
  visibilityMode?: VisibilityMode;
  releaseCondition?: string;
  effectiveDate?: Date | string;
  reviewDate?: Date | string;
}) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const item = await LifeInstruction.create({
      ...data,
      status: "active",
      versionHistory: [
        {
          version: 1,
          content: data.detailedInstruction,
          updatedAt: new Date(),
          updatedBy: context.name,
        },
      ],
    });

    await logLifeActivity({
      action: "CREATE_INSTRUCTION",
      resourceType: "instruction",
      resourceId: String(item._id),
      resourceName: data.title,
      details: `Created ${data.instructionType} instruction: "${data.title}"`,
    });

    revalidatePath("/instructions");
    return { success: true, item: JSON.parse(JSON.stringify(item)) };
  } catch (error: any) {
    console.error("Error in createInstruction:", error);
    return { success: false, error: error.message };
  }
}

export async function updateInstruction(
  id: string,
  data: Partial<{
    title: string;
    detailedInstruction: string;
    instructionType: InstructionType;
    assignedPersonId: string;
    backupPersonId: string;
    priority: ResponsibilityPriority;
    visibilityMode: VisibilityMode;
    status: "active" | "draft" | "archived";
  }>
) {
  try {
    const context = await requireOwnerOrAdmin();
    await connectToDatabase();

    const item = await LifeInstruction.findById(id);
    if (!item) throw new Error("Instruction not found");

    if (data.detailedInstruction && data.detailedInstruction !== item.detailedInstruction) {
      const nextVersion = (item.versionHistory?.length || 0) + 1;
      item.versionHistory.push({
        version: nextVersion,
        content: data.detailedInstruction,
        updatedAt: new Date(),
        updatedBy: context.name,
      });
    }

    Object.assign(item, data);
    await item.save();

    await logLifeActivity({
      action: "UPDATE_INSTRUCTION",
      resourceType: "instruction",
      resourceId: id,
      resourceName: item.title,
      details: `Updated instruction "${item.title}"`,
    });

    revalidatePath("/instructions");
    return { success: true };
  } catch (error: any) {
    console.error("Error in updateInstruction:", error);
    return { success: false, error: error.message };
  }
}
