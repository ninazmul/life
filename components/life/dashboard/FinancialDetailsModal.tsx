/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Search,
  X,
  Wallet,
  Home,
  Coins,
  Briefcase,
  Gem,
  PieChart,
  HandCoins,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { LifeFinancialBreakdowns } from "@/types";

interface FinancialDetailsModalProps {
  cardType: "assets" | "liabilities" | "netWorth" | "loansGiven" | null;
  onClose: () => void;
  breakdowns?: LifeFinancialBreakdowns;
  symbol?: string;
}

function WaveSparkline({ color = "#0EA5E9" }: { color?: string }) {
  return (
    <svg
      width="44"
      height="16"
      viewBox="0 0 44 16"
      fill="none"
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <path
        d="M2 13 C 8 3, 16 14, 24 7 C 32 1, 38 12, 42 8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarSparkline({ color = "#8B5CF6" }: { color?: string }) {
  return (
    <svg
      width="34"
      height="16"
      viewBox="0 0 34 16"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect x="2" y="10" width="3.5" height="6" rx="1" fill={color} opacity="0.35" />
      <rect x="8.5" y="7" width="3.5" height="9" rx="1" fill={color} opacity="0.55" />
      <rect x="15" y="9" width="3.5" height="7" rx="1" fill={color} opacity="0.7" />
      <rect x="21.5" y="4" width="3.5" height="12" rx="1" fill={color} opacity="0.85" />
      <rect x="28" y="1" width="3.5" height="15" rx="1" fill={color} />
    </svg>
  );
}

function formatMoney(amount: number, symbol = "৳"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }
  return `${symbol} ${Number(amount).toLocaleString("en-US")}`;
}

export function FinancialDetailsModal({
  cardType,
  onClose,
  breakdowns,
  symbol = "৳",
}: FinancialDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"category" | "account" | "history">("category");
  const [searchQuery, setSearchQuery] = useState("");

  if (!cardType) return null;

  // Icon resolver
  const getCategoryIcon = (iconType: string) => {
    switch (iconType) {
      case "wallet":
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      case "house":
        return <Home className="w-4 h-4 text-sky-600" />;
      case "coins":
        return <Coins className="w-4 h-4 text-amber-600" />;
      case "briefcase":
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case "gem":
        return <Gem className="w-4 h-4 text-purple-600" />;
      default:
        return <Coins className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getCategoryBg = (iconType: string) => {
    switch (iconType) {
      case "wallet":
        return "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900";
      case "house":
        return "bg-sky-50 dark:bg-sky-950/60 border-sky-100 dark:border-sky-900";
      case "coins":
        return "bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900";
      case "briefcase":
        return "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900";
      case "gem":
        return "bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900";
      default:
        return "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900";
    }
  };

  // 1. Total Assets Data
  const assetsData = breakdowns?.totalAssets || {
    total: 1250000,
    growthPercent: 12,
    categories: [],
    accounts: [],
    history: [],
  };

  // 2. Total Liabilities Data
  const liabilitiesData = breakdowns?.totalLiabilities || {
    total: 320000,
    growthPercent: 5,
    categories: [],
    items: [],
  };

  // 3. Net Worth Data
  const netWorthData = breakdowns?.netWorth || {
    total: 930000,
    growthPercent: 15,
    totalAssets: 1250000,
    totalLiabilities: 320000,
  };

  // 4. Loans Given Data
  const loansGivenData = breakdowns?.loansGiven || {
    total: 105000,
    activeCount: 2,
    loans: [],
  };

  const titles = {
    assets: {
      title: "Total Assets",
      subtitle: "Complete breakdown of your assets",
      amount: assetsData.total,
      growth: `↗ +${assetsData.growthPercent}% from last month`,
      icon: Home,
      iconColor: "text-sky-600 bg-sky-100 dark:bg-sky-950/60",
      sparkline: <WaveSparkline color="#0EA5E9" />,
    },
    liabilities: {
      title: "Total Liabilities",
      subtitle: "Outstanding obligations & borrowings",
      amount: liabilitiesData.total,
      growth: `↗ +${liabilitiesData.growthPercent}% from last month`,
      icon: Wallet,
      iconColor: "text-rose-600 bg-rose-100 dark:bg-rose-950/60",
      sparkline: <WaveSparkline color="#F43F5E" />,
    },
    netWorth: {
      title: "Net Worth",
      subtitle: "Assets minus total liabilities breakdown",
      amount: netWorthData.total,
      growth: `↗ +${netWorthData.growthPercent}% from last month`,
      icon: PieChart,
      iconColor: "text-purple-600 bg-purple-100 dark:bg-purple-950/60",
      sparkline: <BarSparkline color="#8B5CF6" />,
    },
    loansGiven: {
      title: "Loans Given",
      subtitle: "Active loans & repayment tracker",
      amount: loansGivenData.total,
      growth: `${loansGivenData.activeCount} active loans`,
      icon: HandCoins,
      iconColor: "text-amber-600 bg-amber-100 dark:bg-amber-950/60",
      sparkline: <BarSparkline color="#D97706" />,
    },
  }[cardType];

  const IconComponent = titles.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] bg-[#F7F6FC] dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Drag Handle (Mobile) */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold text-[#1E1B4B] dark:text-white leading-tight truncate">
                {titles.title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {titles.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-2xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* Hero Summary Card */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${titles.iconColor}`}
              >
                <IconComponent className="w-6 h-6" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {titles.title}
                </span>
                <p className="text-[20px] sm:text-[22px] font-extrabold text-[#1E1B4B] dark:text-white tracking-tight leading-tight mt-0.5">
                  {formatMoney(titles.amount, symbol)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    {titles.growth}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {titles.sparkline}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              CARD 1: TOTAL ASSETS BREAKDOWN
          ══════════════════════════════════════════════════ */}
          {cardType === "assets" && (
            <div className="space-y-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-[12px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("category")}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === "category"
                      ? "bg-white dark:bg-slate-700 text-[#4F46E5] dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  By Category
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("account")}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === "account"
                      ? "bg-white dark:bg-slate-700 text-[#4F46E5] dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  By Account
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                    activeTab === "history"
                      ? "bg-white dark:bg-slate-700 text-[#4F46E5] dark:text-indigo-300 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  History
                </button>
              </div>

              {/* By Category View */}
              {activeTab === "category" && (
                <div className="space-y-2">
                  {assetsData.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={cat.link}
                      onClick={onClose}
                      className="group p-3 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-2xs transition-all flex items-center justify-between gap-3 active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getCategoryBg(
                            cat.iconType
                          )}`}
                        >
                          {getCategoryIcon(cat.iconType)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#1E1B4B] dark:text-white truncate leading-tight">
                            {cat.label}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[13px] font-extrabold text-[#1E1B4B] dark:text-white">
                          {formatMoney(cat.amount, symbol)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* By Account View */}
              {activeTab === "account" && (
                <div className="space-y-2">
                  {assetsData.accounts && assetsData.accounts.length > 0 ? (
                    assetsData.accounts.map((acc, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#1E1B4B] dark:text-white truncate">
                            {acc.name}
                          </p>
                          <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                            {acc.type} • {acc.institution || "Registered"}
                          </p>
                        </div>
                        <span className="text-[13px] font-extrabold text-[#1E1B4B] dark:text-white shrink-0">
                          {formatMoney(acc.balance, symbol)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No individual asset records found. Add them in the Assets workspace.
                    </div>
                  )}
                </div>
              )}

              {/* History View */}
              {activeTab === "history" && (
                <div className="space-y-2">
                  {assetsData.history && assetsData.history.length > 0 ? (
                    assetsData.history.map((hist, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-[#1E1B4B] dark:text-white truncate">
                              {hist.title}
                            </p>
                            <span className="text-[10px] text-slate-400">{hist.date}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-bold text-emerald-600">
                            {hist.change}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatMoney(hist.amount, symbol)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No asset reconciliation history recorded yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              CARD 2: TOTAL LIABILITIES BREAKDOWN
          ══════════════════════════════════════════════════ */}
          {cardType === "liabilities" && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/50 text-[12px] text-rose-800 dark:text-rose-200">
                <span className="font-bold">Total Obligations:</span> Represents outstanding loans received, borrowings, and payable obligations.
              </div>

              <div className="space-y-2">
                {liabilitiesData.items && liabilitiesData.items.length > 0 ? (
                  liabilitiesData.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-[#1E1B4B] dark:text-white truncate">
                            {item.counterparty}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.title}
                        </p>
                        {item.dueDate && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Due: {item.dueDate}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[14px] font-extrabold text-rose-600 dark:text-rose-400">
                          {formatMoney(item.remainingAmount, symbol)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-500">
                    No active liabilities recorded. Total outstanding obligations are {symbol}0.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              CARD 3: NET WORTH BREAKDOWN
          ══════════════════════════════════════════════════ */}
          {cardType === "netWorth" && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/50 text-[12px] text-purple-800 dark:text-purple-200">
                <span className="font-bold">Net Worth Formula:</span> Total Assets minus Total Liabilities equals your true financial standing.
              </div>

              {/* Formula Visual Box */}
              <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-[13px]">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Assets</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    +{formatMoney(netWorthData.totalAssets, symbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-[13px]">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Liabilities</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    -{formatMoney(netWorthData.totalLiabilities, symbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-[15px]">
                  <span className="font-extrabold text-[#1E1B4B] dark:text-white">Net Worth</span>
                  <span className="font-extrabold text-[#4F46E5] dark:text-indigo-400 text-[16px]">
                    ={formatMoney(netWorthData.total, symbol)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
                Reconciled in real time against your physical assets, bank balances, receivables, and recorded debt commitments.
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              CARD 4: LOANS GIVEN BREAKDOWN
          ══════════════════════════════════════════════════ */}
          {cardType === "loansGiven" && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/50 text-[12px] text-amber-800 dark:text-amber-200">
                <span className="font-bold">Outstanding Receivables:</span> Money loaned to family, colleagues, or partners awaiting repayment.
              </div>

              <div className="space-y-2">
                {loansGivenData.loans && loansGivenData.loans.length > 0 ? (
                  loansGivenData.loans.map((loan) => (
                    <div
                      key={loan.id}
                      className="p-3.5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-[#1E1B4B] dark:text-white truncate">
                            {loan.borrowerName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            {loan.status?.replace(/_/g, " ") || "Active"}
                          </span>
                        </div>
                        <span className="text-[13px] font-extrabold text-amber-600 dark:text-amber-400">
                          {formatMoney(loan.remainingAmount, symbol)}
                        </span>
                      </div>

                      {/* Repayment Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (loan.totalRepaid / (loan.originalAmount || 1)) * 100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Repaid: {formatMoney(loan.totalRepaid, symbol)}</span>
                          <span>Original: {formatMoney(loan.originalAmount, symbol)}</span>
                        </div>
                      </div>

                      {loan.dueDate && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expected: {loan.dueDate}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center text-xs text-slate-500">
                    No active loans given recorded.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <Link
            href="/workspace?section=core_vault&category=finance_loans"
            onClick={onClose}
            className="text-[12px] font-bold text-[#4F46E5] hover:text-indigo-700 dark:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            Manage in Workspace
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[12px] font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
