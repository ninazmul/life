/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  User,
  Building2,
  Gift,
  ShieldAlert,
  History,
  Plus,
  Loader2,
  CreditCard,
  FileText,
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
  ILifeInstallment,
  ILifeFinancialHistory,
  ILifePaymentConfirmation,
} from "@/types";
import {
  submitPayment,
  confirmPayment,
  waiveAmount,
  convertToGift,
  generateInstallmentSchedule,
} from "@/lib/actions/lifeFinancialSupport.actions";
import toast from "react-hot-toast";

interface FinancialSupportDetailProps {
  initialData: {
    record: ILifeFinancialSupport;
    installments: ILifeInstallment[];
    history: ILifeFinancialHistory[];
    pendingConfirmations: ILifePaymentConfirmation[];
  };
  isOwner?: boolean;
  isAdmin?: boolean;
}

export function FinancialSupportDetail({
  initialData,
  isOwner = false,
  isAdmin = false,
}: FinancialSupportDetailProps) {
  const [record, setRecord] = useState(initialData.record);
  const [installments, setInstallments] = useState(initialData.installments);
  const [history, setHistory] = useState(initialData.history);
  const [pendingConfirmations, setPendingConfirmations] = useState(
    initialData.pendingConfirmations
  );
  const [activeTab, setActiveTab] = useState<"schedule" | "confirmations" | "gift_conversion" | "timeline">("schedule");

  // Payment Submit Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payTrxRef, setPayTrxRef] = useState("");
  const [payReceiptUrl, setPayReceiptUrl] = useState("");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Gift Conversion Modal
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftType, setGiftType] = useState<"partial" | "full">("partial");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [convertingGift, setConvertingGift] = useState(false);

  // Waive Modal
  const [waiveModalOpen, setWaiveModalOpen] = useState(false);
  const [waiveAmountVal, setWaiveAmountVal] = useState("");
  const [waiveNote, setWaiveNote] = useState("");
  const [waiving, setWaiving] = useState(false);

  const recipient = record.recipientPersonId as any;
  const business = record.relatedBusinessId as any;

  // Handle user payment submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await submitPayment({
        financialSupportId: record._id,
        installmentId: selectedInstallmentId || undefined,
        amount: Number(payAmount),
        paymentDate: new Date(),
        paymentMethod: payMethod,
        transactionReference: payTrxRef,
        receiptUrl: payReceiptUrl,
      });

      if (res.success && res.confirmation) {
        toast.success("Payment submitted for confirmation!");
        setPendingConfirmations([res.confirmation, ...pendingConfirmations]);
        setPayModalOpen(false);
        setPayAmount("");
        setPayTrxRef("");
      } else {
        toast.error(res.error || "Failed to submit payment");
      }
    } catch {
      toast.error("Error submitting payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Owner confirmation / approval
  const handleReviewPayment = async (
    confirmationId: string,
    action: "approved" | "rejected"
  ) => {
    try {
      const res = await confirmPayment({ confirmationId, action });
      if (res.success) {
        toast.success(`Payment ${action}!`);
        // Refresh local view state
        const target = pendingConfirmations.find((c) => c._id === confirmationId);
        if (target && action === "approved") {
          setRecord((prev) => ({
            ...prev,
            totalRepaid: prev.totalRepaid + target.amount,
            remainingBalance: Math.max(0, prev.remainingBalance - target.amount),
          }));
        }
        setPendingConfirmations((prev) =>
          prev.map((c) => (c._id === confirmationId ? { ...c, status: action } : c))
        );
      } else {
        toast.error(res.error || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  // Handle gift conversion (§15)
  const handleConvertGift = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = giftType === "full" ? record.remainingBalance : Number(giftAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please specify a valid gift amount.");
      return;
    }

    setConvertingGift(true);
    try {
      const res = await convertToGift({
        financialSupportId: record._id,
        amount: amountNum,
        conversionType: giftType,
        ownerNote: giftNote,
      });

      if (res.success) {
        toast.success(`Converted ${record.currency} ${amountNum} to Gift!`);
        setRecord((prev) => ({
          ...prev,
          remainingBalance: Math.max(0, prev.remainingBalance - amountNum),
          status: prev.remainingBalance - amountNum === 0 ? "converted_to_gift" : prev.status,
        }));
        setGiftModalOpen(false);
      } else {
        toast.error(res.error || "Failed to convert");
      }
    } catch {
      toast.error("Conversion failed");
    } finally {
      setConvertingGift(false);
    }
  };

  // Handle Waive amount
  const handleWaive = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(waiveAmountVal);
    if (!val || val <= 0) {
      toast.error("Please specify a valid amount.");
      return;
    }

    setWaiving(true);
    try {
      const res = await waiveAmount(record._id, val, waiveNote);
      if (res.success) {
        toast.success(`Waived ${record.currency} ${val}!`);
        setRecord((prev) => ({
          ...prev,
          remainingBalance: Math.max(0, prev.remainingBalance - val),
        }));
        setWaiveModalOpen(false);
      } else {
        toast.error(res.error || "Failed to waive amount");
      }
    } catch {
      toast.error("Waive failed");
    } finally {
      setWaiving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Link
          href="/finance"
          className="h-9 w-9 p-0 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 shadow-xs flex items-center justify-center transition-all cursor-pointer"
          title="Back to Financial Records"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <span className="text-xs font-bold text-slate-500">Back to Financial Records</span>
      </div>

      {/* Main Card Header */}
      <div className="p-6 rounded-3xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100 font-black uppercase">
                {record.supportType.replace("_", " ")}
              </span>

              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black uppercase border ${
                  record.status === "fully_repaid"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : record.status === "converted_to_gift" || record.status === "gift"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {record.status.replace("_", " ")}
              </span>
            </div>

            <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight">{record.title}</h1>

            <p className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-4 pt-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <User className="w-3.5 h-3.5 text-[#4F46E5]" />
                Recipient: {recipient?.name} {recipient?.relation ? `(${recipient.relation})` : ""}
              </span>

              {business && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {business.name}
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Given: {new Date(record.givenDate).toLocaleDateString()}
              </span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setSelectedInstallmentId("");
                setPayModalOpen(true);
              }}
              className="h-9 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Submit Payment
            </Button>

            {(isOwner || isAdmin) && record.remainingBalance > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setGiftModalOpen(true)}
                  className="h-9 px-3.5 rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  Convert to Gift
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setWaiveModalOpen(true)}
                  className="h-9 px-3.5 rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs cursor-pointer"
                >
                  Waive Amount
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400">Total Given</p>
            <p className="text-lg font-black text-[#1E1B4B] mt-0.5">
              {record.currency} {record.totalAmount.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400">Total Repaid</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">
              {record.currency} {record.totalRepaid.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400">Remaining Balance</p>
            <p className="text-lg font-black text-amber-600 mt-0.5">
              {record.currency} {record.remainingBalance.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400">Installments</p>
            <p className="text-lg font-black text-[#1E1B4B] mt-0.5">
              {installments.filter((i) => i.status === "paid").length} / {installments.length || "-"}
            </p>
          </div>
        </div>

        {/* Note if visible */}
        {record.recipientVisibleNote && (
          <div className="p-4 rounded-2xl bg-[#EEF2FF] border border-indigo-100 text-xs text-slate-700 font-medium">
            <span className="font-black text-[#4F46E5] mr-1.5">
              Note from Owner:
            </span>
            {record.recipientVisibleNote}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === "schedule"
              ? "text-[#4F46E5] font-black"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Repayment Schedule ({installments.length})
          {activeTab === "schedule" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("confirmations")}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === "confirmations"
              ? "text-[#4F46E5] font-black"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Payment Approvals ({pendingConfirmations.length})
          {activeTab === "confirmations" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("gift_conversion")}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === "gift_conversion"
              ? "text-[#4F46E5] font-black"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Gift History ({record.giftConversions?.length || 0})
          {activeTab === "gift_conversion" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === "timeline"
              ? "text-[#4F46E5] font-black"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Audit Timeline ({history.length})
          {activeTab === "timeline" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "schedule" && (
        <div className="space-y-3">
          {installments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                No installment schedule defined for this support.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100/90 bg-white overflow-hidden shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
              {installments.map((inst) => (
                <div
                  key={inst._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-black text-xs shrink-0">
                      #{inst.installmentNumber}
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#1E1B4B]">
                        {record.currency} {inst.expectedAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due: {new Date(inst.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black uppercase border ${
                        inst.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : inst.status === "overdue"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {inst.status.replace("_", " ")}
                    </span>

                    {inst.status !== "paid" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInstallmentId(inst._id);
                          setPayAmount(String(inst.remainingAmount));
                          setPayModalOpen(true);
                        }}
                        className="h-8 px-3 rounded-xl border-indigo-200 bg-white hover:bg-[#EEF2FF] text-[#4F46E5] font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Pay This
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Confirmations Queue (§14) */}
      {activeTab === "confirmations" && (
        <div className="space-y-3">
          {pendingConfirmations.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">No payments pending verification.</p>
            </div>
          ) : (
            pendingConfirmations.map((conf) => (
              <div
                key={conf._id}
                className="p-5 rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#1E1B4B]">
                      {conf.currency} {conf.amount.toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black uppercase border ${
                        conf.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : conf.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {conf.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Submitted by {conf.submittedByName} on{" "}
                    {new Date(conf.paymentDate).toLocaleDateString()} via {conf.paymentMethod}
                    {conf.transactionReference ? ` (Ref: ${conf.transactionReference})` : ""}
                  </p>
                </div>

                {(isOwner || isAdmin) && conf.status === "submitted" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReviewPayment(conf._id, "approved")}
                      className="h-8 px-3.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Confirm & Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewPayment(conf._id, "rejected")}
                      className="h-8 px-3.5 rounded-xl text-xs font-bold text-rose-600 border-rose-200 bg-white hover:bg-rose-50 cursor-pointer"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Gift Conversions (§15) */}
      {activeTab === "gift_conversion" && (
        <div className="space-y-3">
          {(record.giftConversions || []).length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto shadow-xs">
                <Gift className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">No gift conversions recorded.</p>
            </div>
          ) : (
            (record.giftConversions || []).map((gc, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-1.5 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-700">
                    Converted: {record.currency} {gc.amount.toLocaleString()} ({gc.conversionType})
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(gc.conversionDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Previous balance was {record.currency} {gc.previousRemaining.toLocaleString()}, new balance is {record.currency} {gc.newRemaining.toLocaleString()}.
                </p>
                {gc.ownerNote && (
                  <p className="text-xs text-slate-700 italic font-serif mt-1">"{gc.ownerNote}"</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Timeline History (§12) */}
      {activeTab === "timeline" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-white shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-xs">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">No audit entries found.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((h) => (
                <div
                  key={h._id}
                  className="p-4 rounded-2xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)] text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#1E1B4B]">{h.description}</p>
                    <p className="text-slate-500 font-medium">
                      By {h.performedBy} on {new Date(h.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {h.amount ? (
                    <span className="font-black text-emerald-700 shrink-0 text-sm">
                      ৳{h.amount.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Payment Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-[#1E1B4B] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <span>Submit Payment for Verification</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Amount ({record.currency}) *</label>
              <Input
                type="number"
                required
                min="1"
                step="any"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Transaction Ref / Cheque #</label>
              <Input
                value={payTrxRef}
                onChange={(e) => setPayTrxRef(e.target.value)}
                placeholder="TRX987654"
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPayModalOpen(false)}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingPayment}
                className="h-10 px-5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold rounded-xl gap-2 shadow-xs transition-all cursor-pointer"
              >
                {submittingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit for Approval
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert to Gift Modal (§15) */}
      <Dialog open={giftModalOpen} onOpenChange={setGiftModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-[#1E1B4B] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <span>Convert Support to Gift</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConvertGift} className="space-y-4 pt-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Conversion Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="gt"
                    checked={giftType === "partial"}
                    onChange={() => setGiftType("partial")}
                    className="text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  Partial Amount
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="gt"
                    checked={giftType === "full"}
                    onChange={() => setGiftType("full")}
                    className="text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  Full Remaining Balance ({record.currency} {record.remainingBalance.toLocaleString()})
                </label>
              </div>
            </div>

            {giftType === "partial" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Gift Amount ({record.currency}) *
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  max={record.remainingBalance}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value)}
                  placeholder="e.g. 20000"
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Owner’s Note</label>
              <textarea
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Reason or prayer for recipient..."
                className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setGiftModalOpen(false)}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={convertingGift}
                className="h-10 px-5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold rounded-xl gap-2 shadow-xs transition-all cursor-pointer"
              >
                {convertingGift && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Gift Conversion
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Waive Modal */}
      <Dialog open={waiveModalOpen} onOpenChange={setWaiveModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-[#1E1B4B] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span>Waive Outstanding Amount</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleWaive} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Amount to Waive ({record.currency}) *
              </label>
              <Input
                type="number"
                required
                min="1"
                max={record.remainingBalance}
                value={waiveAmountVal}
                onChange={(e) => setWaiveAmountVal(e.target.value)}
                placeholder="e.g. 10000"
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reason / Note</label>
              <textarea
                value={waiveNote}
                onChange={(e) => setWaiveNote(e.target.value)}
                placeholder="Explanation of waiver..."
                className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setWaiveModalOpen(false)}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={waiving}
                className="h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl gap-2 shadow-xs transition-all cursor-pointer"
              >
                {waiving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Waiver
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
