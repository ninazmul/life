"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Shield,
  FileText,
  Send,
  Calendar,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { resolveUnifiedRequest } from "@/lib/actions/lifeToolsSupport.actions";

interface RequestReviewBottomSheetProps {
  request: any | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

export function RequestReviewBottomSheet({
  request,
  isOpen,
  onClose,
  onResolved,
}: RequestReviewBottomSheetProps) {
  const [responseNote, setResponseNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const handleAction = async (status: "approved" | "rejected" | "in_review") => {
    setIsSubmitting(true);
    try {
      const res = await resolveUnifiedRequest({
        requestId: request._id,
        status,
        adminResponse: responseNote,
      });

      if (res.success) {
        toast.success(`Request marked as ${status}`);
        setResponseNote("");
        onResolved?.();
        onClose();
      } else {
        toast.error(res.error || "Failed to update request");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case "in_review":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In Review</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1E1B4B]">Review Request</h2>
              <p className="text-[11px] text-slate-500 font-normal">Authorized request review & response</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Submitter & Status Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {request.submittedByName?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#1E1B4B]">{request.submittedByName || "Requester"}</p>
                <p className="text-[11px] text-slate-500">{request.submittedByEmail}</p>
              </div>
            </div>
            {getStatusBadge(request.status)}
          </div>

          {/* Request Information */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {request.category?.replace(/_/g, " ") || "Request"}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-normal">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date(request.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h3 className="text-[15px] font-bold text-[#1E1B4B]">{request.title}</h3>
            <p className="text-[13px] text-slate-600 leading-relaxed font-normal whitespace-pre-wrap">
              {request.description}
            </p>
            {request.relatedRecordName && (
              <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Related Record: {request.relatedRecordName}</span>
              </div>
            )}
          </div>

          {/* Previous Response if resolved */}
          {request.adminResponse && (
            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <span className="font-semibold text-indigo-700">Previous Reviewer Response:</span>
              <p className="text-slate-700">{request.adminResponse}</p>
              {request.resolvedBy && (
                <p className="text-[10px] text-slate-400 pt-1">Resolved by: {request.resolvedBy}</p>
              )}
            </div>
          )}

          {/* Response Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[12px] font-bold text-[#1E1B4B]">
              Add Response / Instructions to Submitter
            </label>
            <textarea
              rows={3}
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder="Provide a decision note, explanation, or instructions..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden placeholder:text-slate-400 font-normal resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction("rejected")}
            className="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors disabled:opacity-50"
          >
            Reject Request
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction("in_review")}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
          >
            Mark In Review
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAction("approved")}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            Approve Request
          </button>
        </div>
      </div>
    </div>
  );
}
