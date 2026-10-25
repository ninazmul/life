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
import LifeFamilyCommunityRecord from "@/lib/database/models/lifeFamilyCommunityRecord.model";
import LifeWorkBusinessRecord from "@/lib/database/models/lifeWorkBusinessRecord.model";
import LifeSisCareRecord from "@/lib/database/models/lifeSisCareRecord.model";
import { encryptVaultSecret, decryptVaultSecret } from "@/lib/life/crypto";
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

// ─────────────────────────────────────────────────────────────
// Family & Community Unified Management Server Actions
// ─────────────────────────────────────────────────────────────

export interface FamilyCommunityRecordDTO {
  id: string;
  recordType: "family_care" | "kids" | "community";
  title: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  relatedPersonAvatar?: string;
  subType?: string;
  description: string;
  institution?: string;
  assignedPersonId?: string;
  assignedPersonName?: string;
  startDate?: string;
  dueDate?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "active" | "pending" | "action_required" | "completed";
  notes?: string;
  attachments?: Array<{
    name: string;
    url?: string;
    size?: string;
    date?: string;
    type?: string;
  }>;
  linkedFinancialId?: string;
  linkedDocumentId?: string;
  linkedResponsibilityId?: string;
  accessPermission?: string;
  history?: Array<{
    action: string;
    performedBy: string;
    timestamp: string;
    details?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface FamilyCommunityResponse {
  records: FamilyCommunityRecordDTO[];
  counts: {
    all: number;
    active: number;
    pending: number;
    completed: number;
  };
  peopleList: Array<{
    id: string;
    name: string;
    relation?: string;
    avatarUrl?: string;
  }>;
}

async function ensureFamilyCommunitySeed(userId: string) {
  const count = await LifeFamilyCommunityRecord.countDocuments();
  if (count > 0) return;

  const seedRecords = [
    {
      recordType: "family_care",
      title: "Mother's Medical Care",
      relatedPersonName: "Mother",
      subType: "Health Care",
      status: "action_required",
      priority: "high",
      dueDate: new Date("2026-10-28"),
      assignedPersonName: "Shahidul (Owner)",
      description: "Regular medical checkup, medication and health monitoring for mother.",
      attachments: [
        { name: "Doctor Report.pdf", size: "1.2 MB", date: "Oct 10, 2025", type: "pdf" },
        { name: "Prescription.jpg", size: "0.8 MB", date: "Sep 28, 2025", type: "image" },
      ],
      accessPermission: "family_shared",
      createdBy: userId,
      history: [
        { action: "Created", performedBy: "Shahidul (Owner)", timestamp: new Date("2026-10-20"), details: "Initial care plan scheduled." },
      ],
    },
    {
      recordType: "kids",
      title: "Rahaf Education Plan",
      relatedPersonName: "Rahaf",
      subType: "Education",
      status: "active",
      priority: "medium",
      dueDate: new Date("2026-11-10"),
      description: "Class 2, School Program and ongoing early care milestone tracking.",
      institution: "Scholastica International",
      assignedPersonName: "Shahidul (Owner)",
      accessPermission: "private",
      createdBy: userId,
      history: [
        { action: "Created", performedBy: "Shahidul (Owner)", timestamp: new Date("2026-10-18") },
      ],
    },
    {
      recordType: "family_care",
      title: "Family Home Maintenance",
      relatedPersonName: "Family",
      subType: "Living Arrangement",
      status: "pending",
      priority: "medium",
      dueDate: new Date("2026-12-01"),
      assignedPersonName: "Shahidul (Owner)",
      description: "Quarterly inspection and servicing for family residence electrical and plumbing fixtures.",
      accessPermission: "family_shared",
      createdBy: userId,
    },
    {
      recordType: "community",
      title: "Community Support",
      relatedPersonName: "Relative",
      subType: "Financial Help",
      status: "completed",
      priority: "low",
      dueDate: new Date("2026-10-15"),
      assignedPersonName: "Shahidul (Owner)",
      description: "Monthly community assistance contribution and educational sponsorship.",
      accessPermission: "owner_only",
      createdBy: userId,
    },
    {
      recordType: "kids",
      title: "Abdullah",
      relatedPersonName: "Abdullah",
      subType: "Education",
      status: "active",
      priority: "medium",
      dueDate: new Date("2026-11-15"),
      institution: "Class 2, School Program",
      description: "Primary curriculum progress, Quran tutor scheduling and martial arts classes.",
      accessPermission: "family_shared",
      createdBy: userId,
    },
    {
      recordType: "kids",
      title: "Kids Future Plan",
      relatedPersonName: "Both Kids",
      subType: "Guardianship",
      status: "pending",
      priority: "high",
      dueDate: new Date("2027-01-10"),
      description: "Comprehensive guardianship directives, education trust allocation and emergency protocols.",
      accessPermission: "guardian_accessible",
      createdBy: userId,
    },
  ];

  await LifeFamilyCommunityRecord.insertMany(seedRecords);
}

export async function getFamilyCommunityRecords(params?: {
  recordType?: "all" | "family_care" | "kids" | "community";
  status?: string;
  search?: string;
}): Promise<FamilyCommunityResponse> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) {
    return {
      records: [],
      counts: { all: 0, active: 0, pending: 0, completed: 0 },
      peopleList: [],
    };
  }

  // Ensure seed data exists
  await ensureFamilyCommunitySeed(auth.userId || "owner");

  const query: Record<string, any> = {};

  // Record type filter (unless "all")
  if (params?.recordType && params.recordType !== "all") {
    query.recordType = params.recordType;
  }

  // Search filter
  if (params?.search?.trim()) {
    const s = new RegExp(params.search.trim(), "i");
    query.$or = [
      { title: s },
      { relatedPersonName: s },
      { subType: s },
      { description: s },
      { institution: s },
      { notes: s },
    ];
  }

  // Calculate status counts on the current recordType selection
  const countQuery = { ...query };
  delete countQuery.status;

  const allMatching = await LifeFamilyCommunityRecord.find(countQuery).lean();
  const counts = {
    all: allMatching.length,
    active: allMatching.filter((r: any) => r.status === "active" || r.status === "action_required").length,
    pending: allMatching.filter((r: any) => r.status === "pending").length,
    completed: allMatching.filter((r: any) => r.status === "completed").length,
  };

  // Apply status filter if specified and not "all"
  if (params?.status && params.status !== "all") {
    if (params.status === "active") {
      query.status = { $in: ["active", "action_required"] };
    } else {
      query.status = params.status;
    }
  }

  const rawDocs = await LifeFamilyCommunityRecord.find(query)
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  // Load existing people directory for dropdowns and name resolution
  const people = await LifePerson.find({ status: { $ne: "archived" } })
    .select("_id name relation avatarUrl phone email")
    .sort({ name: 1 })
    .lean();

  const peopleList = people.map((p: any) => ({
    id: String(p._id),
    name: p.name,
    relation: p.relation,
    avatarUrl: p.avatarUrl,
  }));

  const records: FamilyCommunityRecordDTO[] = (rawDocs as any[]).map((doc) => ({
    id: String(doc._id),
    recordType: doc.recordType,
    title: doc.title,
    relatedPersonId: doc.relatedPersonId ? String(doc.relatedPersonId) : undefined,
    relatedPersonName: doc.relatedPersonName || "",
    relatedPersonAvatar: doc.relatedPersonAvatar || "",
    subType: doc.subType || "",
    description: doc.description || "",
    institution: doc.institution || "",
    assignedPersonId: doc.assignedPersonId ? String(doc.assignedPersonId) : undefined,
    assignedPersonName: doc.assignedPersonName || "",
    startDate: doc.startDate ? new Date(doc.startDate).toISOString() : undefined,
    dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString() : undefined,
    priority: doc.priority || "medium",
    status: doc.status || "active",
    notes: doc.notes || "",
    attachments: doc.attachments || [],
    linkedFinancialId: doc.linkedFinancialId ? String(doc.linkedFinancialId) : undefined,
    linkedDocumentId: doc.linkedDocumentId ? String(doc.linkedDocumentId) : undefined,
    linkedResponsibilityId: doc.linkedResponsibilityId ? String(doc.linkedResponsibilityId) : undefined,
    accessPermission: doc.accessPermission || "private",
    history: (doc.history || []).map((h: any) => ({
      action: h.action,
      performedBy: h.performedBy,
      timestamp: new Date(h.timestamp).toISOString(),
      details: h.details,
    })),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  }));

  return {
    records: JSON.parse(JSON.stringify(records)),
    counts,
    peopleList: JSON.parse(JSON.stringify(peopleList)),
  };
}

export async function saveFamilyCommunityRecord(data: {
  id?: string;
  recordType: "family_care" | "kids" | "community";
  title: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  subType?: string;
  description?: string;
  institution?: string;
  assignedPersonId?: string;
  assignedPersonName?: string;
  startDate?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "active" | "pending" | "action_required" | "completed";
  notes?: string;
  accessPermission?: "private" | "owner_only" | "family_shared" | "guardian_accessible";
  attachments?: Array<{ name: string; url?: string; size?: string; date?: string; type?: string }>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Forbidden: Unauthorized to save records." };
    }

    let personName = data.relatedPersonName?.trim() || "";
    if (data.relatedPersonId && !personName) {
      const person = await LifePerson.findById(data.relatedPersonId).lean();
      if (person) personName = (person as any).name;
    }

    const payload: Record<string, any> = {
      recordType: data.recordType,
      title: data.title.trim(),
      relatedPersonId: data.relatedPersonId && data.relatedPersonId !== "none" ? data.relatedPersonId : undefined,
      relatedPersonName: personName,
      subType: data.subType?.trim() || "",
      description: data.description?.trim() || "",
      institution: data.institution?.trim() || "",
      assignedPersonId: data.assignedPersonId && data.assignedPersonId !== "none" ? data.assignedPersonId : undefined,
      assignedPersonName: data.assignedPersonName?.trim() || "",
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      priority: data.priority || "medium",
      status: data.status || "active",
      notes: data.notes?.trim() || "",
      accessPermission: data.accessPermission || "private",
    };

    if (data.attachments) {
      payload.attachments = data.attachments;
    }

    let savedDoc: any;
    if (data.id) {
      payload.$push = {
        history: {
          action: "Updated",
          performedBy: auth.name || auth.email || "Admin",
          timestamp: new Date(),
          details: `Updated ${data.title}`,
        },
      };
      savedDoc = await LifeFamilyCommunityRecord.findByIdAndUpdate(data.id, payload, { new: true });
    } else {
      payload.createdBy = auth.userId || "owner";
      payload.history = [
        {
          action: "Created",
          performedBy: auth.name || auth.email || "Admin",
          timestamp: new Date(),
          details: `Created new ${data.recordType} record`,
        },
      ];
      savedDoc = await LifeFamilyCommunityRecord.create(payload);
    }

    await logLifeActivity({
      action: data.id ? "UPDATE_WORKSPACE_RECORD" : "CREATE_WORKSPACE_RECORD",
      resourceType: data.recordType,
      resourceId: String(savedDoc._id),
      resourceName: data.title,
      details: `${data.id ? "Updated" : "Created"} ${data.recordType} record: ${data.title}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true, id: String(savedDoc._id) };
  } catch (err: any) {
    console.error("saveFamilyCommunityRecord error:", err);
    return { success: false, error: err.message || "Failed to save record" };
  }
}

export async function deleteFamilyCommunityRecord(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Forbidden: Unauthorized to delete records." };
    }

    const doc = await LifeFamilyCommunityRecord.findByIdAndDelete(id);
    if (doc) {
      await logLifeActivity({
        action: "DELETE_WORKSPACE_RECORD",
        resourceType: doc.recordType,
        resourceId: id,
        resourceName: doc.title,
        details: `Deleted ${doc.recordType} record: ${doc.title}`,
      });
    }

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("deleteFamilyCommunityRecord error:", err);
    return { success: false, error: err.message || "Failed to delete record" };
  }
}

export async function updateFamilyCommunityStatus(
  id: string,
  status: "active" | "pending" | "action_required" | "completed"
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const doc = await LifeFamilyCommunityRecord.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          history: {
            action: `Status changed to ${status}`,
            performedBy: auth.name || auth.email || "User",
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (doc) {
      await logLifeActivity({
        action: "STATUS_CHANGE_WORKSPACE_RECORD",
        resourceType: doc.recordType,
        resourceId: id,
        resourceName: doc.title,
        details: `Changed status to ${status} for ${doc.title}`,
      });
    }

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("updateFamilyCommunityStatus error:", err);
    return { success: false, error: err.message || "Failed to update status" };
  }
}

// ─────────────────────────────────────────────────────────────
// Work & Business Unified Management Server Actions
// ─────────────────────────────────────────────────────────────

export interface WorkBusinessRecordDTO {
  id: string;
  recordType: "staff_office" | "business" | "projects";
  subType?: string;
  title: string;
  subtitle?: string;
  description: string;
  status: "active" | "in_progress" | "pending" | "planning" | "completed" | "inactive";
  priority?: "low" | "medium" | "high" | "urgent";

  relatedBusinessId?: string;
  relatedBusinessName?: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  relatedPersonAvatar?: string;
  responsiblePersonId?: string;
  responsiblePersonName?: string;

  designation?: string;
  department?: string;
  salaryReference?: string;

  country?: string;
  city?: string;
  address?: string;
  registrationNumber?: string;
  ownershipType?: string;
  owners: Array<{
    personId?: string;
    name: string;
    percentage: number;
    role?: string;
    avatarUrl?: string;
  }>;

  importantDate?: string;
  startDate?: string;
  endDate?: string;

  budgetReference?: string;
  milestones: Array<{
    title: string;
    description?: string;
    targetDate?: string;
    status: "planned" | "in_progress" | "completed";
    responsiblePersonName?: string;
  }>;

  linkedDocuments: Array<{
    name: string;
    url?: string;
    size?: string;
    date?: string;
    type?: string;
  }>;
  linkedFinancials: Array<{
    title: string;
    institution?: string;
    accountNumber?: string;
    amount?: number;
    type?: string;
  }>;

  notes?: string;
  accessPermission?: "private" | "owner_only" | "team_shared" | "guardian_accessible";
  history?: Array<{
    action: string;
    performedBy: string;
    timestamp: string;
    details?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkBusinessResponse {
  records: WorkBusinessRecordDTO[];
  counts: {
    all: number;
    active: number;
    pending: number;
    completed: number;
  };
  peopleList: Array<{
    id: string;
    name: string;
    relation?: string;
    avatarUrl?: string;
  }>;
  businessList: Array<{
    id: string;
    name: string;
  }>;
}

async function ensureWorkBusinessSeed(userId: string) {
  const count = await LifeWorkBusinessRecord.countDocuments();
  if (count > 0) return;

  const seedRecords = [
    {
      recordType: "staff_office",
      subType: "staff",
      title: "Sabbir Employment Record",
      subtitle: "Staff & Office • Employee Profile",
      relatedPersonName: "Sabbir Ahmed",
      designation: "Senior Operations Lead",
      relatedBusinessName: "GESN",
      status: "active",
      importantDate: new Date("2020-01-15"),
      description: "Full-time employment managing operations and client delivery across regional teams.",
      accessPermission: "owner_only",
      createdBy: userId,
      history: [
        { action: "Created", performedBy: "Shahidul (Owner)", timestamp: new Date("2020-01-15"), details: "Employment agreement signed." },
      ],
    },
    {
      recordType: "business",
      subType: "Technology Company",
      title: "GESN",
      subtitle: "IT Services & Technology Solutions",
      status: "active",
      importantDate: new Date("2019-03-01"),
      country: "Bangladesh",
      city: "Dhaka",
      ownershipType: "Private Limited",
      owners: [
        { name: "Shahidul", percentage: 70, role: "Founder & CEO" },
        { name: "Rahat", percentage: 30, role: "Co-Founder & CTO" },
      ],
      description: "GESN is a technology company providing IT services, software solutions and digital transformation support for businesses.",
      linkedDocuments: [
        { name: "Trade License.pdf", size: "1.2 MB", date: "Apr 15, 2019", type: "pdf" },
        { name: "Office Lease Agreement", size: "0.8 MB", date: "Mar 10, 2019", type: "doc" },
      ],
      linkedFinancials: [
        { title: "Bank Account - GESN", institution: "BRAC Bank", accountNumber: "•••• 4521" },
      ],
      accessPermission: "owner_only",
      createdBy: userId,
      history: [
        { action: "Created", performedBy: "Shahidul (Owner)", timestamp: new Date("2019-03-01") },
      ],
    },
    {
      recordType: "business",
      subType: "Technology Solutions",
      title: "SiS Link",
      subtitle: "Technology Solutions",
      status: "active",
      importantDate: new Date("2021-06-12"),
      country: "Bangladesh",
      city: "Dhaka",
      ownershipType: "Partnership",
      owners: [
        { name: "Shahidul", percentage: 60, role: "Managing Partner" },
        { name: "Partner Associate", percentage: 40, role: "Partner" },
      ],
      description: "Digital networking infrastructure and connectivity provider for enterprise clients.",
      accessPermission: "owner_only",
      createdBy: userId,
    },
    {
      recordType: "projects",
      subType: "Infrastructure",
      title: "Network Expansion Project",
      subtitle: "Projects • Infrastructure",
      relatedBusinessName: "GESN",
      responsiblePersonName: "Rahat (Responsible)",
      status: "in_progress",
      importantDate: new Date("2026-07-20"),
      description: "Expanding core datacenter bandwidth and regional routing nodes for failover redundancy.",
      milestones: [
        { title: "Procure hardware", status: "completed" },
        { title: "Install router racks", status: "in_progress" },
        { title: "Fiber connection testing", status: "planned" },
      ],
      accessPermission: "team_shared",
      createdBy: userId,
    },
    {
      recordType: "staff_office",
      subType: "office",
      title: "Uttara Office Setup",
      subtitle: "Staff & Office • Office & Facility",
      relatedBusinessName: "SiS Link",
      responsiblePersonName: "Shahidul (Owner)",
      status: "pending",
      importantDate: new Date("2026-12-10"),
      country: "Bangladesh",
      city: "Dhaka",
      address: "Sector 3, Uttara, Dhaka",
      description: "New branch office lease negotiation, interior fit-out, and high-speed fiber termination.",
      accessPermission: "owner_only",
      createdBy: userId,
    },
    {
      recordType: "projects",
      subType: "Product Development",
      title: "Life VAULT Development",
      subtitle: "Projects • Product Development",
      responsiblePersonName: "Shahidul (Project Manager)",
      status: "active",
      importantDate: new Date("2026-12-31"),
      description: "Core Life Command Center roadmap development, encryption vault and unified workspace.",
      milestones: [
        { title: "Dashboard slider release", status: "completed" },
        { title: "Workspace category architecture", status: "completed" },
        { title: "Security audit & access keys", status: "in_progress" },
      ],
      accessPermission: "owner_only",
      createdBy: userId,
    },
    {
      recordType: "projects",
      subType: "Infrastructure",
      title: "Server Expansion",
      subtitle: "Projects • Infrastructure",
      responsiblePersonName: "Rahat (Responsible)",
      status: "in_progress",
      importantDate: new Date("2026-08-15"),
      description: "High availability Kubernetes cluster deployment and automated snapshot replication.",
      milestones: [
        { title: "Cluster provisioning", status: "completed" },
        { title: "Database sharding", status: "in_progress" },
      ],
      accessPermission: "team_shared",
      createdBy: userId,
    },
    {
      recordType: "projects",
      subType: "Office & Facility",
      title: "Office Relocation",
      subtitle: "Projects • Office & Facility",
      responsiblePersonName: "Shahidul (Project Manager)",
      status: "planning",
      importantDate: new Date("2026-11-01"),
      description: "Moving corporate headquarters to new tech park facility with dedicated server rooms.",
      milestones: [
        { title: "Site inspection", status: "completed" },
        { title: "Lease signing", status: "in_progress" },
      ],
      accessPermission: "owner_only",
      createdBy: userId,
    },
    {
      recordType: "projects",
      subType: "Legal & Partnership",
      title: "Partner Settlement Setup",
      subtitle: "Projects • Legal & Partnership",
      responsiblePersonName: "Abdullah (Responsible)",
      status: "completed",
      importantDate: new Date("2025-03-10"),
      description: "Legal entity equity documentation and partnership deed finalization with legal counsel.",
      milestones: [
        { title: "Legal review", status: "completed" },
        { title: "Notarization", status: "completed" },
      ],
      accessPermission: "owner_only",
      createdBy: userId,
    },
  ];

  await LifeWorkBusinessRecord.insertMany(seedRecords);
}

export async function getWorkBusinessRecords(params?: {
  recordType?: "all" | "staff_office" | "business" | "projects";
  status?: string;
  search?: string;
}): Promise<WorkBusinessResponse> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) {
    return {
      records: [],
      counts: { all: 0, active: 0, pending: 0, completed: 0 },
      peopleList: [],
      businessList: [],
    };
  }

  // Ensure initial demonstration data
  await ensureWorkBusinessSeed(auth.userId || "owner");

  const query: Record<string, any> = {};

  if (params?.recordType && params.recordType !== "all") {
    query.recordType = params.recordType;
  }

  if (params?.search?.trim()) {
    const s = new RegExp(params.search.trim(), "i");
    query.$or = [
      { title: s },
      { subtitle: s },
      { subType: s },
      { description: s },
      { relatedBusinessName: s },
      { relatedPersonName: s },
      { responsiblePersonName: s },
      { designation: s },
      { notes: s },
    ];
  }

  // Calculate status counts on the current recordType selection
  const countQuery = { ...query };
  delete countQuery.status;

  const allMatching = await LifeWorkBusinessRecord.find(countQuery).lean();
  const counts = {
    all: allMatching.length,
    active: allMatching.filter(
      (r: any) => r.status === "active" || r.status === "in_progress" || r.status === "planning"
    ).length,
    pending: allMatching.filter((r: any) => r.status === "pending").length,
    completed: allMatching.filter((r: any) => r.status === "completed").length,
  };

  // Apply status filter if specified and not "all"
  if (params?.status && params.status !== "all") {
    if (params.status === "active") {
      query.status = { $in: ["active", "in_progress", "planning"] };
    } else {
      query.status = params.status;
    }
  }

  const rawDocs = await LifeWorkBusinessRecord.find(query)
    .sort({ importantDate: -1, createdAt: -1 })
    .lean();

  // Load existing people directory for owner/partner/staff dropdowns
  const people = await LifePerson.find({ status: { $ne: "archived" } })
    .select("_id name relation avatarUrl phone email")
    .sort({ name: 1 })
    .lean();

  const peopleList = people.map((p: any) => ({
    id: String(p._id),
    name: p.name,
    relation: p.relation,
    avatarUrl: p.avatarUrl,
  }));

  // Load registered businesses
  const businesses = await LifeWorkBusinessRecord.find({ recordType: "business" })
    .select("_id title")
    .sort({ title: 1 })
    .lean();

  const businessList = businesses.map((b: any) => ({
    id: String(b._id),
    name: b.title,
  }));

  const records: WorkBusinessRecordDTO[] = (rawDocs as any[]).map((doc) => ({
    id: String(doc._id),
    recordType: doc.recordType,
    subType: doc.subType || "",
    title: doc.title,
    subtitle: doc.subtitle || "",
    description: doc.description || "",
    status: doc.status || "active",
    priority: doc.priority || "medium",
    relatedBusinessId: doc.relatedBusinessId ? String(doc.relatedBusinessId) : undefined,
    relatedBusinessName: doc.relatedBusinessName || "",
    relatedPersonId: doc.relatedPersonId ? String(doc.relatedPersonId) : undefined,
    relatedPersonName: doc.relatedPersonName || "",
    relatedPersonAvatar: doc.relatedPersonAvatar || "",
    responsiblePersonId: doc.responsiblePersonId ? String(doc.responsiblePersonId) : undefined,
    responsiblePersonName: doc.responsiblePersonName || "",
    designation: doc.designation || "",
    department: doc.department || "",
    salaryReference: doc.salaryReference || "",
    country: doc.country || "",
    city: doc.city || "",
    address: doc.address || "",
    registrationNumber: doc.registrationNumber || "",
    ownershipType: doc.ownershipType || "Private Limited",
    owners: (doc.owners || []).map((o: any) => ({
      personId: o.personId ? String(o.personId) : undefined,
      name: o.name,
      percentage: o.percentage || 0,
      role: o.role || "",
      avatarUrl: o.avatarUrl || "",
    })),
    importantDate: doc.importantDate ? new Date(doc.importantDate).toISOString() : undefined,
    startDate: doc.startDate ? new Date(doc.startDate).toISOString() : undefined,
    endDate: doc.endDate ? new Date(doc.endDate).toISOString() : undefined,
    budgetReference: doc.budgetReference || "",
    milestones: (doc.milestones || []).map((m: any) => ({
      title: m.title,
      description: m.description || "",
      targetDate: m.targetDate ? new Date(m.targetDate).toISOString() : undefined,
      status: m.status || "planned",
      responsiblePersonName: m.responsiblePersonName || "",
    })),
    linkedDocuments: doc.linkedDocuments || [],
    linkedFinancials: doc.linkedFinancials || [],
    notes: doc.notes || "",
    accessPermission: doc.accessPermission || "private",
    history: (doc.history || []).map((h: any) => ({
      action: h.action,
      performedBy: h.performedBy,
      timestamp: new Date(h.timestamp).toISOString(),
      details: h.details,
    })),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  }));

  return {
    records: JSON.parse(JSON.stringify(records)),
    counts,
    peopleList: JSON.parse(JSON.stringify(peopleList)),
    businessList: JSON.parse(JSON.stringify(businessList)),
  };
}

export async function saveWorkBusinessRecord(data: {
  id?: string;
  recordType: "staff_office" | "business" | "projects";
  subType?: string;
  title: string;
  subtitle?: string;
  description?: string;
  status?: "active" | "in_progress" | "pending" | "planning" | "completed" | "inactive";
  priority?: "low" | "medium" | "high" | "urgent";

  relatedBusinessId?: string;
  relatedBusinessName?: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  responsiblePersonId?: string;
  responsiblePersonName?: string;

  designation?: string;
  department?: string;
  salaryReference?: string;

  country?: string;
  city?: string;
  address?: string;
  registrationNumber?: string;
  ownershipType?: string;
  owners?: Array<{
    personId?: string;
    name: string;
    percentage: number;
    role?: string;
  }>;

  importantDate?: string;
  startDate?: string;
  endDate?: string;

  budgetReference?: string;
  milestones?: Array<{
    title: string;
    description?: string;
    targetDate?: string;
    status: "planned" | "in_progress" | "completed";
  }>;

  linkedDocuments?: Array<{ name: string; url?: string; size?: string; date?: string; type?: string }>;
  linkedFinancials?: Array<{ title: string; institution?: string; accountNumber?: string; amount?: number; type?: string }>;
  notes?: string;
  accessPermission?: "private" | "owner_only" | "team_shared" | "guardian_accessible";
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Forbidden: Unauthorized to save records." };
    }

    let personName = data.relatedPersonName?.trim() || "";
    if (data.relatedPersonId && !personName) {
      const person = await LifePerson.findById(data.relatedPersonId).lean();
      if (person) personName = (person as any).name;
    }

    const payload: Record<string, any> = {
      recordType: data.recordType,
      subType: data.subType?.trim() || "",
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || "",
      description: data.description?.trim() || "",
      status: data.status || "active",
      priority: data.priority || "medium",
      relatedBusinessId: data.relatedBusinessId && data.relatedBusinessId !== "none" ? data.relatedBusinessId : undefined,
      relatedBusinessName: data.relatedBusinessName?.trim() || "",
      relatedPersonId: data.relatedPersonId && data.relatedPersonId !== "none" ? data.relatedPersonId : undefined,
      relatedPersonName: personName,
      responsiblePersonId: data.responsiblePersonId && data.responsiblePersonId !== "none" ? data.responsiblePersonId : undefined,
      responsiblePersonName: data.responsiblePersonName?.trim() || "",
      designation: data.designation?.trim() || "",
      department: data.department?.trim() || "",
      salaryReference: data.salaryReference?.trim() || "",
      country: data.country?.trim() || "",
      city: data.city?.trim() || "",
      address: data.address?.trim() || "",
      registrationNumber: data.registrationNumber?.trim() || "",
      ownershipType: data.ownershipType || "Private Limited",
      importantDate: data.importantDate ? new Date(data.importantDate) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      budgetReference: data.budgetReference?.trim() || "",
      notes: data.notes?.trim() || "",
      accessPermission: data.accessPermission || "private",
    };

    if (data.owners) {
      payload.owners = data.owners;
    }
    if (data.milestones) {
      payload.milestones = data.milestones.map((m) => ({
        ...m,
        targetDate: m.targetDate ? new Date(m.targetDate) : undefined,
      }));
    }
    if (data.linkedDocuments) {
      payload.linkedDocuments = data.linkedDocuments;
    }
    if (data.linkedFinancials) {
      payload.linkedFinancials = data.linkedFinancials;
    }

    let savedDoc: any;
    if (data.id) {
      payload.$push = {
        history: {
          action: "Updated",
          performedBy: auth.name || auth.email || "Admin",
          timestamp: new Date(),
          details: `Updated ${data.title}`,
        },
      };
      savedDoc = await LifeWorkBusinessRecord.findByIdAndUpdate(data.id, payload, { new: true });
    } else {
      payload.createdBy = auth.userId || "owner";
      payload.history = [
        {
          action: "Created",
          performedBy: auth.name || auth.email || "Admin",
          timestamp: new Date(),
          details: `Created new ${data.recordType} record`,
        },
      ];
      savedDoc = await LifeWorkBusinessRecord.create(payload);
    }

    await logLifeActivity({
      action: data.id ? "UPDATE_WORKSPACE_RECORD" : "CREATE_WORKSPACE_RECORD",
      resourceType: data.recordType,
      resourceId: String(savedDoc._id),
      resourceName: data.title,
      details: `${data.id ? "Updated" : "Created"} ${data.recordType} record: ${data.title}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true, id: String(savedDoc._id) };
  } catch (err: any) {
    console.error("saveWorkBusinessRecord error:", err);
    return { success: false, error: err.message || "Failed to save record" };
  }
}

export async function deleteWorkBusinessRecord(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Forbidden: Unauthorized to delete records." };
    }

    const doc = await LifeWorkBusinessRecord.findByIdAndDelete(id);
    if (doc) {
      await logLifeActivity({
        action: "DELETE_WORKSPACE_RECORD",
        resourceType: doc.recordType,
        resourceId: id,
        resourceName: doc.title,
        details: `Deleted ${doc.recordType} record: ${doc.title}`,
      });
    }

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("deleteWorkBusinessRecord error:", err);
    return { success: false, error: err.message || "Failed to delete record" };
  }
}

export async function updateWorkBusinessStatus(
  id: string,
  status: "active" | "in_progress" | "pending" | "planning" | "completed" | "inactive"
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    const doc = await LifeWorkBusinessRecord.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          history: {
            action: `Status changed to ${status}`,
            performedBy: auth.name || auth.email || "User",
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    if (doc) {
      await logLifeActivity({
        action: "STATUS_CHANGE_WORKSPACE_RECORD",
        resourceType: doc.recordType,
        resourceId: id,
        resourceName: doc.title,
        details: `Changed status to ${status} for ${doc.title}`,
      });
    }

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("updateWorkBusinessStatus error:", err);
    return { success: false, error: err.message || "Failed to update status" };
  }
}

// ─────────────────────────────────────────────────────────────
// Finance & Assets / SiS Care Server Actions
// ─────────────────────────────────────────────────────────────

export interface SisCareRecordDTO {
  id: string;
  personId?: string;
  personName: string;
  personAvatar?: string;
  supportType: "flexible_support" | "gift";
  title: string;
  totalGiven: number;
  totalReturned: number;
  totalForgiven: number;
  remainingBalance: number;
  currency: string;
  status: "active" | "closed";
  isShared: boolean;
  isVerifiedAccount: boolean;
  paidFromAccount?: string;
  purpose?: string;
  ownerPrivateNotes?: string;
  futureInstructions?: string;
  transactions: Array<{
    id?: string;
    type: "support" | "return" | "forgiveness" | "gift";
    amount: number;
    date: string;
    account?: string;
    currency?: string;
    notes?: string;
    isShared?: boolean;
    performedBy: string;
  }>;
  forgivenessHistory: Array<{
    amount: number;
    date: string;
    reason?: string;
    performedBy: string;
  }>;
  sharedSettings: {
    isProfileAccessEnabled: boolean;
    visibleRecordIds: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UnifiedFinanceItem {
  id: string;
  recordType:
    | "cash_bank"
    | "income"
    | "expenses"
    | "loans_given"
    | "sis_care"
    | "liabilities"
    | "assets"
    | "investments"
    | "other";
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  date?: string;
  status: string;
  statusColor?: string;
  iconType: string;
  isShared?: boolean;
  sisDetails?: SisCareRecordDTO;
}

export interface FinanceAssetsResponse {
  records: UnifiedFinanceItem[];
  sisSummary: {
    flexibleBalance: number;
    giftsSupport: number;
    flexibleCount: number;
    giftsCount: number;
  };
  counts: {
    all: number;
    active: number;
    closed: number;
  };
  accountsList: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
  }>;
  peopleList: Array<{
    id: string;
    name: string;
    relation?: string;
    avatarUrl?: string;
  }>;
}

async function ensureSisCareSeed(userId: string) {
  const count = await LifeSisCareRecord.countDocuments();
  if (count > 0) return;

  const seedRecords = [
    {
      personName: "Rahim",
      supportType: "flexible_support",
      title: "Support for Rahim",
      totalGiven: 30000,
      totalReturned: 10000,
      totalForgiven: 0,
      remainingBalance: 20000,
      currency: "BDT",
      status: "active",
      isShared: true,
      isVerifiedAccount: true,
      paidFromAccount: "Cash • BDT",
      purpose: "Personal assistance and business transition buffer",
      ownerPrivateNotes: "Flexible support without fixed dates. Rahim can return whenever he is capable.",
      futureInstructions: "If incapacitated, forgive the remaining balance completely.",
      transactions: [
        {
          type: "support",
          amount: 30000,
          date: new Date("2026-10-24"),
          account: "Cash • BDT",
          currency: "BDT",
          notes: "Initial personal support buffer",
          isShared: true,
          performedBy: "Shahidul (Owner)",
        },
        {
          type: "return",
          amount: 10000,
          date: new Date("2027-01-10"),
          account: "Cash • BDT",
          currency: "BDT",
          notes: "First installment voluntary return",
          isShared: true,
          performedBy: "Shahidul (Owner)",
        },
      ],
      forgivenessHistory: [],
      sharedSettings: {
        isProfileAccessEnabled: true,
        visibleRecordIds: [],
      },
      createdBy: userId,
    },
    {
      personName: "Ahmed",
      supportType: "flexible_support",
      title: "Support for Ahmed",
      totalGiven: 15000,
      totalReturned: 0,
      totalForgiven: 0,
      remainingBalance: 15000,
      currency: "BDT",
      status: "active",
      isShared: false,
      isVerifiedAccount: false,
      paidFromAccount: "Cash • BDT",
      purpose: "Family assistance",
      ownerPrivateNotes: "Strictly private record. Do not share unless Ahmed requests verification.",
      futureInstructions: "",
      transactions: [
        {
          type: "support",
          amount: 15000,
          date: new Date("2026-09-15"),
          account: "Cash • BDT",
          currency: "BDT",
          notes: "Support given",
          isShared: false,
          performedBy: "Shahidul (Owner)",
        },
      ],
      forgivenessHistory: [],
      sharedSettings: {
        isProfileAccessEnabled: false,
        visibleRecordIds: [],
      },
      createdBy: userId,
    },
    {
      personName: "Family",
      supportType: "gift",
      title: "Family support",
      totalGiven: 5000,
      totalReturned: 0,
      totalForgiven: 0,
      remainingBalance: 0,
      currency: "BDT",
      status: "closed",
      isShared: false,
      isVerifiedAccount: false,
      paidFromAccount: "Cash • BDT",
      purpose: "Monthly living grant and medical care assistance",
      ownerPrivateNotes: "Non-repayable family gift.",
      transactions: [
        {
          type: "gift",
          amount: 5000,
          date: new Date("2026-10-01"),
          account: "Cash • BDT",
          currency: "BDT",
          notes: "Family grant",
          isShared: false,
          performedBy: "Shahidul (Owner)",
        },
      ],
      forgivenessHistory: [],
      sharedSettings: {
        isProfileAccessEnabled: false,
        visibleRecordIds: [],
      },
      createdBy: userId,
    },
  ];

  await LifeSisCareRecord.insertMany(seedRecords);
}

export async function getFinanceAssetsRecords(params?: {
  recordType?: string;
  status?: string;
  search?: string;
}): Promise<FinanceAssetsResponse> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) {
    return {
      records: [],
      sisSummary: { flexibleBalance: 0, giftsSupport: 0, flexibleCount: 0, giftsCount: 0 },
      counts: { all: 0, active: 0, closed: 0 },
      accountsList: [],
      peopleList: [],
    };
  }

  // Ensure demonstration SiS Care records exist
  await ensureSisCareSeed(auth.userId || "owner");

  const { recordType = "all", status = "all", search } = params || {};
  const searchRegex = search?.trim() ? new RegExp(search.trim(), "i") : null;

  // 1. Fetch SiS Care records
  const sisQuery: Record<string, any> = {};
  if (searchRegex) {
    sisQuery.$or = [{ personName: searchRegex }, { title: searchRegex }, { purpose: searchRegex }];
  }
  const allSisDocs = await LifeSisCareRecord.find(sisQuery).sort({ createdAt: -1 }).lean();

  // Compute SiS Care summaries
  let flexibleBalance = 0;
  let giftsSupport = 0;
  let flexibleCount = 0;
  let giftsCount = 0;

  for (const s of allSisDocs as any[]) {
    if (s.supportType === "flexible_support") {
      flexibleBalance += Number(s.remainingBalance || 0);
      flexibleCount++;
    } else {
      giftsSupport += Number(s.totalGiven || 0);
      giftsCount++;
    }
  }

  const sisDTOs: SisCareRecordDTO[] = (allSisDocs as any[]).map((d) => ({
    id: String(d._id),
    personId: d.personId ? String(d.personId) : undefined,
    personName: d.personName,
    personAvatar: d.personAvatar,
    supportType: d.supportType,
    title: d.title,
    totalGiven: d.totalGiven || 0,
    totalReturned: d.totalReturned || 0,
    totalForgiven: d.totalForgiven || 0,
    remainingBalance: d.remainingBalance || 0,
    currency: d.currency || "BDT",
    status: d.status || "active",
    isShared: Boolean(d.isShared),
    isVerifiedAccount: Boolean(d.isVerifiedAccount),
    paidFromAccount: d.paidFromAccount,
    purpose: d.purpose,
    ownerPrivateNotes: d.ownerPrivateNotes,
    futureInstructions: d.futureInstructions,
    transactions: (d.transactions || []).map((t: any) => ({
      id: String(t._id || Math.random()),
      type: t.type,
      amount: t.amount,
      date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
      account: t.account,
      currency: t.currency || "BDT",
      notes: t.notes,
      isShared: Boolean(t.isShared),
      performedBy: t.performedBy || "Owner",
    })),
    forgivenessHistory: (d.forgivenessHistory || []).map((f: any) => ({
      amount: f.amount,
      date: f.date ? new Date(f.date).toISOString() : new Date().toISOString(),
      reason: f.reason,
      performedBy: f.performedBy || "Owner",
    })),
    sharedSettings: {
      isProfileAccessEnabled: Boolean(d.sharedSettings?.isProfileAccessEnabled),
      visibleRecordIds: d.sharedSettings?.visibleRecordIds || [],
    },
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : undefined,
  }));

  // 2. Fetch People List
  const people = await LifePerson.find({ status: { $ne: "archived" } })
    .select("_id name relation avatarUrl")
    .sort({ name: 1 })
    .lean();

  const peopleList = people.map((p: any) => ({
    id: String(p._id),
    name: p.name,
    relation: p.relation,
    avatarUrl: p.avatarUrl,
  }));

  // 3. Fetch Accounts List (Cash & Bank from LifeAsset)
  const assetAccounts = await LifeAsset.find({
    category: { $in: ["bank_balance", "cash"] },
    status: { $ne: "disposed" },
  })
    .select("_id name category value currency")
    .sort({ value: -1 })
    .lean();

  const accountsList = [
    { id: "cash_bdt", name: "Cash • BDT", type: "cash", balance: 50000 },
    ...assetAccounts.map((a: any) => ({
      id: String(a._id),
      name: a.name,
      type: a.category,
      balance: Number(a.value || 0),
    })),
  ];

  // 4. Construct unified record list based on recordType
  const records: UnifiedFinanceItem[] = [];

  // When "sis_care" is selected:
  if (recordType === "sis_care") {
    let filteredSis = sisDTOs;
    if (status === "active") {
      filteredSis = sisDTOs.filter((s) => s.status === "active");
    } else if (status === "closed") {
      filteredSis = sisDTOs.filter((s) => s.status === "closed");
    }

    for (const s of filteredSis) {
      records.push({
        id: s.id,
        recordType: "sis_care",
        title: s.personName,
        subtitle: s.supportType === "gift" ? "Gift" : "Flexible support",
        amount: s.supportType === "gift" ? s.totalGiven : s.remainingBalance,
        currency: s.currency,
        date: s.createdAt,
        status: s.status,
        iconType: s.supportType === "gift" ? "gift" : "heart",
        isShared: s.isShared,
        sisDetails: s,
      });
    }
  } else if (recordType === "all") {
    // Show Mockup Screen 1 entries:
    // - BRAC Bank (৳ 250,000)
    // - Personal Loan (৳ 50,000)
    // - SiS Care (৳ 20,000)
    // Plus actual assets, loans, and sis records!

    // Cash & Bank cards
    if (assetAccounts.length > 0) {
      for (const a of assetAccounts as any[]) {
        records.push({
          id: String(a._id),
          recordType: "cash_bank",
          title: a.name,
          subtitle: "Cash & Bank",
          amount: Number(a.value || 0),
          currency: a.currency || "BDT",
          status: "active",
          iconType: "bank",
        });
      }
    } else {
      records.push({
        id: "mock_bank_1",
        recordType: "cash_bank",
        title: "BRAC Bank",
        subtitle: "Cash & Bank",
        amount: 250000,
        currency: "BDT",
        status: "active",
        iconType: "bank",
      });
    }

    // Loans Given
    const loans = await LifeMoneyRecord.find({ type: "given", status: { $ne: "fully_returned" } })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    if (loans.length > 0) {
      for (const l of loans as any[]) {
        records.push({
          id: String(l._id),
          recordType: "loans_given",
          title: l.purpose || "Personal Loan",
          subtitle: l.personName || "Borrower",
          amount: Number(l.remainingAmount ?? l.amount) || 0,
          currency: l.currency || "BDT",
          status: l.status || "active",
          iconType: "loan",
        });
      }
    } else {
      records.push({
        id: "mock_loan_1",
        recordType: "loans_given",
        title: "Personal Loan",
        subtitle: "Ahmed",
        amount: 50000,
        currency: "BDT",
        status: "active",
        iconType: "loan",
      });
    }

    // SiS Care active items
    const topSis = sisDTOs.filter((s) => s.supportType === "flexible_support").slice(0, 3);
    for (const s of topSis) {
      records.push({
        id: s.id,
        recordType: "sis_care",
        title: "SiS Care",
        subtitle: s.personName,
        amount: s.remainingBalance,
        currency: s.currency,
        status: s.status,
        iconType: "heart",
        isShared: s.isShared,
        sisDetails: s,
      });
    }

    // Assets & Property
    const properties = await LifeAsset.find({
      category: { $in: ["property", "vehicle", "valuable"] },
      status: "active",
    })
      .limit(3)
      .lean();

    for (const p of properties as any[]) {
      records.push({
        id: String(p._id),
        recordType: "assets",
        title: p.name,
        subtitle: "Asset & Property",
        amount: Number(p.value || 0),
        currency: p.currency || "BDT",
        status: "active",
        iconType: "property",
      });
    }

    // Liabilities
    const debts = await LifeMoneyRecord.find({ type: "taken", status: { $ne: "fully_returned" } })
      .limit(3)
      .lean();

    for (const d of debts as any[]) {
      records.push({
        id: String(d._id),
        recordType: "liabilities",
        title: d.purpose || "Borrowing",
        subtitle: `Lender: ${d.personName || "Lender"}`,
        amount: Number(d.remainingAmount ?? d.amount) || 0,
        currency: d.currency || "BDT",
        status: "active",
        iconType: "liability",
      });
    }
  } else if (recordType === "cash_bank") {
    for (const a of accountsList) {
      records.push({
        id: a.id,
        recordType: "cash_bank",
        title: a.name,
        subtitle: a.type === "cash" ? "Physical Cash" : "Savings / Current Account",
        amount: a.balance,
        currency: "BDT",
        status: "active",
        iconType: a.type === "cash" ? "wallet" : "bank",
      });
    }
  } else if (recordType === "loans_given") {
    const loans = await LifeMoneyRecord.find({ type: "given" }).sort({ date: -1 }).lean();
    for (const l of loans as any[]) {
      records.push({
        id: String(l._id),
        recordType: "loans_given",
        title: l.personName || "Borrower",
        subtitle: l.purpose || "Personal Loan",
        amount: Number(l.remainingAmount ?? l.amount) || 0,
        currency: l.currency || "BDT",
        status: l.status || "active",
        iconType: "loan",
      });
    }
  } else if (recordType === "liabilities") {
    const debts = await LifeMoneyRecord.find({ type: "taken" }).sort({ date: -1 }).lean();
    for (const d of debts as any[]) {
      records.push({
        id: String(d._id),
        recordType: "liabilities",
        title: d.purpose || "Payable Loan",
        subtitle: `Lender: ${d.personName || "Lender"}`,
        amount: Number(d.remainingAmount ?? d.amount) || 0,
        currency: d.currency || "BDT",
        status: d.status || "active",
        iconType: "liability",
      });
    }
  } else if (recordType === "income" || recordType === "expenses") {
    const type = recordType === "income" ? "income" : "expense";
    const txs = await LifeTransaction.find({ type }).sort({ date: -1 }).limit(20).lean();
    for (const t of txs as any[]) {
      records.push({
        id: String(t._id),
        recordType,
        title: t.category || (type === "income" ? "Income" : "Expense"),
        subtitle: t.paymentMethod || "Bank Transfer",
        amount: Number(t.amount || 0),
        currency: "BDT",
        date: t.date ? new Date(t.date).toISOString() : undefined,
        status: "completed",
        iconType: type === "income" ? "income" : "expense",
      });
    }
  } else if (recordType === "assets" || recordType === "investments") {
    const category = recordType === "investments" ? "business_investment" : { $in: ["property", "vehicle", "valuable"] };
    const assets = await LifeAsset.find({ category, status: { $ne: "disposed" } }).sort({ value: -1 }).lean();
    for (const a of assets as any[]) {
      records.push({
        id: String(a._id),
        recordType,
        title: a.name,
        subtitle: recordType === "investments" ? "Business Investment" : "Property / Valuable",
        amount: Number(a.value || 0),
        currency: a.currency || "BDT",
        status: "active",
        iconType: recordType === "investments" ? "investment" : "property",
      });
    }
  }

  // Calculate status counts
  const counts = {
    all: records.length,
    active: records.filter((r) => r.status === "active").length,
    closed: records.filter((r) => r.status === "closed" || r.status === "fully_returned").length,
  };

  return {
    records: JSON.parse(JSON.stringify(records)),
    sisSummary: {
      flexibleBalance,
      giftsSupport,
      flexibleCount,
      giftsCount,
    },
    counts,
    accountsList: JSON.parse(JSON.stringify(accountsList)),
    peopleList: JSON.parse(JSON.stringify(peopleList)),
  };
}

export async function saveSisCareRecord(data: {
  id?: string;
  personId?: string;
  personName: string;
  supportType: "flexible_support" | "gift";
  amount: number;
  date?: string;
  paidFromAccount?: string;
  purpose?: string;
  ownerPrivateNotes?: string;
  isShared?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    const amount = Number(data.amount) || 0;
    const isGift = data.supportType === "gift";

    if (data.id) {
      const existing = await LifeSisCareRecord.findById(data.id);
      if (!existing) return { success: false, error: "Record not found" };

      existing.personName = data.personName;
      existing.personId = data.personId && data.personId !== "none" ? data.personId : undefined;
      existing.purpose = data.purpose || existing.purpose;
      existing.ownerPrivateNotes = data.ownerPrivateNotes ?? existing.ownerPrivateNotes;
      if (typeof data.isShared === "boolean") existing.isShared = data.isShared;

      await existing.save();
      revalidatePath("/workspace");
      revalidatePath("/");
      return { success: true, id: String(existing._id) };
    }

    // New record
    const newDoc = await LifeSisCareRecord.create({
      personId: data.personId && data.personId !== "none" ? data.personId : undefined,
      personName: data.personName.trim(),
      supportType: data.supportType,
      title: isGift ? `Gift for ${data.personName}` : `Support for ${data.personName}`,
      totalGiven: amount,
      totalReturned: 0,
      totalForgiven: 0,
      remainingBalance: isGift ? 0 : amount,
      currency: "BDT",
      status: "active",
      isShared: Boolean(data.isShared),
      isVerifiedAccount: true,
      paidFromAccount: data.paidFromAccount || "Cash • BDT",
      purpose: data.purpose || "Personal support",
      ownerPrivateNotes: data.ownerPrivateNotes || "",
      transactions: [
        {
          type: isGift ? "gift" : "support",
          amount,
          date: data.date ? new Date(data.date) : new Date(),
          account: data.paidFromAccount || "Cash • BDT",
          currency: "BDT",
          notes: data.purpose || "Initial support",
          isShared: Boolean(data.isShared),
          performedBy: auth.name || auth.email || "Owner",
        },
      ],
      forgivenessHistory: [],
      sharedSettings: {
        isProfileAccessEnabled: Boolean(data.isShared),
        visibleRecordIds: [],
      },
      createdBy: auth.userId || "owner",
    });

    await logLifeActivity({
      action: "CREATE_SIS_CARE_RECORD",
      resourceType: "sis_care",
      resourceId: String(newDoc._id),
      resourceName: newDoc.title,
      details: `Created SiS Care ${data.supportType} of ৳ ${amount.toLocaleString()} for ${data.personName}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true, id: String(newDoc._id) };
  } catch (err: any) {
    console.error("saveSisCareRecord error:", err);
    return { success: false, error: err.message || "Failed to save SiS Care record" };
  }
}

export async function recordSisCareReturn(params: {
  recordId: string;
  amount: number;
  date?: string;
  account?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    const { recordId, amount, date, account, notes } = params;
    const doc = await LifeSisCareRecord.findById(recordId);
    if (!doc) return { success: false, error: "Record not found" };

    const returnAmt = Number(amount) || 0;
    if (returnAmt <= 0) return { success: false, error: "Amount must be greater than zero" };
    if (returnAmt > doc.remainingBalance) {
      return { success: false, error: `Return amount cannot exceed remaining balance (৳ ${doc.remainingBalance.toLocaleString()})` };
    }

    doc.totalReturned = (doc.totalReturned || 0) + returnAmt;
    doc.remainingBalance = Math.max(0, (doc.remainingBalance || 0) - returnAmt);
    if (doc.remainingBalance === 0) {
      doc.status = "closed";
    }

    doc.transactions.push({
      type: "return",
      amount: returnAmt,
      date: date ? new Date(date) : new Date(),
      account: account || "Cash • BDT",
      currency: "BDT",
      notes: notes || "Voluntary return",
      isShared: doc.isShared,
      performedBy: auth.name || auth.email || "Owner",
    } as any);

    await doc.save();

    await logLifeActivity({
      action: "SIS_CARE_RETURN_RECORDED",
      resourceType: "sis_care",
      resourceId: recordId,
      resourceName: doc.title,
      details: `Recorded voluntary return of ৳ ${returnAmt.toLocaleString()} from ${doc.personName}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("recordSisCareReturn error:", err);
    return { success: false, error: err.message || "Failed to record return" };
  }
}

export async function recordSisCareForgive(params: {
  recordId: string;
  amount: number;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    const { recordId, amount, reason } = params;
    const doc = await LifeSisCareRecord.findById(recordId);
    if (!doc) return { success: false, error: "Record not found" };

    const forgiveAmt = Number(amount) || 0;
    if (forgiveAmt <= 0) return { success: false, error: "Amount must be greater than zero" };
    if (forgiveAmt > doc.remainingBalance) {
      return { success: false, error: `Forgive amount cannot exceed remaining balance (৳ ${doc.remainingBalance.toLocaleString()})` };
    }

    doc.totalForgiven = (doc.totalForgiven || 0) + forgiveAmt;
    doc.remainingBalance = Math.max(0, (doc.remainingBalance || 0) - forgiveAmt);
    if (doc.remainingBalance === 0) {
      doc.status = "closed";
    }

    doc.transactions.push({
      type: "forgiveness",
      amount: forgiveAmt,
      date: new Date(),
      account: "Forgiveness (No cash)",
      currency: "BDT",
      notes: reason || "Private forgiveness decision by owner",
      isShared: false,
      performedBy: auth.name || auth.email || "Owner",
    } as any);

    doc.forgivenessHistory.push({
      amount: forgiveAmt,
      date: new Date(),
      reason: reason || "Private forgiveness",
      performedBy: auth.name || auth.email || "Owner",
    } as any);

    await doc.save();

    await logLifeActivity({
      action: "SIS_CARE_FORGIVENESS_APPLIED",
      resourceType: "sis_care",
      resourceId: recordId,
      resourceName: doc.title,
      details: `Forgave ৳ ${forgiveAmt.toLocaleString()} for ${doc.personName}. Remaining: ৳ ${doc.remainingBalance.toLocaleString()}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("recordSisCareForgive error:", err);
    return { success: false, error: err.message || "Failed to forgive amount" };
  }
}

export async function toggleSisCareProfileAccess(
  recordId: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    const doc = await LifeSisCareRecord.findById(recordId);
    if (!doc) return { success: false, error: "Record not found" };

    doc.isShared = isEnabled;
    if (!doc.sharedSettings) {
      doc.sharedSettings = { isProfileAccessEnabled: isEnabled, visibleRecordIds: [] };
    } else {
      doc.sharedSettings.isProfileAccessEnabled = isEnabled;
    }

    await doc.save();

    await logLifeActivity({
      action: "TOGGLE_SIS_CARE_SHARING",
      resourceType: "sis_care",
      resourceId: recordId,
      resourceName: doc.title,
      details: `Turned ${isEnabled ? "ON" : "OFF"} profile sharing access for ${doc.personName}`,
    });

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("toggleSisCareProfileAccess error:", err);
    return { success: false, error: err.message || "Failed to toggle profile access" };
  }
}

export async function deleteSisCareRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    const doc = await LifeSisCareRecord.findByIdAndDelete(recordId);
    if (doc) {
      await logLifeActivity({
        action: "DELETE_SIS_CARE_RECORD",
        resourceType: "sis_care",
        resourceId: recordId,
        resourceName: doc.title,
        details: `Deleted SiS Care record for ${doc.personName}`,
      });
    }

    revalidatePath("/workspace");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("deleteSisCareRecord error:", err);
    return { success: false, error: err.message || "Failed to delete record" };
  }
}

// ─────────────────────────────────────────────────────────────
// Secure Vault Server Actions (Documents, Digital Vault, Access Control)
// ─────────────────────────────────────────────────────────────

export interface UnifiedSecureVaultItem {
  id: string;
  recordType: "documents" | "digital_vault" | "access_control";
  title: string;
  subtitle: string;
  category: string;
  isShared?: boolean;
  isProtected?: boolean;
  status: string;
  statusColor?: string;
  date?: string;
  expiryInfo?: string;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  iconType: string;
  details?: {
    document?: {
      fileUrl: string;
      fileType: string;
      fileSize: number;
      documentNumber?: string;
      issueDate?: string;
      expiryDate?: string;
      issuingAuthority?: string;
      relatedPersonName?: string;
      relatedBusinessName?: string;
      notes?: string;
    };
    digitalVault?: {
      serviceOrWebsite: string;
      category: string;
      url?: string;
      username?: string;
      maskedUsername?: string;
      hasSecret: boolean;
      relatedBusinessName?: string;
      relatedPersonName?: string;
      recoveryInfo?: string;
      notes?: string;
      permissionSummary: {
        accountDetails: string;
        protectedSecret: string;
      };
    };
    accessControl?: {
      personName: string;
      personRelation?: string;
      targetRecordTitle: string;
      targetRecordType: string;
      canView: boolean;
      canDownload: boolean;
      canEdit: boolean;
      canShare: boolean;
      status: "active" | "pending" | "revoked";
      effectiveDate?: string;
      expiryDate?: string;
    };
  };
}

export interface SecureVaultResponse {
  records: UnifiedSecureVaultItem[];
  counts: {
    all: number;
    documents: number;
    digitalVault: number;
    accessControl: number;
  };
  peopleList: Array<{ id: string; name: string; relation?: string }>;
  businessesList: Array<{ id: string; name: string }>;
}

async function ensureSecureVaultSeed(userId: string) {
  const docCount = await LifeDocument.countDocuments();
  const vaultCount = await LifeVaultItem.countDocuments();
  const permCount = await LifeRecordPermission.countDocuments();

  if (docCount === 0) {
    const seedDocs = [
      {
        title: "Passport — Saurav",
        category: "identity",
        fileUrl: "/documents/passport_saurav.pdf",
        fileType: "application/pdf",
        fileSize: 2400000,
        documentNumber: "A04829103",
        issueDate: new Date("2019-01-15"),
        expiryDate: new Date("2029-01-15"),
        issuingAuthority: "DIP Bangladesh",
        isShared: false,
        visibility: "visible_now",
        notes: "Official machine-readable passport with 10-year validity.",
      },
      {
        title: "GESN Trade License",
        category: "business",
        fileUrl: "/documents/gesn_trade_license.pdf",
        fileType: "application/pdf",
        fileSize: 1850000,
        documentNumber: "TL-2023-8821",
        issueDate: new Date("2023-11-12"),
        expiryDate: new Date("2026-11-12"),
        issuingAuthority: "Dhaka North City Corporation",
        isShared: false,
        visibility: "visible_now",
        notes: "Corporate trade license renewal under GESN.",
      },
      {
        title: "Property Deed",
        category: "property",
        fileUrl: "/documents/property_deed.pdf",
        fileType: "application/pdf",
        fileSize: 4200000,
        documentNumber: "DEED-DH-4091",
        issueDate: new Date("2021-03-20"),
        issuingAuthority: "Sub-Registry Office Tejgaon",
        isShared: false,
        visibility: "visible_now",
        notes: "Tejgaon / Dhanmondi residential plot ownership deed.",
      },
      {
        title: "Birth Certificate — Rahaf",
        category: "identity",
        fileUrl: "/documents/birth_certificate_rahaf.pdf",
        fileType: "application/pdf",
        fileSize: 1100000,
        documentNumber: "BR-2022-77402",
        issueDate: new Date("2022-06-10"),
        issuingAuthority: "Dhaka City Corporation",
        isShared: true,
        visibility: "visible_now",
        notes: "Original birth certificate and digital registration record.",
      },
    ];
    await LifeDocument.insertMany(seedDocs);
  }

  if (vaultCount === 0) {
    const hostingerSecret = encryptVaultSecret("HostingerVault@2026!");
    const googleSecret = encryptVaultSecret("GoogleAdmin#9920");

    const seedVault = [
      {
        title: "Hostinger",
        systemOrWebsite: "Domain & Hosting",
        url: "hostinger.com",
        username: "saurav@gesn.net",
        encryptedSecret: hostingerSecret.encryptedSecret,
        secretIv: hostingerSecret.secretIv,
        secretAuthTag: hostingerSecret.secretAuthTag,
        category: "hosting",
        visibilityMode: "available_now",
        reVerificationRequired: true,
        revealPermission: true,
        copyPermission: true,
        recoveryInfo: "Primary SSH key and recovery backup code in Safe #2",
        notes: "Primary web servers, DNS zone management, and SSL certs for GESN portfolio.",
      },
      {
        title: "Google Workspace",
        systemOrWebsite: "Email & Admin Console",
        url: "workspace.google.com",
        username: "admin@gesn.net",
        encryptedSecret: googleSecret.encryptedSecret,
        secretIv: googleSecret.secretIv,
        secretAuthTag: googleSecret.secretAuthTag,
        category: "email",
        visibilityMode: "available_now",
        reVerificationRequired: true,
        revealPermission: true,
        copyPermission: true,
        recoveryInfo: "Master 2FA hardware key configured on YubiKey",
        notes: "Central corporate Google Workspace root admin access.",
      },
    ];
    await LifeVaultItem.insertMany(seedVault);
  }

  if (permCount === 0) {
    // Look up or seed demo people for permissions
    let akhi = await LifePerson.findOne({ name: "Akhi" });
    if (!akhi) {
      akhi = await LifePerson.create({
        name: "Akhi",
        relation: "Family",
        contactNumber: "+8801700000001",
        isLoginEnabled: true,
      });
    }

    let sanaullah = await LifePerson.findOne({ name: "Sanaullah" });
    if (!sanaullah) {
      sanaullah = await LifePerson.create({
        name: "Sanaullah",
        relation: "Partner",
        contactNumber: "+8801700000002",
        isLoginEnabled: true,
      });
    }

    let sabbir = await LifePerson.findOne({ name: "Sabbir" });
    if (!sabbir) {
      sabbir = await LifePerson.create({
        name: "Sabbir",
        relation: "Associate",
        contactNumber: "+8801700000003",
        isLoginEnabled: true,
      });
    }

    const seedPerms = [
      {
        recordId: "perm-akhi-docs",
        recordType: "document",
        assignedPersonId: akhi._id,
        visibilityMode: "available_now",
        canView: true,
        canDownload: true,
        canEdit: false,
        canShare: false,
        isReleased: true,
        releaseCondition: "Family documents",
      },
      {
        recordId: "perm-sanaullah-trade",
        recordType: "document",
        assignedPersonId: sanaullah._id,
        visibilityMode: "available_now",
        canView: true,
        canDownload: false,
        canEdit: false,
        canShare: false,
        isReleased: true,
        releaseCondition: "GESN Trade License",
      },
      {
        recordId: "perm-sabbir-sis",
        recordType: "financial_support",
        assignedPersonId: sabbir._id,
        visibilityMode: "available_now",
        canView: true,
        canDownload: false,
        canEdit: false,
        canShare: false,
        isReleased: true,
        releaseCondition: "Selected SiS Care records",
      },
    ];
    await LifeRecordPermission.insertMany(seedPerms);
  }
}

export async function getSecureVaultRecords(params?: {
  recordType?: string;
  filter?: string;
  search?: string;
}): Promise<SecureVaultResponse> {
  await connectToDatabase();
  const auth = await getLifeAuthContext();
  if (!auth) {
    return {
      records: [],
      counts: { all: 0, documents: 0, digitalVault: 0, accessControl: 0 },
      peopleList: [],
      businessesList: [],
    };
  }

  await ensureSecureVaultSeed(auth.userId || "owner");

  const { recordType = "all", filter = "all", search } = params || {};
  const searchRegex = search?.trim() ? new RegExp(search.trim(), "i") : null;

  const unifiedList: UnifiedSecureVaultItem[] = [];

  // 1. Fetch Documents
  if (recordType === "all" || recordType === "documents") {
    const docQuery: Record<string, any> = {};
    if (searchRegex) {
      docQuery.$or = [{ title: searchRegex }, { notes: searchRegex }, { documentNumber: searchRegex }];
    }
    if (filter === "personal") docQuery.category = { $in: ["identity", "medical"] };
    if (filter === "business") docQuery.category = { $in: ["business", "agreement"] };
    if (filter === "property") docQuery.category = "property";
    if (filter === "private") docQuery.isShared = { $ne: true };
    if (filter === "shared") docQuery.isShared = true;

    const docs = await LifeDocument.find(docQuery)
      .populate("relatedPersonId", "name relation")
      .populate("relatedBusinessId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    for (const d of docs as any[]) {
      let isExpiringSoon = false;
      let isExpired = false;
      let expiryInfo = "";

      if (d.expiryDate) {
        const exp = new Date(d.expiryDate);
        const diffMonths = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (diffMonths < 0) {
          isExpired = true;
          expiryInfo = "Expired";
        } else if (diffMonths <= 6) {
          isExpiringSoon = true;
          expiryInfo = `Expiring soon • ${exp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        } else {
          expiryInfo = `Valid until ${exp.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
        }
      }

      if (filter === "expiring" && !isExpiringSoon && !isExpired) {
        continue;
      }

      unifiedList.push({
        id: String(d._id),
        recordType: "documents",
        title: d.title,
        subtitle: `${d.category ? d.category.charAt(0).toUpperCase() + d.category.slice(1) : "Document"} • ${
          d.isShared ? "Shared" : "Private"
        }`,
        category: d.category || "other",
        isShared: Boolean(d.isShared),
        isProtected: false,
        status: isExpiringSoon ? "Expiring soon" : expiryInfo || (d.isShared ? "Shared" : "Private"),
        statusColor: isExpiringSoon ? "amber" : isExpired ? "red" : d.isShared ? "sky" : "slate",
        expiryInfo,
        isExpiringSoon,
        isExpired,
        date: d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : undefined,
        iconType: d.category === "business" ? "rose" : "blue",
        details: {
          document: {
            fileUrl: d.fileUrl || "/sample.pdf",
            fileType: d.fileType || "application/pdf",
            fileSize: d.fileSize || 0,
            documentNumber: d.documentNumber,
            issueDate: d.issueDate ? new Date(d.issueDate).toLocaleDateString() : undefined,
            expiryDate: d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : undefined,
            issuingAuthority: d.issuingAuthority,
            relatedPersonName: d.relatedPersonId?.name,
            relatedBusinessName: d.relatedBusinessId?.name,
            notes: d.notes,
          },
        },
      });
    }
  }

  // 2. Fetch Digital Vault Items
  if (recordType === "all" || recordType === "digital_vault") {
    const vaultQuery: Record<string, any> = {};
    if (searchRegex) {
      vaultQuery.$or = [
        { title: searchRegex },
        { systemOrWebsite: searchRegex },
        { username: searchRegex },
        { notes: searchRegex },
      ];
    }
    if (filter === "private") vaultQuery.isShared = { $ne: true };
    if (filter === "shared") vaultQuery.isShared = true;

    const vaultItems = await LifeVaultItem.find(vaultQuery)
      .select("-encryptedSecret -secretIv -secretAuthTag")
      .populate("relatedBusinessId", "name")
      .sort({ createdAt: -1 })
      .lean();

    for (const v of vaultItems as any[]) {
      const maskedUsername = v.username
        ? v.username.replace(/^(.)(.*)(@.*)$/, (_: any, a: string, b: string, c: string) => `${a}***${c}`)
        : undefined;

      unifiedList.push({
        id: String(v._id),
        recordType: "digital_vault",
        title: v.title,
        subtitle: `${v.systemOrWebsite || "Digital Vault"} • Protected`,
        category: v.category || "website",
        isShared: false,
        isProtected: true,
        status: "Protected",
        statusColor: "emerald",
        iconType: "purple",
        details: {
          digitalVault: {
            serviceOrWebsite: v.systemOrWebsite || v.category || "Digital Service",
            category: v.category,
            url: v.url,
            username: v.username,
            maskedUsername: maskedUsername || v.username,
            hasSecret: true,
            relatedBusinessName: v.relatedBusinessId?.name || "GESN",
            recoveryInfo: v.recoveryInfo,
            notes: v.notes,
            permissionSummary: {
              accountDetails: "View only",
              protectedSecret: "Restricted",
            },
          },
        },
      });
    }
  }

  // 3. Fetch Access Control (Permissions)
  if (recordType === "all" || recordType === "access_control") {
    const permQuery: Record<string, any> = {};
    if (filter === "active") permQuery.visibilityMode = { $ne: "revoked_archived" };
    if (filter === "revoked") permQuery.visibilityMode = "revoked_archived";
    if (filter === "pending") permQuery.isReleased = false;

    const perms = await LifeRecordPermission.find(permQuery)
      .populate("assignedPersonId", "name relation avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    for (const p of perms as any[]) {
      const personName = p.assignedPersonId?.name || "User";
      const targetTitle = p.releaseCondition || (p.recordType === "document" ? "Family documents" : "Records");

      if (searchRegex && !searchRegex.test(personName) && !searchRegex.test(targetTitle)) {
        continue;
      }

      const isRevoked = p.visibilityMode === "revoked_archived";
      const permSummary = [
        p.canView ? "View" : "",
        p.canDownload ? "Download" : "",
        p.canEdit ? "Edit" : "",
      ]
        .filter(Boolean)
        .join(" • ") || "View only";

      unifiedList.push({
        id: String(p._id),
        recordType: "access_control",
        title: `${personName} • ${targetTitle}`,
        subtitle: `Access Control • ${permSummary}`,
        category: "permission",
        isShared: true,
        status: isRevoked ? "Revoked" : "Active",
        statusColor: isRevoked ? "red" : "emerald",
        iconType: "sky",
        details: {
          accessControl: {
            personName,
            personRelation: p.assignedPersonId?.relation,
            targetRecordTitle: targetTitle,
            targetRecordType: p.recordType,
            canView: Boolean(p.canView),
            canDownload: Boolean(p.canDownload),
            canEdit: Boolean(p.canEdit),
            canShare: Boolean(p.canShare),
            status: isRevoked ? "revoked" : "active",
            effectiveDate: p.effectiveDate ? new Date(p.effectiveDate).toLocaleDateString() : undefined,
            expiryDate: p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : undefined,
          },
        },
      });
    }
  }

  // Related lists for forms
  const people = await LifePerson.find({}).select("name relation avatarUrl").sort({ name: 1 }).lean();
  const businesses = await LifeBusiness.find({}).select("name").sort({ name: 1 }).lean();

  const counts = {
    all: unifiedList.length,
    documents: unifiedList.filter((r) => r.recordType === "documents").length,
    digitalVault: unifiedList.filter((r) => r.recordType === "digital_vault").length,
    accessControl: unifiedList.filter((r) => r.recordType === "access_control").length,
  };

  return {
    records: JSON.parse(JSON.stringify(unifiedList)),
    counts,
    peopleList: JSON.parse(JSON.stringify(people.map((p: any) => ({ id: String(p._id), name: p.name, relation: p.relation })))),
    businessesList: JSON.parse(JSON.stringify(businesses.map((b: any) => ({ id: String(b._id), name: b.name })))),
  };
}

export async function saveVaultDocument(data: {
  id?: string;
  title: string;
  category: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  relatedBusinessId?: string;
  relatedPersonId?: string;
  notes?: string;
  isShared?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    if (data.id) {
      const existing = await LifeDocument.findById(data.id);
      if (!existing) return { success: false, error: "Document not found" };

      existing.title = data.title.trim();
      existing.category = (data.category as any) || existing.category;
      if (data.fileUrl) {
        existing.fileUrl = data.fileUrl;
        if (!existing.versions) existing.versions = [];
        existing.versions.push({
          fileUrl: data.fileUrl,
          fileType: data.fileType || "application/pdf",
          fileSize: data.fileSize || 0,
          uploadedAt: new Date(),
          uploadedBy: auth.name || auth.email || "Owner",
        });
      }
      existing.documentNumber = data.documentNumber;
      if (data.issueDate) existing.issueDate = new Date(data.issueDate);
      if (data.expiryDate) existing.expiryDate = new Date(data.expiryDate);
      existing.issuingAuthority = data.issuingAuthority;
      existing.notes = data.notes ?? existing.notes;
      if (typeof data.isShared === "boolean") existing.isShared = data.isShared;

      await existing.save();
      revalidatePath("/workspace");
      return { success: true, id: String(existing._id) };
    }

    const newDoc = await LifeDocument.create({
      title: data.title.trim(),
      category: data.category || "other",
      fileUrl: data.fileUrl || "/documents/uploaded_document.pdf",
      fileType: data.fileType || "application/pdf",
      fileSize: data.fileSize || 1024000,
      documentNumber: data.documentNumber,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      issuingAuthority: data.issuingAuthority,
      relatedBusinessId: data.relatedBusinessId && data.relatedBusinessId !== "none" ? data.relatedBusinessId : undefined,
      relatedPersonId: data.relatedPersonId && data.relatedPersonId !== "none" ? data.relatedPersonId : undefined,
      notes: data.notes || "",
      isShared: Boolean(data.isShared),
      visibility: "visible_now",
    });

    await logLifeActivity({
      action: "CREATE_DOCUMENT",
      resourceType: "document",
      resourceId: String(newDoc._id),
      resourceName: newDoc.title,
      details: `Added new vault document: ${newDoc.title} [${newDoc.category}]`,
    });

    revalidatePath("/workspace");
    return { success: true, id: String(newDoc._id) };
  } catch (err: any) {
    console.error("saveVaultDocument error:", err);
    return { success: false, error: err.message || "Failed to save document" };
  }
}

export async function saveVaultDigitalAccount(data: {
  id?: string;
  title: string;
  category: string;
  systemOrWebsite?: string;
  url?: string;
  username?: string;
  secret?: string;
  recoveryInfo?: string;
  relatedBusinessId?: string;
  notes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    if (data.id) {
      const existing = await LifeVaultItem.findById(data.id);
      if (!existing) return { success: false, error: "Vault item not found" };

      existing.title = data.title.trim();
      existing.systemOrWebsite = data.systemOrWebsite || existing.systemOrWebsite;
      existing.url = data.url ?? existing.url;
      existing.username = data.username ?? existing.username;
      existing.category = (data.category as any) || existing.category;
      existing.recoveryInfo = data.recoveryInfo ?? existing.recoveryInfo;
      existing.notes = data.notes ?? existing.notes;

      if (data.secret && data.secret.trim() !== "") {
        const { encryptedSecret, secretIv, secretAuthTag } = encryptVaultSecret(data.secret.trim());
        existing.encryptedSecret = encryptedSecret;
        existing.secretIv = secretIv;
        existing.secretAuthTag = secretAuthTag;
      }

      await existing.save();
      revalidatePath("/workspace");
      return { success: true, id: String(existing._id) };
    }

    const { encryptedSecret, secretIv, secretAuthTag } = encryptVaultSecret(data.secret || "ProtectedSecret@123");

    const newVault = await LifeVaultItem.create({
      title: data.title.trim(),
      systemOrWebsite: data.systemOrWebsite || "Digital Account",
      url: data.url || "",
      username: data.username || "",
      encryptedSecret,
      secretIv,
      secretAuthTag,
      category: data.category || "website",
      recoveryInfo: data.recoveryInfo || "",
      relatedBusinessId: data.relatedBusinessId && data.relatedBusinessId !== "none" ? data.relatedBusinessId : undefined,
      notes: data.notes || "",
      visibilityMode: "available_now",
      reVerificationRequired: true,
      revealPermission: true,
      copyPermission: true,
    });

    await logLifeActivity({
      action: "CREATE_VAULT_ITEM",
      resourceType: "vault",
      resourceId: String(newVault._id),
      resourceName: newVault.title,
      details: `Created digital vault credentials: ${newVault.title}`,
    });

    revalidatePath("/workspace");
    return { success: true, id: String(newVault._id) };
  } catch (err: any) {
    console.error("saveVaultDigitalAccount error:", err);
    return { success: false, error: err.message || "Failed to save digital account" };
  }
}

export async function saveVaultPermission(data: {
  id?: string;
  personId: string;
  targetRecordTitle: string;
  targetRecordType: string;
  canView?: boolean;
  canDownload?: boolean;
  canEdit?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    if (data.id) {
      const existing = await LifeRecordPermission.findById(data.id);
      if (!existing) return { success: false, error: "Permission not found" };

      if (typeof data.canView === "boolean") existing.canView = data.canView;
      if (typeof data.canDownload === "boolean") existing.canDownload = data.canDownload;
      if (typeof data.canEdit === "boolean") existing.canEdit = data.canEdit;

      await existing.save();
      revalidatePath("/workspace");
      return { success: true, id: String(existing._id) };
    }

    const newPerm = await LifeRecordPermission.create({
      recordId: `scope-${Date.now()}`,
      recordType: data.targetRecordType || "document",
      assignedPersonId: data.personId,
      visibilityMode: "available_now",
      releaseCondition: data.targetRecordTitle || "Shared record scope",
      canView: data.canView ?? true,
      canDownload: data.canDownload ?? false,
      canEdit: data.canEdit ?? false,
      canShare: false,
      isReleased: true,
    });

    await logLifeActivity({
      action: "GRANT_ACCESS",
      resourceType: "permission",
      resourceId: String(newPerm._id),
      resourceName: data.targetRecordTitle,
      details: `Granted access to ${data.targetRecordTitle}`,
    });

    revalidatePath("/workspace");
    return { success: true, id: String(newPerm._id) };
  } catch (err: any) {
    console.error("saveVaultPermission error:", err);
    return { success: false, error: err.message || "Failed to grant access" };
  }
}

export async function updateVaultPermission(
  permissionId: string,
  updates: {
    canView?: boolean;
    canDownload?: boolean;
    canEdit?: boolean;
    isRevoked?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await LifeRecordPermission.findById(permissionId);
    if (!existing) return { success: false, error: "Permission not found" };

    if (updates.isRevoked) {
      existing.visibilityMode = "revoked_archived";
      existing.canView = false;
      existing.canDownload = false;
      existing.canEdit = false;
    } else {
      if (typeof updates.canView === "boolean") existing.canView = updates.canView;
      if (typeof updates.canDownload === "boolean") existing.canDownload = updates.canDownload;
      if (typeof updates.canEdit === "boolean") existing.canEdit = updates.canEdit;
      existing.visibilityMode = "available_now";
    }

    await existing.save();

    await logLifeActivity({
      action: updates.isRevoked ? "REVOKE_PERMISSION" : "UPDATE_PERMISSION",
      resourceType: "permission",
      resourceId: permissionId,
      resourceName: existing.releaseCondition || "Permission Rule",
      details: updates.isRevoked ? "Revoked record access" : "Modified permissions",
    });

    revalidatePath("/workspace");
    return { success: true };
  } catch (err: any) {
    console.error("updateVaultPermission error:", err);
    return { success: false, error: err.message || "Failed to update permission" };
  }
}

export async function revealDigitalVaultSecret(
  itemId: string,
  masterPin?: string
): Promise<{ success: boolean; secret?: string; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    if (!auth.isOwner && !auth.isAdmin && !auth.permissions.canRevealVault) {
      return { success: false, error: "Forbidden: Not authorized to reveal Vault secrets." };
    }

    const doc = await LifeVaultItem.findById(itemId).lean();
    if (!doc) return { success: false, error: "Item not found" };

    const decrypted = decryptVaultSecret(
      (doc as any).encryptedSecret,
      (doc as any).secretIv,
      (doc as any).secretAuthTag
    );

    await logLifeActivity({
      action: "REVEAL_SECRET",
      resourceType: "vault",
      resourceId: itemId,
      resourceName: (doc as any).title,
      details: `Revealed protected credential for "${(doc as any).title}"`,
    });

    return { success: true, secret: decrypted || "VaultSecret#2026" };
  } catch (err: any) {
    console.error("revealDigitalVaultSecret error:", err);
    return { success: false, error: err.message || "Decryption failed" };
  }
}

export async function deleteVaultRecord(
  recordType: "documents" | "digital_vault" | "access_control",
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth || (!auth.isOwner && !auth.isAdmin)) {
      return { success: false, error: "Unauthorized" };
    }

    if (recordType === "documents") {
      await LifeDocument.findByIdAndDelete(id);
    } else if (recordType === "digital_vault") {
      await LifeVaultItem.findByIdAndDelete(id);
    } else {
      await LifeRecordPermission.findByIdAndDelete(id);
    }

    await logLifeActivity({
      action: "DELETE_VAULT_RECORD",
      resourceType: recordType,
      resourceId: id,
      resourceName: "Vault Item",
      details: `Deleted ${recordType} record: ${id}`,
    });

    revalidatePath("/workspace");
    return { success: true };
  } catch (err: any) {
    console.error("deleteVaultRecord error:", err);
    return { success: false, error: err.message || "Failed to delete" };
  }
}
