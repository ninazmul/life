/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  Gift,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  Search,
  User,
  Building2,
  ChevronRight,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ILifeFinancialSupport,
  ILifePerson,
  ILifeBusiness,
  FinancialSupportType,
} from "@/types";
import { createFinancialSupport } from "@/lib/actions/lifeFinancialSupport.actions";
import toast from "react-hot-toast";

interface FinancialSupportListProps {
  records: ILifeFinancialSupport[];
  people: ILifePerson[];
  businesses: ILifeBusiness[];
  ownerDashboard?: any;
  userSummary?: any;
  isOwner?: boolean;
  isAdmin?: boolean;
}

export function FinancialSupportList({
  records: initialRecords,
  people,
  businesses,
  ownerDashboard,
  userSummary,
  isOwner = false,
  isAdmin = false,
}: FinancialSupportListProps) {
  const [records, setRecords] = useState(initialRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    recipientPersonId: "",
    supportType: "repayable_support",
    relatedBusinessId: "",
    totalAmount: "",
    currency: "BDT",
    givenDate: new Date().toISOString().split("T")[0],
    paymentMethod: "bank_transfer",
    transactionReference: "",
    purpose: "",
    repayableOrNot: true,
    repaymentStartDate: "",
    installmentFrequency: "monthly",
    installmentAmount: "",
    numberOfInstallments: "",
    dueDate: "",
    ownerPrivateNote: "",
    recipientVisibleNote: "",
  });

  const handleSupportTypeChange = (type: string) => {
    const isGift = type === "gift" || type === "conditional_gift";
    setFormData((prev) => ({
      ...prev,
      supportType: type,
      repayableOrNot: !isGift,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.recipientPersonId || !formData.totalAmount) {
      toast.error("Please fill in required fields (Title, Recipient, Amount).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createFinancialSupport({
        title: formData.title,
        recipientPersonId: formData.recipientPersonId,
        supportType: formData.supportType as any,
        relatedBusinessId: formData.relatedBusinessId || undefined,
        totalAmount: Number(formData.totalAmount),
        currency: formData.currency,
        givenDate: formData.givenDate,
        paymentMethod: formData.paymentMethod,
        transactionReference: formData.transactionReference,
        purpose: formData.purpose,
        repayableOrNot: formData.repayableOrNot,
        repaymentStartDate: formData.repaymentStartDate || undefined,
        installmentFrequency: formData.installmentFrequency as any,
        installmentAmount: formData.installmentAmount ? Number(formData.installmentAmount) : undefined,
        numberOfInstallments: formData.numberOfInstallments ? Number(formData.numberOfInstallments) : undefined,
        dueDate: formData.dueDate || undefined,
        ownerPrivateNote: formData.ownerPrivateNote,
        recipientVisibleNote: formData.recipientVisibleNote,
      });

      if (res.success && res.record) {
        toast.success("Financial support record created!");
        setRecords([res.record, ...records]);
        setAddModalOpen(false);
      } else {
        toast.error(res.error || "Failed to create record");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const name = (r.recipientPersonId as any)?.name || "";
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === "repayable") return r.repayableOrNot;
    if (filterType === "gift") return !r.repayableOrNot || r.status === "converted_to_gift" || r.status === "gift";
    if (filterType === "overdue") return r.status === "overdue";
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Financial Support & Transactions
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Personal financial assistance, repayment tracking & gift allocations
          </p>
        </div>

        {(isOwner || isAdmin) && (
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Financial Record
          </Button>
        )}
      </div>

      {/* Summary Cards: Currency-separated for Owner (§17) or User Dashboard (§16) */}
      {isOwner && ownerDashboard?.currencyMap ? (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Currency Portfolios (Distinct Totals)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(ownerDashboard.currencyMap).map(([cur, val]: [string, any]) => (
              <div
                key={cur}
                className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {cur}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Repaid: {cur} {val.totalRepaid.toLocaleString()}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Total Given</p>
                  <p className="text-xl font-extrabold text-foreground">
                    {cur} {val.totalGiven.toLocaleString()}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {cur} {val.remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : userSummary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">Total Support Received</p>
            <p className="text-xl font-extrabold text-foreground mt-1">
              {userSummary.currency} {userSummary.totalReceived.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">Repayable Support</p>
            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {userSummary.currency} {userSummary.repayableAmount.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">Total Returned</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {userSummary.currency} {userSummary.totalRepaid.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">Remaining to Return</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {userSummary.currency} {userSummary.remainingBalance.toLocaleString()}
            </p>
          </div>
        </div>
      ) : null}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records or recipients..."
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex gap-2">
          {["all", "repayable", "gift", "overdue"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors border ${
                filterType === t
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card">
            <Wallet className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No financial support records found.</p>
          </div>
        ) : (
          filteredRecords.map((r) => {
            const recipient = r.recipientPersonId as any;
            const business = r.relatedBusinessId as any;

            return (
              <Link
                key={r._id}
                href={`/finance/${r._id}`}
                className="block p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-emerald-500/40 transition-all shadow-sm group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold uppercase">
                        {r.supportType.replace("_", " ")}
                      </span>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          r.status === "fully_repaid" || r.status === "closed"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : r.status === "overdue"
                            ? "bg-red-500/10 text-red-600 border border-red-500/20"
                            : r.status === "converted_to_gift" || r.status === "gift"
                            ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        }`}
                      >
                        {r.status.replace("_", " ")}
                      </span>

                      {r.visibilityMode && r.visibilityMode !== "available_now" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 font-medium">
                          {r.visibilityMode}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-foreground truncate group-hover:text-emerald-600 transition-colors">
                      {r.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        {recipient?.name || "Recipient"} {recipient?.relation ? `(${recipient.relation})` : ""}
                      </span>

                      {business && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {business.name}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(r.givenDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Financial Values */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-border">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">Total Support</p>
                      <p className="text-base font-extrabold text-foreground">
                        {r.currency} {r.totalAmount.toLocaleString()}
                      </p>
                    </div>

                    {r.repayableOrNot && r.status !== "converted_to_gift" && r.status !== "gift" ? (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {r.currency} {r.remainingBalance.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-500/10 px-2 py-1 rounded-lg">
                          <Gift className="w-3.5 h-3.5" /> Non-Repayable
                        </span>
                      </div>
                    )}

                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Add Financial Record Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              New Financial Support Record
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Record Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Medical emergency support or Business expansion advance"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Recipient *</label>
                <select
                  required
                  value={formData.recipientPersonId}
                  onChange={(e) => setFormData({ ...formData, recipientPersonId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Recipient</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Support Type *</label>
                <select
                  value={formData.supportType}
                  onChange={(e) => handleSupportTypeChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="repayable_support">Repayable Support</option>
                  <option value="personal_loan">Personal Care</option>
                  <option value="salary_advance">Salary Advance</option>
                  <option value="business_advance">Business Advance</option>
                  <option value="emergency_support">Emergency Support</option>
                  <option value="medical_support">Medical Support</option>
                  <option value="family_support">Family Support</option>
                  <option value="gift">Gift</option>
                  <option value="conditional_gift">Conditional Gift</option>
                  <option value="investment">Investment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Total Amount *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="e.g. 50000"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="SAR">SAR (ر.س)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Given Date</label>
                <Input
                  type="date"
                  value={formData.givenDate}
                  onChange={(e) => setFormData({ ...formData, givenDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Transaction Reference / Check No.
              </label>
              <Input
                value={formData.transactionReference}
                onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                placeholder="TRX123456 or Check #4892"
                className="rounded-xl"
              />
            </div>

            {formData.repayableOrNot && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Repayment & Installment Setup
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Repayment Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.repaymentStartDate}
                      onChange={(e) => setFormData({ ...formData, repaymentStartDate: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Frequency
                    </label>
                    <select
                      value={formData.installmentFrequency}
                      onChange={(e) => setFormData({ ...formData, installmentFrequency: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Installment Amount
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.installmentAmount}
                      onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Number of Installments
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.numberOfInstallments}
                      onChange={(e) => setFormData({ ...formData, numberOfInstallments: e.target.value })}
                      placeholder="e.g. 10"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Visible Note to Recipient
              </label>
              <textarea
                value={formData.recipientVisibleNote}
                onChange={(e) => setFormData({ ...formData, recipientVisibleNote: e.target.value })}
                placeholder="Comforting, clear instructions for recipient..."
                className="w-full h-16 p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Financial Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
