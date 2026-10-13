/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Plus,
  ArrowLeft,
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
import { GesnTransactionsSkeleton } from "./GesnTransactionsSkeleton";
import { IGesnReportsData } from "@/types/gesnReports";
import toast from "react-hot-toast";

const GesnTransactionsView = dynamic(
  () => import("./GesnTransactionsView").then((mod) => mod.GesnTransactionsView),
  {
    loading: () => <GesnTransactionsSkeleton />,
    ssr: true,
  }
);


interface FinancialSupportListProps {
  records: ILifeFinancialSupport[];
  people: ILifePerson[];
  businesses: ILifeBusiness[];
  ownerDashboard?: any;
  userSummary?: any;
  isOwner?: boolean;
  isAdmin?: boolean;
  canAccessLiveAccounting?: boolean;
  initialGesnReports?: IGesnReportsData | null;
  initialGesnError?: string | null;
}

export function FinancialSupportList({
  records: initialRecords,
  people,
  businesses,
  ownerDashboard,
  userSummary,
  isOwner = false,
  isAdmin = false,
  canAccessLiveAccounting: canAccessLiveAccountingProp,
  initialGesnReports = null,
  initialGesnError = null,
}: FinancialSupportListProps) {
  const canAccessLiveAccounting =
    canAccessLiveAccountingProp !== undefined
      ? canAccessLiveAccountingProp
      : Boolean(isOwner || isAdmin);

  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [mainView, setMainView] = useState<"acc_transactions" | "personal_support">(
    canAccessLiveAccounting ? "acc_transactions" : "personal_support"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [personalPage, setPersonalPage] = useState<number>(1);
  const personalPageSize = 10;
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPersonalPage(1);
  }, [searchQuery, filterType]);



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
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 p-0 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
                Financial Support & Transactions
              </h1>
              {records.length > 0 && (
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100">
                  {records.length}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Personal financial assistance, repayment tracking & gift allocations
            </p>
          </div>
        </div>

        {(isOwner || isAdmin) && (
          <Button
            onClick={() => {
              setMainView("personal_support");
              setAddModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Financial Record
          </Button>
        )}
      </div>

      {/* Main View Switcher Tabs / Section Header */}
      {canAccessLiveAccounting ? (
        <div className="flex border-b border-slate-200/80 gap-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setMainView("acc_transactions")}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              mainView === "acc_transactions"
                ? "border-[#4F46E5] text-[#4F46E5]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ACC.GESN.NET Live Accounting</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse" />
              Live Sync
            </span>
          </button>

          <button
            onClick={() => setMainView("personal_support")}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              mainView === "personal_support"
                ? "border-[#4F46E5] text-[#4F46E5]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Personal Support & Commitments</span>
            {records.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-black border border-indigo-100">
                {records.length}
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="flex border-b border-slate-200/80 pb-3 items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-black text-[#1E1B4B]">
            <Wallet className="w-4 h-4 text-[#4F46E5]" />
            <span>Personal Support & Commitments</span>
            {records.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-black border border-indigo-100">
                {records.length}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Your personal & assigned financial records
          </span>
        </div>
      )}

      {/* View Content */}
      {canAccessLiveAccounting && mainView === "acc_transactions" ? (
        <GesnTransactionsView
          initialData={initialGesnReports}
          initialError={initialGesnError}
        />
      ) : (
        <>
          {/* Summary Cards: Currency-separated for Owner (§17) or User Dashboard (§16) */}
          {isOwner && ownerDashboard?.currencyMap ? (
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                Currency Portfolios (Distinct Totals)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(ownerDashboard.currencyMap).map(([cur, val]: [string, any]) => (
                  <div
                    key={cur}
                    className="p-5 rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100">
                        {cur}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        Repaid: {cur} {val.totalRepaid.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">Total Given</p>
                      <p className="text-xl font-black text-[#1E1B4B] mt-0.5">
                        {cur} {val.totalGiven.toLocaleString()}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Remaining:</span>
                      <span className="font-black text-emerald-700">
                        {cur} {val.remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : userSummary ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
                <p className="text-xs font-semibold text-slate-400">Total Support Received</p>
                <p className="text-xl font-black text-[#1E1B4B] mt-1">
                  {userSummary.currency} {userSummary.totalReceived.toLocaleString()}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
                <p className="text-xs font-semibold text-slate-400">Repayable Support</p>
                <p className="text-xl font-black text-[#4F46E5] mt-1">
                  {userSummary.currency} {userSummary.repayableAmount.toLocaleString()}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
                <p className="text-xs font-semibold text-slate-400">Total Returned</p>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  {userSummary.currency} {userSummary.totalRepaid.toLocaleString()}
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
                <p className="text-xs font-semibold text-slate-400">Remaining to Return</p>
                <p className="text-xl font-black text-amber-600 mt-1">
                  {userSummary.currency} {userSummary.remainingBalance.toLocaleString()}
                </p>
              </div>
            </div>
          ) : null}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records or recipients..."
                className="pl-10 h-10 rounded-xl border-slate-200/80 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#4F46E5] shadow-xs"
              />
            </div>

            <div className="flex gap-2">
              {["all", "repayable", "gift", "overdue"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3.5 py-2 rounded-xl text-xs capitalize transition-all cursor-pointer ${
                    filterType === t
                      ? "bg-[#4F46E5] text-white font-bold shadow-xs"
                      : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 font-semibold"
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
              <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-xs">
                  <Wallet className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900">No financial support records found.</p>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Record personal care, allowances, educational support, or repaid installments.
                </p>
              </div>
            ) : (
              (() => {
                const totalPersonalPages = Math.max(1, Math.ceil(filteredRecords.length / personalPageSize));
                const personalStartIndex = (personalPage - 1) * personalPageSize;
                const personalEndIndex = Math.min(personalStartIndex + personalPageSize, filteredRecords.length);
                const pagedRecords = filteredRecords.slice(personalStartIndex, personalEndIndex);

                return (
                  <>
                    {pagedRecords.map((r) => {
                      const recipient = r.recipientPersonId as any;
                      const business = r.relatedBusinessId as any;

                      return (
                        <Link
                          key={r._id}
                          href={`/finance/${r._id}`}
                          className="block p-5 rounded-2xl border border-slate-100/90 bg-white hover:border-slate-200 hover:shadow-md transition-all shadow-[0_2px_12px_rgba(30,27,75,0.04)] group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100 font-black uppercase">
                                  {r.supportType.replace("_", " ")}
                                </span>

                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black uppercase border ${
                                    r.status === "fully_repaid" || r.status === "closed"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : r.status === "overdue"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : r.status === "converted_to_gift" || r.status === "gift"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {r.status.replace("_", " ")}
                                </span>

                                {r.visibilityMode && r.visibilityMode !== "available_now" && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                                    {r.visibilityMode}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-base font-black text-[#1E1B4B] truncate group-hover:text-[#4F46E5] transition-colors">
                                {r.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                                  <User className="w-3.5 h-3.5 text-[#4F46E5]" />
                                  {recipient?.name || "Recipient"} {recipient?.relation ? `(${recipient.relation})` : ""}
                                </span>

                                {business && (
                                  <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    {business.name}
                                  </span>
                                )}

                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(r.givenDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Financial Values */}
                            <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                              <div className="text-left sm:text-right">
                                <p className="text-xs font-semibold text-slate-400">Total Support</p>
                                <p className="text-base font-black text-[#1E1B4B]">
                                  {r.currency} {r.totalAmount.toLocaleString()}
                                </p>
                              </div>

                              {r.repayableOrNot && r.status !== "converted_to_gift" && r.status !== "gift" ? (
                                <div className="text-right">
                                  <p className="text-xs font-semibold text-slate-400">Remaining</p>
                                  <p className="text-base font-black text-emerald-700">
                                    {r.currency} {r.remainingBalance.toLocaleString()}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg">
                                    <Gift className="w-3.5 h-3.5" /> Non-Repayable
                                  </span>
                                </div>
                              )}

                              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}

                    {totalPersonalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                        <span>
                          Showing {personalStartIndex + 1}–{personalEndIndex} of {filteredRecords.length} records
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPersonalPage((p) => Math.max(1, p - 1))}
                            disabled={personalPage === 1}
                            className="h-8 px-2.5 rounded-xl text-xs font-bold border-slate-200 bg-white"
                          >
                            Prev
                          </Button>
                          <span className="px-2 font-bold text-[#1E1B4B]">
                            Page {personalPage} of {totalPersonalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPersonalPage((p) => Math.min(totalPersonalPages, p + 1))}
                            disabled={personalPage === totalPersonalPages}
                            className="h-8 px-2.5 rounded-xl text-xs font-bold border-slate-200 bg-white"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </>

      )}


      {/* Add Financial Record Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-lg rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-[#1E1B4B] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span>New Financial Support Record</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Record Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Medical emergency support or Business expansion advance"
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Recipient *</label>
                <select
                  required
                  value={formData.recipientPersonId}
                  onChange={(e) => setFormData({ ...formData, recipientPersonId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  <option value="">Select Recipient</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Support Type *</label>
                <select
                  value={formData.supportType}
                  onChange={(e) => handleSupportTypeChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
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
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-700">Total Amount *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="e.g. 50000"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="SAR">SAR (ر.س)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Given Date</label>
                <Input
                  type="date"
                  value={formData.givenDate}
                  onChange={(e) => setFormData({ ...formData, givenDate: e.target.value })}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Transaction Reference / Check No.
              </label>
              <Input
                value={formData.transactionReference}
                onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                placeholder="TRX123456 or Check #4892"
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            {formData.repayableOrNot && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1E1B4B]">
                  Repayment & Installment Setup
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Repayment Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.repaymentStartDate}
                      onChange={(e) => setFormData({ ...formData, repaymentStartDate: e.target.value })}
                      className="h-10 rounded-xl border-slate-200 bg-white text-slate-900 text-xs focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Frequency
                    </label>
                    <select
                      value={formData.installmentFrequency}
                      onChange={(e) => setFormData({ ...formData, installmentFrequency: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:border-[#4F46E5] focus:outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Installment Amount
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.installmentAmount}
                      onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="h-10 rounded-xl border-slate-200 bg-white text-slate-900 text-xs focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Number of Installments
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.numberOfInstallments}
                      onChange={(e) => setFormData({ ...formData, numberOfInstallments: e.target.value })}
                      placeholder="e.g. 10"
                      className="h-10 rounded-xl border-slate-200 bg-white text-slate-900 text-xs focus:border-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Visible Note to Recipient
              </label>
              <textarea
                value={formData.recipientVisibleNote}
                onChange={(e) => setFormData({ ...formData, recipientVisibleNote: e.target.value })}
                placeholder="Comforting, clear instructions for recipient..."
                className="w-full h-16 p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 px-5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold rounded-xl gap-2 shadow-xs transition-all cursor-pointer"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Financial Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
