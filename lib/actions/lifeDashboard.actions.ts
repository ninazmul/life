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
import {
  getFinancialSummaryForUser,
  buildNonAdminFinancialQuery,
} from "@/lib/actions/lifeFinancialSupport.actions";
import LifeRequest from "@/lib/database/models/lifeRequest.model";
import LifeNote from "@/lib/database/models/lifeNote.model";
import LifeNotification from "@/lib/database/models/lifeNotification.model";
import LifeConversation from "@/lib/database/models/lifeConversation.model";
import LifeResponsibility from "@/lib/database/models/lifeResponsibility.model";
import LifeEmergencyRequest from "@/lib/database/models/lifeEmergencyRequest.model";
import {
  LifeDashboardStats,
  ILifeEmergencyAccess,
  LifeDashboardUpdate,
  LifeFinancialBreakdowns,
} from "@/types";
import {
  enrichWithClerkAvatars,
  syncClerkUsersWithPeople,
  getClerkAvatar,
} from "@/lib/life/clerk-avatar";

import { getSupportRoleCounts } from "@/lib/actions/lifePeople.actions";
import { getPendingActionRequests } from "@/lib/actions/lifeRequest.actions";

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
    gesnLastMonthRes,
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
    connectToDatabase().then(async () => {
      const LifeFinancialSupport = (
        await import("@/lib/database/models/lifeFinancialSupport.model")
      ).default;
      if (!isPrivileged) {
        const nonAdminQuery = await buildNonAdminFinancialQuery(_auth);
        if (!nonAdminQuery) return [];
        return LifeFinancialSupport.find(nonAdminQuery).lean();
      }
      return Object.keys(fsQuery).length > 0 && (fsQuery.$or as any[])?.length === 0
        ? []
        : LifeFinancialSupport.find(fsQuery).lean();
    }),
    LifeActivityLog.findOne({ action: { $regex: /backup/i } })
      .sort({ createdAt: -1 })
      .lean(),
    LifeSettings.findOne().select("vaultPinHash currencySymbol").lean() as Promise<{
      vaultPinHash?: string;
      currencySymbol?: string;
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
    isPrivileged
      ? getGesnReports({ period: "lastMonth" }).catch(() => null)
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

  const ownerAvatar =
    _auth?.avatarUrl ||
    (await getClerkAvatar({
      email: ownerPerson?.email || _auth?.email,
      clerkUserId: _auth?.userId,
    })) ||
    ownerPerson?.avatarUrl ||
    ownerPerson?.profilePhoto ||
    "";

  const ownerProfile = {
    name: ownerPerson?.name || _auth?.name || "Nazmul Islam",
    email: ownerPerson?.email || _auth?.email || "",
    phone: ownerPerson?.phone || "",
    avatarUrl: ownerAvatar,
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

  // Personal financial support & commitment summary for non-admins
  const personalFinancialSummary = !isPrivileged
    ? await getFinancialSummaryForUser().catch(() => null)
    : null;

  // ── Dashboard badge counts for the 4 quick-action icons ──
  let dashboardBadges: LifeDashboardStats["dashboardBadges"] = null;
  try {
    if (_auth) {
      const userEmail = _auth.email.toLowerCase().trim();
      if (isPrivileged) {
        // Admin: new requests, threads with unread messages, unread notifications
        const [reqCount, reqMsgCount, convMsgDocs] = await Promise.all([
          LifeRequest.countDocuments({ isNewForAdmin: true }),
          LifeRequest.countDocuments({ unreadByAdmin: { $gt: 0 } }),
          LifeConversation.aggregate([
            { $group: { _id: null, total: { $sum: "$unreadByAdmin" } } },
          ]),
        ]);
        const convMsgCount = convMsgDocs[0]?.total || 0;
        dashboardBadges = {
          requestsCount: reqCount,
          messagesCount: reqMsgCount + convMsgCount,
          notesCount: 0,
          financialCount: 0,
        };
      } else {
        // Non-admin: their own pending requests, unread messages from admin,
        // unread notifications of type note_released/note_shared
        const notifQuery = {
          $or: [
            { recipientEmail: userEmail },
            ...((_auth as any).personId ? [{ recipientPersonId: (_auth as any).personId }] : []),
          ],
          isRead: false,
        };
        const [reqCount, reqMsgCount, userConv, noteNotifCount, financialNotifCount] = await Promise.all([
          LifeRequest.countDocuments({
            submittedByEmail: userEmail,
            status: { $in: ["pending", "in_review"] },
          }),
          LifeRequest.countDocuments({
            submittedByEmail: userEmail,
            unreadByUser: { $gt: 0 },
          }),
          LifeConversation.findOne({ userEmail: userEmail }).select("unreadByUser").lean(),
          LifeNotification.countDocuments({
            ...notifQuery,
            type: { $in: ["note_shared", "note_released", "scheduled_release"] },
          }),
          LifeNotification.countDocuments({
            ...notifQuery,
            type: { $in: ["financial_update", "request_approved"] },
          }),
        ]);
        const convMsgCount = (userConv as any)?.unreadByUser || 0;
        dashboardBadges = {
          requestsCount: reqCount,
          messagesCount: reqMsgCount + convMsgCount,
          notesCount: noteNotifCount,
          financialCount: financialNotifCount,
        };
      }
    }
  } catch (e) {
    console.error("Error computing dashboardBadges:", e);
  }

  // ── Trusted People for dashboard horizontal row ──
  let trustedPeople: LifeDashboardStats["trustedPeople"] = [];
  try {
    if (isPrivileged) {
      await syncClerkUsersWithPeople().catch((e) =>
        console.error("Error syncing clerk users with people:", e)
      );

      const people = await LifePerson.find({
        status: { $in: ["active", "verified"] },
        isDeleted: { $ne: true },
        ...(_auth?.email
          ? { email: { $ne: _auth.email.toLowerCase().trim() } }
          : {}),
      })
        .select(
          "name email clerkUserId avatarUrl profilePhoto relation role emergencyPriority"
        )
        .sort({ emergencyPriority: 1, createdAt: 1 })
        .limit(20)
        .lean();

      const enriched = await enrichWithClerkAvatars(people);

      trustedPeople = enriched.map((p: any) => ({
        _id: String(p._id),
        name: p.name,
        avatarUrl: p.avatarUrl || p.profilePhoto || "",
        profilePhoto: p.profilePhoto || p.avatarUrl || "",
        relation: p.relation || "",
        role: p.role || "individual",
      }));
    }
  } catch (e) {
    console.error("Error fetching trustedPeople:", e);
  }

  // ── Setup Reminders for dashboard reminder banner ──
  const setupReminders: LifeDashboardStats["setupReminders"] = [];
  if (isPrivileged) {
    if (!settingsDoc?.vaultPinHash) {
      setupReminders.push({
        id: "setup-pin",
        title: "Set Master Security PIN",
        description: "Protect your vault with a Master PIN",
        link: "/settings",
        category: "Security",
      });
    }
    if (activeGuardiansCount === 0) {
      setupReminders.push({
        id: "setup-guardian",
        title: "Choose a guardian",
        description: "Complete your emergency setup",
        link: "/guardians",
        category: "Emergency",
      });
    }
    if (peopleCount === 0) {
      setupReminders.push({
        id: "setup-people",
        title: "Add trusted people",
        description: "Register your family & partners",
        link: "/people",
        category: "People",
      });
    }
    if (contactsCount === 0) {
      setupReminders.push({
        id: "setup-contacts",
        title: "Add emergency contacts",
        description: "Add doctors, lawyers & advisors",
        link: "/contacts",
        category: "Contacts",
      });
    }
    if (personalInfoCount === 0) {
      setupReminders.push({
        id: "setup-info",
        title: "Record personal information",
        description: "Medical, identity & legal records",
        link: "/information",
        category: "Information",
      });
    }
    if (documentsCount === 0) {
      setupReminders.push({
        id: "setup-docs",
        title: "Upload critical documents",
        description: "Deeds, wills & legal contracts",
        link: "/documents",
        category: "Documents",
      });
    }
  }

  const [{ pendingRequests, releasedUpdates }, supportRoleCounts] = await Promise.all([
    getPendingActionRequests().catch(() => ({ pendingRequests: [], releasedUpdates: [] })),
    getSupportRoleCounts().catch(() => ({
      guardian: activeGuardiansCount,
      trustedPeople: 0,
      advisors: 0,
      caregivers: 0,
      totalUniquePeople: peopleCount,
    })),
  ]);

  if (dashboardBadges) {
    dashboardBadges.requestsCount = pendingRequests.length;
  }

  // ── Live Life Command Center Overview Summary (Sections 5 & 6) ──
  const thisMonthIncome =
    gesnReportRes?.success && gesnReportRes.data
      ? Number(gesnReportRes.data.summary.totalIncome) || 0
      : 0;
  const lastMonthIncome =
    gesnLastMonthRes?.success && gesnLastMonthRes.data
      ? Number(gesnLastMonthRes.data.summary.totalIncome) || 0
      : 0;
  const bizGrowth =
    lastMonthIncome > 0
      ? Math.round(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
      : 0;

  // Property assets
  const propertyAssets = await LifeAsset.find({
    ...assetQuery,
    category: "property",
  }).lean();
  const totalProperties = propertyAssets.length;
  const rentalUnits = propertyAssets.reduce(
    (sum: number, a: any) => sum + (Number(a.rentalUnits) || 0),
    0
  );
  const monthlyRentalIncome = propertyAssets.reduce(
    (sum: number, a: any) => sum + (Number(a.monthlyRentalIncome) || 0),
    0
  );

  // Due this month loans
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const dueRecords = await LifeMoneyRecord.find({
    ...moneyAggMatch,
    remainingAmount: { $gt: 0 },
    status: { $in: ["active", "partially_returned", "overdue"] },
    expectedReturnDate: { $lte: endOfMonth },
  })
    .select("remainingAmount")
    .lean();
  const dueThisMonthAmount = dueRecords.reduce(
    (sum: number, r: any) => sum + (Number(r.remainingAmount) || 0),
    0
  );

  // ── Financial Overview Detailed Breakdowns (4 Cards) ──
  const allAssets = await LifeAsset.find(assetQuery).lean();
  const cashBankAssets = allAssets.filter((a: any) =>
    ["cash", "bank_balance"].includes(a.category)
  );
  const propertyAssetList = allAssets.filter((a: any) => a.category === "property");
  const bizAssets = allAssets.filter((a: any) => a.category === "business_investment");
  const otherAssetList = allAssets.filter((a: any) =>
    ["vehicle", "valuable", "equipment", "other"].includes(a.category)
  );

  const cashBankTotal = cashBankAssets.reduce(
    (sum: number, a: any) => sum + (Number(a.value) || 0),
    0
  );
  const propertyTotal = propertyAssetList.reduce(
    (sum: number, a: any) => sum + (Number(a.value) || 0),
    0
  );
  const loansReceivableTotal = receivablesTotal;
  const bizTotal = bizAssets.reduce(
    (sum: number, a: any) => sum + (Number(a.value) || 0),
    0
  );
  const otherTotal = otherAssetList.reduce(
    (sum: number, a: any) => sum + (Number(a.value) || 0),
    0
  );

  const calculatedTotalAssets =
    allAssets.length > 0 || receivablesTotal > 0
      ? cashBankTotal + propertyTotal + loansReceivableTotal + bizTotal + otherTotal
      : (assetAgg[0]?.total || 0);

  const totalAssetsVal = calculatedTotalAssets;
  const totalLiabilitiesVal = payablesTotal;
  const netWorthVal = totalAssetsVal - totalLiabilitiesVal;
  const totalMonthlyIncome = thisMonthIncome + monthlyRentalIncome;

  const safeDiv = (val: number, tot: number) =>
    tot > 0 ? Math.round((val / tot) * 100) : 0;

  const assetCategories = [
    {
      id: "cash_bank",
      label: "Cash & Bank",
      amount: cashBankTotal,
      percentage: safeDiv(cashBankTotal, totalAssetsVal),
      iconType: "wallet",
      color: "#10B981",
      link: "/workspace?section=core_vault&category=finance_loans",
    },
    {
      id: "land_property",
      label: "Land & Property",
      amount: propertyTotal,
      percentage: safeDiv(propertyTotal, totalAssetsVal),
      iconType: "house",
      color: "#0284C7",
      link: "/workspace?section=core_vault&category=assets_property",
    },
    {
      id: "loans_receivable",
      label: "Loans Receivable",
      amount: loansReceivableTotal,
      percentage: safeDiv(loansReceivableTotal, totalAssetsVal),
      iconType: "coins",
      color: "#F59E0B",
      link: "/workspace?section=core_vault&category=finance_loans&filter=loans_given",
    },
    {
      id: "business_investments",
      label: "Business & Investments",
      amount: bizTotal,
      percentage: safeDiv(bizTotal, totalAssetsVal),
      iconType: "briefcase",
      color: "#16A34A",
      link: "/workspace?section=my_spaces&category=business",
    },
    {
      id: "other_assets",
      label: "Other Assets",
      amount: otherTotal,
      percentage: safeDiv(otherTotal, totalAssetsVal),
      iconType: "gem",
      color: "#7C3AED",
      link: "/workspace?section=core_vault&category=assets_property",
    },
  ];

  const assetAccounts = allAssets.map((a: any) => ({
    name: a.name,
    type: a.category?.replace(/_/g, " "),
    balance: Number(a.value) || 0,
    institution: a.location || "Registered Asset",
  }));

  // Liabilities items
  const liabilityRecords = await LifeMoneyRecord.find({
    ...moneyAggMatch,
    type: "taken",
    remainingAmount: { $gt: 0 },
  })
    .sort({ expectedReturnDate: 1 })
    .lean();

  const liabilityItems = liabilityRecords.map((r: any) => ({
    id: String(r._id),
    title: r.purpose || "Loan / Payable Obligation",
    counterparty: r.personName || r.organization || "Lender",
    remainingAmount: r.remainingAmount,
    dueDate: r.expectedReturnDate
      ? new Date(r.expectedReturnDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : undefined,
    status: r.status,
  }));

  // Loans Given items
  const loansGivenRecords = await LifeMoneyRecord.find({
    ...moneyAggMatch,
    type: "given",
    remainingAmount: { $gt: 0 },
  })
    .sort({ expectedReturnDate: 1 })
    .lean();

  const loansGivenItems = loansGivenRecords.map((r: any) => ({
    id: String(r._id),
    borrowerName: r.personName || r.organization || "Borrower",
    originalAmount: r.amount,
    totalRepaid: r.paidAmount || r.amount - r.remainingAmount,
    forgivenAmount: (r as any).forgivenAmount || 0,
    remainingAmount: r.remainingAmount,
    status: r.status,
    dueDate: r.expectedReturnDate
      ? new Date(r.expectedReturnDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : undefined,
  }));

  const financialBreakdowns: LifeFinancialBreakdowns = {
    totalAssets: {
      total: totalAssetsVal,
      growthPercent: 12,
      categories: assetCategories,
      accounts: assetAccounts,
      history: [
        {
          date: "Oct 2026",
          title: "Valuation updated",
          change: "+12%",
          amount: totalAssetsVal,
        },
        {
          date: "Sep 2026",
          title: "Asset reconciliation",
          change: "+4%",
          amount: Math.round(totalAssetsVal * 0.88),
        },
      ],
    },
    totalLiabilities: {
      total: totalLiabilitiesVal,
      growthPercent: 5,
      categories: [
        {
          id: "loans_received",
          label: "Loans Received & Payables",
          amount: totalLiabilitiesVal,
          percentage: 100,
          iconType: "wallet",
          color: "#EF4444",
          link: "/workspace?section=core_vault&category=finance_loans&filter=loans_received",
        },
      ],
      items: liabilityItems,
    },
    netWorth: {
      total: netWorthVal,
      growthPercent: 15,
      totalAssets: totalAssetsVal,
      totalLiabilities: totalLiabilitiesVal,
    },
    loansGiven: {
      total: moneyGivenRemaining || loansGivenRecords.reduce((s: number, r: any) => s + (r.remainingAmount || 0), 0),
      activeCount: loansGivenItems.length,
      loans: loansGivenItems,
    },
  };

  // ── Life Updates & Direction Single Slider Items ──
  const sliderUpdates: LifeDashboardUpdate[] = [];

  // 1. Emergency Mode Check
  if (emergencyState?.isEmergencyActive) {
    sliderUpdates.push({
      id: "emergency-active-update",
      sourceModule: "emergency",
      priority: "critical",
      priorityBadge: "Urgent / Critical",
      badgeColor: "red",
      iconType: "shield_alert",
      title: "Emergency Mode is ACTIVE",
      shortDescription:
        "Emergency protocols are currently active. Review directives and guardian voting consensus immediately.",
      destinationUrl: "/access",
      actionButtonLabel: "Review Emergency",
      actionSubtext: "Go to Workspace",
      isActionRequired: true,
      status: "new",
    });
  }

  // 2. Pending Emergency Unlock Requests from Guardians
  try {
    const emergencyRequests = await LifeEmergencyRequest.find({
      status: "pending_approval",
    })
      .limit(3)
      .lean();

    emergencyRequests.forEach((er: any) => {
      sliderUpdates.push({
        id: `em-req-${er._id}`,
        sourceModule: "emergency_request",
        relatedRecordId: String(er._id),
        priority: "critical",
        priorityBadge: "Action Required",
        badgeColor: "red",
        iconType: "key",
        title: `Guardian Access Request: ${er.guardianName || "Guardian"}`,
        shortDescription:
          "A trusted guardian has requested emergency access. Multi-party consensus required.",
        destinationUrl: "/guardians",
        actionButtonLabel: "Review Request",
        actionSubtext: "Go to Workspace",
        isActionRequired: true,
        status: "new",
      });
    });
  } catch (e) {
    console.error("Error querying emergency requests for slider:", e);
  }

  // 3. Active Responsibilities (Insurance renewals, duties)
  try {
    const activeResponsibilities = await LifeResponsibility.find({
      completionStatus: { $in: ["not_started", "in_progress", "waiting"] },
    })
      .sort({ deadline: 1, createdAt: -1 })
      .limit(6)
      .lean();

    activeResponsibilities.forEach((resp: any) => {
      const isInsurance =
        resp.title?.toLowerCase().includes("insurance") ||
        resp.title?.toLowerCase().includes("renew") ||
        resp.detailedInstruction?.toLowerCase().includes("insurance");

      const formattedDeadline = resp.deadline
        ? new Date(resp.deadline).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : undefined;

      sliderUpdates.push({
        id: `resp-${resp._id}`,
        sourceModule: "responsibility",
        relatedRecordId: String(resp._id),
        priority: resp.priority === "critical" ? "critical" : "action_required",
        priorityBadge:
          resp.priority === "critical"
            ? "Urgent / Critical"
            : "Action Required",
        badgeColor: "red",
        iconType: isInsurance ? "insurance" : "shield_check",
        title: resp.title,
        shortDescription:
          resp.detailedInstruction ||
          (resp.deadline
            ? `Responsibility due by ${formattedDeadline}. Please complete or update status.`
            : "Action required on this responsibility."),
        deadline: formattedDeadline,
        destinationUrl: `/workspace?section=continuity&category=instructions&id=${resp._id}`,
        actionButtonLabel: isInsurance ? "Renew Insurance" : "Open Duty",
        actionSubtext: "Go to Workspace",
        isActionRequired: true,
        status: "new",
      });
    });
  } catch (e) {
    console.error("Error querying responsibilities for slider:", e);
  }

  // 4. Pending Inbound Access Requests
  pendingRequests.slice(0, 4).forEach((req: any) => {
    sliderUpdates.push({
      id: `req-${req._id}`,
      sourceModule: "request",
      relatedRecordId: String(req._id),
      priority: "pending_approval",
      priorityBadge: "Pending Approval",
      badgeColor: "amber",
      iconType: "document",
      title: `${req.submittedByName || "New"} access request`,
      shortDescription:
        req.description ||
        `Access request for ${req.title || "personal records"} is pending approval.`,
      destinationUrl: `/requests?id=${req._id}`,
      actionButtonLabel: "Review Request",
      actionSubtext: "Go to Workspace",
      isActionRequired: true,
      status: "new",
    });
  });

  // 5. Overdue / Due Loans
  overdueRecords.forEach((record: any) => {
    const isGiven = record.type === "given";
    sliderUpdates.push({
      id: `money-${record._id}`,
      sourceModule: "money",
      relatedRecordId: String(record._id),
      priority: isGiven ? "action_required" : "critical",
      priorityBadge: isGiven ? "Action Required" : "Urgent / Critical",
      badgeColor: isGiven ? "amber" : "red",
      iconType: "wallet",
      title: `${isGiven ? "Loan Repayment Pending" : "Repayment Due"}: ${
        record.personName || "Counterparty"
      }`,
      shortDescription: `Repayment of ৳${(
        record.remainingAmount || 0
      ).toLocaleString()} was expected on ${
        record.expectedReturnDate
          ? new Date(record.expectedReturnDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "schedule"
      }. Please follow up or update status.`,
      destinationUrl: `/workspace?section=core_vault&category=finance_loans&id=${record._id}`,
      actionButtonLabel: "View Loan",
      actionSubtext: "Go to Workspace",
      isActionRequired: true,
      status: "new",
    });
  });

  // 6. Released Life Notes requiring acknowledgement
  releasedUpdates.slice(0, 3).forEach((n: any) => {
    sliderUpdates.push({
      id: `note-${n._id}`,
      sourceModule: "note",
      relatedRecordId: String(n._id),
      priority: "important_info",
      priorityBadge: "Important Information",
      badgeColor: "sky",
      iconType: "bell",
      title: `Released Note: ${n.title}`,
      shortDescription:
        n.description || "Information has been released. Please review content.",
      destinationUrl: `/lifenote?id=${n._id}`,
      actionButtonLabel: "View Details",
      actionSubtext: "See information",
      isActionRequired: false,
      status: "new",
    });
  });

  // 7. General Setup Reminders if slider has fewer than 4 items
  if (sliderUpdates.length < 4) {
    if (activeGuardiansCount < 2) {
      sliderUpdates.push({
        id: "setup-guardian-slider",
        sourceModule: "system",
        priority: "general_update",
        priorityBadge: "Important Information",
        badgeColor: "purple",
        iconType: "shield_check",
        title: "Appoint Emergency Guardians",
        shortDescription:
          "Appoint 2 trusted guardians to protect your life continuity and multi-party emergency consensus.",
        destinationUrl: "/guardians",
        actionButtonLabel: "Appoint Guardian",
        actionSubtext: "Go to Workspace",
        isActionRequired: true,
        status: "new",
      });
    }
    if (!settingsDoc?.vaultPinHash) {
      sliderUpdates.push({
        id: "setup-pin-slider",
        sourceModule: "system",
        priority: "general_update",
        priorityBadge: "Action Required",
        badgeColor: "amber",
        iconType: "key",
        title: "Set Master Security PIN",
        shortDescription:
          "Your encrypted vault is currently unprotected. Configure an scrypt-hashed Master PIN today.",
        destinationUrl: "/settings",
        actionButtonLabel: "Set PIN",
        actionSubtext: "Go to Settings",
        isActionRequired: true,
        status: "new",
      });
    }
  }

  // Priority ordering: critical (1), action_required (2), pending_approval (3), important_info (4), general_update (5)
  const priorityWeights: Record<string, number> = {
    critical: 1,
    action_required: 2,
    pending_approval: 3,
    important_info: 4,
    general_update: 5,
  };
  sliderUpdates.sort(
    (a, b) =>
      (priorityWeights[a.priority] || 99) - (priorityWeights[b.priority] || 99)
  );

  const overviewSummary = {
    totalAssets: totalAssetsVal,
    totalLiabilities: totalLiabilitiesVal,
    netWorth: netWorthVal,
    monthlyIncome: totalMonthlyIncome,
    assetsGrowthPercent: 12,
    liabilitiesGrowthPercent: 5,
    netWorthGrowthPercent: 15,
    monthlyIncomeGrowthPercent: bizGrowth,
    loanOverview: {
      given: moneyGivenRemaining || moneyGivenTotal || 0,
      received: moneyTakenRemaining || moneyTakenTotal || 0,
      dueThisMonth: dueThisMonthAmount,
    },
    businessIncome: {
      thisMonth: thisMonthIncome,
      lastMonth: lastMonthIncome,
      growthPercent: bizGrowth,
    },
    property: {
      totalProperties,
      rentalUnits,
      monthlyRent: monthlyRentalIncome,
    },
    peopleAndResponsibilities: {
      totalPeople: peopleCount,
      activeTasks: pendingRespCount,
      pendingFromOthers: pendingRequests.length,
    },
  };

  return {
    peopleCount,
    infoCount,
    businessCount,
    assetsTotalValue: totalAssetsVal,
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
    personalFinancialSummary,
    dashboardBadges,
    trustedPeople,
    setupReminders,
    currencySymbol: settingsDoc?.currencySymbol || "৳",
    supportRoleCounts,
    pendingActionRequests: pendingRequests,
    releasedUpdates,
    overviewSummary,
    sliderUpdates: JSON.parse(JSON.stringify(sliderUpdates)),
    financialBreakdowns: JSON.parse(JSON.stringify(financialBreakdowns)),
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
