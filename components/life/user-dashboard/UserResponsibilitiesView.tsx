/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  XCircle,
  Calendar,
  FileText,
  Loader2,
  Send,
  X,
  MessageSquare,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getUserResponsibilities,
  respondToResponsibility,
  submitResponsibilityUpdate,
} from "@/lib/actions/lifeUserDashboard.actions";
import { createRequest } from "@/lib/actions/lifeRequest.actions";

interface Props {
  onBack: () => void;
  ownerName?: string;
}

export function UserResponsibilitiesView({ onBack, ownerName = "Owner" }: Props) {
  const [responsibilities, setResponsibilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "ongoing" | "completed">("all");

  // Accept modal state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptingItem, setAcceptingItem] = useState<any | null>(null);
  const [acceptNote, setAcceptNote] = useState("");
  const [submittingAccept, setSubmittingAccept] = useState(false);

  // Decline modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [decliningItem, setDecliningItem] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [submittingDecline, setSubmittingDecline] = useState(false);

  // Send Update modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<any | null>(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [markComplete, setMarkComplete] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Inquiry modal state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryItem, setInquiryItem] = useState<any | null>(null);
  const [inquiryText, setInquiryText] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    loadResponsibilities();
  }, []);

  async function loadResponsibilities() {
    setLoading(true);
    const res = await getUserResponsibilities();
    if (res.success && res.data) {
      setResponsibilities(res.data);
    }
    setLoading(false);
  }

  async function handleAccept() {
    if (!acceptingItem) return;
    setSubmittingAccept(true);
    const res = await respondToResponsibility(acceptingItem._id, "accept", acceptNote.trim());
    if (res.success) {
      toast.success("Responsibility accepted");
      setShowAcceptModal(false);
      setAcceptingItem(null);
      setAcceptNote("");
      loadResponsibilities();
    } else {
      toast.error(res.error || "Failed to accept");
    }
    setSubmittingAccept(false);
  }

  async function handleDecline() {
    if (!decliningItem) return;
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    setSubmittingDecline(true);
    const res = await respondToResponsibility(decliningItem._id, "cannot_perform", declineReason.trim());
    if (res.success) {
      toast.success("Response recorded and owner notified");
      setShowDeclineModal(false);
      setDecliningItem(null);
      setDeclineReason("");
      loadResponsibilities();
    } else {
      toast.error(res.error || "Failed to decline");
    }
    setSubmittingDecline(false);
  }

  async function handleSendUpdate() {
    if (!updatingItem || !updateMessage.trim()) return;
    setSubmittingUpdate(true);
    const res = await submitResponsibilityUpdate(updatingItem._id, updateMessage.trim(), markComplete);
    if (res.success) {
      toast.success(markComplete ? "Marked as completed and owner notified" : "Update sent to owner");
      setShowUpdateModal(false);
      setUpdatingItem(null);
      setUpdateMessage("");
      setMarkComplete(false);
      loadResponsibilities();
    } else {
      toast.error(res.error || "Failed to send update");
    }
    setSubmittingUpdate(false);
  }

  async function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!inquiryText.trim() || !inquiryItem) return;

    setSubmittingInquiry(true);
    const res = await createRequest({
      category: "general_inquiry",
      title: `Question regarding responsibility: ${inquiryItem.title}`,
      description: inquiryText.trim(),
      relatedRecordId: inquiryItem._id,
      relatedRecordType: "responsibility",
      relatedRecordName: inquiryItem.title,
    });

    if (res.success) {
      toast.success("Question submitted to owner");
      setShowInquiryModal(false);
      setInquiryText("");
      setInquiryItem(null);
    } else {
      toast.error(res.error || "Failed to submit inquiry");
    }
    setSubmittingInquiry(false);
  }

  const filtered = responsibilities.filter((r) => {
    const isPending = !r.userResponse;
    const isCompleted = r.status === "completed";
    const isOngoing = (r.userResponse === "accept" || r.userResponse === "accepted") && !isCompleted;

    if (filter === "pending") return isPending;
    if (filter === "ongoing") return isOngoing;
    if (filter === "completed") return isCompleted;
    return true;
  });

  const pendingCount = responsibilities.filter((r) => !r.userResponse).length;
  const ongoingCount = responsibilities.filter((r) => (r.userResponse === "accept" || r.userResponse === "accepted") && r.status !== "completed").length;
  const completedCount = responsibilities.filter((r) => r.status === "completed").length;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Header */}
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
            My Responsibilities
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Assigned roles, duties and delegated trusts
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium shrink-0 ${
            filter === "all"
              ? "bg-[#4F46E5] text-white font-bold shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All ({responsibilities.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium shrink-0 ${
            filter === "pending"
              ? "bg-[#4F46E5] text-white font-bold shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Pending Response ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("ongoing")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium shrink-0 ${
            filter === "ongoing"
              ? "bg-[#4F46E5] text-white font-bold shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Ongoing ({ongoingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium shrink-0 ${
            filter === "completed"
              ? "bg-[#4F46E5] text-white font-bold shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
          <p className="text-xs font-medium">Loading responsibilities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100/90 p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#1E1B4B]">No responsibilities here</h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            {filter === "pending"
              ? "You have answered all delegated requests."
              : "No responsibilities are currently assigned to you under this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((resp) => {
            const hasResponded = !!resp.userResponse;
            const isAccepted = resp.userResponse === "accept" || resp.userResponse === "accepted";
            const isDeclined = resp.userResponse === "cannot_perform" || resp.userResponse === "declined";
            const isCompleted = resp.status === "completed";

            return (
              <div
                key={resp._id}
                className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.03)] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          resp.priority === "urgent" || resp.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : resp.priority === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {resp.priority || "Normal"} Priority
                      </span>

                      {!hasResponded ? (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Awaiting Response
                        </span>
                      ) : isAccepted ? (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isCompleted ? "Completed" : "Accepted"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Declined
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#1E1B4B] mt-1.5">
                      {resp.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInquiryItem(resp);
                      setShowInquiryModal(true);
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0"
                    title="Ask question"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-medium">
                  {resp.instructions}
                </div>

                {/* Dates & Documents */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                  {resp.deadline ? (
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      Due by: {new Date(resp.deadline).toLocaleDateString()}
                    </span>
                  ) : (
                    <span>No deadline set</span>
                  )}

                  {resp.relatedDocument && (
                    <a
                      href={resp.relatedDocument.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4F46E5] hover:underline flex items-center gap-1 font-bold"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {resp.relatedDocument.title || "Related Doc"}
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                {!hasResponded ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAcceptingItem(resp);
                        setShowAcceptModal(true);
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept Responsibility
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDecliningItem(resp);
                        setShowDeclineModal(true);
                      }}
                      className="py-2 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                ) : isAccepted && !isCompleted ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Accepted on {resp.responseDate ? new Date(resp.responseDate).toLocaleDateString() : "record"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUpdatingItem(resp);
                        setShowUpdateModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Send Progress Update
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Accept Responsibility Modal */}
      {showAcceptModal && acceptingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  Accept Responsibility
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAcceptModal(false);
                  setAcceptingItem(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              You are accepting the responsibility: <span className="font-bold text-[#1E1B4B]">{acceptingItem.title}</span>. The owner will be notified of your commitment.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Optional Note to Owner</label>
              <textarea
                value={acceptNote}
                onChange={(e) => setAcceptNote(e.target.value)}
                placeholder="e.g. I have received the directive and will oversee the tasks..."
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] resize-none font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAcceptModal(false);
                  setAcceptingItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAccept}
                onClick={handleAccept}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {submittingAccept ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Confirm Acceptance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Responsibility Modal */}
      {showDeclineModal && decliningItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  Decline Responsibility
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDecliningItem(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Please share a reason with {ownerName} so an alternate designee can be arranged.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Reason for Declining *</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Explain why you cannot take on this responsibility..."
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] resize-none font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDecliningItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecline || !declineReason.trim()}
                onClick={handleDecline}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {submittingDecline ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Update Modal */}
      {showUpdateModal && updatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  Send Progress Update
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUpdateModal(false);
                  setUpdatingItem(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Updating progress for: <span className="font-bold text-[#1E1B4B]">{updatingItem.title}</span>
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Update Message</label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Describe recent actions taken or current status..."
                  rows={4}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] resize-none font-medium"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={markComplete}
                  onChange={(e) => setMarkComplete(e.target.checked)}
                  className="rounded text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700">
                  Mark this responsibility as completely finished
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateModal(false);
                  setUpdatingItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingUpdate || !updateMessage.trim()}
                onClick={handleSendUpdate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {submittingUpdate ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Submit Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && inquiryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  Ask About Responsibility
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInquiryModal(false);
                  setInquiryItem(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Have a question about {inquiryItem.title}? Send a clarification request to the owner.
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
                    setInquiryItem(null);
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
