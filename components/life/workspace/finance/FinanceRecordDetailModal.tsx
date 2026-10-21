"use client";

import { useState, useEffect } from "react";
import {
  X,
  Lock,
  Globe2,
  Users,
  Calendar,
  Wallet,
  Receipt,
  FileCheck2,
  Share2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  History,
  Trash2,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import {
  UnifiedFinancialItem,
  getUnifiedRecordDetail,
  shareUnifiedRecord,
  revokeUnifiedRecordShare,
  recordUnifiedLoanRepayment,
  forgiveUnifiedLoanPrincipal,
} from "@/lib/actions/lifeUnifiedFinance.actions";
import { ILifePerson } from "@/types";
import toast from "react-hot-toast";

interface FinanceRecordDetailModalProps {
  item: UnifiedFinancialItem | null;
  onClose: () => void;
  peopleList: ILifePerson[];
  onRecordUpdated: () => void;
  currencySymbol?: string;
}

function formatMoney(amount: number, symbol = "৳"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0${symbol}`;
  }
  return `${Number(amount).toLocaleString("en-US")}${symbol}`;
}

export function FinanceRecordDetailModal({
  item,
  onClose,
  peopleList,
  onRecordUpdated,
  currencySymbol = "৳",
}: FinanceRecordDetailModalProps) {
  const [detailData, setDetailData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-actions state inside details
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "sharing" | "repay" | "forgive">("overview");

  // Repay state
  const [repayAmount, setRepayAmount] = useState("");
  const [repayNotes, setRepayNotes] = useState("");
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);

  // Forgive state
  const [forgiveAmount, setForgiveAmount] = useState("");
  const [forgiveReason, setForgiveReason] = useState("");
  const [isSubmittingForgive, setIsSubmittingForgive] = useState(false);

  // Share state
  const [sharePersonId, setSharePersonId] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!item) return;
    setIsLoading(true);
    getUnifiedRecordDetail(item.id, item.sourceModel)
      .then((res) => {
        setDetailData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load record details");
        setIsLoading(false);
      });
  }, [item]);

  if (!item) return null;

  const handleShare = async () => {
    if (!sharePersonId) {
      toast.error("Please select a person to grant access");
      return;
    }
    setIsSharing(true);
    try {
      await shareUnifiedRecord({
        recordId: item.id,
        sourceModel: item.sourceModel,
        personId: sharePersonId,
      });
      toast.success("Read-only access granted successfully!");
      setSharePersonId("");
      const res = await getUnifiedRecordDetail(item.id, item.sourceModel);
      setDetailData(res);
      onRecordUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to grant access");
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevoke = async (targetPersonId: string) => {
    const confirmRevoke = window.confirm("Are you sure you want to revoke this person's access?");
    if (!confirmRevoke) return;

    try {
      await revokeUnifiedRecordShare({
        recordId: item.id,
        sourceModel: item.sourceModel,
        personId: targetPersonId,
      });
      toast.success("Access revoked immediately!");
      const res = await getUnifiedRecordDetail(item.id, item.sourceModel);
      setDetailData(res);
      onRecordUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke access");
    }
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(repayAmount);
    if (!num || num <= 0) {
      toast.error("Enter a valid repayment amount");
      return;
    }
    setIsSubmittingRepay(true);
    try {
      await recordUnifiedLoanRepayment({
        loanId: item.id,
        amount: num,
        date: new Date().toISOString().split("T")[0],
        notes: repayNotes,
      });
      toast.success("Repayment recorded!");
      setRepayAmount("");
      setRepayNotes("");
      setActiveTab("overview");
      const res = await getUnifiedRecordDetail(item.id, item.sourceModel);
      setDetailData(res);
      onRecordUpdated();
    } catch (err: any) {
      toast.error(err.message || "Repayment failed");
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  const handleForgiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(forgiveAmount);
    if (!num || num <= 0) {
      toast.error("Enter a valid forgiveness amount");
      return;
    }
    setIsSubmittingForgive(true);
    try {
      await forgiveUnifiedLoanPrincipal({
        loanId: item.id,
        forgiveAmount: num,
        reason: forgiveReason || "Goodwill forgiveness",
      });
      toast.success("Principal forgiveness applied!");
      setForgiveAmount("");
      setForgiveReason("");
      setActiveTab("overview");
      const res = await getUnifiedRecordDetail(item.id, item.sourceModel);
      setDetailData(res);
      onRecordUpdated();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmittingForgive(false);
    }
  };

  const isLoan = item.recordType === "loan_given" || item.recordType === "loan_received";
  const settlements = detailData?.settlements || [];
  const permissions = detailData?.permissions || [];
  const record = detailData?.record || {};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#4F46E5] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1E1B4B] dark:text-white leading-tight">
                Record Details
              </h3>
              <p className="text-[11px] text-slate-500 capitalize">
                {item.recordType.replace("_", " ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[12px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#4F46E5] text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Overview
          </button>

          {settlements.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#4F46E5] text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              History ({settlements.length})
            </button>
          )}

          {isLoan && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("repay")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "repay"
                    ? "bg-[#4F46E5] text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                + Repay
              </button>
              {item.recordType === "loan_given" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("forgive")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === "forgive"
                      ? "bg-[#4F46E5] text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Forgive
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("sharing")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "sharing"
                ? "bg-[#4F46E5] text-white shadow-2xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Privacy & Sharing ({permissions.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 flex-1">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-[12px]">
              Loading record data...
            </div>
          ) : activeTab === "overview" ? (
            <div className="space-y-4">
              {/* Main Amount Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Principal / Value
                </span>
                <p className="text-[24px] font-black text-[#1E1B4B] dark:text-white">
                  {formatMoney(item.amount, currencySymbol)}
                </p>
                {typeof item.remainingAmount === "number" && isLoan && (
                  <div className="flex items-center justify-center gap-3 pt-2 text-[12px] font-bold border-t border-indigo-100/80 dark:border-indigo-900/40">
                    <span className="text-emerald-700">
                      Repaid: {formatMoney(item.paidAmount || 0, currencySymbol)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-rose-600">
                      Remaining: {formatMoney(item.remainingAmount, currencySymbol)}
                    </span>
                  </div>
                )}
              </div>

              {/* Detail Items Grid */}
              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Title</span>
                  <span className="font-bold text-[#1E1B4B] dark:text-white max-w-[200px] truncate">
                    {item.title}
                  </span>
                </div>

                {item.personName && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Linked Person</span>
                    <span className="font-bold text-[#1E1B4B] dark:text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {item.personName}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Record Date</span>
                  <span className="font-bold text-[#1E1B4B] dark:text-white">
                    {new Date(item.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {item.dueDate && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Expected Return / Due</span>
                    <span className="font-bold text-amber-700">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {item.account && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Account / Channel</span>
                    <span className="font-bold text-[#1E1B4B] dark:text-white">
                      {item.account}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Privacy Status</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {permissions.length === 0 ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Private (Owner Only)
                      </>
                    ) : (
                      <>
                        <Globe2 className="w-3.5 h-3.5 text-indigo-500" />
                        Shared with {permissions.length} user{permissions.length === 1 ? "" : "s"}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Notes & Terms
                  </span>
                  <p className="text-[12px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === "history" ? (
            /* Settlements / Repayment History */
            <div className="space-y-3">
              <h4 className="text-[13px] font-bold text-[#1E1B4B] dark:text-white">
                Repayment & Settlement History
              </h4>
              <div className="space-y-2">
                {settlements.map((s: any) => (
                  <div
                    key={String(s._id)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[12px]"
                  >
                    <div>
                      <span className="font-bold text-emerald-600 block">
                        +{formatMoney(s.amount, currencySymbol)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(s.date).toLocaleDateString()} • {s.paymentMethod || "Bank"}
                      </span>
                      {s.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{s.notes}</p>
                      )}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "repay" ? (
            /* Repay Loan Form */
            <form onSubmit={handleRepaySubmit} className="space-y-3 text-[12px]">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                <span className="text-slate-500 block">Current Remaining Balance</span>
                <span className="text-[16px] font-extrabold text-[#1E1B4B] dark:text-white">
                  {formatMoney(item.remainingAmount || 0, currencySymbol)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Repayment Amount ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={item.remainingAmount || undefined}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[14px]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="e.g. Bank transfer reference or note"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRepay}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50"
              >
                {isSubmittingRepay ? "Recording..." : "Confirm Repayment"}
              </button>
            </form>
          ) : activeTab === "forgive" ? (
            /* Principal Forgiveness Form */
            <form onSubmit={handleForgiveSubmit} className="space-y-3 text-[12px]">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Principal Forgiveness</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Forgiven principal decreases the outstanding balance without being counted as a repayment or income.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount to Forgive ({currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={item.remainingAmount || undefined}
                  value={forgiveAmount}
                  onChange={(e) => setForgiveAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[14px]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Forgiveness *
                </label>
                <input
                  type="text"
                  value={forgiveReason}
                  onChange={(e) => setForgiveReason(e.target.value)}
                  placeholder="e.g. Humanitarian relief, family settlement"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingForgive}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all disabled:opacity-50"
              >
                {isSubmittingForgive ? "Applying..." : "Confirm Principal Forgiveness"}
              </button>
            </form>
          ) : (
            /* Explicit Sharing & ACL Settings */
            <div className="space-y-4 text-[12px]">
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#1E1B4B] dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Granular Access Control</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Only users explicitly granted access below can view this record. Linking a person as a counterparty does <strong>not</strong> grant them access.
                </p>
              </div>

              {/* Grant Share Control */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Grant Read-Only Access
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={sharePersonId}
                    onChange={(e) => setSharePersonId(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-medium"
                  >
                    <option value="">-- Select Person to Share With --</option>
                    {peopleList.map((p) => (
                      <option key={String((p as any)._id)} value={String((p as any)._id)}>
                        {p.name} {p.relation ? `(${p.relation})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isSharing || !sharePersonId}
                    className="px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSharing ? "Sharing..." : "Share"}
                  </button>
                </div>
              </div>

              {/* Active Permissions List */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-[#1E1B4B] dark:text-white">
                  Currently Authorized Users ({permissions.length})
                </h4>
                {permissions.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">
                    This record is strictly Private — Owner Only. No external users have access.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {permissions.map((perm: any) => {
                      const p = perm.assignedPersonId;
                      return (
                        <div
                          key={String(perm._id)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-[11px]">
                              {p?.name?.[0] || "U"}
                            </div>
                            <div>
                              <span className="font-bold text-[#1E1B4B] dark:text-white block">
                                {p?.name || "Authorized User"}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Read-only • Granted on {new Date(perm.releasedAt || perm.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRevoke(String(p?._id || perm.assignedPersonId))}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
