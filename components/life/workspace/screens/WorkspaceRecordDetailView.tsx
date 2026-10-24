"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Pencil,
  Eye,
  EyeOff,
  Receipt,
  PlusCircle,
  FileEdit,
  Link as LinkIcon,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  WorkspaceCategoryConfig,
  WorkspaceSubcategoryConfig,
} from "@/lib/life/workspaceCategories";
import { WorkspaceRecordItem } from "@/lib/actions/lifeWorkspace.actions";

interface WorkspaceRecordDetailViewProps {
  category: WorkspaceCategoryConfig;
  subcategory: WorkspaceSubcategoryConfig;
  record: WorkspaceRecordItem;
  onBack: () => void;
  onEdit: () => void;
  onViewTransactions?: () => void;
  onAddTransaction?: () => void;
}

export function WorkspaceRecordDetailView({
  category,
  subcategory,
  record,
  onBack,
  onEdit,
  onViewTransactions,
  onAddTransaction,
}: WorkspaceRecordDetailViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const displayRef = isRevealed
    ? record.referenceNumber || "**** 4521"
    : record.maskedReference || "**** 4521";

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to List"
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#1E1B4B] tracking-tight leading-snug truncate">
              {record.title}
            </h1>
            <p className="text-[12px] text-slate-500 font-normal truncate mt-0.5">
              {record.subtitle ? record.subtitle.split("\n")[0] : subcategory.title}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Options"
          className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Top Hero Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-4">
        {/* Row 1: Logo/Icon, Title, Subtitle, Status, Edit */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {record.title.slice(0, 4).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1E1B4B]">
                  {record.title}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {record.subtitle ? record.subtitle.split("\n")[0] : subcategory.unitLabel || "Record"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit Record"
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-xs"
          >
            <Pencil className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        </div>

        {/* Row 2: Account / Reference Number with Reveal toggle */}
        {record.referenceNumber && (
          <div className="pt-1">
            <p className="text-[11px] font-medium text-slate-400">Account / Reference Number</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-[#1E1B4B] tracking-wider font-mono">
                {displayRef}
              </span>
              <button
                type="button"
                onClick={() => setIsRevealed(!isRevealed)}
                aria-label="Toggle sensitive reference visibility"
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
              >
                {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Row 3: Current Balance / Amount */}
        {record.amount !== undefined && (
          <div className="pt-1 border-t border-slate-50">
            <p className="text-[11px] font-medium text-slate-400">Current Balance</p>
            <div className="text-2xl font-extrabold text-[#1E1B4B] tracking-tight mt-0.5">
              {record.currency || "৳"} {record.amount.toLocaleString()}
            </div>
          </div>
        )}

        {/* Row 4: Timestamp */}
        <p className="text-[11px] text-slate-400 pt-1">
          Updated: {new Date(record.updatedAt || Date.now()).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Action Buttons Row (3 cards) */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={onViewTransactions || (() => {})}
          className="bg-purple-50/80 hover:bg-purple-100/80 border border-purple-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-white/80 text-purple-600 flex items-center justify-center shadow-2xs mb-1.5 group-hover:scale-105 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-purple-700 leading-tight">
            View Transactions
          </span>
        </button>

        <button
          type="button"
          onClick={onAddTransaction || onEdit}
          className="bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-white/80 text-emerald-600 flex items-center justify-center shadow-2xs mb-1.5 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 leading-tight">
            Add Transaction
          </span>
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="bg-sky-50/80 hover:bg-sky-100/80 border border-sky-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-white/80 text-sky-600 flex items-center justify-center shadow-2xs mb-1.5 group-hover:scale-105 transition-transform">
            <FileEdit className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-sky-700 leading-tight">
            Edit Account
          </span>
        </button>
      </div>

      {/* Account / Record Information Key-Value Details */}
      {record.details && Object.keys(record.details).length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
          <h3 className="text-xs font-bold text-[#1E1B4B] tracking-tight">
            Account Information
          </h3>
          <div className="divide-y divide-slate-50 text-xs">
            {Object.entries(record.details).map(([key, val]) => (
              <div key={key} className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-normal">{key}</span>
                <span className="font-semibold text-[#1E1B4B] text-right truncate">
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-[#1E1B4B] tracking-tight mb-1">
            Notes
          </h3>
          <p className="text-xs text-slate-600 font-normal leading-relaxed">
            {record.notes || "Personal savings account."}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit notes"
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Linked Records Section */}
      <button
        type="button"
        className="w-full bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] flex items-center justify-between hover:border-indigo-100 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1E1B4B] leading-tight">
              Linked Records
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {record.linkedCount || 1} linked item
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </button>
    </div>
  );
}
