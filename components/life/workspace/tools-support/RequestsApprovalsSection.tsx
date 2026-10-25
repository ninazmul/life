"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  FileText,
  AlertCircle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getUnifiedInboxRequests,
  resolveUnifiedRequest,
} from "@/lib/actions/lifeToolsSupport.actions";
import { RequestReviewBottomSheet } from "./RequestReviewBottomSheet";

interface RequestsApprovalsSectionProps {
  onRefresh?: () => void;
}

export function RequestsApprovalsSection({ onRefresh }: RequestsApprovalsSectionProps) {
  const [filter, setFilter] = useState<"pending" | "reviewed" | "all">("pending");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await getUnifiedInboxRequests({ filter });
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleQuickApprove = async (e: React.MouseEvent, req: any) => {
    e.stopPropagation();
    try {
      const res = await resolveUnifiedRequest({
        requestId: req._id,
        status: "approved",
        adminResponse: "Quick approved via Unified Inbox",
      });
      if (res.success) {
        toast.success(`Request approved`);
        fetchRequests();
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to approve");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const pendingCount = requests.filter(
    (r) => r.status === "pending" || r.status === "in_review"
  ).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            filter === "pending"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>Pending</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              filter === "pending"
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("reviewed")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === "reviewed"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Reviewed
        </button>

        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === "all"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All Requests
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading requests inbox...
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100/90 text-center space-y-2 shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#1E1B4B]">No requests found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {filter === "pending"
              ? "Everything is clear! There are no pending requests awaiting review."
              : "No requests found for this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req._id}
              onClick={() => setActiveRequest(req)}
              className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer space-y-3"
            >
              {/* Header: Requester + Category Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {req.submittedByName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">{req.submittedByName || "Requester"}</h4>
                    <p className="text-[10px] text-slate-400 font-normal">
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 capitalize">
                    {req.category?.replace(/_/g, " ") || "Request"}
                  </span>
                  {req.status === "approved" && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Approved
                    </span>
                  )}
                  {req.status === "rejected" && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                      Rejected
                    </span>
                  )}
                  {req.status === "pending" && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-[13px] font-bold text-[#1E1B4B]">{req.title}</h3>
                <p className="text-[12px] text-slate-500 line-clamp-2 mt-0.5 font-normal leading-relaxed">
                  {req.description}
                </p>
              </div>

              {/* Related Record info if present */}
              {req.relatedRecordName && (
                <div className="text-[11px] text-indigo-600 bg-indigo-50/50 rounded-lg p-2 border border-indigo-100 flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Target: {req.relatedRecordName}</span>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1">
                  Open Review Sheet <ArrowRight className="w-3 h-3" />
                </span>

                {req.status === "pending" && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleQuickApprove(e, req)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors"
                    >
                      Quick Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal Sheet */}
      <RequestReviewBottomSheet
        request={activeRequest}
        isOpen={Boolean(activeRequest)}
        onClose={() => setActiveRequest(null)}
        onResolved={() => {
          fetchRequests();
          onRefresh?.();
        }}
      />
    </div>
  );
}
