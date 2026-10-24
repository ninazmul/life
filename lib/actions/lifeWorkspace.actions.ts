"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/database";
import { getLifeAuthContext, logLifeActivity } from "@/lib/life/auth";
import LifeAsset from "@/lib/database/models/lifeAsset.model";
import LifeMoneyRecord from "@/lib/database/models/lifeMoneyRecord.model";
import LifeTransaction from "@/lib/database/models/lifeTransaction.model";
import LifeSettlement from "@/lib/database/models/lifeSettlement.model";
import LifeFinancialSupport from "@/lib/database/models/lifeFinancialSupport.model";
import LifePerson from "@/lib/database/models/lifePerson.model";
import LifeBusiness from "@/lib/database/models/lifeBusiness.model";
import LifeDocument from "@/lib/database/models/lifeDocument.model";
import LifeResponsibility from "@/lib/database/models/lifeResponsibility.model";
import LifeInstruction from "@/lib/database/models/lifeInstruction.model";
import LifeContact from "@/lib/database/models/lifeContact.model";
import LifeLegacyMessage from "@/lib/database/models/lifeLegacyMessage.model";
import LifeVaultItem from "@/lib/database/models/lifeVaultItem.model";
import LifeRecordPermission from "@/lib/database/models/lifeRecordPermission.model";
import { WORKSPACE_CATEGORIES } from "@/lib/life/workspaceCategories";

export interface WorkspaceRecordItem {
  id: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  subtitle?: string;
  referenceNumber?: string;
  maskedReference?: string;
  amount?: number;
  currency?: string;
  status: string;
  statusColor?: string;
  date?: string;
  updatedAt?: string;
  personName?: string;
  personId?: string;
  notes?: string;
  iconType?: string;
  details?: Record<string, any>;
  linkedCount?: number;
  linkedRecords?: Array<{ id: string; title: string; type: string; href?: string }>;
}

export interface WorkspaceModuleResponse {
  records: WorkspaceRecordItem[];
  totalSummary?: {
    label: string;
    amount?: number;
    count?: number;
    currencySymbol: string;
  };
  filterTabs: Array<{ id: string; label: string; count?: number }>;
  currencySymbol: string;
}

/**
 * Helper to mask sensitive numbers (e.g. account numbers, cards)
 */
function maskValue(val: string): string {
  if (!val) return "";
  const cleaned = val.replace(/\s+/g, "");
  if (cleaned.length <= 4) return "****";
  const last4 = cleaned.slice(-4);
  return `**** ${last4}`;
}

/**
 * Fetch records for any workspace subcategory
 */
export async function getWorkspaceModuleRecords(params: {
  categoryId: string;
  subcategoryId: string;
  filter?: string;
  search?: string;
}): Promise<WorkspaceModuleResponse> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) {
    return {
      records: [],
      filterTabs: [{ id: "all", label: "All" }],
      currencySymbol: "৳",
    };
  }

  const { categoryId, subcategoryId, filter = "all", search } = params;
  const searchRegex = search?.trim() ? new RegExp(search.trim(), "i") : null;

  const records: WorkspaceRecordItem[] = [];
  let summaryLabel = "Total";
  let summaryAmount = 0;
  let summaryCount = 0;

  // ─────────────────────────────────────────────────────────────
  // 1. Finance & Assets
  // ─────────────────────────────────────────────────────────────
  if (categoryId === "finance_assets") {
    if (subcategoryId === "cash_bank") {
      summaryLabel = "Total Cash & Bank";
      const query: Record<string, any> = {
        category: { $in: ["bank_balance", "cash", "other"] },
        status: { $ne: "disposed" },
      };

      if (filter === "bank") query.category = "bank_balance";
      else if (filter === "cash") query.category = "cash";
      else if (filter === "wallet") query.name = { $regex: /wallet|nagad|bkash|upay/i };

      if (searchRegex) {
        query.$or = [{ name: searchRegex }, { location: searchRegex }, { notes: searchRegex }];
      }

      const assets = await LifeAsset.find(query).sort({ value: -1 }).lean();

      for (const a of assets as any[]) {
        const isBank = a.category === "bank_balance" || /bank/i.test(a.name);
        const isWallet = /nagad|bkash|rocket|upay|wallet/i.test(a.name);
        const sub = isBank ? "Savings Account" : isWallet ? "Mobile Wallet" : "Physical Cash";
        const refNo = a.location || (isBank ? "4521" : isWallet ? "01812 345678" : "-");

        summaryAmount += Number(a.value) || 0;
        summaryCount++;

        records.push({
          id: String(a._id),
          categoryId,
          subcategoryId,
          title: a.name,
          subtitle: `${sub}\n${maskValue(refNo)}`,
          referenceNumber: refNo,
          maskedReference: maskValue(refNo),
          amount: Number(a.value) || 0,
          currency: a.currency || "BDT",
          status: a.status || "active",
          statusColor: a.status === "active" ? "emerald" : "slate",
          updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString(),
          notes: a.notes || "",
          details: {
            "Bank / Provider Name": a.name,
            "Account Type": sub,
            "Account Number": refNo,
            "Branch / Location": a.location || "Principal Branch",
            Currency: `${a.currency || "BDT"} (৳)`,
            "Opening Date": a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-",
          },
          linkedCount: a.relatedPersonId ? 1 : 0,
          linkedRecords: a.relatedPersonId
            ? [{ id: String(a.relatedPersonId), title: "Account Signer", type: "Person" }]
            : [],
        });
      }
    } else if (subcategoryId === "income") {
      summaryLabel = "Total Income";
      const query: Record<string, any> = { type: "income" };
      if (filter !== "all") query.category = { $regex: new RegExp(filter, "i") };
      if (searchRegex) query.$or = [{ category: searchRegex }, { notes: searchRegex }, { personName: searchRegex }];

      const txs = await LifeTransaction.find(query).sort({ date: -1 }).lean();
      for (const t of txs as any[]) {
        const amt = Number(t.amount) || 0;
        summaryAmount += amt;
        summaryCount++;

        records.push({
          id: String(t._id),
          categoryId,
          subcategoryId,
          title: t.category || "Income",
          subtitle: `${t.paymentMethod || "Bank Transfer"}\n${t.personName || "Direct"}`,
          amount: amt,
          currency: "BDT",
          status: "received",
          statusColor: "emerald",
          date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
          personName: t.personName,
          personId: t.personId ? String(t.personId) : undefined,
          notes: t.notes || "",
          details: {
            "Income Title": t.category || "Income",
            Amount: `৳ ${amt.toLocaleString()}`,
            Source: t.personName || "Direct",
            "Receiving Account": t.paymentMethod || "Bank Account",
            Date: t.date ? new Date(t.date).toLocaleDateString() : "-",
          },
        });
      }
    } else if (subcategoryId === "expenses") {
      summaryLabel = "Total Expenses";
      const query: Record<string, any> = { type: "expense" };
      if (filter !== "all") query.category = { $regex: new RegExp(filter, "i") };
      if (searchRegex) query.$or = [{ category: searchRegex }, { notes: searchRegex }, { personName: searchRegex }];

      const txs = await LifeTransaction.find(query).sort({ date: -1 }).lean();
      for (const t of txs as any[]) {
        const amt = Number(t.amount) || 0;
        summaryAmount += amt;
        summaryCount++;

        records.push({
          id: String(t._id),
          categoryId,
          subcategoryId,
          title: t.category || "Expense",
          subtitle: `${t.paymentMethod || "Cash"}\n${t.personName || "General"}`,
          amount: amt,
          currency: "BDT",
          status: "paid",
          statusColor: "rose",
          date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
          notes: t.notes || "",
          details: {
            "Expense Title": t.category || "Expense",
            Amount: `৳ ${amt.toLocaleString()}`,
            "Paid From": t.paymentMethod || "Cash",
            Date: t.date ? new Date(t.date).toLocaleDateString() : "-",
          },
        });
      }
    } else if (subcategoryId === "assets") {
      summaryLabel = "Total Physical Assets";
      const query: Record<string, any> = {
        category: { $in: ["property", "vehicle", "valuable", "equipment", "other"] },
        status: { $ne: "disposed" },
      };
      if (filter === "property") query.category = "property";
      else if (filter === "vehicle") query.category = "vehicle";
      else if (filter === "valuable") query.category = "valuable";

      if (searchRegex) query.$or = [{ name: searchRegex }, { location: searchRegex }, { notes: searchRegex }];

      const assets = await LifeAsset.find(query).sort({ value: -1 }).lean();
      for (const a of assets as any[]) {
        const amt = Number(a.value) || 0;
        summaryAmount += amt;
        summaryCount++;

        records.push({
          id: String(a._id),
          categoryId,
          subcategoryId,
          title: a.name,
          subtitle: `${a.category.toUpperCase()}\n${a.location || "Deed Recorded"}`,
          amount: amt,
          currency: a.currency || "BDT",
          status: a.status || "active",
          statusColor: "emerald",
          updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString(),
          notes: a.notes || "",
          details: {
            "Asset Name": a.name,
            Category: a.category,
            "Estimated Value": `৳ ${amt.toLocaleString()}`,
            Location: a.location || "-",
            "Ownership %": `${a.ownershipPercentage || 100}%`,
          },
        });
      }
    } else if (subcategoryId === "liabilities") {
      summaryLabel = "Total Outstanding Liabilities";
      const query: Record<string, any> = {
        type: { $in: ["taken", "invest_received"] },
      };
      if (filter === "settled") query.status = { $in: ["fully_returned", "written_off"] };
      else if (filter === "active") query.status = { $in: ["active", "partially_returned", "overdue"] };

      if (searchRegex) query.$or = [{ personName: searchRegex }, { purpose: searchRegex }, { notes: searchRegex }];

      const loans = await LifeMoneyRecord.find(query).sort({ date: -1 }).lean();
      for (const l of loans as any[]) {
        const remaining = Number(l.remainingAmount ?? l.amount) || 0;
        summaryAmount += remaining;
        summaryCount++;

        records.push({
          id: String(l._id),
          categoryId,
          subcategoryId,
          title: l.purpose || `Loan from ${l.personName || "Lender"}`,
          subtitle: `Lender: ${l.personName || "Lender"}\nDue: ${l.expectedReturnDate ? new Date(l.expectedReturnDate).toLocaleDateString() : "Flexible"}`,
          amount: remaining,
          currency: l.currency || "BDT",
          status: l.status || "active",
          statusColor: l.status === "fully_returned" ? "slate" : "red",
          date: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
          personName: l.personName,
          personId: l.personId ? String(l.personId) : undefined,
          notes: l.notes || "",
          details: {
            Lender: l.personName || "Lender",
            "Original Amount": `৳ ${(Number(l.amount) || 0).toLocaleString()}`,
            "Outstanding Amount": `৳ ${remaining.toLocaleString()}`,
            "Amount Repaid": `৳ ${(Number(l.paidAmount) || 0).toLocaleString()}`,
            "Due Date": l.expectedReturnDate ? new Date(l.expectedReturnDate).toLocaleDateString() : "Flexible",
          },
        });
      }
    } else if (subcategoryId === "loans_given") {
      summaryLabel = "Total Loans Receivable";
      const query: Record<string, any> = {
        type: { $in: ["given", "invest_made"] },
      };
      if (filter === "active") query.status = "active";
      else if (filter === "partially_returned") query.status = "partially_returned";
      else if (filter === "overdue") query.status = "overdue";
      else if (filter === "completed") query.status = "fully_returned";

      if (searchRegex) query.$or = [{ personName: searchRegex }, { purpose: searchRegex }, { notes: searchRegex }];

      const loans = await LifeMoneyRecord.find(query).sort({ date: -1 }).lean();
      for (const l of loans as any[]) {
        const remaining = Number(l.remainingAmount ?? l.amount) || 0;
        summaryAmount += remaining;
        summaryCount++;

        records.push({
          id: String(l._id),
          categoryId,
          subcategoryId,
          title: l.personName || "Borrower",
          subtitle: `${l.purpose || "Loan Record"}\nDue: ${l.expectedReturnDate ? new Date(l.expectedReturnDate).toLocaleDateString() : "Flexible"}`,
          amount: remaining,
          currency: l.currency || "BDT",
          status: l.status || "active",
          statusColor: l.status === "fully_returned" ? "slate" : "amber",
          date: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
          personName: l.personName,
          personId: l.personId ? String(l.personId) : undefined,
          notes: l.notes || "",
          details: {
            Borrower: l.personName || "Counterparty",
            "Original Loan": `৳ ${(Number(l.amount) || 0).toLocaleString()}`,
            "Outstanding Amount": `৳ ${remaining.toLocaleString()}`,
            "Repaid So Far": `৳ ${(Number(l.paidAmount) || 0).toLocaleString()}`,
            "Due Date": l.expectedReturnDate ? new Date(l.expectedReturnDate).toLocaleDateString() : "Flexible",
          },
        });
      }
    } else if (subcategoryId === "investments") {
      summaryLabel = "Total Investments";
      const query: Record<string, any> = {
        category: "business_investment",
        status: { $ne: "disposed" },
      };
      if (searchRegex) query.$or = [{ name: searchRegex }, { notes: searchRegex }];

      const assets = await LifeAsset.find(query).sort({ value: -1 }).lean();
      for (const a of assets as any[]) {
        const amt = Number(a.value) || 0;
        summaryAmount += amt;
        summaryCount++;

        records.push({
          id: String(a._id),
          categoryId,
          subcategoryId,
          title: a.name,
          subtitle: `Equity: ${a.ownershipPercentage || 100}%\n${a.notes || "Venture Investment"}`,
          amount: amt,
          currency: a.currency || "BDT",
          status: a.status || "active",
          statusColor: "purple",
          updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : new Date().toISOString(),
          details: {
            "Investment Name": a.name,
            "Ownership Percentage": `${a.ownershipPercentage || 100}%`,
            "Estimated Value": `৳ ${amt.toLocaleString()}`,
            "Related Business": a.name,
          },
        });
      }
    } else if (subcategoryId === "other_financial") {
      summaryLabel = "Total Support & SiS Care";
      const query: Record<string, any> = {};
      if (filter === "sis_care") query.supportType = { $in: ["family_support", "medical_support", "emergency_support"] };
      else if (filter === "gifts") query.supportType = "gift";

      if (searchRegex) query.$or = [{ title: searchRegex }, { purpose: searchRegex }];

      const supports = await LifeFinancialSupport.find(query)
        .populate("recipientPersonId", "name relation")
        .sort({ givenDate: -1 })
        .lean();

      for (const s of supports as any[]) {
        const amt = Number(s.totalAmount) || 0;
        summaryAmount += amt;
        summaryCount++;
        const pName = s.recipientPersonId?.name || "Recipient";

        records.push({
          id: String(s._id),
          categoryId,
          subcategoryId,
          title: s.title || `Support for ${pName}`,
          subtitle: `${s.supportType.replace("_", " ").toUpperCase()}\nRecipient: ${pName}`,
          amount: amt,
          currency: s.currency || "BDT",
          status: s.status || "active",
          statusColor: "indigo",
          date: s.givenDate ? new Date(s.givenDate).toISOString() : new Date().toISOString(),
          personName: pName,
          personId: s.recipientPersonId ? String(s.recipientPersonId._id) : undefined,
          notes: s.purpose || "",
          details: {
            "Record Title": s.title || `Support for ${pName}`,
            "Support Type": s.supportType.replace("_", " "),
            Recipient: pName,
            Amount: `৳ ${amt.toLocaleString()}`,
            Date: s.givenDate ? new Date(s.givenDate).toLocaleDateString() : "-",
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. People & Family
  // ─────────────────────────────────────────────────────────────
  else if (categoryId === "people_family") {
    summaryLabel = "Total People Records";
    if (subcategoryId === "family_care") {
      const people = await LifePerson.find({
        relation: { $in: ["spouse", "child", "parent", "sibling", "family", "dependent"] },
        status: { $ne: "deleted" },
      })
        .sort({ name: 1 })
        .lean();

      for (const p of people as any[]) {
        summaryCount++;
        records.push({
          id: String(p._id),
          categoryId,
          subcategoryId,
          title: p.name,
          subtitle: `${(p.relation || "Family").toUpperCase()}\n${p.phone || p.email || "Primary Contact"}`,
          status: p.status || "active",
          statusColor: "emerald",
          personName: p.name,
          personId: String(p._id),
          notes: p.notes || "",
          details: {
            "Member Name": p.name,
            Relationship: p.relation || "Family",
            Phone: p.phone || "-",
            Email: p.email || "-",
            "Care Status": "Active Regular Care",
          },
        });
      }
    } else if (subcategoryId === "kids") {
      const kids = await LifePerson.find({
        $or: [{ relation: "child" }, { category: "kid" }, { relation: "dependent" }],
        status: { $ne: "deleted" },
      })
        .sort({ name: 1 })
        .lean();

      for (const k of kids as any[]) {
        summaryCount++;
        records.push({
          id: String(k._id),
          categoryId,
          subcategoryId,
          title: k.name,
          subtitle: `Child Dossier\n${k.relation || "Child"} • Protected`,
          status: "active",
          statusColor: "pink",
          personName: k.name,
          personId: String(k._id),
          notes: k.notes || "",
          details: {
            "Child Name": k.name,
            Relationship: k.relation || "Child",
            "Emergency Guardian": "Designated Co-Guardian",
            "Access Permission": "Strictly Confidential",
          },
        });
      }
    } else if (subcategoryId === "community") {
      const community = await LifePerson.find({
        relation: { $nin: ["spouse", "child", "parent", "sibling"] },
        status: { $ne: "deleted" },
      })
        .sort({ name: 1 })
        .lean();

      for (const c of community as any[]) {
        summaryCount++;
        records.push({
          id: String(c._id),
          categoryId,
          subcategoryId,
          title: c.name,
          subtitle: `${(c.relation || "Community").toUpperCase()}\n${c.phone || c.email || ""}`,
          status: c.status || "active",
          statusColor: "purple",
          personName: c.name,
          personId: String(c._id),
          notes: c.notes || "",
          details: {
            Name: c.name,
            Connection: c.relation || "Associate",
            Phone: c.phone || "-",
            Email: c.email || "-",
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Work & Business
  // ─────────────────────────────────────────────────────────────
  else if (categoryId === "work_business") {
    if (subcategoryId === "staff_office") {
      summaryLabel = "Total Staff Members";
      const staff = await LifePerson.find({
        $or: [{ category: "staff" }, { relation: { $in: ["staff", "assistant", "employee"] } }],
      }).lean();

      for (const s of staff as any[]) {
        summaryCount++;
        records.push({
          id: String(s._id),
          categoryId,
          subcategoryId,
          title: s.name,
          subtitle: `Staff Member\n${s.phone || "Active Duty"}`,
          status: s.status || "active",
          statusColor: "sky",
          personName: s.name,
          personId: String(s._id),
          notes: s.notes || "",
          details: {
            "Staff Name": s.name,
            Role: "Office / Domestic Staff",
            Phone: s.phone || "-",
            Status: s.status || "Active",
          },
        });
      }
    } else if (subcategoryId === "business") {
      summaryLabel = "Total Business Entities";
      const businesses = await LifeBusiness.find({}).sort({ createdAt: -1 }).lean();
      for (const b of businesses as any[]) {
        summaryCount++;
        records.push({
          id: String(b._id),
          categoryId,
          subcategoryId,
          title: b.name,
          subtitle: `Equity: ${b.ownershipPercentage || 100}%\n${b.status || "Active Operating"}`,
          status: b.status || "active",
          statusColor: "emerald",
          notes: b.notes || "",
          details: {
            "Business Name": b.name,
            "Legal Name": b.legalName || b.name,
            "Ownership Percentage": `${b.ownershipPercentage || 100}%`,
            Status: b.status || "Active",
          },
        });
      }
    } else if (subcategoryId === "projects") {
      summaryLabel = "Total Projects";
      const resp = await LifeResponsibility.find({}).sort({ createdAt: -1 }).lean();
      for (const r of resp as any[]) {
        summaryCount++;
        records.push({
          id: String(r._id),
          categoryId,
          subcategoryId,
          title: r.title,
          subtitle: `Priority: ${r.priority?.toUpperCase() || "NORMAL"}\nStatus: ${r.status || "Pending"}`,
          status: r.status || "in_progress",
          statusColor: "amber",
          notes: r.detailedInstruction || "",
          details: {
            "Project Title": r.title,
            Priority: r.priority || "Normal",
            Status: r.status || "In Progress",
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Secure Vault
  // ─────────────────────────────────────────────────────────────
  else if (categoryId === "secure_vault") {
    if (subcategoryId === "documents") {
      summaryLabel = "Total Secure Documents";
      const docs = await LifeDocument.find({}).sort({ createdAt: -1 }).lean();
      for (const d of docs as any[]) {
        summaryCount++;
        records.push({
          id: String(d._id),
          categoryId,
          subcategoryId,
          title: d.title,
          subtitle: `${d.category?.toUpperCase() || "LEGAL"}\nSecurely Encrypted`,
          status: "encrypted",
          statusColor: "indigo",
          notes: d.notes || "",
          details: {
            "Document Title": d.title,
            Category: d.category || "General",
            "File URL": d.fileUrl || "Vault Document",
          },
        });
      }
    } else if (subcategoryId === "digital_vault") {
      summaryLabel = "Total Vault Secrets";
      const items = await LifeVaultItem.find({}).sort({ createdAt: -1 }).lean();
      for (const v of items as any[]) {
        summaryCount++;
        records.push({
          id: String(v._id),
          categoryId,
          subcategoryId,
          title: v.title,
          subtitle: `${v.category?.toUpperCase() || "CREDENTIAL"}\nAES-256-GCM Protected`,
          status: "locked",
          statusColor: "purple",
          referenceNumber: v.usernameOrIdentifier || "****",
          maskedReference: maskValue(v.usernameOrIdentifier || "password"),
          notes: v.notes || "",
          details: {
            "Secret Title": v.title,
            Category: v.category || "General",
            Identifier: v.usernameOrIdentifier || "-",
            "Encryption Status": "AES-256-GCM Sealed",
          },
        });
      }
    } else if (subcategoryId === "access_control") {
      summaryLabel = "Total Permission Grants";
      const perms = await LifeRecordPermission.find({}).populate("assignedPersonId", "name relation").lean();
      for (const p of perms as any[]) {
        summaryCount++;
        records.push({
          id: String(p._id),
          categoryId,
          subcategoryId,
          title: p.assignedPersonId?.name || "Designated User",
          subtitle: `${p.recordType?.toUpperCase() || "MODULE"}\nView Allowed`,
          status: "active",
          statusColor: "amber",
          details: {
            "Authorized Person": p.assignedPersonId?.name || "User",
            "Module Scope": p.recordType || "Records",
            "Access Level": p.canEdit ? "Edit & View" : "View Only",
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Life Continuity
  // ─────────────────────────────────────────────────────────────
  else if (categoryId === "life_continuity") {
    if (subcategoryId === "responsibilities") {
      summaryLabel = "Total Responsibilities";
      const resp = await LifeResponsibility.find({}).populate("assignedPersonId", "name relation").lean();
      for (const r of resp as any[]) {
        summaryCount++;
        records.push({
          id: String(r._id),
          categoryId,
          subcategoryId,
          title: r.title,
          subtitle: `Assigned: ${r.assignedPersonId?.name || "Family"}\nPriority: ${r.priority || "Normal"}`,
          status: r.status || "active",
          statusColor: "emerald",
          notes: r.detailedInstruction || "",
          personName: r.assignedPersonId?.name,
          details: {
            "Duty Title": r.title,
            "Assigned To": r.assignedPersonId?.name || "Family Guardian",
            Priority: r.priority || "Normal",
            Status: r.status || "Active",
          },
        });
      }
    } else if (subcategoryId === "instructions") {
      summaryLabel = "Total Directives";
      const inst = await LifeInstruction.find({}).populate("assignedPersonId", "name relation").lean();
      for (const i of inst as any[]) {
        summaryCount++;
        records.push({
          id: String(i._id),
          categoryId,
          subcategoryId,
          title: i.title,
          subtitle: `Directive: ${i.instructionType || "General"}\nRecipient: ${i.assignedPersonId?.name || "Successor"}`,
          status: "active",
          statusColor: "sky",
          notes: i.detailedInstruction || "",
          details: {
            "Instruction Title": i.title,
            Type: i.instructionType || "General",
            "Assigned Recipient": i.assignedPersonId?.name || "Designated Successor",
          },
        });
      }
    } else if (subcategoryId === "emergency") {
      summaryLabel = "Total Emergency Protocols";
      const contacts = await LifeContact.find({ category: "emergency" }).lean();
      for (const c of contacts as any[]) {
        summaryCount++;
        records.push({
          id: String(c._id),
          categoryId,
          subcategoryId,
          title: c.name,
          subtitle: `Emergency Contact\nPhone: ${c.phone || "On File"}`,
          status: "active",
          statusColor: "red",
          details: {
            "Contact Name": c.name,
            Role: c.role || "Emergency Trustee",
            Phone: c.phone || "-",
            Email: c.email || "-",
          },
        });
      }
    } else if (subcategoryId === "legacy_legal") {
      summaryLabel = "Total Legacy Messages";
      const msgs = await LifeLegacyMessage.find({}).populate("assignedRecipientIds", "name relation").lean();
      for (const m of msgs as any[]) {
        summaryCount++;
        records.push({
          id: String(m._id),
          categoryId,
          subcategoryId,
          title: m.title,
          subtitle: `Release Trigger: ${m.releaseTrigger?.replace("_", " ") || "Posthumous"}\nSealed Letter`,
          status: "sealed",
          statusColor: "rose",
          details: {
            "Letter Title": m.title,
            "Release Trigger": m.releaseTrigger || "Guardian Consensus",
            "Sealed Status": "Condition-Sealed",
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Tools & Support
  // ─────────────────────────────────────────────────────────────
  else if (categoryId === "tools_support") {
    summaryLabel = "System Utilities";
    records.push({
      id: "system_settings",
      categoryId,
      subcategoryId: "app_settings",
      title: "Master Application Settings",
      subtitle: "Language, PIN, Currencies and Conceal Timers",
      status: "active",
      statusColor: "slate",
      details: {
        "Default Currency": "BDT (৳)",
        "Vault Conceal Timer": "30 Seconds",
        "Master PIN": "scrypt Salted Hash Enabled",
      },
    });
  }

  // Find filter tabs from category configuration
  const catConfig = WORKSPACE_CATEGORIES.find((c) => c.id === categoryId);
  const subConfig = catConfig?.subcategories.find((s) => s.id === subcategoryId);
  const filterTabs = subConfig?.filterTabs || [{ id: "all", label: "All" }];

  return {
    records: JSON.parse(JSON.stringify(records)),
    totalSummary: {
      label: summaryLabel,
      amount: summaryAmount > 0 ? summaryAmount : undefined,
      count: summaryCount,
      currencySymbol: "৳",
    },
    filterTabs: JSON.parse(JSON.stringify(filterTabs)),
    currencySymbol: "৳",
  };
}

/**
 * Fetch a single record detail
 */
export async function getWorkspaceRecordDetail(params: {
  categoryId: string;
  subcategoryId: string;
  recordId: string;
}): Promise<WorkspaceRecordItem | null> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) return null;

  const { categoryId, subcategoryId, recordId } = params;

  // Query matching module records
  const result = await getWorkspaceModuleRecords({
    categoryId,
    subcategoryId,
  });

  const record = result.records.find((r) => r.id === recordId);
  return record ? JSON.parse(JSON.stringify(record)) : null;
}

/**
 * Create or edit a workspace record
 */
export async function saveWorkspaceRecord(params: {
  categoryId: string;
  subcategoryId: string;
  recordId?: string;
  data: Record<string, any>;
}) {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    throw new Error("Forbidden: Only Owners or Admins can modify workspace records.");
  }

  const { categoryId, subcategoryId, recordId, data } = params;

  if (categoryId === "finance_assets") {
    if (subcategoryId === "cash_bank" || subcategoryId === "assets" || subcategoryId === "investments") {
      const isBank = subcategoryId === "cash_bank";
      const isInvest = subcategoryId === "investments";
      const category = isBank ? "bank_balance" : isInvest ? "business_investment" : data.assetCategory || "property";

      if (recordId) {
        await LifeAsset.findByIdAndUpdate(recordId, {
          name: data.name || data.title,
          value: Number(data.value || data.amount) || 0,
          location: data.branch || data.location || "",
          currency: data.currency || "BDT",
          notes: data.notes || "",
        });
      } else {
        await LifeAsset.create({
          name: data.name || data.title,
          category,
          value: Number(data.value || data.amount) || 0,
          location: data.branch || data.location || "",
          currency: data.currency || "BDT",
          notes: data.notes || "",
          status: "active",
        });
      }
    } else if (subcategoryId === "income" || subcategoryId === "expenses") {
      const type = subcategoryId === "income" ? "income" : "expense";
      await LifeTransaction.create({
        type,
        amount: Number(data.amount) || 0,
        category: data.category || data.title || (type === "income" ? "Income" : "Expense"),
        paymentMethod: data.account || "Bank Transfer",
        notes: data.notes || "",
        date: data.date ? new Date(data.date) : new Date(),
      });
    } else if (subcategoryId === "loans_given" || subcategoryId === "liabilities") {
      const type = subcategoryId === "loans_given" ? "given" : "taken";
      const amount = Number(data.amount) || 0;
      await LifeMoneyRecord.create({
        type,
        personName: data.personName || "Counterparty",
        personId: data.personId && data.personId !== "none" ? data.personId : undefined,
        amount,
        remainingAmount: amount,
        paidAmount: 0,
        currency: "BDT",
        purpose: data.title || "Loan Record",
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes || "",
        status: "active",
      });
    }
  }

  await logLifeActivity({
    action: recordId ? "UPDATE_WORKSPACE_RECORD" : "CREATE_WORKSPACE_RECORD",
    resourceType: subcategoryId,
    resourceId: recordId || "new",
    resourceName: data.title || data.name || subcategoryId,
    details: `${recordId ? "Updated" : "Created"} ${subcategoryId} record in ${categoryId}`,
  });

  revalidatePath("/workspace");
  revalidatePath("/");
  return { success: true };
}
