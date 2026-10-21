"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Lock,
  Users,
  ChevronRight,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  FileCheck2,
  RefreshCw,
  X,
  CreditCard,
  Gift,
  HeartHandshake,
} from "lucide-react";
import { UnifiedFinancialItem } from "@/lib/actions/lifeUnifiedFinance.actions";
import { ILifePerson } from "@/types";

interface FinanceRecordListProps {
  records: UnifiedFinancialItem[];
  activeFilter: string;
  activeSubFilter?: string;
  onFilterChange: (filter: string, subFilter?: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  peopleList: ILifePerson[];
  selectedPersonId?: string;
  onPersonFilterChange: (personId: string) => void;
  privacyFilter: "all" | "private" | "shared";
  onPrivacyFilterChange: (privacy: "all" | "private" | "shared") => void;
  onSelectRecord: (record: UnifiedFinancialItem) => void;
  currencySymbol?: string;
}

function formatMoney(amount: number, symbol = "৳"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0${symbol}`;
  }
  return `${Number(amount).toLocaleString("en-US")}${symbol}`;
}

export function FinanceRecordList({
  records,
  activeFilter,
  activeSubFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  peopleList,
  selectedPersonId,
  onPersonFilterChange,
  privacyFilter,
  onPrivacyFilterChange,
  onSelectRecord,
  currencySymbol = "৳",
}: FinanceRecordListProps) {
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter options
  const filterOptions = [
    { id: "all", label: "All Records" },
    { id: "income", label: "Income" },
    { id: "expenses", label: "Expenses" },
    { id: "loans", label: "Loans" },
    { id: "support", label: "Support" },
    { id: "accounts", label: "Accounts" },
    { id: "bills_dues", label: "Bills & Dues" },
  ];

  // Secondary sub-filters
  const renderSubFilters = () => {
    if (activeFilter === "loans") {
      return (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
          <button
            type="button"
            onClick={() => onFilterChange("loans", undefined)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              !activeSubFilter
                ? "bg-[#4F46E5] text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Loans
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("loans", "loans_given")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              activeSubFilter === "loans_given"
                ? "bg-[#4F46E5] text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Loans Given
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("loans", "loans_received")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              activeSubFilter === "loans_received"
                ? "bg-[#4F46E5] text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Loans Received
          </button>
        </div>
      );
    }

    if (activeFilter === "support") {
      return (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
          <button
            type="button"
            onClick={() => onFilterChange("support", undefined)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              !activeSubFilter
                ? "bg-[#4F46E5] text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Support
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("support", "gifts")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              activeSubFilter === "gifts"
                ? "bg-[#4F46E5] text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Gifts
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("support", "sis_care")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              activeSubFilter === "sis_care"
                ? "bg-[#4F46E5] text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            SiS Care
          </button>
        </div>
      );
    }

    return null;
  };

  const getBadgeStyle = (type: UnifiedFinancialItem["recordType"]) => {
    switch (type) {
      case "income":
        return { label: "Income", color: "text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/50" };
      case "expense":
        return { label: "Expense", color: "text-rose-700 bg-rose-50 border-rose-100 dark:bg-rose-950/50" };
      case "loan_given":
        return { label: "Loan Given", color: "text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-950/50" };
      case "loan_received":
        return { label: "Loan Taken", color: "text-purple-700 bg-purple-50 border-purple-100 dark:bg-purple-950/50" };
      case "loan_repayment":
        return { label: "Repayment", color: "text-sky-700 bg-sky-50 border-sky-100 dark:bg-sky-950/50" };
      case "sis_care":
        return { label: "SiS Care", color: "text-pink-700 bg-pink-50 border-pink-100 dark:bg-pink-950/50" };
      case "support":
        return { label: "Support", color: "text-indigo-700 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/50" };
      case "transfer":
        return { label: "Transfer", color: "text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800" };
      case "bill_due":
        return { label: "Bill / Due", color: "text-orange-700 bg-orange-50 border-orange-100 dark:bg-orange-950/50" };
      default:
        return { label: "Record", color: "text-slate-700 bg-slate-100 border-slate-200" };
    }
  };

  return (
    <div className="space-y-3">
      {/* Search & Compact Filter Bar */}
      <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] space-y-2.5">
        {/* Search input + Filter button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title, person, notes or ref..."
              aria-label="Search financial records"
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl py-2 pl-9 pr-8 text-[12px] sm:text-[13px] text-[#1E1B4B] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`h-9 px-3 rounded-xl border text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showFilterPanel || selectedPersonId !== "all" || privacyFilter !== "all"
                ? "bg-indigo-50 border-indigo-200 text-[#4F46E5] dark:bg-indigo-950/60 dark:border-indigo-800"
                : "border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            }`}
            aria-label="Toggle filter panel"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Filters</span>
            {(selectedPersonId !== "all" || privacyFilter !== "all") && (
              <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
            )}
          </button>
        </div>

        {/* Primary Filter Pill Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onFilterChange(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === opt.id
                  ? "bg-[#4F46E5] text-white shadow-2xs font-extrabold"
                  : "bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Secondary Sub-filters (if applicable) */}
        {renderSubFilters()}

        {/* Expandable Compact Filter Panel */}
        {showFilterPanel && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            {/* Person Filter */}
            <div>
              <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                Linked Person
              </label>
              <select
                value={selectedPersonId || "all"}
                onChange={(e) => onPersonFilterChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="all">All People</option>
                {peopleList.map((p) => (
                  <option key={String((p as any)._id)} value={String((p as any)._id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Privacy Filter */}
            <div>
              <label className="text-slate-400 font-bold block mb-1 uppercase tracking-wider">
                Privacy Mode
              </label>
              <select
                value={privacyFilter}
                onChange={(e) => onPrivacyFilterChange(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-700 dark:text-slate-200 font-medium"
              >
                <option value="all">All Records</option>
                <option value="private">Private (Owner Only)</option>
                <option value="shared">Shared Explicitly</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Record List */}
      {records.length === 0 ? (
        <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-200/60 dark:border-slate-700">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-[14px] font-bold text-[#1E1B4B] dark:text-white">
            No financial records found
          </p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {searchQuery
              ? `No records match "${searchQuery}". Try clearing your filters.`
              : "Tap '+ Add Record' below to record your first income, loan, expense, or support entry."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((item) => {
            const badge = getBadgeStyle(item.recordType);
            const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={`${item.sourceModel}_${item.id}`}
                onClick={() => onSelectRecord(item)}
                className="bg-white/95 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
              >
                {/* Left: Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    {item.isPrivate ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/60 dark:border-slate-700">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Private</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-100">
                        <Users className="w-2.5 h-2.5" />
                        <span>Shared ({item.sharedCount})</span>
                      </span>
                    )}
                    {item.status && item.status !== "completed" && item.status !== "active" && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-amber-50 dark:bg-amber-950 text-amber-700 border border-amber-200/60">
                        {item.status.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  <h3 className="text-[13px] sm:text-[14px] font-bold text-[#1E1B4B] dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                    {item.personName && (
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {item.personName}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formattedDate}
                    </span>
                    {item.account && (
                      <span className="hidden sm:inline text-slate-400">
                        • {item.account}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Navigation Arrow */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <span
                      className={`text-[14px] sm:text-[15px] font-extrabold block leading-tight ${
                        item.recordType === "income"
                          ? "text-emerald-600"
                          : item.recordType === "expense"
                            ? "text-rose-600"
                            : "text-[#1E1B4B] dark:text-white"
                      }`}
                    >
                      {item.recordType === "income" ? "+" : item.recordType === "expense" ? "-" : ""}
                      {formatMoney(item.amount, currencySymbol)}
                    </span>
                    {typeof item.remainingAmount === "number" && (item.recordType === "loan_given" || item.recordType === "loan_received") && (
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Due: {formatMoney(item.remainingAmount, currencySymbol)}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
