"use client";

import React from "react";
import {
  X,
  ClipboardCheck,
  ScrollText,
  Siren,
  Scale,
  User,
  Lock,
  Clock,
  Shield,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Link2,
  Flag,
  FileText,
  Edit3,
  Trash2,
} from "lucide-react";
import { UnifiedContinuityItem } from "@/lib/actions/lifeWorkspace.actions";

interface ContinuityDetailBottomSheetProps {
  item: UnifiedContinuityItem;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RECORD_TYPE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bgColor: string; borderColor: string }
> = {
  responsibilities: {
    label: "Responsibility",
    icon: ClipboardCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
  },
  instructions: {
    label: "Instruction",
    icon: ScrollText,
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-100",
  },
  emergency: {
    label: "Emergency Protocol",
    icon: Siren,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
  },
  legacy_legal: {
    label: "Legacy & Legal",
    icon: Scale,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500" },
  high: { label: "High", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  medium: { label: "Medium", color: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-500" },
  low: { label: "Low", color: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

const ACCESS_METHOD_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  immediate: { label: "Immediate Access", icon: Eye, color: "text-emerald-600" },
  timed_request: { label: "Timed Request", icon: Clock, color: "text-amber-600" },
  guardian_verified: { label: "Guardian Verified", icon: Shield, color: "text-purple-600" },
};

const WORK_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  accepted: "Accepted",
  in_progress: "In Progress",
  submitted: "Submitted",
  completed: "Completed",
};

export function ContinuityDetailBottomSheet({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ContinuityDetailBottomSheetProps) {
  if (!isOpen) return null;

  const typeConfig = RECORD_TYPE_CONFIG[item.recordType] || RECORD_TYPE_CONFIG.responsibilities;
  const TypeIcon = typeConfig.icon;
  const priorityConfig = PRIORITY_CONFIG[item.priority || "medium"];
  const accessConfig = ACCESS_METHOD_CONFIG[item.accessPolicy.method];
  const AccessIcon = accessConfig?.icon || Clock;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-x border-slate-200/50 dark:border-slate-800 shadow-2xl">
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${typeConfig.bgColor} ${typeConfig.color} border ${typeConfig.borderColor} flex items-center justify-center`}
              >
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1E1B4B] dark:text-white leading-tight">
                  {item.ownerTitle}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{typeConfig.label}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-500 shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pb-8 space-y-4">
            {/* Status & Priority Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${priorityConfig.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`} />
                {priorityConfig.label}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                {WORK_STATUS_LABELS[item.workStatus] || item.workStatus}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  item.status === "active"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : item.status === "draft"
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {item.status === "active" ? "Active" : item.status === "draft" ? "Draft" : "Archived"}
              </span>
            </div>

            {/* Recipient-Visible Title */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100/90 dark:border-slate-700/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Recipient-Visible Title
                </span>
              </div>
              <p className="text-xs font-semibold text-[#1E1B4B] dark:text-white">
                {item.recipientTitle}
              </p>
              {item.recipientDescription && (
                <p className="text-[11px] text-slate-500 mt-1">{item.recipientDescription}</p>
              )}
            </div>

            {/* Main Content */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Instructions / Content
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {item.mainContent}
              </p>
            </div>

            {/* Assigned Person */}
            {item.assignedPersonName && (
              <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100/80 dark:border-sky-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                    {item.assignedPersonName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                      {item.assignedPersonName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {item.assignedRole || "Assigned Recipient"}
                    </p>
                  </div>
                </div>
                <User className="w-4 h-4 text-sky-400" />
              </div>
            )}

            {/* Access Policy Card */}
            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AccessIcon className={`w-4 h-4 ${accessConfig?.color || "text-slate-500"}`} />
                  <span className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                    {accessConfig?.label || "Access Policy"}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.accessPolicy.accessStatus === "released"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.accessPolicy.accessStatus === "available"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {item.accessPolicy.accessStatus === "released"
                    ? "Released"
                    : item.accessPolicy.accessStatus === "available"
                    ? "Available"
                    : "Locked"}
                </span>
              </div>

              {item.accessPolicy.method === "timed_request" && (
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Waiting period: <span className="font-bold">{item.accessPolicy.waitingPeriodLabel}</span>{" "}
                  before access is granted after request.
                </p>
              )}
              {item.accessPolicy.method === "guardian_verified" && (
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Requires <span className="font-bold">{item.accessPolicy.requiredApprovals}</span> guardian
                  approvals before release.
                </p>
              )}
              {item.accessPolicy.method === "immediate" && (
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Assigned recipient has immediate access to view this record.
                </p>
              )}
            </div>

            {/* Applicable Situation */}
            {item.applicableSituation && (
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/40">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    Applicable Situation
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">{item.applicableSituation}</p>
              </div>
            )}

            {/* Linked Items */}
            {item.linkedItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-0.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Linked Records
                  </span>
                </div>
                {item.linkedItems.map((li, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{li.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">{li.type}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Owner Private Notes (visible only to owner) */}
            {item.ownerPrivateNotes && (
              <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/80 dark:border-rose-900/40">
                <div className="flex items-center gap-2 mb-1">
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                    Owner Private Notes
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 whitespace-pre-line">
                  {item.ownerPrivateNotes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-[10px] text-slate-400 px-0.5 pt-1">
              <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onEdit}
                className="flex-1 h-11 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Edit3 className="w-4 h-4" />
                Edit Record
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="w-11 h-11 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
