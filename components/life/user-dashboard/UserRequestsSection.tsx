/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  Loader2,
  X,
  User,
  Shield,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getMyRequests,
  sendRequestMessage,
  createRequest,
  markRequestMessagesAsRead,
} from "@/lib/actions/lifeRequest.actions";
import { ILifeRequest, RequestCategory } from "@/types";

interface Props {
  onBack: () => void;
}

const CATEGORY_LABELS: Record<RequestCategory, string> = {
  general_inquiry: "General Inquiry",
  access_request: "Access Request",
  document_access: "Document Access",
  financial_care: "Financial Care",
  note_access: "Note Access",
  information_request: "Information Request",
  responsibility_request: "Responsibility Request",
  other: "Other",
};

export function UserRequestsSection({ onBack }: Props) {
  const [requests, setRequests] = useState<ILifeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ILifeRequest | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // New Request Form state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCategory, setNewCategory] = useState<RequestCategory>("general_inquiry");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await getMyRequests();
      setRequests(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load requests");
    }
    setLoading(false);
  }

  async function handleSelectRequest(req: ILifeRequest) {
    setSelectedRequest(req);
    if ((req.unreadByUser || 0) > 0) {
      await markRequestMessagesAsRead(String(req._id));
      setRequests((prev) =>
        prev.map((r) => (r._id === req._id ? { ...r, unreadByUser: 0 } : r))
      );
    }
  }

  async function handleSendReply() {
    if (!selectedRequest || !replyMessage.trim()) return;
    setSendingReply(true);
    const res = await sendRequestMessage(String(selectedRequest._id), replyMessage.trim());
    if (res.success) {
      const newMsg = {
        senderId: "me",
        senderName: "You",
        senderRole: "user",
        message: replyMessage.trim(),
        isRead: false,
        sentAt: new Date().toISOString(),
      };
      const updatedMessages = [...(selectedRequest.messages || []), newMsg];
      const updated = { ...selectedRequest, messages: updatedMessages as any };
      setSelectedRequest(updated);
      setRequests((prev) =>
        prev.map((r) => (r._id === selectedRequest._id ? updated : r))
      );
      setReplyMessage("");
      toast.success("Message sent");
    } else {
      toast.error(res.error || "Failed to send message");
    }
    setSendingReply(false);
  }

  async function handleCreateNewRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.error("Please fill in both title and description");
      return;
    }

    setCreating(true);
    const res = await createRequest({
      category: newCategory,
      title: newTitle.trim(),
      description: newDescription.trim(),
    });

    if (res.success) {
      toast.success("Request submitted successfully");
      setShowNewModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("general_inquiry");
      loadRequests();
    } else {
      toast.error(res.error || "Failed to submit request");
    }
    setCreating(false);
  }

  // ── Render Request Detail View ──
  if (selectedRequest) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              aria-label="Back to requests"
              className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-[#1E1B4B] line-clamp-1">
                {selectedRequest.title}
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                {CATEGORY_LABELS[selectedRequest.category]} •{" "}
                {new Date(selectedRequest.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              selectedRequest.status === "approved" || selectedRequest.status === "completed"
                ? "bg-emerald-100 text-emerald-800"
                : selectedRequest.status === "in_review"
                ? "bg-sky-100 text-sky-800"
                : selectedRequest.status === "rejected"
                ? "bg-rose-100 text-rose-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {selectedRequest.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Initial Request Description Card */}
        <div className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.03)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E1B4B]">
            <HelpCircle className="w-4 h-4 text-[#4F46E5]" />
            Your Original Request
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {selectedRequest.description}
          </p>
        </div>

        {/* Conversation Thread */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Communication History
          </h2>

          {(!selectedRequest.messages || selectedRequest.messages.length === 0) ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">
                No replies yet. The owner will review and respond shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedRequest.messages.map((msg: any, idx: number) => {
                const isAdmin = msg.senderRole === "admin" || msg.senderRole === "super_admin";
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-3.5 border ${
                      isAdmin
                        ? "bg-[#EEF2FF] border-indigo-100 text-slate-800 ml-4"
                        : "bg-white border-slate-100 text-slate-800 mr-4 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {isAdmin ? (
                          <Shield className="w-3.5 h-3.5 text-[#4F46E5]" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="text-xs font-bold text-[#1E1B4B]">
                          {msg.senderName || (isAdmin ? "Life VAULT Owner" : "You")}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {msg.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Send Reply Input */}
        <div className="bg-white rounded-2xl border border-slate-100/90 p-3 shadow-[0_2px_12px_rgba(30,27,75,0.04)] flex items-center gap-2">
          <input
            type="text"
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
            placeholder="Write a message to the owner..."
            className="flex-1 text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] placeholder:text-slate-400 font-medium"
          />
          <button
            type="button"
            disabled={sendingReply || !replyMessage.trim()}
            onClick={handleSendReply}
            className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0 shadow-xs"
          >
            {sendingReply ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Render Requests List ──
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
              My Requests
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Questions, access inquiries & correspondence
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="px-3 py-1.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          New Request
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
          <p className="text-xs font-medium">Loading your requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100/90 p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#4F46E5]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E1B4B]">No requests yet</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-0.5">
              Have a question about an instruction, need access to a file, or want to send a message to the owner?
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Submit Your First Request
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((req) => {
            const hasUnread = (req.unreadByUser || 0) > 0;
            return (
              <button
                key={String(req._id)}
                type="button"
                onClick={() => handleSelectRequest(req)}
                className={`w-full text-left bg-white rounded-2xl border p-3.5 sm:p-4 transition-all shadow-[0_2px_12px_rgba(30,27,75,0.03)] hover:border-indigo-200 group ${
                  hasUnread ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-100/90"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[req.category]}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === "approved" || req.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : req.status === "in_review"
                            ? "bg-sky-100 text-sky-800"
                            : req.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {req.status.replace(/_/g, " ")}
                      </span>
                      {hasUnread && (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded-full">
                          New Reply
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[#1E1B4B] group-hover:text-[#4F46E5] transition-colors">
                      {req.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                      {req.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5] transition-colors shrink-0 mt-1" />
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  <span>{req.messages?.length || 0} messages</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  Submit New Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRequest} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as RequestCategory)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:border-[#4F46E5] font-medium"
                >
                  <option value="general_inquiry">General Inquiry</option>
                  <option value="access_request">Access Request</option>
                  <option value="document_access">Document Access</option>
                  <option value="financial_care">Financial Care</option>
                  <option value="responsibility_request">Responsibility Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Subject / Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Question about educational grant"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Details</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe your request or question in detail..."
                  rows={4}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim() || !newDescription.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {creating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
