"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/database";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifeTransaction from "@/lib/database/models/lifeTransaction.model";
import LifeSettlement from "@/lib/database/models/lifeSettlement.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeRecordPermission from "@/lib/database/models/lifeRecordPermission.model";
import LifeShareHistory from "@/lib/database/models/lifeShareHistory.model";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";

export interface UnifiedFinancialItem {
  id: string;
  sourceModel: "money_record" | "transaction" | "financial_support";
  recordType:
    | "income"
    | "expense"
    | "loan_given"
    | "loan_received"
    | "loan_repayment"
    | "support"
    | "sis_care"
    | "transfer"
    | "bill_due";
  title: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
  personId?: string;
  personName?: string;
  category?: string;
  account?: string;
  reference?: string;
  notes?: string;
  dueDate?: string;
  paidAmount?: number;
  remainingAmount?: number;
  forgivenAmount?: number;
  isPrivate: boolean;
  sharedCount: number;
  createdAt: string;
  canEdit: boolean;
  canShare: boolean;
}

export interface UnifiedFinancialSummary {
  filter: string;
  card1: { label: string; value: number; count?: number };
  card2: { label: string; value: number; count?: number };
  card3?: { label: string; value: number; count?: number };
  card4?: { label: string; value: number; count?: number };
}

export interface UnifiedFinancialWorkspaceResponse {
  records: UnifiedFinancialItem[];
  summary: UnifiedFinancialSummary;
  totalCount: number;
  currencySymbol: string;
}

/**
 * Helper to check permissions for non-admin user
 */
async function getAccessibleRecordIds(
  personId: string | undefined,
  recordType: "money_record" | "transaction" | "financial_support"
): Promise<Set<string>> {
  if (!personId) return new Set();

  const permissions = await LifeRecordPermission.find({
    assignedPersonId: personId,
    recordType,
    canView: true,
  })
    .select("recordId")
    .lean();

  return new Set(permissions.map((p) => String(p.recordId)));
}

/**
 * Fetch unified financial workspace data with strict server-side ACL
 */
export async function getUnifiedFinancialWorkspaceData(params?: {
  filter?: string; // 'all' | 'income' | 'expenses' | 'loans' | 'support' | 'accounts' | 'bills_dues'
  subFilter?: string; // e.g. 'loans_given' | 'loans_received' | 'gifts' | 'sis_care'
  search?: string;
  personId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  privacy?: "all" | "private" | "shared";
}): Promise<UnifiedFinancialWorkspaceResponse> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) {
    return {
      records: [],
      summary: {
        filter: "all",
        card1: { label: "Monthly Income", value: 0 },
        card2: { label: "Monthly Expenses", value: 0 },
        card3: { label: "Loans Receivable", value: 0 },
        card4: { label: "Loans Payable", value: 0 },
      },
      totalCount: 0,
      currencySymbol: "৳",
    };
  }

  const isPrivileged = auth.isOwner || auth.isAdmin;
  const filter = params?.filter || "all";
  const subFilter = params?.subFilter;
  const search = params?.search?.trim().toLowerCase();
  const personId = params?.personId && params.personId !== "all" ? params.personId : undefined;
  const status = params?.status && params.status !== "all" ? params.status : undefined;
  const privacy = params?.privacy || "all";

  // Date filters
  const dateFrom = params?.dateFrom ? new Date(params.dateFrom) : undefined;
  const dateTo = params?.dateTo ? new Date(params.dateTo) : undefined;
  if (dateTo) dateTo.setHours(23, 59, 59, 999);

  // Fetch record permissions to determine explicit shares
  const allPermissions = await LifeRecordPermission.find({ canView: true }).lean();
  const permissionMap = new Map<string, string[]>();
  for (const perm of allPermissions) {
    const key = `${perm.recordType}_${perm.recordId}`;
    if (!permissionMap.has(key)) permissionMap.set(key, []);
    permissionMap.get(key)!.push(String(perm.assignedPersonId));
  }

  // Accessible set for non-owners
  const userPersonId = auth.personId ? String(auth.personId) : undefined;
  const accessibleMoneyIds = isPrivileged
    ? null
    : await getAccessibleRecordIds(userPersonId, "money_record");
  const accessibleTxIds = isPrivileged
    ? null
    : await getAccessibleRecordIds(userPersonId, "transaction");
  const accessibleSupportIds = isPrivileged
    ? null
    : await getAccessibleRecordIds(userPersonId, "financial_support");

  const items: UnifiedFinancialItem[] = [];

  // ─────────────────────────────────────────────────────────────
  // 1. Fetch Money Records (Loans Given / Loans Received)
  // ─────────────────────────────────────────────────────────────
  if (["all", "loans"].includes(filter)) {
    const moneyQuery: Record<string, any> = {};
    if (personId) moneyQuery.personId = personId;
    if (status) moneyQuery.status = status;
    if (dateFrom || dateTo) {
      moneyQuery.date = {};
      if (dateFrom) moneyQuery.date.$gte = dateFrom;
      if (dateTo) moneyQuery.date.$lte = dateTo;
    }

    if (subFilter === "loans_given") {
      moneyQuery.type = "given";
    } else if (subFilter === "loans_received") {
      moneyQuery.type = "taken";
    } else {
      moneyQuery.type = { $in: ["given", "taken"] };
    }

    const moneyRecords = await LifeMoneyRecord.find(moneyQuery)
      .populate("personId", "name phone relation")
      .sort({ date: -1 })
      .lean();

    for (const doc of moneyRecords) {
      const docId = String(doc._id);
      const permKey = `money_record_${docId}`;
      const sharedWith = permissionMap.get(permKey) || [];

      // Check ACL for non-owners
      if (!isPrivileged) {
        const isLinkedPerson = userPersonId && String(doc.personId?._id || doc.personId) === userPersonId;
        const isSharedWithUser = userPersonId && sharedWith.includes(userPersonId);
        if (!isSharedWithUser && (!accessibleMoneyIds || !accessibleMoneyIds.has(docId))) {
          // If not explicitly shared, non-owner cannot see it
          continue;
        }
      }

      const isPrivate = sharedWith.length === 0;
      if (privacy === "private" && !isPrivate) continue;
      if (privacy === "shared" && isPrivate) continue;

      const pName = (doc.personId as any)?.name || doc.personName || "Counterparty";
      const recType = doc.type === "given" ? "loan_given" : "loan_received";
      const title = doc.purpose || (doc.type === "given" ? `Loan Given to ${pName}` : `Loan Received from ${pName}`);

      items.push({
        id: docId,
        sourceModel: "money_record",
        recordType: recType,
        title,
        amount: Number(doc.amount) || 0,
        currency: doc.currency || "BDT",
        date: new Date(doc.date).toISOString(),
        status: doc.status || "active",
        personId: doc.personId ? String((doc.personId as any)._id || doc.personId) : undefined,
        personName: pName,
        category: "Loans",
        account: "Cash / Bank",
        reference: doc.interestRate ? `Rate: ${doc.interestRate}` : undefined,
        notes: doc.notes || "",
        dueDate: doc.expectedReturnDate ? new Date(doc.expectedReturnDate).toISOString() : undefined,
        paidAmount: Number(doc.paidAmount) || 0,
        remainingAmount: Number(doc.remainingAmount) || 0,
        isPrivate,
        sharedCount: sharedWith.length,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        canEdit: isPrivileged,
        canShare: isPrivileged,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Fetch General Ledger Transactions (Income, Expenses, Repayments, Transfers, Dues)
  // ─────────────────────────────────────────────────────────────
  const transactionTypesToFetch: string[] = [];
  if (filter === "all") {
    transactionTypesToFetch.push("income", "expense", "loan_repayment", "other");
  } else if (filter === "income") {
    transactionTypesToFetch.push("income");
  } else if (filter === "expenses") {
    transactionTypesToFetch.push("expense");
  } else if (filter === "loans") {
    transactionTypesToFetch.push("loan_repayment");
  } else if (filter === "accounts") {
    transactionTypesToFetch.push("other", "money_in", "money_out");
  } else if (filter === "bills_dues") {
    transactionTypesToFetch.push("expense", "other");
  }

  if (transactionTypesToFetch.length > 0) {
    const txQuery: Record<string, any> = {
      type: { $in: transactionTypesToFetch },
    };
    if (personId) txQuery.personId = personId;
    if (dateFrom || dateTo) {
      txQuery.date = {};
      if (dateFrom) txQuery.date.$gte = dateFrom;
      if (dateTo) txQuery.date.$lte = dateTo;
    }

    const transactions = await LifeTransaction.find(txQuery)
      .populate("personId", "name phone relation")
      .sort({ date: -1 })
      .lean();

    for (const tx of transactions) {
      const txId = String(tx._id);
      const permKey = `transaction_${txId}`;
      const sharedWith = permissionMap.get(permKey) || [];

      if (!isPrivileged) {
        const isSharedWithUser = userPersonId && sharedWith.includes(userPersonId);
        if (!isSharedWithUser && (!accessibleTxIds || !accessibleTxIds.has(txId))) {
          continue;
        }
      }

      const isPrivate = sharedWith.length === 0;
      if (privacy === "private" && !isPrivate) continue;
      if (privacy === "shared" && isPrivate) continue;

      let recType: UnifiedFinancialItem["recordType"] = "expense";
      if (tx.type === "income") recType = "income";
      else if (tx.type === "loan_repayment") recType = "loan_repayment";
      else if (tx.category === "Transfer" || tx.type === "money_in" || tx.type === "money_out") recType = "transfer";
      else if (tx.category === "Bills & Dues") recType = "bill_due";

      const pName = (tx.personId as any)?.name || tx.personName || "";
      const title = tx.notes || `${tx.category || "Financial Transaction"} (${pName || "General"})`;

      items.push({
        id: txId,
        sourceModel: "transaction",
        recordType: recType,
        title,
        amount: Number(tx.amount) || 0,
        currency: "BDT",
        date: new Date(tx.date).toISOString(),
        status: "completed",
        personId: tx.personId ? String((tx.personId as any)._id || tx.personId) : undefined,
        personName: pName || undefined,
        category: tx.category || "General",
        account: tx.paymentMethod || "Bank / Cash",
        reference: tx.reference || undefined,
        notes: tx.notes || "",
        isPrivate,
        sharedCount: sharedWith.length,
        createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
        canEdit: isPrivileged,
        canShare: isPrivileged,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Fetch Financial Support & SiS Care (Gifts & Family Allowances)
  // ─────────────────────────────────────────────────────────────
  if (["all", "support"].includes(filter)) {
    const supportQuery: Record<string, any> = {};
    if (personId) supportQuery.recipientPersonId = personId;
    if (status) supportQuery.status = status;
    if (dateFrom || dateTo) {
      supportQuery.givenDate = {};
      if (dateFrom) supportQuery.givenDate.$gte = dateFrom;
      if (dateTo) supportQuery.givenDate.$lte = dateTo;
    }

    if (subFilter === "gifts") {
      supportQuery.supportType = { $in: ["gift", "conditional_gift"] };
    } else if (subFilter === "sis_care") {
      supportQuery.supportType = {
        $in: ["family_support", "emergency_support", "medical_support", "repayable_support"],
      };
    }

    const supports = await LifeFinancialSupport.find(supportQuery)
      .populate("recipientPersonId", "name phone relation")
      .sort({ givenDate: -1 })
      .lean();

    for (const sup of supports) {
      const supId = String(sup._id);
      const permKey = `financial_support_${supId}`;
      const sharedWith = permissionMap.get(permKey) || [];

      if (!isPrivileged) {
        const isRecipient = userPersonId && String((sup.recipientPersonId as any)?._id || sup.recipientPersonId) === userPersonId;
        const isSharedWithUser = userPersonId && sharedWith.includes(userPersonId);
        if (!isRecipient && !isSharedWithUser && (!accessibleSupportIds || !accessibleSupportIds.has(supId))) {
          continue;
        }
      }

      const isPrivate = sharedWith.length === 0;
      if (privacy === "private" && !isPrivate) continue;
      if (privacy === "shared" && isPrivate) continue;

      const pName = (sup.recipientPersonId as any)?.name || "Recipient";
      const isSisCare = ["family_support", "emergency_support", "medical_support"].includes(sup.supportType);
      const recType = isSisCare ? "sis_care" : "support";

      // Calculate any principal gift conversions
      const forgivenSum = (sup.giftConversions || []).reduce(
        (sum: number, conv: any) => sum + (Number(conv.amount) || 0),
        0
      );

      items.push({
        id: supId,
        sourceModel: "financial_support",
        recordType: recType,
        title: sup.title || `Support for ${pName}`,
        amount: Number(sup.totalAmount) || 0,
        currency: sup.currency || "BDT",
        date: new Date(sup.givenDate).toISOString(),
        status: sup.status || "active",
        personId: sup.recipientPersonId ? String((sup.recipientPersonId as any)._id || sup.recipientPersonId) : undefined,
        personName: pName,
        category: sup.supportType.replace("_", " "),
        account: sup.paymentMethod || "Bank Transfer",
        reference: sup.transactionReference || undefined,
        notes: sup.purpose || sup.recipientVisibleNote || "",
        dueDate: sup.dueDate ? new Date(sup.dueDate).toISOString() : undefined,
        paidAmount: Number(sup.totalRepaid) || 0,
        remainingAmount: Number(sup.remainingBalance) || 0,
        forgivenAmount: forgivenSum,
        isPrivate,
        sharedCount: sharedWith.length,
        createdAt: sup.createdAt ? new Date(sup.createdAt).toISOString() : new Date().toISOString(),
        canEdit: isPrivileged,
        canShare: isPrivileged,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Apply text search if query provided
  // ─────────────────────────────────────────────────────────────
  let filteredItems = items;
  if (search) {
    filteredItems = items.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        (item.personName && item.personName.toLowerCase().includes(search)) ||
        (item.reference && item.reference.toLowerCase().includes(search)) ||
        (item.category && item.category.toLowerCase().includes(search)) ||
        (item.account && item.account.toLowerCase().includes(search)) ||
        (item.notes && item.notes.toLowerCase().includes(search))
    );
  }

  // Sort descending by date
  filteredItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ─────────────────────────────────────────────────────────────
  // 5. Calculate Contextual Summaries (Strict Server Calculations in BDT ৳)
  // ─────────────────────────────────────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let summary: UnifiedFinancialSummary;

  if (filter === "loans") {
    if (subFilter === "loans_given") {
      const givenItems = items.filter((i) => i.recordType === "loan_given");
      const totalOutstanding = givenItems.reduce((acc, i) => acc + (i.remainingAmount ?? 0), 0);
      const totalRepaid = givenItems.reduce((acc, i) => acc + (i.paidAmount ?? 0), 0);
      const totalPrincipal = givenItems.reduce((acc, i) => acc + i.amount, 0);
      summary = {
        filter: "loans",
        card1: { label: "Total Outstanding", value: totalOutstanding, count: givenItems.length },
        card2: { label: "Total Repaid", value: totalRepaid },
        card3: { label: "Total Principal Given", value: totalPrincipal },
      };
    } else if (subFilter === "loans_received") {
      const receivedItems = items.filter((i) => i.recordType === "loan_received");
      const totalPayable = receivedItems.reduce((acc, i) => acc + (i.remainingAmount ?? 0), 0);
      const totalRepaid = receivedItems.reduce((acc, i) => acc + (i.paidAmount ?? 0), 0);
      const totalPrincipal = receivedItems.reduce((acc, i) => acc + i.amount, 0);
      summary = {
        filter: "loans",
        card1: { label: "Total Payable", value: totalPayable, count: receivedItems.length },
        card2: { label: "Total Repaid", value: totalRepaid },
        card3: { label: "Total Principal Taken", value: totalPrincipal },
      };
    } else {
      const givenItems = items.filter((i) => i.recordType === "loan_given");
      const receivedItems = items.filter((i) => i.recordType === "loan_received");
      const totalGivenOutstanding = givenItems.reduce((acc, i) => acc + (i.remainingAmount ?? 0), 0);
      const totalReceivedPayable = receivedItems.reduce((acc, i) => acc + (i.remainingAmount ?? 0), 0);
      summary = {
        filter: "loans",
        card1: { label: "Loans Receivable", value: totalGivenOutstanding, count: givenItems.length },
        card2: { label: "Loans Payable", value: totalReceivedPayable, count: receivedItems.length },
        card3: {
          label: "Repayments Received",
          value: items.filter((i) => i.recordType === "loan_repayment").reduce((acc, i) => acc + i.amount, 0),
        },
      };
    }
  } else if (filter === "income") {
    const incomeItems = items.filter((i) => i.recordType === "income");
    const thisMonth = incomeItems
      .filter((i) => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, i) => acc + i.amount, 0);

    const thisYear = incomeItems
      .filter((i) => new Date(i.date).getFullYear() === currentYear)
      .reduce((acc, i) => acc + i.amount, 0);

    const totalAllTime = incomeItems.reduce((acc, i) => acc + i.amount, 0);

    summary = {
      filter: "income",
      card1: { label: "This Month", value: thisMonth, count: incomeItems.length },
      card2: { label: "This Year", value: thisYear },
      card3: { label: "Total Income", value: totalAllTime },
    };
  } else if (filter === "expenses") {
    const expenseItems = items.filter((i) => i.recordType === "expense");
    const thisMonth = expenseItems
      .filter((i) => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, i) => acc + i.amount, 0);

    const thisYear = expenseItems
      .filter((i) => new Date(i.date).getFullYear() === currentYear)
      .reduce((acc, i) => acc + i.amount, 0);

    summary = {
      filter: "expenses",
      card1: { label: "This Month", value: thisMonth, count: expenseItems.length },
      card2: { label: "This Year", value: thisYear },
      card3: { label: "Total Expenses", value: expenseItems.reduce((acc, i) => acc + i.amount, 0) },
    };
  } else if (filter === "support") {
    const supportItems = items.filter((i) => i.recordType === "support" || i.recordType === "sis_care");
    const totalPaid = supportItems.reduce((acc, i) => acc + (i.paidAmount || i.amount), 0);
    const activeScheduled = supportItems.reduce((acc, i) => acc + (i.remainingAmount ?? 0), 0);
    summary = {
      filter: "support",
      card1: { label: "Total Paid Support", value: totalPaid, count: supportItems.length },
      card2: { label: "Active / Scheduled Support", value: activeScheduled },
    };
  } else if (filter === "accounts") {
    const transferItems = items.filter((i) => i.recordType === "transfer");
    summary = {
      filter: "accounts",
      card1: { label: "Transfers Count", value: transferItems.length },
      card2: { label: "Total Volume Moved", value: transferItems.reduce((acc, i) => acc + i.amount, 0) },
    };
  } else if (filter === "bills_dues") {
    const billItems = items.filter((i) => i.recordType === "bill_due" || (i.recordType === "expense" && i.category === "Bills & Dues"));
    summary = {
      filter: "bills_dues",
      card1: { label: "Total Commitments", value: billItems.reduce((acc, i) => acc + i.amount, 0), count: billItems.length },
      card2: {
        label: "Paid This Month",
        value: billItems
          .filter((i) => {
            const d = new Date(i.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          })
          .reduce((acc, i) => acc + i.amount, 0),
      },
    };
  } else {
    // "all" Records filter
    const incomeItems = items.filter((i) => i.recordType === "income");
    const expenseItems = items.filter((i) => i.recordType === "expense");
    const givenItems = items.filter((i) => i.recordType === "loan_given");
    const receivedItems = items.filter((i) => i.recordType === "loan_received");

    const monthlyIncome = incomeItems
      .filter((i) => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, i) => acc + i.amount, 0);

    const monthlyExpenses = expenseItems
      .filter((i) => {
        const d = new Date(i.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, i) => acc + i.amount, 0);

    const loansReceivable = givenItems.reduce((acc, i) => acc + (i.remainingAmount ?? 0), 0);
    const loansPayable = receivedItems.reduce((acc, i) => acc + (i.remainingAmount ?? 0), 0);

    summary = {
      filter: "all",
      card1: { label: "Monthly Income", value: monthlyIncome },
      card2: { label: "Monthly Expenses", value: monthlyExpenses },
      card3: { label: "Loans Receivable", value: loansReceivable, count: givenItems.length },
      card4: { label: "Loans Payable", value: loansPayable, count: receivedItems.length },
    };
  }

  return {
    records: JSON.parse(JSON.stringify(filteredItems)),
    summary: JSON.parse(JSON.stringify(summary)),
    totalCount: filteredItems.length,
    currencySymbol: "৳",
  };
}

/**
 * Fetch list of active loans for repayment form dropdown
 */
export async function getActiveLoansForRepayment(): Promise<
  Array<{
    id: string;
    type: "given" | "taken";
    title: string;
    personName: string;
    amount: number;
    remainingAmount: number;
    paidAmount: number;
  }>
> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return [];

  const loans = await LifeMoneyRecord.find({
    status: { $in: ["active", "partially_returned", "overdue"] },
    remainingAmount: { $gt: 0 },
  })
    .populate("personId", "name")
    .sort({ date: -1 })
    .lean();

  return loans.map((l: any) => ({
    id: String(l._id),
    type: l.type,
    title: l.purpose || `${l.type === "given" ? "Given to" : "Taken from"} ${l.personId?.name || l.personName || "Counterparty"}`,
    personName: l.personId?.name || l.personName || "Counterparty",
    amount: Number(l.amount) || 0,
    remainingAmount: Number(l.remainingAmount) || 0,
    paidAmount: Number(l.paidAmount) || 0,
  }));
}

/**
 * Create Unified Income Record
 */
export async function createUnifiedIncome(data: {
  amount: number;
  source: string;
  date: string;
  account?: string;
  description?: string;
  personId?: string;
  isPrivate?: boolean;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can record income.");
  }

  const cleanPersonId = data.personId && data.personId !== "none" ? data.personId : undefined;
  let personName = "";
  if (cleanPersonId) {
    const p = await LifePerson.findById(cleanPersonId).lean();
    if (p) personName = (p as any).name;
  }

  const doc = await LifeTransaction.create({
    amount: Number(data.amount) || 0,
    type: "income",
    date: data.date ? new Date(data.date) : new Date(),
    personId: cleanPersonId,
    personName,
    category: data.source || "Income",
    paymentMethod: data.account || "Bank Transfer",
    notes: data.description || `Income from ${data.source || "Source"}`,
  });

  await logLifeActivity({
    action: "CREATE_INCOME",
    resourceType: "transaction",
    resourceId: String(doc._id),
    resourceName: `Income: ৳${Number(data.amount).toLocaleString()}`,
    details: `Added income of ৳${Number(data.amount).toLocaleString()} from ${data.source}`,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true, id: String(doc._id) };
}

/**
 * Create Unified Expense Record
 */
export async function createUnifiedExpense(data: {
  amount: number;
  category: string;
  date: string;
  account?: string;
  description?: string;
  personId?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can record expenses.");
  }

  const cleanPersonId = data.personId && data.personId !== "none" ? data.personId : undefined;
  let personName = "";
  if (cleanPersonId) {
    const p = await LifePerson.findById(cleanPersonId).lean();
    if (p) personName = (p as any).name;
  }

  const doc = await LifeTransaction.create({
    amount: Number(data.amount) || 0,
    type: "expense",
    date: data.date ? new Date(data.date) : new Date(),
    personId: cleanPersonId,
    personName,
    category: data.category || "Expense",
    paymentMethod: data.account || "Cash",
    notes: data.description || `Expense: ${data.category}`,
  });

  await logLifeActivity({
    action: "CREATE_EXPENSE",
    resourceType: "transaction",
    resourceId: String(doc._id),
    resourceName: `Expense: ৳${Number(data.amount).toLocaleString()}`,
    details: `Recorded expense of ৳${Number(data.amount).toLocaleString()} under ${data.category}`,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true, id: String(doc._id) };
}

/**
 * Create Unified Loan (Given or Received)
 */
export async function createUnifiedLoan(data: {
  type: "given" | "taken";
  personId: string;
  amount: number;
  date: string;
  dueDate?: string;
  terms?: string;
  notes?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can issue or record loans.");
  }

  if (!data.personId || data.personId === "none") {
    throw new Error("A valid person must be selected from the People directory.");
  }

  const person = await LifePerson.findById(data.personId).lean();
  if (!person) throw new Error("Selected person was not found in the directory.");
  const personName = (person as any).name;

  const amount = Number(data.amount) || 0;
  if (amount <= 0) throw new Error("Loan amount must be greater than zero.");

  const recordDate = data.date ? new Date(data.date) : new Date();

  // Create Loan Record
  const loan = await LifeMoneyRecord.create({
    type: data.type,
    personId: data.personId,
    personName,
    amount,
    currency: "BDT",
    date: recordDate,
    purpose: data.terms || `${data.type === "given" ? "Loan Given to" : "Loan Received from"} ${personName}`,
    expectedReturnDate: data.dueDate ? new Date(data.dueDate) : undefined,
    paidAmount: 0,
    remainingAmount: amount,
    status: "active",
    notes: data.notes || "",
  });

  // Track initial loan transaction without double counting as income/expense
  await LifeTransaction.create({
    amount,
    type: data.type === "given" ? "loan_given" : "loan_received",
    date: recordDate,
    personId: data.personId,
    personName,
    category: "Loan",
    paymentMethod: "Bank Transfer",
    notes: `Principal ${data.type === "given" ? "disbursed to" : "borrowed from"} ${personName}`,
    relatedRecordId: String(loan._id),
    relatedRecordType: "LifeMoneyRecord",
  });

  await logLifeActivity({
    action: data.type === "given" ? "GIVE_LOAN" : "RECEIVE_LOAN",
    resourceType: "money",
    resourceId: String(loan._id),
    resourceName: `Loan: ৳${amount.toLocaleString()}`,
    details: `${data.type === "given" ? "Disbursed loan to" : "Received loan from"} ${personName} for ৳${amount.toLocaleString()}`,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true, id: String(loan._id) };
}

/**
 * Record Unified Loan Repayment (strictly validates against existing remaining balance)
 */
export async function recordUnifiedLoanRepayment(data: {
  loanId: string;
  amount: number;
  date: string;
  account?: string;
  notes?: string;
  reference?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can record loan repayments.");
  }

  const loan = await LifeMoneyRecord.findById(data.loanId);
  if (!loan) throw new Error("Loan record not found.");

  const repaymentAmount = Number(data.amount) || 0;
  if (repaymentAmount <= 0) {
    throw new Error("Repayment amount must be greater than zero.");
  }

  if (repaymentAmount > loan.remainingAmount) {
    throw new Error(
      `Repayment amount (৳${repaymentAmount.toLocaleString()}) cannot exceed the current outstanding balance (৳${loan.remainingAmount.toLocaleString()}).`
    );
  }

  const repaymentDate = data.date ? new Date(data.date) : new Date();

  // Create settlement
  await LifeSettlement.create({
    moneyRecordId: loan._id,
    amount: repaymentAmount,
    date: repaymentDate,
    paymentMethod: data.account || "bank_transfer",
    reference: data.reference || "",
    notes: data.notes || "",
  });

  // Update loan record balances
  const newPaidAmount = (loan.paidAmount || 0) + repaymentAmount;
  const newRemainingAmount = Math.max(0, loan.amount - newPaidAmount);

  loan.paidAmount = newPaidAmount;
  loan.remainingAmount = newRemainingAmount;
  loan.status = newRemainingAmount === 0 ? "fully_returned" : "partially_returned";
  await loan.save();

  // Record transaction as loan_repayment (NOT new income)
  await LifeTransaction.create({
    amount: repaymentAmount,
    type: "loan_repayment",
    date: repaymentDate,
    personId: loan.personId,
    personName: loan.personName,
    category: "Settlement",
    paymentMethod: data.account || "Bank Transfer",
    reference: data.reference || "",
    notes: data.notes || `Repayment on loan for ${loan.personName}`,
    relatedRecordId: String(loan._id),
    relatedRecordType: "LifeMoneyRecord",
  });

  await logLifeActivity({
    action: "RECORD_REPAYMENT",
    resourceType: "money",
    resourceId: String(loan._id),
    resourceName: `Repayment: ৳${repaymentAmount.toLocaleString()}`,
    details: `Recorded repayment of ৳${repaymentAmount.toLocaleString()} on loan for ${loan.personName}. Outstanding: ৳${newRemainingAmount.toLocaleString()}`,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true, remainingAmount: newRemainingAmount };
}

/**
 * Forgive Loan Principal (updates remaining balance without recording repayment/income)
 */
export async function forgiveUnifiedLoanPrincipal(data: {
  loanId: string;
  forgiveAmount: number;
  reason: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || !auth.isOwner) {
    throw new Error("Forbidden: Only the Owner can forgive loan principal.");
  }

  const loan = await LifeMoneyRecord.findById(data.loanId);
  if (!loan) throw new Error("Loan not found.");

  const forgiveAmount = Number(data.forgiveAmount) || 0;
  if (forgiveAmount <= 0) throw new Error("Forgiveness amount must be greater than zero.");

  if (forgiveAmount > loan.remainingAmount) {
    throw new Error(
      `Forgive amount (৳${forgiveAmount.toLocaleString()}) cannot exceed remaining balance (৳${loan.remainingAmount.toLocaleString()}).`
    );
  }

  const newRemaining = Math.max(0, loan.remainingAmount - forgiveAmount);
  loan.remainingAmount = newRemaining;
  loan.notes = `${loan.notes ? loan.notes + "\n" : ""}[Principal Forgiven]: ৳${forgiveAmount.toLocaleString()} on ${new Date().toLocaleDateString()}. Reason: ${data.reason}`;

  if (newRemaining === 0) {
    loan.status = "written_off";
  }
  await loan.save();

  await logLifeActivity({
    action: "FORGIVE_LOAN_PRINCIPAL",
    resourceType: "money",
    resourceId: String(loan._id),
    resourceName: `Forgiven: ৳${forgiveAmount.toLocaleString()}`,
    details: `Forgave principal of ৳${forgiveAmount.toLocaleString()} for ${loan.personName}. Reason: ${data.reason}`,
    isCritical: true,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true, remainingAmount: newRemaining };
}

/**
 * Create Unified Support or SiS Care Record
 */
export async function createUnifiedSupport(data: {
  title: string;
  recipientPersonId: string;
  amount: number;
  supportType: "family_support" | "gift" | "medical_support" | "emergency_support";
  date: string;
  account?: string;
  notes?: string;
  isRepayable?: boolean;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can create financial support.");
  }

  const person = await LifePerson.findById(data.recipientPersonId).lean();
  if (!person) throw new Error("Selected recipient not found.");

  const totalAmount = Number(data.amount) || 0;
  const isRepayable = Boolean(data.isRepayable);

  const sup = await LifeFinancialSupport.create({
    title: data.title || `${data.supportType.replace("_", " ")} for ${(person as any).name}`,
    recipientPersonId: data.recipientPersonId,
    supportType: data.supportType,
    totalAmount,
    currency: "BDT",
    givenDate: data.date ? new Date(data.date) : new Date(),
    paymentMethod: data.account || "bank_transfer",
    purpose: data.notes || "",
    repayableOrNot: isRepayable,
    totalRepaid: 0,
    remainingBalance: isRepayable ? totalAmount : 0,
    status: "active",
    visibilityMode: "owner_only",
    createdBy: auth.name || "Owner",
  });

  await logLifeActivity({
    action: "CREATE_SUPPORT",
    resourceType: "financial_support",
    resourceId: String(sup._id),
    resourceName: `Support: ৳${totalAmount.toLocaleString()}`,
    details: `Created ${data.supportType} of ৳${totalAmount.toLocaleString()} for ${(person as any).name}`,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true, id: String(sup._id) };
}

/**
 * Create Unified Account Transfer (does not count as income or expense)
 */
export async function createUnifiedTransfer(data: {
  amount: number;
  sourceAccount: string;
  destinationAccount: string;
  date: string;
  notes?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can record account transfers.");
  }

  const amount = Number(data.amount) || 0;
  const transferNote = `Transfer from ${data.sourceAccount} to ${data.destinationAccount}${data.notes ? ` — ${data.notes}` : ""}`;

  const doc = await LifeTransaction.create({
    amount,
    type: "other",
    date: data.date ? new Date(data.date) : new Date(),
    category: "Transfer",
    paymentMethod: `${data.sourceAccount} → ${data.destinationAccount}`,
    notes: transferNote,
  });

  await logLifeActivity({
    action: "ACCOUNT_TRANSFER",
    resourceType: "transaction",
    resourceId: String(doc._id),
    resourceName: `Transfer: ৳${amount.toLocaleString()}`,
    details: transferNote,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true, id: String(doc._id) };
}

/**
 * Create Unified Bill / Due Commitment
 */
export async function createUnifiedBill(data: {
  title: string;
  amount: number;
  dueDate: string;
  account?: string;
  notes?: string;
  personId?: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can record bills & dues.");
  }

  const cleanPersonId = data.personId && data.personId !== "none" ? data.personId : undefined;
  let personName = "";
  if (cleanPersonId) {
    const p = await LifePerson.findById(cleanPersonId).lean();
    if (p) personName = (p as any).name;
  }

  const amount = Number(data.amount) || 0;
  const doc = await LifeTransaction.create({
    amount,
    type: "expense",
    date: data.dueDate ? new Date(data.dueDate) : new Date(),
    personId: cleanPersonId,
    personName,
    category: "Bills & Dues",
    paymentMethod: data.account || "Bank / Mobile Banking",
    notes: data.notes || data.title,
    reference: `Due: ${new Date(data.dueDate).toLocaleDateString()}`,
  });

  await logLifeActivity({
    action: "CREATE_BILL",
    resourceType: "transaction",
    resourceId: String(doc._id),
    resourceName: `Bill: ৳${amount.toLocaleString()}`,
    details: `Added bill/due: ${data.title} for ৳${amount.toLocaleString()}`,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true, id: String(doc._id) };
}

/**
 * Get unified record details with transaction/repayment history & permission list
 */
export async function getUnifiedRecordDetail(
  recordId: string,
  sourceModel: "money_record" | "transaction" | "financial_support"
) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) throw new Error("Unauthorized");

  const isPrivileged = auth.isOwner || auth.isAdmin;

  let record: any = null;
  let settlements: any[] = [];
  let linkedPerson: any = null;

  if (sourceModel === "money_record") {
    record = await LifeMoneyRecord.findById(recordId)
      .populate("personId", "name phone email relation avatarUrl")
      .lean();
    if (!record) throw new Error("Record not found");

    settlements = await LifeSettlement.find({ moneyRecordId: recordId })
      .sort({ date: -1 })
      .lean();
    linkedPerson = record.personId;
  } else if (sourceModel === "transaction") {
    record = await LifeTransaction.findById(recordId)
      .populate("personId", "name phone email relation avatarUrl")
      .lean();
    if (!record) throw new Error("Record not found");
    linkedPerson = record.personId;
  } else if (sourceModel === "financial_support") {
    record = await LifeFinancialSupport.findById(recordId)
      .populate("recipientPersonId", "name phone email relation avatarUrl")
      .lean();
    if (!record) throw new Error("Record not found");
    linkedPerson = record.recipientPersonId;
  }

  // Permissions & Sharing list
  const permissions = await LifeRecordPermission.find({
    recordId,
    recordType: sourceModel,
    canView: true,
  })
    .populate("assignedPersonId", "name phone email relation avatarUrl")
    .lean();

  return {
    record: JSON.parse(JSON.stringify(record)),
    settlements: JSON.parse(JSON.stringify(settlements)),
    linkedPerson: JSON.parse(JSON.stringify(linkedPerson || null)),
    permissions: JSON.parse(JSON.stringify(permissions)),
    canEdit: isPrivileged,
    canShare: isPrivileged,
  };
}

/**
 * Explicit Record Sharing (Server-Enforced ACL)
 */
export async function shareUnifiedRecord(data: {
  recordId: string;
  sourceModel: "money_record" | "transaction" | "financial_support";
  personId: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can grant record permissions.");
  }

  const person = await LifePerson.findById(data.personId);
  if (!person) throw new Error("Person not found in directory.");

  // Upsert record permission
  const perm = await LifeRecordPermission.findOneAndUpdate(
    {
      recordId: data.recordId,
      recordType: data.sourceModel,
      assignedPersonId: data.personId,
    },
    {
      canView: true,
      canDownload: false,
      canEdit: false,
      canShare: false,
      visibilityMode: "available_now",
      isReleased: true,
      releasedAt: new Date(),
      releasedBy: auth.name || "Owner",
    },
    { upsert: true, new: true }
  );

  await logLifeActivity({
    action: "SHARE_FINANCIAL_RECORD",
    resourceType: data.sourceModel,
    resourceId: data.recordId,
    resourceName: `Shared with ${person.name}`,
    details: `Granted read-only access to record (${data.sourceModel}:${data.recordId}) for ${person.name}`,
    isCritical: true,
  });

  revalidatePath("/workspace");
  return { success: true, permission: JSON.parse(JSON.stringify(perm)) };
}

/**
 * Revoke Explicit Record Share
 */
export async function revokeUnifiedRecordShare(data: {
  recordId: string;
  sourceModel: "money_record" | "transaction" | "financial_support";
  personId: string;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners/Admins can revoke record permissions.");
  }

  const person = await LifePerson.findById(data.personId);
  const personName = person ? person.name : "User";

  await LifeRecordPermission.deleteOne({
    recordId: data.recordId,
    recordType: data.sourceModel,
    assignedPersonId: data.personId,
  });

  await logLifeActivity({
    action: "REVOKE_FINANCIAL_RECORD_SHARE",
    resourceType: data.sourceModel,
    resourceId: data.recordId,
    resourceName: `Revoked from ${personName}`,
    details: `Revoked access to record (${data.sourceModel}:${data.recordId}) from ${personName}`,
    isCritical: true,
  });

  revalidatePath("/workspace");
  return { success: true };
}
