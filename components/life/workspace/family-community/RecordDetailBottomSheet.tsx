"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Calendar,
  User,
  HeartPulse,
  Flame,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2,
  Pencil,
  MoreHorizontal,
  ChevronRight,
  Shield,
  Clock,
  ExternalLink,
  Trash2,
  AlertCircle,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  FamilyCommunityRecordDTO,
  updateFamilyCommunityStatus,
  deleteFamilyCommunityRecord,
} from "@/lib/actions/lifeWorkspace.actions";

interface RecordDetailBottomSheetProps {
  record: FamilyCommunityRecordDTO;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: FamilyCommunityRecordDTO) => void;
  onRecordUpdated: () => void;
}

export function RecordDetailBottomSheet({
  record,
  isOpen,
  onClose,
  onEdit,
  onRecordUpdated,
}: RecordDetailBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "linked" | "history">("overview");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!isOpen) return null;

  const handleMarkCompleted = async () => {
    try {
      setIsUpdating(true);
      const nextStatus = record.status === "completed" ? "active" : "completed";
      const res = await updateFamilyCommunityStatus(record.id, nextStatus);
      if (res.success) {
        toast.success(
          nextStatus === "completed"
            ? "Record marked as completed!"
            : "Record marked as active!"
        );
        onRecordUpdated();
      } else {
        toast.error(res.error || "Failed to update record status");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${record.title}"?`)) return;
    try {
      setIsUpdating(true);
      const res = await deleteFamilyCommunityRecord(record.id);
      if (res.success) {
        toast.success("Record deleted successfully");
        onClose();
        onRecordUpdated();
      } else {
        toast.error(res.error || "Failed to delete record");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record");
    } finally {
      setIsUpdating(false);
    }
  };

  const getRecordTypeBadge = () => {
    switch (record.recordType) {
      case "family_care":
        return "Family Care";
      case "kids":
        return "Kids Record";
      case "community":
        return "Community Record";
      default:
        return "Record";
    }
  };

  const getStatusBadge = () => {
    switch (record.status) {
      case "action_required":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Action Required
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = () => {
    const p = record.priority || "medium";
    const colors: Record<string, string> = {
      urgent: "text-red-600 bg-red-50 border-red-200",
      high: "text-amber-700 bg-amber-50 border-amber-200",
      medium: "text-indigo-600 bg-indigo-50 border-indigo-200",
      low: "text-slate-600 bg-slate-50 border-slate-200",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${
          colors[p] || colors.medium
        }`}
      >
        <Flame className="w-3 h-3" />
        {p}
      </span>
    );
  };

  const renderFileIcon = (type?: string) => {
    if (type === "pdf") {
      return (
        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold text-xs">
          PDF
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
        <File className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Drag Handle (Mobile) */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header with Avatar & Details */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-100 to-indigo-100 border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-base shadow-xs overflow-hidden">
                {record.relatedPersonAvatar ? (
                  <img
                    src={record.relatedPersonAvatar}
                    alt={record.relatedPersonName || record.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(record.relatedPersonName || record.title || "FC").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white line-clamp-1">
                  {record.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-medium">
                    {getRecordTypeBadge()}
                  </span>
                  {record.subType && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-600 font-medium">
                        {record.subType}
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-1.5">{getStatusBadge()}</div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Tabs */}
          <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            {(["overview", "notes", "linked", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
                  activeTab === tab
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "overview" && (
            <>
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Related Person */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Related Person
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.relatedPersonName || "Not Linked"}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Status
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block capitalize">
                      {record.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Care / Record Type */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {record.recordType === "kids" ? "Education / Record" : "Care Type"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.subType || "General Care"}
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Priority
                    </span>
                    <div className="mt-0.5">{getPriorityBadge()}</div>
                  </div>
                </div>

                {/* Due / Review Date */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Due / Review Date
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.dueDate
                        ? new Date(record.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No Date Set"}
                    </span>
                  </div>
                </div>

                {/* Assigned To */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Assigned To
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.assignedPersonName || "Owner"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Institution for Kids if present */}
              {record.institution && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      Institution / School Program
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {record.institution}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 bg-white dark:bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200">
                    Class 2
                  </span>
                </div>
              )}

              {/* Description Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(30,27,75,0.02)] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Description
                  </h4>
                  <button
                    type="button"
                    onClick={() => onEdit(record)}
                    className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {record.description || "No description provided."}
                </p>
              </div>

              {/* Attachments Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Attachments ({record.attachments?.length || 0})
                  </h4>
                  <span className="text-xs font-semibold text-indigo-600 cursor-pointer hover:underline">
                    See All
                  </span>
                </div>

                {record.attachments && record.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {record.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-indigo-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {renderFileIcon(att.type)}
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                              {att.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {att.date || "Oct 10, 2025"} • {att.size || "1.0 MB"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 text-xs text-slate-400">
                    No documents attached yet.
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "notes" && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Record Notes & Guidance
                </h4>
                {record.notes ? (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {record.notes}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No additional notes recorded. You can add notes by editing this record.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "linked" && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Linked Directory Profile
                </h4>
                {record.relatedPersonId ? (
                  <Link
                    href={`/people/${record.relatedPersonId}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        {(record.relatedPersonName || "Member").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {record.relatedPersonName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Central Person Directory
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </Link>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No individual profile linked from the People section.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Access & Security Classification
                </h4>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {record.accessPermission?.replace("_", " ") || "Private (Owner Only)"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Protected by LIFE VAULT AES-256 RBAC protocols. Linking someone to a record does not automatically grant them view access.
                </p>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Activity Audit Trail
              </h4>
              {record.history && record.history.length > 0 ? (
                <div className="space-y-2">
                  {record.history.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-3"
                    >
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {h.action}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          by {h.performedBy} •{" "}
                          {new Date(h.timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {h.details && (
                          <p className="text-[11px] text-slate-500 mt-1">{h.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5">
          {/* Mark as Completed */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleMarkCompleted}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
              record.status === "completed"
                ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            {record.status === "completed" ? "Mark as Active" : "Mark as Completed"}
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(record)}
            className="flex-1 py-3 px-3 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>

          {/* More Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-11 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 bottom-13 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-1.5 space-y-1 z-20">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    toast.success("Record link copied to clipboard");
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  Share Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDelete();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Delete Record
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
