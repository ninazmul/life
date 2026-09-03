"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeSettlement from "@/lib/database/models/lifeSettlement.model";
import LifeTransaction from "@/lib/database/models/lifeTransaction.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import {
  LifeMoneyType,
  LifeMoneyStatus,
  ILifeMoneyRecord,
  ILifeTransaction,
  ILifePerson,
} from "@/types";

export async function getMoneyOverview() {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return null;

  if (!auth.isOwner && !auth.isAdmin && !auth.permissions.canViewFinancial) {
    return null;
  }

  const [aggregations, recentTransactions, activeLoansCount] = await Promise.all([
    LifeMoneyRecord.aggregate([
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          paidAmount: { $sum: "$paidAmount" },
          remainingAmount: { $sum: "$remainingAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
    LifeTransaction.find()
      .populate("personId", "name relation")
      .populate("businessId", "name")
      .sort({ date: -1, createdAt: -1 })
      .limit(8)
      .lean(),
    LifeMoneyRecord.countDocuments({
      status: { $in: ["active", "partially_returned", "overdue"] },
    }),
  ]);

  const stats: Record<string, { total: number; paid: number; remaining: number; count: number }> = {
    given: { total: 0, paid: 0, remaining: 0, count: 0 },
    taken: { total: 0, paid: 0, remaining: 0, count: 0 },
    invest_made: { total: 0, paid: 0, remaining: 0, count: 0 },
    invest_received: { total: 0, paid: 0, remaining: 0, count: 0 },
  };

  aggregations.forEach((item) => {
    if (stats[item._id]) {
      stats[item._id] = {
        total: item.totalAmount || 0,
        paid: item.paidAmount || 0,
        remaining: item.remainingAmount || 0,
        count: item.count || 0,
      };
    }
  });

  return {
    given: stats.given,
    taken: stats.taken,
    investMade: stats.invest_made,
    investReceived: stats.invest_received,
    receivables: stats.given.remaining,
    payables: stats.taken.remaining,
    activeLoansCount,
    recentTransactions: JSON.parse(JSON.stringify(recentTransactions)),
  };
}

export async function getMoneyRecords(params?: {
  type?: LifeMoneyType;
  status?: LifeMoneyStatus;
  personId?: string;
  businessId?: string;
}): Promise<ILifeMoneyRecord[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};

  if (params?.type) query.type = params.type;
  if (params?.status) query.status = params.status;
  if (params?.personId) query.personId = params.personId;
  if (params?.businessId) query.businessId = params.businessId;

  // Non-owner individual access check
  if (!auth.isOwner && !auth.isAdmin) {
    if (!auth.permissions.canViewFinancial) {
      if (auth.personId) {
        query.personId = auth.personId;
      } else {
        return [];
      }
    }
  }

  const records = await LifeMoneyRecord.find(query)
    .populate("personId", "name relation phone")
    .populate("businessId", "name")
    .sort({ date: -1 })
    .lean();

  // Populate settlements for each record
  const recordIds = records.map((r) => r._id);
  const settlements = await LifeSettlement.find({ moneyRecordId: { $in: recordIds } })
    .sort({ date: -1 })
    .lean();

  const recordSettlementMap = new Map<string, Record<string, unknown>[]>();
  settlements.forEach((s) => {
    const key = String(s.moneyRecordId);
    if (!recordSettlementMap.has(key)) recordSettlementMap.set(key, []);
    recordSettlementMap.get(key)!.push(s);
  });

  const recordsWithSettlements = records.map((r) => ({
    ...r,
    settlements: recordSettlementMap.get(String(r._id)) || [],
  }));

  return JSON.parse(JSON.stringify(recordsWithSettlements));
}

export async function createMoneyRecord(data: {
  type: LifeMoneyType;
  personId?: string;
  personName?: string;
  organization?: string;
  businessId?: string;
  amount: number;
  currency?: string;
  date?: string;
  purpose?: string;
  expectedReturnDate?: string;
  interestRate?: string;
  profitShare?: string;
  ownershipPercentage?: number;
  notes?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can record financial loans or investments.");
  }

  let finalPersonName = data.personName || "";
  const cleanPersonId = data.personId && data.personId !== "none" ? data.personId : undefined;

  if (cleanPersonId) {
    const p = (await LifePerson.findById(cleanPersonId).lean()) as (ILifePerson & { _id: unknown }) | null;
    if (p) finalPersonName = p.name;
  }

  const amount = Number(data.amount) || 0;
  const recordDate = data.date ? new Date(data.date) : new Date();

  const record = await LifeMoneyRecord.create({
    type: data.type,
    personId: cleanPersonId,
    personName: finalPersonName,
    organization: data.organization || "",
    businessId: data.businessId && data.businessId !== "none" ? data.businessId : undefined,
    amount,
    currency: data.currency || "BDT",
    date: recordDate,
    purpose: data.purpose || "",
    expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : undefined,
    interestRate: data.interestRate || "",
    profitShare: data.profitShare || "",
    ownershipPercentage: Number(data.ownershipPercentage) || 0,
    paidAmount: 0,
    remainingAmount: amount,
    status: "active",
    notes: data.notes || "",
  });

  // Map to ledger transaction
  let txType: string = "loan_given";
  if (data.type === "taken") txType = "loan_received";
  else if (data.type === "invest_made") txType = "invest_made";
  else if (data.type === "invest_received") txType = "invest_received";

  await LifeTransaction.create({
    amount,
    type: txType,
    date: recordDate,
    personId: cleanPersonId,
    personName: finalPersonName,
    businessId: data.businessId && data.businessId !== "none" ? data.businessId : undefined,
    category: data.type === "given" || data.type === "taken" ? "Loan" : "Investment",
    paymentMethod: "Bank Transfer",
    notes: data.purpose || `Initial ${data.type.replace("_", " ")} record`,
    relatedRecordId: String(record._id),
    relatedRecordType: "LifeMoneyRecord",
  });

  await logLifeActivity({
    action: "CREATE_MONEY_RECORD",
    resourceType: "money",
    resourceId: String(record._id),
    resourceName: `${data.type.toUpperCase()}: ৳${amount.toLocaleString()}`,
    details: `Recorded ${data.type.replace("_", " ")} of ৳${amount.toLocaleString()} for ${
      finalPersonName || data.organization || "counterparty"
    }`,
  });

  revalidatePath("/money");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(record));
}

export async function recordSettlement(data: {
  moneyRecordId: string;
  amount: number;
  date?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  receiptUrl?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can record settlements.");
  }

  const moneyRecord = await LifeMoneyRecord.findById(data.moneyRecordId);
  if (!moneyRecord) throw new Error("Money record not found.");

  const settlementAmount = Number(data.amount) || 0;
  if (settlementAmount <= 0) {
    throw new Error("Settlement amount must be greater than zero.");
  }

  const settlementDate = data.date ? new Date(data.date) : new Date();

  // Create settlement record
  const settlement = await LifeSettlement.create({
    moneyRecordId: moneyRecord._id,
    amount: settlementAmount,
    date: settlementDate,
    paymentMethod: data.paymentMethod || "bank_transfer",
    reference: data.reference || "",
    notes: data.notes || "",
    receiptUrl: data.receiptUrl || "",
  });

  // Calculate new balances
  const newPaidAmount = (moneyRecord.paidAmount || 0) + settlementAmount;
  const newRemainingAmount = Math.max(0, moneyRecord.amount - newPaidAmount);

  moneyRecord.paidAmount = newPaidAmount;
  moneyRecord.remainingAmount = newRemainingAmount;

  if (newRemainingAmount === 0) {
    moneyRecord.status = "fully_returned";
  } else {
    moneyRecord.status = "partially_returned";
  }

  await moneyRecord.save();

  // Record in general ledger transactions
  const txType =
    moneyRecord.type === "given"
      ? "loan_repayment"
      : moneyRecord.type === "taken"
      ? "loan_repayment"
      : "invest_return";

  await LifeTransaction.create({
    amount: settlementAmount,
    type: txType,
    date: settlementDate,
    personId: moneyRecord.personId,
    personName: moneyRecord.personName,
    businessId: moneyRecord.businessId,
    category: "Settlement",
    paymentMethod: data.paymentMethod || "Cash",
    reference: data.reference || "",
    notes: data.notes || `Settlement repayment of ৳${settlementAmount.toLocaleString()}`,
    relatedRecordId: String(moneyRecord._id),
    relatedRecordType: "LifeSettlement",
  });

  await logLifeActivity({
    action: "RECORD_SETTLEMENT",
    resourceType: "money",
    resourceId: String(moneyRecord._id),
    resourceName: `Settlement: ৳${settlementAmount.toLocaleString()}`,
    details: `Recorded settlement repayment of ৳${settlementAmount.toLocaleString()} against ${
      moneyRecord.personName || "counterparty"
    } (Remaining: ৳${newRemainingAmount.toLocaleString()})`,
  });

  revalidatePath("/money");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(settlement));
}

export async function getTransactions(params?: {
  type?: string;
  limit?: number;
}): Promise<ILifeTransaction[]> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const query: Record<string, unknown> = {};
  if (params?.type && params.type !== "all") {
    query.type = params.type;
  }

  const transactions = await LifeTransaction.find(query)
    .populate("personId", "name relation")
    .populate("businessId", "name")
    .sort({ date: -1, createdAt: -1 })
    .limit(params?.limit || 50)
    .lean();

  return JSON.parse(JSON.stringify(transactions));
}
