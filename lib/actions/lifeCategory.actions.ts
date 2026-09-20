"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeCategory from "@/lib/database/models/lifeCategory.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeNote from "@/lib/database/models/lifeNote.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { MainCategoryKey, ILifeCategory } from "@/types";

export interface MainCategoryConfig {
  key: MainCategoryKey;
  title: string;
  description: string;
  defaultSubcategories: string[];
}

export const MAIN_CATEGORIES: MainCategoryConfig[] = [
  {
    key: "financial_care",
    title: "Financial Care",
    description: "Support payments, debts, receivables, and capital tracking",
    defaultSubcategories: [
      "Family & Dependent Allowances",
      "Education & Healthcare Support",
      "Personal Loans & Debt Settlements",
      "Venture Capital & Investments",
    ],
  },
  {
    key: "estate_wasiyyah",
    title: "Estate & Wasiyyah",
    description: "Testaments, asset allocations, property deeds, and nominee declarations",
    defaultSubcategories: [
      "Wasiyyah & Testament Directives",
      "Heir & Nominee Allocations",
      "Real Estate Deeds & Valuables",
      "Private Equity & Company Shares",
    ],
  },
  {
    key: "roles_responsibilities",
    title: "Roles & Responsibilities",
    description: "Operational continuity tasks, family guardianship, and business duties",
    defaultSubcategories: [
      "Immediate Family Caretaking",
      "Business Operational Continuity",
      "Payroll & Supplier Obligations",
      "Legal & Representation Duties",
    ],
  },
  {
    key: "emergency_contacts",
    title: "Emergency Contacts & Help",
    description: "Key people, doctors, lawyers, accountants, and priority call tree",
    defaultSubcategories: [
      "Immediate Emergency Call Tree",
      "Primary Physicians & Hospitals",
      "Legal Advisors & Notaries",
      "System Engineers & Cloud Admins",
    ],
  },
  {
    key: "security_access",
    title: "Security & Access",
    description: "Master security PIN, emergency protocol triggers, and vault recovery",
    defaultSubcategories: [
      "Master PIN Gate & Audit Rules",
      "Emergency Protocol Delegation",
      "Vault Passwords & Recovery Keys",
      "Role-Based Access Matrices",
    ],
  },
  {
    key: "instructions_messages",
    title: "Instructions & Messages",
    description: "Sealed legacy letters, operational instructions, and funeral wishes",
    defaultSubcategories: [
      "Sealed Legacy & Farewell Letters",
      "Operational Handover Protocols",
      "Digital Accounts & Passwords Access",
      "Religious Directives & Final Wishes",
    ],
  },
];

/**
 * Returns all categories and subcategories, auto-seeding defaults if none exist.
 */
export async function getCategoriesWithSubcategories(): Promise<{
  mainCategories: MainCategoryConfig[];
  subcategories: ILifeCategory[];
}> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) {
    return { mainCategories: MAIN_CATEGORIES, subcategories: [] };
  }

  // Seed default subcategories if collection is empty
  const count = await LifeCategory.countDocuments();
  if (count === 0) {
    const seedDocs = [];
    for (const main of MAIN_CATEGORIES) {
      for (let i = 0; i < main.defaultSubcategories.length; i++) {
        seedDocs.push({
          mainCategory: main.key,
          name: main.defaultSubcategories[i],
          description: `${main.defaultSubcategories[i]} records and instructions`,
          order: i,
          isArchived: false,
          createdBy: "system",
        });
      }
    }
    await LifeCategory.insertMany(seedDocs);
  }

  const subcategories = await LifeCategory.find()
    .sort({ mainCategory: 1, order: 1, createdAt: 1 })
    .lean();

  return {
    mainCategories: MAIN_CATEGORIES,
    subcategories: JSON.parse(JSON.stringify(subcategories)),
  };
}

/**
 * Returns subcategories grouped by main category key.
 */
export async function getCategoriesAndSubcategories(): Promise<Record<string, ILifeCategory[]>> {
  const { subcategories } = await getCategoriesWithSubcategories();
  const grouped: Record<string, ILifeCategory[]> = {};
  for (const main of MAIN_CATEGORIES) {
    grouped[main.key] = [];
  }
  for (const sub of subcategories) {
    if (!grouped[sub.mainCategory]) {
      grouped[sub.mainCategory] = [];
    }
    grouped[sub.mainCategory].push(sub);
  }
  return grouped;
}

/**
 * Creates a new subcategory under a main category.
 */
export async function createSubcategory(data: {
  mainCategory: MainCategoryKey;
  name: string;
  description?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can create subcategories.");
  }

  if (!data.name?.trim()) {
    throw new Error("Subcategory name is required.");
  }

  const maxOrderDoc = (await LifeCategory.findOne({ mainCategory: data.mainCategory })
    .sort({ order: -1 })
    .select("order")
    .lean()) as any;

  const nextOrder = (maxOrderDoc?.order ?? -1) + 1;

  const subcategory = await LifeCategory.create({
    mainCategory: data.mainCategory,
    name: data.name.trim(),
    description: data.description?.trim() || "",
    order: nextOrder,
    isArchived: false,
    createdBy: auth.email,
  });

  await logLifeActivity({
    action: "CREATE_SUBCATEGORY",
    resourceType: "category",
    resourceId: String(subcategory._id),
    resourceName: subcategory.name,
    details: `Created subcategory "${subcategory.name}" under ${data.mainCategory}`,
  });

  revalidatePath("/");
  revalidatePath("/access");
  return JSON.parse(JSON.stringify(subcategory));
}

/**
 * Updates or renames a subcategory.
 */
export async function updateSubcategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    isArchived?: boolean;
    order?: number;
  }
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can edit subcategories.");
  }

  const existing = await LifeCategory.findById(id);
  if (!existing) throw new Error("Subcategory not found.");

  const prevName = existing.name;
  if (data.name !== undefined) existing.name = data.name.trim();
  if (data.description !== undefined) existing.description = data.description.trim();
  if (data.isArchived !== undefined) existing.isArchived = data.isArchived;
  if (data.order !== undefined) existing.order = data.order;

  await existing.save();

  await logLifeActivity({
    action: "UPDATE_SUBCATEGORY",
    resourceType: "category",
    resourceId: id,
    resourceName: existing.name,
    details: `Updated subcategory "${prevName}" -> "${existing.name}" (archived: ${existing.isArchived})`,
  });

  revalidatePath("/");
  revalidatePath("/access");
  return JSON.parse(JSON.stringify(existing));
}

/**
 * Reorders a list of subcategory IDs within a category.
 */
export async function reorderSubcategories(orderedIds: string[]) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can reorder subcategories.");
  }

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: index } },
    },
  }));

  if (bulkOps.length > 0) {
    await LifeCategory.bulkWrite(bulkOps);
  }

  revalidatePath("/");
  return { success: true };
}

/**
 * Archives a subcategory.
 */
export async function archiveSubcategory(id: string) {
  return updateSubcategory(id, { isArchived: true });
}

/**
 * Deletes a subcategory. Checks for existing records in Money, Financial Care, Documents, Notes.
 * If records exist, blocks deletion and advises archiving or moving records.
 */
export async function deleteSubcategory(id: string) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can remove subcategories.");
  }

  const subcategory = await LifeCategory.findById(id);
  if (!subcategory) throw new Error("Subcategory not found.");

  // Check if any records reference this category/name
  const nameRegex = new RegExp(`^${subcategory.name.trim()}$`, "i");
  const [moneyCount, supportCount, noteCount] = await Promise.all([
    LifeMoneyRecord.countDocuments({ purpose: nameRegex }),
    LifeFinancialSupport.countDocuments({ purpose: nameRegex }),
    LifeNote.countDocuments({ category: nameRegex }),
  ]);

  const totalReferences = moneyCount + supportCount + noteCount;

  if (totalReferences > 0) {
    throw new Error(
      `Cannot delete "${subcategory.name}" because it contains ${totalReferences} associated record(s). Please move these records to another subcategory first, or Archive this subcategory instead.`
    );
  }

  await LifeCategory.findByIdAndDelete(id);

  await logLifeActivity({
    action: "DELETE_SUBCATEGORY",
    resourceType: "category",
    resourceId: id,
    resourceName: subcategory.name,
    details: `Deleted empty subcategory "${subcategory.name}" under ${subcategory.mainCategory}`,
  });

  revalidatePath("/");
  revalidatePath("/access");
  return { success: true };
}
