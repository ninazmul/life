"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Calendar,
  User,
  Building2,
  Briefcase,
  Flag,
  Flame,
  FileText,
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
  MapPin,
  PieChart,
  Landmark,
  Layers,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  WorkBusinessRecordDTO,
  updateWorkBusinessStatus,
  deleteWorkBusinessRecord,
} from "@/lib/actions/lifeWorkspace.actions";

interface WorkBusinessRecordDetailBottomSheetProps {
  record: WorkBusinessRecordDTO;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (record: WorkBusinessRecordDTO) => void;
  onRecordUpdated: () => void;
}

export function WorkBusinessRecordDetailBottomSheet({
  record,
  isOpen,
  onClose,
  onEdit,
  onRecordUpdated,
}: WorkBusinessRecordDetailBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "linked" | "history">("overview");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!isOpen) return null;

  const handleToggleStatus = async () => {
    try {
      setIsUpdating(true);
      const nextStatus = record.status === "completed" ? "active" : "completed";
      const res = await updateWorkBusinessStatus(record.id, nextStatus);
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
      const res = await deleteWorkBusinessRecord(record.id);
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
      case "business":
        return "Business Record";
      case "staff_office":
        return record.subType === "office" ? "Office Record" : "Staff & Employment";
      case "projects":
        return "Project Record";
      default:
        return "Work Record";
    }
  };

  const getStatusBadge = () => {
    switch (record.status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            In Progress
          </span>
        );
      case "planning":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Planning
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
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const renderTopAvatar = () => {
    if (record.recordType === "business") {
      return (
        <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
          {record.title.slice(0, 4).toUpperCase()}
        </div>
      );
    }

    if (record.recordType === "staff_office") {
      if (record.subType === "office") {
        return (
          <div className="w-13 h-13 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        );
      }
      return (
        <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          <User className="w-6 h-6" />
        </div>
      );
    }

    return (
      <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
        <Flag className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Drag Handle (Mobile) */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {renderTopAvatar()}
              <div>
                <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white line-clamp-1">
                  {record.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-medium">
                    {getRecordTypeBadge()}
                  </span>
                  {record.subtitle && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-600 font-medium truncate max-w-[170px]">
                        {record.subtitle}
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
              {/* Quick Info Grid (Matching Mockup Screen 3) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Type / Category */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {record.recordType === "business"
                        ? "Business Type"
                        : record.recordType === "projects"
                        ? "Project Type"
                        : "Role / Subtype"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.subType || record.designation || "Enterprise"}
                    </span>
                  </div>
                </div>

                {/* 2. Status */}
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

                {/* 3. Owners / Partners / Responsible */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {record.recordType === "business"
                        ? "Owners / Partners"
                        : record.recordType === "projects"
                        ? "Project Manager"
                        : "Related Person"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.owners && record.owners.length > 0
                        ? record.owners.map((o) => `${o.name} (${o.percentage}%)`).join(", ")
                        : record.responsiblePersonName || record.relatedPersonName || "Owner"}
                    </span>
                  </div>
                </div>

                {/* 4. Country / Location */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Country / Location
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.country || record.city
                        ? `${record.country || "Bangladesh"}${record.city ? ` (${record.city})` : ""}`
                        : "Dhaka, Bangladesh"}
                    </span>
                  </div>
                </div>

                {/* 5. Ownership / Partnership Structure */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center shrink-0">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {record.recordType === "business"
                        ? "Ownership Structure"
                        : record.recordType === "projects"
                        ? "Related Business"
                        : "Business Entity"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.ownershipType || record.relatedBusinessName || "Private Limited"}
                    </span>
                  </div>
                </div>

                {/* 6. Important Date */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {record.recordType === "business"
                        ? "Incorporation Date"
                        : record.recordType === "projects"
                        ? "Target Deadline"
                        : "Joining Date"}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {record.importantDate
                        ? new Date(record.importantDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestones (for Projects) */}
              {record.recordType === "projects" && record.milestones && record.milestones.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Milestones ({record.milestones.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {record.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              m.status === "completed" ? "text-emerald-600" : "text-slate-300"
                            }`}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {m.title}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase ${
                            m.status === "completed"
                              ? "bg-emerald-50 text-emerald-600"
                              : m.status === "in_progress"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {m.status?.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
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

              {/* Linked Records (Matching Mockup Screen 3) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Linked Records ({(record.linkedDocuments?.length || 0) + (record.linkedFinancials?.length || 0)})
                  </h4>
                  <span className="text-xs font-semibold text-indigo-600 cursor-pointer hover:underline">
                    See All
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Documents */}
                  {record.linkedDocuments?.map((doc, idx) => (
                    <div
                      key={`doc-${idx}`}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                            {doc.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {doc.date || "Apr 15, 2019"} • {doc.size || "1.2 MB"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}

                  {/* Financials */}
                  {record.linkedFinancials?.map((fin, idx) => (
                    <div
                      key={`fin-${idx}`}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                            {fin.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {fin.institution || "BRAC Bank"} • {fin.accountNumber || "•••• 4521"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}

                  {(!record.linkedDocuments || record.linkedDocuments.length === 0) &&
                    (!record.linkedFinancials || record.linkedFinancials.length === 0) && (
                      <div className="p-3 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 text-xs text-slate-400">
                        No linked records attached yet.
                      </div>
                    )}
                </div>
              </div>
            </>
          )}

          {activeTab === "notes" && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Business & Project Notes
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
              {record.relatedPersonId && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Linked People Profile
                  </h4>
                  <Link
                    href={`/people/${record.relatedPersonId}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        {(record.relatedPersonName || "Staff").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {record.relatedPersonName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Central Person Directory Profile
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Access & Handover Governance
                </h4>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                    {record.accessPermission?.replace("_", " ") || "Private (Owner Only)"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Protected under LIFE VAULT Business Continuity protocols. Designation of partners or staff does not automatically grant unrestricted access to private financial reserves or digital credentials.
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

        {/* Bottom Action Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5">
          {/* Mark Completed (for Projects or tasks) */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleToggleStatus}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
              record.status === "completed"
                ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            {record.status === "completed" ? "Mark Active" : "Mark as Completed"}
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(record)}
            className="flex-1 py-3 px-3 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>

          {/* More Menu */}
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
