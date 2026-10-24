"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Plus,
  Landmark,
  Building2,
  Wallet,
  Coins,
  Shield,
  FileText,
  User,
  HeartPulse,
} from "lucide-react";
import {
  WorkspaceCategoryConfig,
  WorkspaceSubcategoryConfig,
} from "@/lib/life/workspaceCategories";
import {
  WorkspaceRecordItem,
  WorkspaceModuleResponse,
} from "@/lib/actions/lifeWorkspace.actions";

interface WorkspaceRecordListViewProps {
  category: WorkspaceCategoryConfig;
  subcategory: WorkspaceSubcategoryConfig;
  data: WorkspaceModuleResponse;
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  onBack: () => void;
  onSelectRecord: (record: WorkspaceRecordItem) => void;
  onAddRecord: () => void;
}

export function WorkspaceRecordListView({
  category,
  subcategory,
  data,
  activeFilter,
  onFilterChange,
  onBack,
  onSelectRecord,
  onAddRecord,
}: WorkspaceRecordListViewProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecords = data.records.filter((rec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.title.toLowerCase().includes(q) ||
      (rec.subtitle && rec.subtitle.toLowerCase().includes(q)) ||
      (rec.referenceNumber && rec.referenceNumber.toLowerCase().includes(q)) ||
      (rec.notes && rec.notes.toLowerCase().includes(q))
    );
  });

  // Helper to pick bank/entity icon or fallback
  const renderItemIcon = (rec: WorkspaceRecordItem) => {
    const t = rec.title.toLowerCase();
    if (t.includes("brac")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
          BRAC
        </div>
      );
    }
    if (t.includes("city")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
          CITY
        </div>
      );
    }
    if (t.includes("dutch") || t.includes("bangla")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
          DBBL
        </div>
      );
    }
    if (t.includes("nagad")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
          NAGAD
        </div>
      );
    }
    if (t.includes("cash")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
      );
    }

    // Default by category
    const SubIcon = subcategory.icon;
    return (
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${subcategory.color}`}
      >
        <SubIcon className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-28 relative animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Subcategories"
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#1E1B4B] tracking-tight leading-snug truncate">
              {subcategory.title}
            </h1>
            <p className="text-[12px] text-slate-500 font-normal truncate mt-0.5">
              {subcategory.description}
            </p>
          </div>
        </div>

        {/* Action icons: Search & 3-dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Toggle search"
            className={`w-8 h-8 rounded-lg border transition-colors flex items-center justify-center ${
              searchOpen
                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="More options"
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {searchOpen && (
        <div className="px-1 animate-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${subcategory.title.toLowerCase()}...`}
              autoFocus
              className="w-full bg-white rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Filter Tabs (Horizontal Scrollable Pills) */}
      {data.filterTabs && data.filterTabs.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5">
          {data.filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Record Cards List */}
      <div className="space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center space-y-2 shadow-xs">
            <p className="text-sm font-semibold text-[#1E1B4B]">No records yet</p>
            <p className="text-xs text-slate-400">
              Add your first record to get started with {subcategory.title}.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            return (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelectRecord(record)}
                className="w-full bg-white rounded-2xl p-3.5 border border-slate-100/90 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-sm hover:border-indigo-100 transition-all flex items-center justify-between text-left group"
              >
                {/* Left logo / icon & Details */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {renderItemIcon(record)}
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-[#1E1B4B] truncate leading-tight group-hover:text-indigo-600 transition-colors">
                      {record.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-normal leading-relaxed whitespace-pre-line mt-0.5">
                      {record.subtitle || record.notes}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Status Badge */}
                <div className="text-right shrink-0">
                  {record.amount !== undefined && (
                    <div className="text-[14px] font-bold text-[#1E1B4B] tracking-tight">
                      ৳ {record.amount.toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[11px] font-medium text-emerald-600 capitalize">
                      {record.status || "Active"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Bottom Total Summary Card */}
      {data.totalSummary && data.totalSummary.amount !== undefined && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100/90 shadow-[0_2px_10px_rgba(30,27,75,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">
                {data.totalSummary.label}
              </p>
              <p className="text-[17px] font-extrabold text-[#1E1B4B] tracking-tight">
                {data.totalSummary.currencySymbol}{" "}
                {data.totalSummary.amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (+) */}
      <button
        type="button"
        onClick={onAddRecord}
        aria-label="Add new record"
        className="fixed bottom-20 right-5 z-40 w-12 h-12 rounded-full bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
}
