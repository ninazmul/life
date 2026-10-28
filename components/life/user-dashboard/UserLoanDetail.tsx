/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Loader2,
  X,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUserLoans } from "@/lib/actions/lifeUserDashboard.actions";
import { createRequest } from "@/lib/actions/lifeRequest.actions";

interface Props {
  onBack: () => void;
}

export function UserLoanDetail({ onBack }: Props) {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealAmounts, setRevealAmounts] = useState(true);

  // Inquiry modal state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [inquiryType, setInquiryType] = useState<"question" | "payment_report">("question");
  const [inquiryText, setInquiryText] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  async function loadLoans() {
    setLoading(true);
    const res = await getUserLoans();
    if (res.success && res.data) {
      setLoans(res.data);
    }
    setLoading(false);
  }

  const totalBorrowed = loans.reduce((acc, l) => acc + (l.amount || 0), 0);
  const totalRepaid = loans.reduce((acc, l) => acc + (l.paidAmount || 0), 0);
  const totalRemaining = loans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0);
  const progressPercent = totalBorrowed > 0 ? Math.min(100, Math.round((totalRepaid / totalBorrowed) * 100)) : 0;

  function formatMoney(amount: number) {
    if (!revealAmounts) return "৳ •••••";
    return `৳ ${Number(amount || 0).toLocaleString("en-US")}`;
  }

  async function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    setSubmittingInquiry(true);
    const title = inquiryType === "payment_report"
      ? `Payment Report for Loan (${selectedLoan?.currency || "BDT"} ${selectedLoan?.amount})`
      : `Question regarding Loan (${selectedLoan?.currency || "BDT"} ${selectedLoan?.amount})`;

    const res = await createRequest({
      category: "financial_care",
      title,
      description: inquiryText.trim(),
      relatedRecordId: selectedLoan?._id,
      relatedRecordType: "loan",
      relatedRecordName: selectedLoan?.purpose || "Personal Loan",
    });

    if (res.success) {
      toast.success(
        inquiryType === "payment_report"
          ? "Payment report sent to owner for verification"
          : "Question sent to owner"
      );
      setShowInquiryModal(false);
      setInquiryText("");
      setSelectedLoan(null);
    } else {
      toast.error(res.error || "Failed to submit request");
    }
    setSubmittingInquiry(false);
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] leading-tight">
              My Loan Details
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Loan records, repayments and remaining balance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRevealAmounts((v) => !v)}
          className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
          aria-label={revealAmounts ? "Hide amounts" : "Show amounts"}
        >
          {revealAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Aggregate Balance Card */}
      <div className="bg-white rounded-3xl border border-slate-100/90 p-5 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500">Remaining Balance</span>
          </div>
          <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {progressPercent}% Repaid
          </span>
        </div>

        <div>
          <p className="text-2xl sm:text-3xl font-black text-[#1E1B4B] tracking-tight">
            {formatMoney(totalRemaining)}
          </p>
        </div>

        {/* Repayment Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#4F46E5] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Repaid: {formatMoney(totalRepaid)}</span>
            <span>Total: {formatMoney(totalBorrowed)}</span>
          </div>
        </div>
      </div>

      {/* Loan List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Loan Records ({loans.length})
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
            <p className="text-xs font-medium">Loading loan details...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100/90 p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-[#1E1B4B]">No Active Loans</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              You currently do not have any recorded loans or outstanding debt.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => {
              const settlements = loan.settlements || [];
              const isSettled = loan.status === "settled" || loan.remainingAmount <= 0;

              return (
                <div
                  key={loan._id}
                  className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.03)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSettled
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-indigo-100 text-[#4F46E5]"
                          }`}
                        >
                          {isSettled ? "Settled" : "Active"}
                        </span>
                        {loan.date && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Disbursed: {new Date(loan.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#1E1B4B] mt-1">
                        {loan.purpose || "Personal Financial Support"}
                      </h3>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-medium">Remaining</p>
                      <p className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                        {formatMoney(loan.remainingAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Original Amount</span>
                      <p className="font-extrabold text-slate-700">{formatMoney(loan.amount)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Total Repaid</span>
                      <p className="font-extrabold text-emerald-600">{formatMoney(loan.paidAmount)}</p>
                    </div>
                    {loan.expectedReturnDate && (
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center gap-1.5 text-slate-600 text-[11px] font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Expected Return: {new Date(loan.expectedReturnDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Repayment History Accordion / List */}
                  {settlements.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-[#4F46E5]" />
                        Repayment History ({settlements.length})
                      </p>
                      <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                        {settlements.map((s: any, idx: number) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-700">
                                {formatMoney(s.amount)}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1.5">
                                via {s.paymentMethod || "Direct Transfer"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(s.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLoan(loan);
                        setInquiryType("payment_report");
                        setShowInquiryModal(true);
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Report Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLoan(loan);
                        setInquiryType("question");
                        setShowInquiryModal(true);
                      }}
                      className="py-2 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition-colors flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Inquire
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inquiry / Report Payment Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  {inquiryType === "payment_report" ? "Report a Payment" : "Ask About This Loan"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInquiryModal(false);
                  setSelectedLoan(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {inquiryType === "payment_report"
                ? "Send details of a payment you made (amount, bank reference, or transaction date) for the owner to record in the ledger."
                : "Have a question about calculation, schedule, or conditions? Send a message directly to the owner."}
            </p>

            <form onSubmit={handleSendInquiry} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Details</label>
                <textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder={
                    inquiryType === "payment_report"
                      ? "e.g. Paid ৳ 10,000 via bKash on Oct 27, TrxID: 9X82..."
                      : "Type your question or clarification here..."
                  }
                  rows={4}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInquiryModal(false);
                    setSelectedLoan(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry || !inquiryText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {submittingInquiry ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
