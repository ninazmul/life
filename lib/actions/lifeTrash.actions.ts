"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeVaultItem from "@/lib/database/models/lifeVaultItem.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeInformation from "@/lib/database/models/lifeInformation.model";
import LifeInstruction from "@/lib/database/models/lifeInstruction.model";
import LifeLegacyMessage from "@/lib/database/models/lifeLegacyMessage.model";
import { requireOwnerOrAdmin, logLifeActivity } from "@/lib/life/auth";

export interface TrashItem {
  id: string;
  itemType: "document" | "vault" | "person" | "information" | "instruction" | "legacy";
  title: string;
  subtitle?: string;
  deletedAt?: string;
  deletedBy?: string;
}

export async function getTrashItems(): Promise<TrashItem[]> {
  try {
    await requireOwnerOrAdmin();
    await connectToDatabase();

    const [docs, vaultItems, people, info, instructions, legacy] =
      await Promise.all([
        LifeDocument.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 }).lean(),
        LifeVaultItem.find({ isDeleted: true }).sort({ deletedAt: -1, updatedAt: -1 }).lean(),
        LifePerson.find({
          $or: [{ isDeleted: true }, { status: "archived" }, { accountStatus: "archived" }],
        })
          .sort({ deletedAt: -1, updatedAt: -1 })
          .lean(),
        LifeInformation.find({ isDeleted: true }).sort({ updatedAt: -1 }).lean(),
        LifeInstruction.find({ isDeleted: true }).sort({ updatedAt: -1 }).lean(),
        LifeLegacyMessage.find({ isDeleted: true }).sort({ updatedAt: -1 }).lean(),
      ]);

    const items: TrashItem[] = [];

    docs.forEach((d: any) => {
      items.push({
        id: d._id.toString(),
        itemType: "document",
        title: d.title,
        subtitle: `Category: ${d.category} • Document Record`,
        deletedAt: d.deletedAt ? new Date(d.deletedAt).toISOString() : new Date(d.updatedAt).toISOString(),
        deletedBy: d.deletedBy || "System Admin",
      });
    });

    vaultItems.forEach((v: any) => {
      items.push({
        id: v._id.toString(),
        itemType: "vault",
        title: v.title,
        subtitle: `Category: ${v.category} • Vault Secret`,
        deletedAt: v.deletedAt ? new Date(v.deletedAt).toISOString() : new Date(v.updatedAt).toISOString(),
        deletedBy: v.deletedBy || "System Admin",
      });
    });

    people.forEach((p: any) => {
      items.push({
        id: p._id.toString(),
        itemType: "person",
        title: p.name,
        subtitle: `Relation: ${p.relation} • Role: ${p.role}`,
        deletedAt: p.deletedAt ? new Date(p.deletedAt).toISOString() : new Date(p.updatedAt).toISOString(),
        deletedBy: p.deletedBy || "System Admin",
      });
    });

    info.forEach((i: any) => {
      items.push({
        id: i._id.toString(),
        itemType: "information",
        title: i.title,
        subtitle: `Category: ${i.category} • Information Note`,
        deletedAt: i.deletedAt ? new Date(i.deletedAt).toISOString() : new Date(i.updatedAt).toISOString(),
        deletedBy: i.deletedBy || "System Admin",
      });
    });

    instructions.forEach((ins: any) => {
      items.push({
        id: ins._id.toString(),
        itemType: "instruction",
        title: ins.title,
        subtitle: `Category: ${ins.category} • Instruction Guide`,
        deletedAt: ins.deletedAt ? new Date(ins.deletedAt).toISOString() : new Date(ins.updatedAt).toISOString(),
        deletedBy: ins.deletedBy || "System Admin",
      });
    });

    legacy.forEach((m: any) => {
      items.push({
        id: m._id.toString(),
        itemType: "legacy",
        title: m.title,
        subtitle: `Legacy Message`,
        deletedAt: m.deletedAt ? new Date(m.deletedAt).toISOString() : new Date(m.updatedAt).toISOString(),
        deletedBy: m.deletedBy || "System Admin",
      });
    });

    return items;
  } catch (error) {
    console.error("Failed to get trash items:", error);
    return [];
  }
}

export async function restoreTrashItem(itemType: string, id: string) {
  try {
    const auth = await requireOwnerOrAdmin();
    await connectToDatabase();

    let restoredName = "";

    switch (itemType) {
      case "document": {
        const doc = await LifeDocument.findByIdAndUpdate(
          id,
          { isDeleted: false, deletedAt: null, deletedBy: null },
          { new: true }
        );
        restoredName = doc?.title || "Document";
        revalidatePath("/documents");
        break;
      }
      case "vault": {
        const item = await LifeVaultItem.findByIdAndUpdate(
          id,
          { isDeleted: false, deletedAt: null, deletedBy: null },
          { new: true }
        );
        restoredName = item?.title || "Vault Secret";
        revalidatePath("/vault");
        break;
      }
      case "person": {
        const person = await LifePerson.findByIdAndUpdate(
          id,
          {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            status: "active",
            accountStatus: "active",
          },
          { new: true }
        );
        restoredName = person?.name || "Person";
        revalidatePath("/people");
        break;
      }
      case "information": {
        const info = await LifeInformation.findByIdAndUpdate(
          id,
          { isDeleted: false, deletedAt: null, deletedBy: null },
          { new: true }
        );
        restoredName = info?.title || "Information";
        revalidatePath("/information");
        break;
      }
      case "instruction": {
        const ins = await LifeInstruction.findByIdAndUpdate(
          id,
          { isDeleted: false, deletedAt: null, deletedBy: null },
          { new: true }
        );
        restoredName = ins?.title || "Instruction";
        revalidatePath("/instructions");
        break;
      }
      case "legacy": {
        const leg = await LifeLegacyMessage.findByIdAndUpdate(
          id,
          { isDeleted: false, deletedAt: null, deletedBy: null },
          { new: true }
        );
        restoredName = leg?.title || "Legacy Message";
        revalidatePath("/legacy");
        break;
      }
      default:
        throw new Error(`Unknown item type: ${itemType}`);
    }

    await logLifeActivity({
      action: "RESTORE_TRASH_ITEM",
      resourceType: itemType,
      resourceId: id,
      resourceName: restoredName,
      details: `${auth.name} restored "${restoredName}" from Trash.`,
      result: "success",
    });

    revalidatePath("/settings/trash");
    revalidatePath("/activity");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to restore trash item:", error);
    return { success: false, error: error.message || "Failed to restore item." };
  }
}

export async function permanentlyDeleteTrashItem(itemType: string, id: string) {
  try {
    const auth = await requireOwnerOrAdmin();
    if (!auth.isOwner) {
      throw new Error("Only the System Owner can permanently purge records.");
    }

    await connectToDatabase();

    let deletedName = "";

    switch (itemType) {
      case "document": {
        const doc = await LifeDocument.findByIdAndDelete(id);
        deletedName = doc?.title || "Document";
        break;
      }
      case "vault": {
        const item = await LifeVaultItem.findByIdAndDelete(id);
        deletedName = item?.title || "Vault Secret";
        break;
      }
      case "person": {
        const person = await LifePerson.findByIdAndDelete(id);
        deletedName = person?.name || "Person";
        break;
      }
      case "information": {
        const info = await LifeInformation.findByIdAndDelete(id);
        deletedName = info?.title || "Information";
        break;
      }
      case "instruction": {
        const ins = await LifeInstruction.findByIdAndDelete(id);
        deletedName = ins?.title || "Instruction";
        break;
      }
      case "legacy": {
        const leg = await LifeLegacyMessage.findByIdAndDelete(id);
        deletedName = leg?.title || "Legacy Message";
        break;
      }
      default:
        throw new Error(`Unknown item type: ${itemType}`);
    }

    await logLifeActivity({
      action: "PERMANENT_DELETE_ITEM",
      resourceType: itemType,
      resourceId: id,
      resourceName: deletedName,
      details: `${auth.name} permanently deleted "${deletedName}" from system storage.`,
      result: "success",
      isCritical: true,
    });

    revalidatePath("/settings/trash");
    revalidatePath("/activity");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to permanently delete item:", error);
    return {
      success: false,
      error: error.message || "Failed to permanently delete item.",
    };
  }
}
