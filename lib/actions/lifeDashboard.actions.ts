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
import LifeSettings from "@/lib/database/models/lifeSettings.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeInstruction from "@/lib/database/models/lifeInstruction.model";
import { getLifeAuthContext } from "@/lib/life/auth";
import { getGesnReports } from "@/lib/actions/gesnReports.actions";
import { LifeDashboardStats, ILifeEmergencyAccess } from "@/types";

export async function getLifeDashboardStats(): Promise<LifeDashboardStats> {
  await connectToDatabase();
  const _auth = await getLifeAuthContext();

  const isPrivileged = _auth?.isOwner || _auth?.isAdmin;

  const allowedPersonIds: string[] = [];
  if (_auth?.personId) allowedPersonIds.push(String(_auth.personId));
  if (_auth?.permissions?.allowedPersonIds?.length) {
    allowedPersonIds.push(..._auth.permissions.allowedPersonIds.map(String));
  }

  const businessOr: any[] = [];
  if (_auth?.personId) {
    businessOr.push({ "partners.personId": _auth.personId });
    businessOr.push({ "engineerContact.personId": _auth.personId });
  }
  if (_auth?.permissions?.allowedBusinessIds?.length) {
    businessOr.push({ _id: { $in: _auth.permissions.allowedBusinessIds } });
  }

  let allowedBusinessIds: string[] = [];
  if (businessOr.length > 0) {
    try {
      const connected = await LifeBusiness.find({ $or: businessOr })
        .select("_id")
        .lean();
      allowedBusinessIds = connected.map((b: any) => String(b._id));
    } catch (e) {
      console.error("Error querying connected businesses for dashboard:", e);
    }
  }

  const peopleQuery: Record<string, any> = { status: "active" };
  const businessQuery: Record<string, any> = { status: "active" };
  const infoQuery: Record<string, any> = { visibility: { $ne: "hidden" } };
  const contactsQuery: Record<string, any> = { status: { $ne: "archived" } };
  const documentsQuery: Record<string, any> = { status: { $ne: "archived" } };
  const legacyQuery: Record<string, any> = { status: { $ne: "archived" } };
  const instructionsQuery: Record<string, any> = {
    status: { $ne: "archived" },
  };
  const personalInfoQuery: Record<string, any> = { category: "personal" };
  const beneficiariesQuery: Record<string, any> = {
    $or: [{ role: "beneficiary" }, { userRole: "beneficiary" }],
    status: { $ne: "archived" },
  };
  const fsQuery: Record<string, any> = {};
  const assetQuery: Record<string, any> = { status: "active" };
  const moneyAggMatch: Record<string, any> = {};
  const overdueRecordsQuery: Record<string, any> = {
    expectedReturnDate: { $lt: new Date() },
    remainingAmount: { $gt: 0 },
    status: { $in: ["active", "partially_returned", "overdue"] },
  };

  if (!isPrivileged) {
    if (allowedPersonIds.length > 0) {
      peopleQuery._id = { $in: allowedPersonIds };
      infoQuery.$or = [{ relatedPersonId: { $in: allowedPersonIds } }];
      documentsQuery.$or = [
        { relatedPersonId: { $in: allowedPersonIds } },
        { assignedToPersonIds: { $in: allowedPersonIds } },
      ];
      legacyQuery.$or = [{ recipientPersonId: { $in: allowedPersonIds } }];
      instructionsQuery.$or = [
        { assignedPersonId: { $in: allowedPersonIds } },
        { backupPersonId: { $in: allowedPersonIds } },
      ];
      beneficiariesQuery._id = { $in: allowedPersonIds };
      personalInfoQuery.$or = [{ relatedPersonId: { $in: allowedPersonIds } }];
      assetQuery.$or = [{ relatedPersonId: { $in: allowedPersonIds } }];
      moneyAggMatch.$or = [{ personId: { $in: allowedPersonIds } }];
      overdueRecordsQuery.$or = [{ personId: { $in: allowedPersonIds } }];
      contactsQuery.$or = [{ relatedPersonId: { $in: allowedPersonIds } }];

      fsQuery.$or = [{ recipientPersonId: { $in: allowedPersonIds } }];
      if (_auth?.userId) fsQuery.$or.push({ createdBy: _auth.userId });
      if (_auth?.name) fsQuery.$or.push({ createdBy: _auth.name });
    } else {
      fsQuery.$or = [];
    }
    if (allowedBusinessIds.length > 0) {
      businessQuery._id = { $in: allowedBusinessIds };
      if (allowedPersonIds.length === 0) {
        contactsQuery.$or = [
          { relatedBusinessId: { $in: allowedBusinessIds } },
        ];
      } else {
        (contactsQuery.$or as any[]).push({
          relatedBusinessId: { $in: allowedBusinessIds },
        });
      }
      assetQuery.$or = assetQuery.$or
        ? [
            ...(assetQuery.$or as any[]),
            { relatedBusinessId: { $in: allowedBusinessIds } },
          ]
        : [{ relatedBusinessId: { $in: allowedBusinessIds } }];
      moneyAggMatch.$or = moneyAggMatch.$or
        ? [
            ...(moneyAggMatch.$or as any[]),
            { businessId: { $in: allowedBusinessIds } },
          ]
        : [{ businessId: { $in: allowedBusinessIds } }];
      overdueRecordsQuery.$or = overdueRecordsQuery.$or
        ? [
            ...(overdueRecordsQuery.$or as any[]),
            { businessId: { $in: allowedBusinessIds } },
          ]
        : [{ businessId: { $in: allowedBusinessIds } }];

      fsQuery.$or = fsQuery.$or
        ? [
            ...(fsQuery.$or as any[]),
            { relatedBusinessId: { $in: allowedBusinessIds } },
          ]
        : [{ relatedBusinessId: { $in: allowedBusinessIds } }];
    }

    if (allowedPersonIds.length === 0 && allowedBusinessIds.length === 0) {
      peopleQuery._id = { $in: [] };
      businessQuery._id = { $in: [] };
    }
  }

  const moneyAggPipeline: any[] = [];
  if (Object.keys(moneyAggMatch).length > 0) {
    moneyAggPipeline.push({ $match: moneyAggMatch });
  }
  moneyAggPipeline.push({
    $group: {
      _id: "$type",
      totalAmount: { $sum: "$amount" },
      remainingAmount: { $sum: "$remainingAmount" },
    },
  });

  const assetAggPipeline: any[] = [
    { $match: assetQuery },
    { $group: { _id: null, total: { $sum: "$value" } } },
  ];

  const [
    peopleCount,
    infoCount,
    businessCount,
    assetAgg,
    moneyAgg,
    recentActivities,
    emergencyState,
  ] = await Promise.all([
    LifePerson.countDocuments(peopleQuery),
    LifeInformation.countDocuments(infoQuery),
    LifeBusiness.countDocuments(businessQuery),
    LifeAsset.aggregate(assetAggPipeline),
    LifeMoneyRecord.aggregate(moneyAggPipeline),
    LifeActivityLog.find().sort({ createdAt: -1 }).limit(6).lean(),
    LifeEmergencyAccess.findOne().lean() as Promise<ILifeEmergencyAccess | null>,
  ]);

  // §24 Extended Dashboard Indicators
  const [
    activeGuardiansCount,
    pendingRequestsCount,
    pendingRespCount,
    financialSupports,
    recentBackupLog,
    settingsDoc,
    contactsCount,
    documentsCount,
    legacyCount,
    instructionsCount,
    beneficiariesCount,
    personalInfoCount,
    gesnReportRes,
  ] = await Promise.all([
    connectToDatabase().then(() =>
      import("@/lib/database/models/lifeGuardian.model").then((m) =>
        m.default.countDocuments({ isActive: true }),
      ),
    ),
    connectToDatabase().then(() =>
      import("@/lib/database/models/lifeEmergencyRequest.model").then((m) =>
        m.default.countDocuments({ status: "pending_approval" }),
      ),
    ),
    connectToDatabase().then(() =>
      import("@/lib/database/models/lifeResponsibility.model").then((m) =>
        m.default.countDocuments({
          completionStatus: { $in: ["not_started", "in_progress", "waiting"] },
        }),
      ),
    ),
    connectToDatabase().then(() =>
      import("@/lib/database/models/lifeFinancialSupport.model").then((m) =>
        Object.keys(fsQuery).length > 0 && (fsQuery.$or as any[])?.length === 0
          ? Promise.resolve([])
          : m.default.find(fsQuery).lean(),
      ),
    ),
    LifeActivityLog.findOne({ action: { $regex: /backup/i } })
      .sort({ createdAt: -1 })
      .lean(),
    LifeSettings.findOne().select("vaultPinHash").lean() as Promise<{
      vaultPinHash?: string;
    } | null>,
    LifeContact.countDocuments(contactsQuery),
    LifeDocument.countDocuments(documentsQuery),
    LifeLegacyMessage.countDocuments(legacyQuery),
    LifeInstruction.countDocuments(instructionsQuery),
    LifePerson.countDocuments(beneficiariesQuery),
    LifeInformation.countDocuments(personalInfoQuery),
    isPrivileged
      ? getGesnReports({ period: "thisMonth" }).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Multi-currency calculation (§17, §24)
  const currencyTotals: Record<
    string,
    { given: number; repaid: number; remaining: number }
  > = {};
  let upcomingPaymentsCount = 0;
  let overduePaymentsCount = 0;
  let supportGivenTotal = 0;
  let supportRepaidTotal = 0;
  let supportRemainingTotal = 0;

  (financialSupports || []).forEach((fs: any) => {
    const cur = (fs.currency || "BDT").toUpperCase();
    if (!currencyTotals[cur]) {
      currencyTotals[cur] = { given: 0, repaid: 0, remaining: 0 };
    }
    const amount = Number(fs.totalAmount) || 0;
    const repaid = Number(fs.totalRepaid) || 0;
    const remaining = Number(fs.remainingBalance) || 0;

    currencyTotals[cur].given += amount;
    currencyTotals[cur].repaid += repaid;
    currencyTotals[cur].remaining += remaining;

    supportGivenTotal += amount;
    supportRepaidTotal += repaid;
    supportRemainingTotal += remaining;

    if (fs.status === "overdue") overduePaymentsCount++;
    if (remaining > 0 && fs.status !== "overdue") upcomingPaymentsCount++;
  });

  const moneyMap: Record<string, { total: number; remaining: number }> = {};
  moneyAgg.forEach((item) => {
    moneyMap[item._id] = {
      total: item.totalAmount || 0,
      remaining: item.remainingAmount || 0,
    };
  });

  // Combine financial supports with legacy money records
  const moneyGivenTotal = (moneyMap["given"]?.total || 0) + supportGivenTotal;
  const moneyGivenRemaining =
    (moneyMap["given"]?.remaining || 0) + supportRemainingTotal;
  const moneyTakenTotal = moneyMap["taken"]?.total || 0;
  const moneyTakenRemaining = moneyMap["taken"]?.remaining || 0;
  const investedTotal = moneyMap["invest_made"]?.total || 0;
  const investmentReceivedTotal = moneyMap["invest_received"]?.total || 0;

  // Receivables = remaining from money given / support + expected investment return
  const receivablesTotal = moneyGivenRemaining;
  // Payables = remaining from money taken
  const payablesTotal = moneyTakenRemaining;

  // Parse ACC.GESN.NET real-time reports data
  const gesnSummary =
    gesnReportRes?.success && gesnReportRes.data
      ? {
          totalIncome: gesnReportRes.data.summary.totalIncome || 0,
          totalExpenses: gesnReportRes.data.summary.totalExpenses || 0,
          netProfit: gesnReportRes.data.summary.netProfit || 0,
          profitMarginPercent:
            gesnReportRes.data.summary.profitMarginPercent || 0,
          incomeCount: gesnReportRes.data.summary.incomeCount || 0,
          expenseCount: gesnReportRes.data.summary.expenseCount || 0,
          topCategories: (gesnReportRes.data.categories || [])
            .filter((c: any) => (c.total || 0) > 0)
            .sort((a: any, b: any) => (b.total || 0) - (a.total || 0))
            .slice(0, 6)
            .map((c: any) => ({
              name: c.category?.name || "Uncategorized",
              type: c.category?.type || "Expense",
              total: c.total || 0,
              count: c.count || 0,
              color:
                c.category?.color ||
                (c.category?.type === "Income" ? "#10b981" : "#ef4444"),
            })),
        }
      : null;

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
      link: "/guardians",
    });
  }

  // Overdue money records
  const overdueRecords = await LifeMoneyRecord.find(overdueRecordsQuery)
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
      link: "/finance",
    });
  });

  // Critical continuity steps not yet completed
  const businesses = await LifeBusiness.find(businessQuery)
    .select("name continuitySteps")
    .lean();

  businesses.forEach((b) => {
    const pendingSteps = (
      (b.continuitySteps || []) as Array<{
        isCompleted?: boolean;
        title?: string;
      }>
    ).filter((s) => !s.isCompleted);
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

  // Calculate actual readiness based on real configuration (§1, §24)
  // 1. Guardian consensus: at least 2 guardians = 25 pts, 1 guardian = 12 pts
  let continuityScore = 0;
  if (activeGuardiansCount >= 2) continuityScore += 25;
  else if (activeGuardiansCount === 1) continuityScore += 12;

  // 2. Emergency delegate configured = 25 pts
  if (
    emergencyState?.primaryAdminEmail &&
    emergencyState.primaryAdminEmail.trim().length > 0
  ) {
    continuityScore += 25;
  }

  // 3. Master PIN configured = 25 pts
  if (settingsDoc?.vaultPinHash && settingsDoc.vaultPinHash.trim().length > 0) {
    continuityScore += 25;
  }

  // 4. Business continuity checklist completion = 25 pts
  let totalSteps = 0;
  let completedSteps = 0;
  businesses.forEach((b) => {
    const steps = (b.continuitySteps || []) as Array<{ isCompleted?: boolean }>;
    totalSteps += steps.length;
    completedSteps += steps.filter((s) => s.isCompleted).length;
  });
  if (totalSteps > 0) {
    continuityScore += Math.round((completedSteps / totalSteps) * 25);
  } else if (businesses.length === 0) {
    continuityScore += 25;
  }

  // Resolve Owner Profile
  let ownerPerson: any = null;
  if (_auth?.personId) {
    ownerPerson = await LifePerson.findById(_auth.personId).lean();
  }
  if (!ownerPerson && _auth?.email) {
    ownerPerson = await LifePerson.findOne({
      $or: [
        { email: new RegExp(`^${_auth.email.trim()}$`, "i") },
        { role: { $in: ["owner", "super_admin"] } },
      ],
      status: { $ne: "archived" },
    }).lean();
  }

  // Profile completion score
  let completionScore = 20;
  if (ownerPerson?.phone) completionScore += 15;
  if (personalInfoCount > 0) completionScore += 20;
  if (documentsCount > 0) completionScore += 15;
  if (activeGuardiansCount > 0 || contactsCount > 0) completionScore += 15;
  if (settingsDoc?.vaultPinHash) completionScore += 15;
  completionScore = Math.min(100, completionScore);

  const medicalStatus =
    personalInfoCount > 0 ? "Recorded & Active" : "Pending Records";
  const emergencyInfoStatus = emergencyState?.isEmergencyActive
    ? "Emergency Active"
    : activeGuardiansCount > 0
      ? `${activeGuardiansCount} Guardians Ready`
      : "Protocols Configured";

  const ownerProfile = {
    name: ownerPerson?.name || _auth?.name || "Nazmul Islam",
    email: ownerPerson?.email || _auth?.email || "",
    phone: ownerPerson?.phone || "",
    avatarUrl:
      ownerPerson?.profilePhoto ||
      ownerPerson?.avatarUrl ||
      _auth?.avatarUrl ||
      "",
    role: ownerPerson?.role || _auth?.role || "super_admin",
    personId: ownerPerson?._id
      ? String(ownerPerson._id)
      : _auth?.personId || undefined,
    profileCompletion: completionScore,
    medicalInfoStatus: medicalStatus,
    documentsAddedCount: documentsCount,
    privateRecordsCount: infoCount,
    emergencyInfoStatus,
    lastUpdated: ownerPerson?.updatedAt || new Date(),
  };

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
    ownerSafetyStatus:
      (emergencyState as any)?.ownerSafetyStatus ||
      (emergencyState?.isEmergencyActive ? "emergency" : "safe"),
    emergencyModeStatus: emergencyState?.isEmergencyActive
      ? "Active"
      : "Normal",
    recoveryState: (emergencyState?.recoveryState as any) || "NORMAL",
    isVaultLocked: Boolean(emergencyState?.isVaultLocked),
    activeRecoveryPending:
      emergencyState?.recoveryState === "EMERGENCY_PENDING" ||
      emergencyState?.vaultRecoveryState === "VAULT_LOCKED_PENDING",
    trustedGuardiansCount: activeGuardiansCount,
    pendingAccessRequestsCount: pendingRequestsCount,
    pendingResponsibilitiesCount: pendingRespCount,
    businessContinuityReadiness: continuityScore,
    upcomingPaymentsCount,
    overduePaymentsCount,
    currencyTotals,
    supportRepaidTotal,
    gesnSummary,
    lastBackupDate: (recentBackupLog as any)?.createdAt || new Date(),
    contactsCount,
    documentsCount,
    legacyCount,
    instructionsCount,
    beneficiariesCount,
    ownerProfile,
  };
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  url: string;
}

export async function searchLifeGlobally(
  query: string,
): Promise<GlobalSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const regex = new RegExp(query.trim(), "i");
  const results: GlobalSearchResult[] = [];
  const isPrivileged = auth.isOwner || auth.isAdmin;

  const allowedPersonIds: string[] = [];
  if (auth.personId) allowedPersonIds.push(String(auth.personId));
  if (auth.permissions?.allowedPersonIds?.length) {
    allowedPersonIds.push(...auth.permissions.allowedPersonIds.map(String));
  }

  const businessOr: any[] = [];
  if (auth.personId) {
    businessOr.push({ "partners.personId": auth.personId });
    businessOr.push({ "engineerContact.personId": auth.personId });
  }
  if (auth.permissions?.allowedBusinessIds?.length) {
    businessOr.push({ _id: { $in: auth.permissions.allowedBusinessIds } });
  }

  let allowedBusinessIds: string[] = [];
  if (businessOr.length > 0) {
    try {
      const connected = await LifeBusiness.find({ $or: businessOr })
        .select("_id")
        .lean();
      allowedBusinessIds = connected.map((b: any) => String(b._id));
    } catch (e) {
      console.error("Error querying connected businesses for search:", e);
    }
  }

  // Search People
  const peopleBaseQuery: Record<string, any> = {
    $or: [
      { name: regex },
      { relation: regex },
      { phone: regex },
      { email: regex },
    ],
    status: { $ne: "archived" },
  };
  if (!isPrivileged && allowedPersonIds.length > 0) {
    peopleBaseQuery._id = { $in: allowedPersonIds };
  } else if (!isPrivileged) {
    peopleBaseQuery._id = { $in: [] };
  }
  const people = await LifePerson.find(peopleBaseQuery).limit(4).lean();

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
  let infoBaseQuery: Record<string, any> = {
    visibility: { $ne: "hidden" },
  };
  const infoTextMatch = {
    $or: [{ title: regex }, { summary: regex }, { tags: regex }],
  };
  if (!isPrivileged) {
    const infoAccessOr: any[] = [];
    if (allowedPersonIds.length > 0)
      infoAccessOr.push({ relatedPersonId: { $in: allowedPersonIds } });
    if (infoAccessOr.length === 0) {
      infoBaseQuery._id = { $in: [] };
    } else {
      infoBaseQuery.$and = [infoTextMatch, { $or: infoAccessOr }];
    }
  } else {
    infoBaseQuery = { ...infoBaseQuery, ...infoTextMatch };
  }
  const info = await LifeInformation.find(infoBaseQuery).limit(4).lean();

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
  const businessBaseQuery: Record<string, any> = {
    $or: [{ name: regex }, { legalName: regex }],
  };
  if (!isPrivileged && allowedBusinessIds.length > 0) {
    businessBaseQuery._id = { $in: allowedBusinessIds };
  } else if (!isPrivileged) {
    businessBaseQuery._id = { $in: [] };
  }
  const businesses = await LifeBusiness.find(businessBaseQuery).limit(3).lean();

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
    let moneyBaseQuery: Record<string, any> = {};
    const moneyTextMatch = {
      $or: [{ personName: regex }, { purpose: regex }, { organization: regex }],
    };
    if (!isPrivileged) {
      const moneyOr: any[] = [];
      if (allowedPersonIds.length > 0)
        moneyOr.push({ personId: { $in: allowedPersonIds } });
      if (allowedBusinessIds.length > 0)
        moneyOr.push({ businessId: { $in: allowedBusinessIds } });
      if (moneyOr.length === 0) {
        moneyBaseQuery._id = { $in: [] };
      } else {
        moneyBaseQuery.$and = [moneyTextMatch, { $or: moneyOr }];
      }
    } else {
      moneyBaseQuery = moneyTextMatch;
    }
    const money = await LifeMoneyRecord.find(moneyBaseQuery).limit(4).lean();

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
  let contactsBaseQuery: Record<string, any> = {};
  const contactsTextMatch = {
    $or: [{ name: regex }, { phone: regex }, { company: regex }],
  };
  if (!isPrivileged) {
    const contactsOr: any[] = [];
    if (allowedPersonIds.length > 0)
      contactsOr.push({ relatedPersonId: { $in: allowedPersonIds } });
    if (allowedBusinessIds.length > 0)
      contactsOr.push({ relatedBusinessId: { $in: allowedBusinessIds } });
    if (contactsOr.length === 0) {
      contactsBaseQuery._id = { $in: [] };
    } else {
      contactsBaseQuery.$and = [contactsTextMatch, { $or: contactsOr }];
    }
  } else {
    contactsBaseQuery = contactsTextMatch;
  }
  const contacts = await LifeContact.find(contactsBaseQuery).limit(4).lean();

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
