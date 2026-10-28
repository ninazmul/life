/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Shield,
  Lock,
  Unlock,
  Clock,
  AlertCircle,
  ChevronRight,
  Loader2,
  KeyRound,
  FileText,
  Send,
  Calendar,
  X,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getUserSecureItems,
  requestAccessToItem,
} from "@/lib/actions/lifeUserDashboard.actions";

interface Props {
  onBack: () => void;
}

export function UserSecureFuture({ onBack }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "available" | "locked">("all");

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    const res = await getUserSecureItems();
    if (res.success && res.data) {
      setItems(res.data);
    }
    setLoading(false);
  }

  async function handleSendRequest() {
    if (!selectedItem) return;
    if (!requestReason.trim()) {
      toast.error("Please enter a reason for your request");
      return;
    }

    setSubmitting(true);
    const res = await requestAccessToItem(selectedItem._id, requestReason.trim());
    if (res.success) {
      toast.success("Access request sent to the owner");
      setShowRequestModal(false);
      setRequestReason("");
      setSelectedItem(null);
      loadItems();
    } else {
      toast.error(res.error || "Failed to submit request");
    }
    setSubmitting(false);
  }

  const filteredItems = items.filter((item) => {
    if (filter === "available") return item.isReleased;
    if (filter === "locked") return !item.isReleased;
    return true;
  });

  const availableCount = items.filter((i) => i.isReleased).length;
  const lockedCount = items.filter((i) => !i.isReleased).length;

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
            Secure & Future Items
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Confidential documents and instructions held in trust
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-[#EEF2FF] p-3.5 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[#1E1B4B]">Condition-Protected Access</p>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Some items are programmed to unlock automatically in emergencies, on a specific date, or upon owner approval.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium ${
            filter === "all"
              ? "bg-[#4F46E5] text-white font-bold shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("available")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium ${
            filter === "available"
              ? "bg-[#4F46E5] text-white font-bold shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Available ({availableCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("locked")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium ${
            filter === "locked"
              ? "bg-[#4F46E5] text-white font-bold shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Locked ({lockedCount})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
          <p className="text-xs font-medium">Checking secure items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100/90 p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#1E1B4B]">No items in this filter</h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            {filter === "locked"
              ? "You do not have any pending condition-sealed items."
              : "No secure items have been assigned to your profile yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isReleased = item.isReleased;

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-100/90 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(30,27,75,0.03)] hover:border-indigo-100 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isReleased
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                    >
                      {isReleased ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isReleased
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isReleased ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {item.statusLabel || (isReleased ? "Available" : "Locked")}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.recordType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1E1B4B] mt-1">
                        {item.displayTitle}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Release Condition Info */}
                <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] text-slate-600 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">Release rule: </span>
                    <span>
                      {item.releaseCondition ||
                        (item.visibilityMode === "scheduled_release"
                          ? `Scheduled for release on ${item.effectiveDate ? new Date(item.effectiveDate).toLocaleDateString() : "future date"}`
                          : item.visibilityMode === "manual_release"
                          ? "Owner manual release or authorized approval"
                          : "Protected under Life VAULT protocol")}
                    </span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isReleased ? "Ready to view" : "Encrypted until released"}
                  </p>
                  {!isReleased ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowRequestModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3 h-3" />
                      Request Early Access
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Early Access Request Modal */}
      {showRequestModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  Request Early Access
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedItem(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Submit a formal request to the owner explaining why you need early access to this locked item.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Item</span>
              <p className="font-bold text-[#1E1B4B]">{selectedItem.displayTitle}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reason for Request</label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Explain why you require access before the scheduled condition..."
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:border-[#4F46E5] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !requestReason.trim()}
                onClick={handleSendRequest}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
