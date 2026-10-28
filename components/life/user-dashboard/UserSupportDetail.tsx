/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Heart,
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
  Gift,
  GraduationCap,
  Home,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUserSupport } from "@/lib/actions/lifeUserDashboard.actions";
import { createRequest } from "@/lib/actions/lifeRequest.actions";

interface Props {
  onBack: () => void;
  ownerName?: string;
}

const SUPPORT_TYPE_LABELS: Record<string, { label: string; icon: any }> = {
  living_allowance: { label: "Living Allowance", icon: Home },
  educational_expense: { label: "Educational Grant", icon: GraduationCap },
  repayable_loan: { label: "Repayable Support", icon: CreditCard },
  gift: { label: "Gift / Grant", icon: Gift },
  medical_support: { label: "Medical Support", icon: Heart },
  other: { label: "Financial Care", icon: Heart },
};

export function UserSupportDetail({ onBack, ownerName = "Owner" }: Props) {
  const [supportList, setSupportList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealAmounts, setRevealAmounts] = useState(true);

  // Inquiry modal state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState<any | null>(null);
  const [inquiryText, setInquiryText] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    loadSupport();
  }, []);

  async function loadSupport() {
    setLoading(true);
    const res = await getUserSupport();
    if (res.success && res.data) {
      setSupportList(res.data);
    }
    setLoading(false);
  }

  const totalSupport = supportList.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalRepaid = supportList.reduce((acc, s) => acc + (s.totalRepaid || 0), 0);
  const totalRemaining = supportList.reduce((acc, s) => acc + (s.remainingBalance || 0), 0);
  const totalForgiven = supportList.reduce((acc, s) => acc + (s.forgiven || 0), 0);

  function formatMoney(amount: number) {
    if (!revealAmounts) return "৳ •••••";
    return `৳ ${Number(amount || 0).toLocaleString("en-US")}`;
  }

  async function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    setSubmittingInquiry(true);
    const res = await createRequest({
      category: "financial_care",
      title: `Inquiry regarding Support: ${selectedSupport?.title || "Care Commitment"}`,
      description: inquiryText.trim(),
      relatedRecordId: selectedSupport?._id,
      relatedRecordType: "support",
      relatedRecordName: selectedSupport?.title,
    });

    if (res.success) {
      toast.success("Question sent to owner");
      setShowInquiryModal(false);
      setInquiryText("");
      setSelectedSupport(null);
    } else {
      toast.error(res.error || "Failed to submit inquiry");
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
              My Financial Support
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Care allowances, educational grants & commitments
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
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500">Total Support Allocated</span>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Active Care
          </span>
        </div>

        <div>
          <p className="text-2xl sm:text-3xl font-black text-[#1E1B4B] tracking-tight">
            {formatMoney(totalSupport)}
          </p>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Repaid</span>
            <p className="font-extrabold text-slate-700">{formatMoney(totalRepaid)}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Remaining</span>
            <p className="font-extrabold text-indigo-600">{formatMoney(totalRemaining)}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Forgiven</span>
            <p className="font-extrabold text-emerald-600">{formatMoney(totalForgiven)}</p>
          </div>
        </div>
      </div>

      {/* Commitments List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Commitments & Grants ({supportList.length})
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
            <p className="text-xs font-medium">Loading support details...</p>
          </div>
        ) : supportList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100/90 p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Heart className="w-5 h-5 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-[#1E1B4B]">No Active Support Records</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              No financial support programs are currently registered under your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {supportList.map((sup) => {
              const TypeConfig = SUPPORT_TYPE_LABELS[sup.supportType] || SUPPORT_TYPE_LABELS.other;
              const TypeIcon = TypeConfig.icon;
              const installments = sup.installments || [];

              return (
                <div
                  key={sup._id}
                  className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.03)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {TypeConfig.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium capitalize">
                            {sup.frequency.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#1E1B4B] mt-1">{sup.title}</h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                        {formatMoney(sup.totalAmount)}
                      </p>
                      {sup.installmentAmount > 0 && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatMoney(sup.installmentAmount)} / term
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recipient Note */}
                  {sup.recipientNote && (
                    <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 space-y-0.5 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Note from {ownerName}
                      </span>
                      <p className="font-medium text-slate-700 leading-relaxed">
                        {sup.recipientNote}
                      </p>
                    </div>
                  )}

                  {/* Installment Schedule */}
                  {installments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Disbursement / Installment Schedule ({installments.length})
                      </p>
                      <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                        {installments.map((inst: any, idx: number) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  inst.status === "paid" ? "bg-emerald-500" : "bg-amber-400"
                                }`}
                              />
                              <span className="font-bold text-slate-700">
                                #{inst.number || idx + 1}: {formatMoney(inst.amount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-slate-400 font-medium">
                                {new Date(inst.dueDate).toLocaleDateString()}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                                  inst.status === "paid"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {inst.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSupport(sup);
                        setShowInquiryModal(true);
                      }}
                      className="py-1.5 px-3 rounded-xl text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Ask a Question
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  Inquire About Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInquiryModal(false);
                  setSelectedSupport(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Have a question about {selectedSupport?.title}? Send a direct message to the owner.
            </p>

            <form onSubmit={handleSendInquiry} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Message</label>
                <textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="Type your question or clarification here..."
                  rows={4}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInquiryModal(false);
                    setSelectedSupport(null);
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
                  Send Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
