"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import LifePerson from "@/lib/database/models/lifePerson.model";
import Admin from "@/lib/database/models/admin.model";
import LifeAsset from "@/lib/database/models/lifeAsset.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeContact from "@/lib/database/models/lifeContact.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import { getClerkAvatar } from "@/lib/life/clerk-avatar";

export interface ProfileData {
  personId?: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  permanentAddress: string;
  avatarUrl: string;
  role: string;
  workspaceName: string;
  isOwner: boolean;
  financialSummary: {
    propertyValue: number;
    totalExpense: number;
    totalBalance: number;
    totalLoan: number;
    currencySymbol: string;
  };
  stats?: {
    documentsCount: number;
    contactsCount: number;
  };
}

export async function getProfileData(): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) {
      return { success: false, error: "Unauthorized" };
    }

    // Resolve owner / person
    let person: any = null;
    if (auth.personId) {
      person = await LifePerson.findById(auth.personId).lean();
    }
    if (!person && auth.email) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${auth.email.trim()}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      }).lean();
    }

    // Resolve admin doc if available
    let adminDoc: any = null;
    if (auth.email) {
      adminDoc = await Admin.findOne({
        email: new RegExp(`^${auth.email.trim()}$`, "i"),
      }).lean();
    }

    // Avatar resolution
    const resolvedAvatar =
      person?.avatarUrl ||
      person?.profilePhoto ||
      auth.avatarUrl ||
      (await getClerkAvatar({
        email: person?.email || auth.email,
        clerkUserId: auth.userId,
      })) ||
      "";

    // System settings for currency
    const settings = (await LifeSettings.findOne().lean()) as any;
    const currencySymbol = settings?.currencySymbol || "৳";

    // Financial calculations strictly from the user's LIFE database (Personal Support, Assets, Money records)
    // No external ACC.GESN.NET or enterprise company data on user profile
    const assetMatchQuery: any = { status: { $ne: "archived" } };
    if (!auth.isOwner && !auth.isAdmin && auth.personId) {
      assetMatchQuery.$or = [
        { assignedToPersonId: auth.personId },
        { beneficiaryIds: auth.personId },
        { createdBy: auth.userId },
      ];
    }

    // 1. Property Value (sum of LifeAsset values)
    const assetAgg = await LifeAsset.aggregate([
      { $match: assetMatchQuery },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);
    const propertyValue = assetAgg[0]?.total || 0;

    // 2. Liquid balance (bank & cash assets)
    const liquidMatchQuery: any = {
      ...assetMatchQuery,
      category: { $in: ["bank_account", "cash", "crypto", "digital"] },
    };
    const liquidAssetAgg = await LifeAsset.aggregate([
      { $match: liquidMatchQuery },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]);
    let totalBalance = liquidAssetAgg[0]?.total || 0;

    // 3. Money records: loans taken (liabilities) & receivables
    const moneyMatchQuery: any = {
      status: { $in: ["active", "partially_returned", "overdue"] },
    };
    if (!auth.isOwner && !auth.isAdmin && auth.personId) {
      moneyMatchQuery.$or = [
        { personId: auth.personId },
        { createdBy: auth.userId },
      ];
    }
    const moneyAgg = await LifeMoneyRecord.aggregate([
      { $match: moneyMatchQuery },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          remainingAmount: { $sum: "$remainingAmount" },
        },
      },
    ]);
    const moneyMap: Record<string, { total: number; remaining: number }> = {};
    moneyAgg.forEach((item) => {
      moneyMap[item._id] = {
        total: item.totalAmount || 0,
        remaining: item.remainingAmount || 0,
      };
    });

    const totalLoan =
      moneyMap["taken"]?.remaining || moneyMap["taken"]?.total || 0;

    // 4. Total Expense (strictly from user's personal financial support commitments)
    const fsMatchQuery: any = { status: { $ne: "archived" } };
    if (!auth.isOwner && !auth.isAdmin && auth.personId) {
      fsMatchQuery.recipientPersonId = auth.personId;
    }
    const fsAgg = await LifeFinancialSupport.aggregate([
      { $match: fsMatchQuery },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalExpense = fsAgg[0]?.total || 0;

    // If liquid balance was 0, calculate net asset balance if user has properties or receivables
    if (totalBalance === 0 && propertyValue > 0) {
      const receivables = moneyMap["given"]?.remaining || 0;
      totalBalance = Math.max(0, propertyValue + receivables - totalLoan);
    }

    const [documentsCount, contactsCount] = await Promise.all([
      LifeDocument.countDocuments({ status: { $ne: "archived" } }).catch(() => 0),
      LifeContact.countDocuments({ status: { $ne: "archived" } }).catch(() => 0),
    ]);

    const profileData: ProfileData = {
      personId: person?._id ? String(person._id) : auth.personId,
      name: person?.name || adminDoc?.name || auth.name || "Shahidul Islam",
      displayName: person?.displayName || person?.username || (auth.name ? auth.name.split(" ")[0] : "Saurav"),
      email: person?.email || adminDoc?.email || auth.email || "",
      phone: person?.phone || "",
      dateOfBirth: person?.dateOfBirth || "",
      address: person?.address || "",
      permanentAddress: person?.permanentAddress || "",
      avatarUrl: resolvedAvatar,
      role: auth.isOwner ? "Owner" : auth.role || "Owner",
      workspaceName: "Personal workspace",
      isOwner: auth.isOwner,
      financialSummary: {
        propertyValue,
        totalExpense,
        totalBalance,
        totalLoan,
        currencySymbol,
      },
      stats: {
        documentsCount,
        contactsCount,
      },
    };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(profileData)),
    };
  } catch (err: any) {
    console.error("Error in getProfileData:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch profile data",
    };
  }
}

export async function updateProfileData(payload: {
  name: string;
  displayName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  permanentAddress?: string;
  avatarUrl?: string;
}): Promise<{
  success: boolean;
  data?: ProfileData;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) {
      return { success: false, error: "Unauthorized" };
    }

    const cleanName = payload.name.trim();
    if (!cleanName) {
      return { success: false, error: "Full name is required" };
    }

    const cleanEmail = payload.email?.toLowerCase().trim() || auth.email.toLowerCase().trim();
    const cleanPhone = payload.phone?.trim() || "";
    const cleanDisplayName = payload.displayName?.trim() || "";
    const cleanDateOfBirth = payload.dateOfBirth?.trim() || "";
    const cleanAddress = payload.address?.trim() || "";
    const cleanPermanentAddress = payload.permanentAddress?.trim() || "";
    const cleanAvatarUrl = payload.avatarUrl?.trim() || "";

    // 1. Update or create LifePerson record
    let person: any = null;
    if (auth.personId) {
      person = await LifePerson.findById(auth.personId);
    }
    if (!person && cleanEmail) {
      person = await LifePerson.findOne({
        $or: [
          { email: new RegExp(`^${cleanEmail}$`, "i") },
          { clerkUserId: auth.userId },
          { role: { $in: ["owner", "super_admin"] } },
        ],
        status: { $ne: "archived" },
      });
    }

    const updateFields: Record<string, any> = {
      name: cleanName,
      displayName: cleanDisplayName,
      dateOfBirth: cleanDateOfBirth,
      phone: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      permanentAddress: cleanPermanentAddress,
    };

    if (cleanAvatarUrl) {
      updateFields.avatarUrl = cleanAvatarUrl;
      updateFields.profilePhoto = cleanAvatarUrl;
    }

    if (person) {
      Object.assign(person, updateFields);
      if (!person.clerkUserId) person.clerkUserId = auth.userId;
      await person.save();
    } else {
      person = await LifePerson.create({
        ...updateFields,
        relation: "Self / Owner",
        role: "super_admin",
        userRole: "super_admin",
        status: "active",
        accountStatus: "active",
        isLoginEnabled: true,
        clerkUserId: auth.userId,
      });
    }

    // 2. Update Admin collection
    if (cleanEmail) {
      await Admin.findOneAndUpdate(
        { email: new RegExp(`^${cleanEmail}$`, "i") },
        {
          $set: {
            name: cleanName,
            email: cleanEmail,
            role: "super_admin",
            isActive: true,
          },
        },
        { upsert: true }
      ).catch(() => {});
    }

    // 3. Update Clerk user profile (firstName / lastName) if possible
    if (auth.userId) {
      try {
        const client = await clerkClient();
        const parts = cleanName.split(" ").filter(Boolean);
        const firstName = parts[0] || cleanName;
        const lastName = parts.slice(1).join(" ") || "";
        await client.users.updateUser(auth.userId, {
          firstName,
          lastName,
        });
      } catch (clerkErr) {
        console.warn("Could not sync name to Clerk account directly:", clerkErr);
      }
    }

    // 4. Log immutable security activity
    await logLifeActivity({
      action: "UPDATE_PROFILE",
      resourceType: "profile",
      resourceId: person?._id ? String(person._id) : undefined,
      resourceName: cleanName,
      details: `Profile updated: Name="${cleanName}", Display="${cleanDisplayName}", Email="${cleanEmail}"`,
    }).catch(() => {});

    // 5. Revalidate all dependent routes so main Dashboard updates instantly
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/people");
    revalidatePath("/settings");

    const refreshed = await getProfileData();
    return {
      success: true,
      data: refreshed.data,
    };
  } catch (err: any) {
    console.error("Error in updateProfileData:", err);
    return {
      success: false,
      error: err.message || "Failed to update profile",
    };
  }
}
