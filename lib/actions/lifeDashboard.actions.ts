"use server";

import { connectToDatabase } from "@/lib/database";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeInformation from "@/lib/database/models/lifeInformation.model";
import LifeBusiness from "@/lib/database/models/lifeBusiness.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeAsset from "@/lib/database/models/lifeAsset.model";
import LifeContact from "@/lib/database/models/lifeContact.model";
import LifeVaultItem from "@/lib/database/models/lifeVaultItem.model";
import LifeLegacyMessage from "@/lib/database/models/lifeLegacyMessage.model";
import LifeActivityLog from "@/lib/database/models/lifeActivityLog.model";
import LifeEmergencyAccess from "@/lib/database/models/lifeEmergencyAccess.model";
import { getLifeAuthContext } from "@/lib/life/auth";
import { LifeDashboardStats, ILifeEmergencyAccess } from "@/types";

export async function getLifeDashboardStats(): Promise<LifeDashboardStats> {
  await connectToDatabase();
  const _auth = await getLifeAuthContext();

  const [
    peopleCount,
    infoCount,
    businessCount,
    assetAgg,
    moneyAgg,
    recentActivities,
    emergencyState,
  ] = await Promise.all([
    LifePerson.countDocuments({ status: "active" }),
    LifeInformation.countDocuments({ visibility: { $ne: "hidden" } }),
    LifeBusiness.countDocuments({ status: "active" }),
    LifeAsset.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]),
    LifeMoneyRecord.aggregate([
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          remainingAmount: { $sum: "$remainingAmount" },
        },
      },
    ]),
    LifeActivityLog.find().sort({ createdAt: -1 }).limit(6).lean(),
    LifeEmergencyAccess.findOne().lean() as Promise<ILifeEmergencyAccess | null>,
  ]);

  const moneyMap: Record<string, { total: number; remaining: number }> = {};
  moneyAgg.forEach((item) => {
    moneyMap[item._id] = {
      total: item.totalAmount || 0,
      remaining: item.remainingAmount || 0,
    };
  });

  const moneyGivenTotal = moneyMap["given"]?.total || 0;
  const moneyGivenRemaining = moneyMap["given"]?.remaining || 0;
  const moneyTakenTotal = moneyMap["taken"]?.total || 0;
  const moneyTakenRemaining = moneyMap["taken"]?.remaining || 0;
  const investedTotal = moneyMap["invest_made"]?.total || 0;
  const investmentReceivedTotal = moneyMap["invest_received"]?.total || 0;

  // Receivables = remaining from money given + expected investment return
  const receivablesTotal = moneyGivenRemaining;
  // Payables = remaining from money taken
  const payablesTotal = moneyTakenRemaining;

  // Fetch attention / urgent items
  const now = new Date();
  const urgentItems: LifeDashboardStats["urgentItems"] = [];

  if (emergencyState?.isEmergencyActive) {
    urgentItems.push({
      id: "emergency-active",
      title: "Emergency Mode is currently ACTIVE",
      category: "Emergency",
      dueText: "Review emergency instructions",
      severity: "high",
      link: "/access",
    });
  }

  // Overdue money records
  const overdueRecords = await LifeMoneyRecord.find({
    expectedReturnDate: { $lt: now },
    remainingAmount: { $gt: 0 },
    status: { $in: ["active", "partially_returned", "overdue"] },
  })
    .limit(4)
    .lean();

  overdueRecords.forEach((record) => {
    const isGiven = record.type === "given";
    urgentItems.push({
      id: String(record._id),
      title: `${isGiven ? "Overdue Receivable from" : "Overdue Repayment to"} ${
        record.personName || "Counterparty"
      }: ৳${record.remainingAmount.toLocaleString()}`,
      category: "Money",
      dueText: record.expectedReturnDate
        ? new Date(record.expectedReturnDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Overdue",
      severity: isGiven ? "medium" : "high",
      link: "/money",
    });
  });

  // Critical continuity steps not yet completed
  const businesses = await LifeBusiness.find({ status: "active" })
    .select("name continuitySteps")
    .lean();

  businesses.forEach((b) => {
    const pendingSteps = ((b.continuitySteps || []) as Array<{ isCompleted?: boolean; title?: string }>).filter((s) => !s.isCompleted);
    if (pendingSteps.length > 0) {
      urgentItems.push({
        id: `biz-${b._id}`,
        title: `${b.name}: ${pendingSteps[0].title}`,
        category: "Continuity",
        dueText: "If I Am Not Available",
        severity: "medium",
        link: "/business",
      });
    }
  });

  return {
    peopleCount,
    infoCount,
    businessCount,
    assetsTotalValue: assetAgg[0]?.total || 0,
    moneyGivenTotal,
    moneyGivenRemaining,
    moneyTakenTotal,
    moneyTakenRemaining,
    investedTotal,
    investmentReceivedTotal,
    receivablesTotal,
    payablesTotal,
    urgentItems: urgentItems.slice(0, 6),
    recentActivities: JSON.parse(JSON.stringify(recentActivities)),
  };
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  url: string;
}

export async function searchLifeGlobally(query: string): Promise<GlobalSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const regex = new RegExp(query.trim(), "i");
  const results: GlobalSearchResult[] = [];

  // Search People
  const people = await LifePerson.find({
    $or: [{ name: regex }, { relation: regex }, { phone: regex }, { email: regex }],
    status: { $ne: "archived" },
  })
    .limit(4)
    .lean();

  people.forEach((p) => {
    results.push({
      id: String(p._id),
      title: p.name,
      subtitle: `${p.relation} • ${p.phone || p.email || ""}`,
      category: "People",
      url: `/people/${p._id}`,
    });
  });

  // Search Information
  const info = await LifeInformation.find({
    $or: [{ title: regex }, { summary: regex }, { tags: regex }],
    visibility: { $ne: "hidden" },
  })
    .limit(4)
    .lean();

  info.forEach((i) => {
    results.push({
      id: String(i._id),
      title: i.title,
      subtitle: `${i.category.toUpperCase()} • Priority: ${i.priority}`,
      category: "Information",
      url: "/information",
    });
  });

  // Search Business
  const businesses = await LifeBusiness.find({
    $or: [{ name: regex }, { legalName: regex }],
  })
    .limit(3)
    .lean();

  businesses.forEach((b) => {
    results.push({
      id: String(b._id),
      title: b.name,
      subtitle: `${b.ownershipPercentage}% Ownership`,
      category: "Business",
      url: "/business",
    });
  });

  // Search Money
  if (auth.isOwner || auth.permissions.canViewFinancial) {
    const money = await LifeMoneyRecord.find({
      $or: [{ personName: regex }, { purpose: regex }, { organization: regex }],
    })
      .limit(4)
      .lean();

    money.forEach((m) => {
      results.push({
        id: String(m._id),
        title: `${m.type.toUpperCase().replace("_", " ")}: ৳${m.amount.toLocaleString()}`,
        subtitle: `${m.personName || m.organization} • Remaining: ৳${m.remainingAmount.toLocaleString()}`,
        category: "Money",
        url: "/money",
      });
    });
  }

  // Search Contacts
  const contacts = await LifeContact.find({
    $or: [{ name: regex }, { phone: regex }, { company: regex }],
  })
    .limit(4)
    .lean();

  contacts.forEach((c) => {
    results.push({
      id: String(c._id),
      title: c.name,
      subtitle: `${c.category} • ${c.phone}`,
      category: "Contacts",
      url: "/contacts",
    });
  });

  // Search Vault (only titles / systems, never decrypted secrets!)
  if (auth.isOwner || auth.permissions.canRevealVault) {
    const vault = await LifeVaultItem.find({
      $or: [{ title: regex }, { systemOrWebsite: regex }, { username: regex }],
    })
      .limit(3)
      .lean();

    vault.forEach((v) => {
      results.push({
        id: String(v._id),
        title: v.title,
        subtitle: `${v.category} • ${v.systemOrWebsite || v.username || ""}`,
        category: "Vault",
        url: "/vault",
      });
    });
  }

  return results;
}
