"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Calendar,
  User,
  Heart,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Gift,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Trash2,
  Users,
  Shield,
  RotateCcw,
  Plus,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  SisCareRecordDTO,
  recordSisCareReturn,
  recordSisCareForgive,
  toggleSisCareProfileAccess,
  deleteSisCareRecord,
} from "@/lib/actions/lifeWorkspace.actions";

interface SisCareDetailBottomSheetProps {
  record: SisCareRecordDTO;
  isOpen: boolean;
  onClose: () => void;
  onRecordUpdated: () => void;
  onOpenSharedView?: () => void;
}

export function SisCareDetailBottomSheet({
  record,
  isOpen,
  onClose,
  onRecordUpdated,
  onOpenSharedView,
}: SisCareDetailBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "linked" | "history">("overview");
  const [isUpdating, setIsUpdating] = useState(false);

  // Return Dialog State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnAmount, setReturnAmount] = useState("");
  const [returnAccount, setReturnAccount] = useState("Cash • BDT");
  const [returnNotes, setReturnNotes] = useState("");

  // Forgive Dialog State
  const [isForgiveModalOpen, setIsForgiveModalOpen] = useState(false);
  const [forgiveAmount, setForgiveAmount] = useState("");
  const [forgiveReason, setForgiveReason] = useState("");

  // More Menu State
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showPrivateNotes, setShowPrivateNotes] = useState(false);

  if (!isOpen) return null;

  const handleToggleSharing = async (enabled: boolean) => {
    try {
      setIsUpdating(true);
      const res = await toggleSisCareProfileAccess(record.id, enabled);
      if (res.success) {
        toast.success(enabled ? "Profile access enabled" : "Profile access disabled");
        onRecordUpdated();
      } else {
        toast.error(res.error || "Failed to update access");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update access");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRecordReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(returnAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid return amount");
      return;
    }
    try {
      setIsUpdating(true);
      const res = await recordSisCareReturn({
        recordId: record.id,
        amount: amt,
        account: returnAccount,
        notes: returnNotes,
      });
      if (res.success) {
        toast.success(`Recorded return of ৳ ${amt.toLocaleString()}`);
        setIsReturnModalOpen(false);
        setReturnAmount("");
        onRecordUpdated();
      } else {
        toast.error(res.error || "Failed to record return");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to record return");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForgiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(forgiveAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount to forgive");
      return;
    }
    try {
      setIsUpdating(true);
      const res = await recordSisCareForgive({
        recordId: record.id,
        amount: amt,
        reason: forgiveReason,
      });
      if (res.success) {
        toast.success(`Forgave ৳ ${amt.toLocaleString()} for ${record.personName}`);
        setIsForgiveModalOpen(false);
        setForgiveAmount("");
        onRecordUpdated();
      } else {
        toast.error(res.error || "Failed to forgive amount");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to forgive amount");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this record for ${record.personName}?`)) return;
    try {
      setIsUpdating(true);
      const res = await deleteSisCareRecord(record.id);
      if (res.success) {
        toast.success("Record deleted");
        onClose();
        onRecordUpdated();
      } else {
        toast.error(res.error || "Failed to delete record");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content (Mockup Screen 3) */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Drag Handle (Mobile) */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                {record.personName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white line-clamp-1">
                  {record.personName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  SiS Care • {record.supportType === "gift" ? "Gift" : "Flexible support"}
                </p>
                <div className="mt-1">
                  {record.isShared ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-600 border border-sky-200">
                      <Users className="w-3 h-3" />
                      Shared
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock className="w-3 h-3" />
                      Private
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Stat Summary Boxes (Screen 3) */}
          <div className="grid grid-cols-3 gap-2 mt-3.5">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Given
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ৳ {record.totalGiven.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
                Returned
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                ৳ {record.totalReturned.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-600 block tracking-wider">
                Remaining
              </span>
              <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                ৳ {record.remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 4 Tabs */}
          <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            {(["overview", "transactions", "linked", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
                  activeTab === tab
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "overview" && (
            <>
              {/* Primary Action Buttons (Screen 3) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Record Return
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Additional flexible support ready to record");
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  Add Support
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Gift grant option selected");
                  }}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Gift className="w-3.5 h-3.5 text-purple-600" />
                  Gift
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 bottom-11 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 p-1.5 space-y-1 z-30">
                      {onOpenSharedView && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            onOpenSharedView();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Users className="w-3.5 h-3.5 text-sky-500" />
                          View Recipient UI
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleDelete();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        Delete Record
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions List (Screen 3) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent transactions
                </h4>
                <div className="space-y-2">
                  {record.transactions && record.transactions.length > 0 ? (
                    record.transactions.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              t.type === "return"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : t.type === "forgiveness"
                                ? "bg-purple-50 text-purple-600 border border-purple-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}
                          >
                            {t.type === "return" ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : t.type === "forgiveness" ? (
                              <Heart className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block capitalize">
                              {t.type}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(t.date).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              • {t.account || "Cash"} • {t.currency || "BDT"}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-black ${
                            t.type === "return"
                              ? "text-red-600"
                              : t.type === "forgiveness"
                              ? "text-purple-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {t.type === "return" ? "-" : "+"}৳ {t.amount.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">No transactions recorded.</div>
                  )}
                </div>
              </div>

              {/* Owner Only Area (Screen 3) */}
              <div
                onClick={() => setShowPrivateNotes(!showPrivateNotes)}
                className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-indigo-900 text-indigo-600 flex items-center justify-center shadow-xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1E1B4B] dark:text-white block">
                      Owner only
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Private notes & future instructions
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    showPrivateNotes ? "rotate-90" : ""
                  }`}
                />
              </div>

              {showPrivateNotes && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-in fade-in">
                  <span className="font-bold block text-slate-800 dark:text-slate-200">
                    Confidential Directives:
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {record.ownerPrivateNotes ||
                      "Flexible personal assistance. Recipient can return whenever capable."}
                  </p>
                  {record.futureInstructions && (
                    <p className="mt-2 text-indigo-700 dark:text-indigo-300 italic border-t border-slate-200 pt-2">
                      Handover note: {record.futureInstructions}
                    </p>
                  )}
                </div>
              )}

              {/* Forgive Amount Button / Card (Screen 3) */}
              <div
                onClick={() => setIsForgiveModalOpen(true)}
                className="p-3.5 rounded-2xl bg-purple-50/70 hover:bg-purple-50 border border-purple-100 dark:border-purple-900/50 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                      Forgive amount
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Forgiveness changes balance, no cash received.
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </div>

              {/* Profile Access Toggle (Screen 3) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Profile access
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={record.isShared}
                      onChange={(e) => handleToggleSharing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    {record.personName} • Verified account
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                  <span className="text-indigo-600 font-semibold cursor-pointer hover:underline text-[11px]">
                    Choose visible records &gt;
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 pt-1 text-center">
                  Private notes are never shared.
                </p>
              </div>
            </>
          )}

          {activeTab === "transactions" && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                All Recorded Postings
              </h4>
              <div className="space-y-2">
                {record.transactions?.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block capitalize">
                        {t.type}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(t.date).toLocaleDateString()} • {t.account}
                      </span>
                      {t.notes && <p className="text-[10px] text-slate-500 mt-0.5">{t.notes}</p>}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        t.type === "return" ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {t.type === "return" ? "-" : "+"}৳ {t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "linked" && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Central Person Directory
                </h4>
                {record.personId ? (
                  <Link
                    href={`/people/${record.personId}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-800">{record.personName}</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </Link>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Recipient is recorded as a non-login contact.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Forgiveness & Adjustment History
              </h4>
              {record.forgivenessHistory && record.forgivenessHistory.length > 0 ? (
                <div className="space-y-2">
                  {record.forgivenessHistory.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs"
                    >
                      <span className="font-bold text-purple-900 block">
                        Forgave ৳ {f.amount.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(f.date).toLocaleDateString()} • by {f.performedBy}
                      </span>
                      {f.reason && <p className="text-[11px] text-slate-600 mt-1">{f.reason}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No forgiveness applied yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Modal: Record Return
      ───────────────────────────────────────────────────────────── */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                Record Voluntary Return
              </h3>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRecordReturnSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Return Amount (BDT) (Remaining: ৳ {record.remainingBalance.toLocaleString()})
                </label>
                <input
                  type="number"
                  required
                  max={record.remainingBalance}
                  placeholder="e.g. 10000"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Receiving Account
                </label>
                <select
                  value={returnAccount}
                  onChange={(e) => setReturnAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="Cash • BDT">Cash • BDT</option>
                  <option value="BRAC Bank • Savings">BRAC Bank • Savings</option>
                  <option value="City Bank">City Bank</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Voluntary partial return"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold"
                >
                  Save Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal: Forgive Amount
      ───────────────────────────────────────────────────────────── */}
      {isForgiveModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                Forgive Amount
              </h3>
              <button
                type="button"
                onClick={() => setIsForgiveModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Forgiveness reduces the remaining balance permanently without creating cash inflow. The recipient will not be alerted unless explicitly authorized.
            </p>
            <form onSubmit={handleForgiveSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Amount to Forgive (Max: ৳ {record.remainingBalance.toLocaleString()})
                </label>
                <input
                  type="number"
                  required
                  max={record.remainingBalance}
                  placeholder={`e.g. ${record.remainingBalance}`}
                  value={forgiveAmount}
                  onChange={(e) => setForgiveAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Private Reason / Note (Owner Eyes Only)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hardship relief, voluntary forgiveness"
                  value={forgiveReason}
                  onChange={(e) => setForgiveReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgiveModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  Confirm Forgive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
