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
      <Link
        href="/finance"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Financial Records
      </Link>

      {/* Main Card Header */}
      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold uppercase">
                {record.supportType.replace("_", " ")}
              </span>

              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  record.status === "fully_repaid"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : record.status === "converted_to_gift" || record.status === "gift"
                    ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                    : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                }`}
              >
                {record.status.replace("_", " ")}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-foreground">{record.title}</h1>

            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-4 pt-1">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                Recipient: {recipient?.name} {recipient?.relation ? `(${recipient.relation})` : ""}
              </span>

              {business && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {business.name}
                </span>
              )}

              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm text-xs"
            >
              <CreditCard className="w-4 h-4 mr-1.5" />
              Submit Payment
            </Button>

            {(isOwner || isAdmin) && record.remainingBalance > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setGiftModalOpen(true)}
                  className="rounded-xl border-purple-500/30 text-purple-600 hover:bg-purple-500/10 text-xs"
                >
                  <Gift className="w-4 h-4 mr-1.5" />
                  Convert to Gift
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setWaiveModalOpen(true)}
                  className="rounded-xl border-amber-500/30 text-amber-600 hover:bg-amber-500/10 text-xs"
                >
                  Waive Amount
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
          <div className="p-3 rounded-2xl bg-muted/40">
            <p className="text-xs text-muted-foreground">Total Given</p>
            <p className="text-lg font-extrabold text-foreground">
              {record.currency} {record.totalAmount.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40">
            <p className="text-xs text-muted-foreground">Total Repaid</p>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {record.currency} {record.totalRepaid.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40">
            <p className="text-xs text-muted-foreground">Remaining Balance</p>
            <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
              {record.currency} {record.remainingBalance.toLocaleString()}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40">
            <p className="text-xs text-muted-foreground">Installments</p>
            <p className="text-lg font-extrabold text-foreground">
              {installments.filter((i) => i.status === "paid").length} / {installments.length || "-"}
            </p>
          </div>
        </div>

        {/* Note if visible */}
        {record.recipientVisibleNote && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-foreground/90">
            <span className="font-bold text-emerald-700 dark:text-emerald-300 mr-1">
              Note from Owner:
            </span>
            {record.recipientVisibleNote}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 transition-colors relative ${
            activeTab === "schedule"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Repayment Schedule ({installments.length})
          {activeTab === "schedule" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("confirmations")}
          className={`pb-3 transition-colors relative ${
            activeTab === "confirmations"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Payment Approvals ({pendingConfirmations.length})
          {activeTab === "confirmations" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("gift_conversion")}
          className={`pb-3 transition-colors relative ${
            activeTab === "gift_conversion"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Gift History ({record.giftConversions?.length || 0})
          {activeTab === "gift_conversion" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 transition-colors relative ${
            activeTab === "timeline"
              ? "text-emerald-600 dark:text-emerald-400 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Audit Timeline ({history.length})
          {activeTab === "timeline" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "schedule" && (
        <div className="space-y-3">
          {installments.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No installment schedule defined for this support.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
              {installments.map((inst) => (
                <div
                  key={inst._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                      #{inst.installmentNumber}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {record.currency} {inst.expectedAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(inst.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                        inst.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : inst.status === "overdue"
                          ? "bg-red-500/10 text-red-600 border border-red-500/20"
                          : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
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
                        className="rounded-xl text-xs"
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
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
              <CheckCircle2 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No payments pending verification.</p>
            </div>
          ) : (
            pendingConfirmations.map((conf) => (
              <div
                key={conf._id}
                className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-foreground">
                      {conf.currency} {conf.amount.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        conf.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : conf.status === "rejected"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {conf.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                    >
                      Confirm & Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewPayment(conf._id, "rejected")}
                      className="rounded-xl text-xs text-red-600 border-red-500/20"
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
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
              <Gift className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No gift conversions recorded.</p>
            </div>
          ) : (
            (record.giftConversions || []).map((gc, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-border bg-card space-y-1 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    Converted: {record.currency} {gc.amount.toLocaleString()} ({gc.conversionType})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(gc.conversionDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Previous balance was {record.currency} {gc.previousRemaining.toLocaleString()}, new balance is {record.currency} {gc.newRemaining.toLocaleString()}.
                </p>
                {gc.ownerNote && (
                  <p className="text-xs text-foreground/80 italic mt-1">"{gc.ownerNote}"</p>
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
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
              <History className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No audit entries found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h._id}
                  className="p-3.5 rounded-2xl border border-border bg-card text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{h.description}</p>
                    <p className="text-muted-foreground">
                      By {h.performedBy} on {new Date(h.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {h.amount ? (
                    <span className="font-bold text-emerald-600 shrink-0">
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
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Submit Payment for Verification</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitPayment} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Amount ({record.currency}) *</label>
              <Input
                type="number"
                required
                min="1"
                step="any"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Transaction Ref / Cheque #</label>
              <Input
                value={payTrxRef}
                onChange={(e) => setPayTrxRef(e.target.value)}
                placeholder="TRX987654"
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {submittingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit for Approval
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert to Gift Modal (§15) */}
      <Dialog open={giftModalOpen} onOpenChange={setGiftModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Convert Support to Gift</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConvertGift} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Conversion Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="gt"
                    checked={giftType === "partial"}
                    onChange={() => setGiftType("partial")}
                  />
                  Partial Amount
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="gt"
                    checked={giftType === "full"}
                    onChange={() => setGiftType("full")}
                  />
                  Full Remaining Balance ({record.currency} {record.remainingBalance.toLocaleString()})
                </label>
              </div>
            </div>

            {giftType === "partial" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
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
                  className="rounded-xl"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Owner’s Note</label>
              <textarea
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Reason or prayer for recipient..."
                className="w-full h-20 p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGiftModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={convertingGift}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                {convertingGift ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Gift Conversion
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Waive Modal */}
      <Dialog open={waiveModalOpen} onOpenChange={setWaiveModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Waive Outstanding Amount</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleWaive} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
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
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Reason / Note</label>
              <textarea
                value={waiveNote}
                onChange={(e) => setWaiveNote(e.target.value)}
                placeholder="Explanation of waiver..."
                className="w-full h-20 p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWaiveModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={waiving}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
              >
                {waiving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Waiver
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
