/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Crown,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Home,
  Wallet,
  PieChart,
  HandCoins,
  ArrowRight,
  Sparkles,
  FileText,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { LifeDashboardStats, LifeDashboardUpdate } from "@/types";
import { UserModuleAccess } from "@/lib/life/module-access";
import { FinancialDetailsModal } from "./FinancialDetailsModal";
import { LifeSearchDialog } from "@/components/life/shared/LifeSearchDialog";

// ── Types ──
interface LifeVaultDashboardProps {
  stats: LifeDashboardStats;
  userAccess?: UserModuleAccess;
}

// ── Currency and Number Formatter ──
function formatMoney(amount: number, symbol = "৳"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }
  return `${symbol} ${Number(amount).toLocaleString("en-US")}`;
}

// ── Helper to calculate ISO Week Number ──
function getWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Lightweight CSS/SVG Sparklines ──
function WaveSparkline({ color = "#0EA5E9" }: { color?: string }) {
  return (
    <svg
      width="38"
      height="14"
      viewBox="0 0 38 14"
      fill="none"
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <path
        d="M2 11 C 8 2, 14 12, 20 6 C 26 0, 32 10, 36 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarSparkline({ color = "#8B5CF6" }: { color?: string }) {
  return (
    <svg
      width="30"
      height="14"
      viewBox="0 0 30 14"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect x="2" y="9" width="3" height="5" rx="0.75" fill={color} opacity="0.35" />
      <rect x="8" y="6" width="3" height="8" rx="0.75" fill={color} opacity="0.55" />
      <rect x="14" y="8" width="3" height="6" rx="0.75" fill={color} opacity="0.7" />
      <rect x="20" y="3" width="3" height="11" rx="0.75" fill={color} opacity="0.85" />
      <rect x="26" y="1" width="3" height="13" rx="0.75" fill={color} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT: LIFE VAULT COMMAND CENTER DASHBOARD
// ═══════════════════════════════════════════════════════
export function LifeVaultDashboard({
  stats,
  userAccess,
}: LifeVaultDashboardProps) {
  const router = useRouter();
  const profile = stats.ownerProfile;
  const symbol = stats.currencySymbol || "৳";

  // Global search dialog
  const [searchOpen, setSearchOpen] = useState(false);

  // Financial details modal state
  const [selectedDetailCard, setSelectedDetailCard] = useState<
    "assets" | "liabilities" | "netWorth" | "loansGiven" | null
  >(null);

  // Keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Resolve user display name
  const rawName = profile?.name || userAccess?.name || "Shahidul";
  const firstName = rawName.split(" ")[0] || "Shahidul";

  // Dynamic greeting based on current hour
  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Compact date formatting (e.g. "Fri, Oct 23, 2026")
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const weekNumber = getWeekNumber(currentDate);

  // ── Financial Overview 4 Cards Independent Visibility State ──
  const [visibleAmounts, setVisibleAmounts] = useState<Record<string, boolean>>({
    assets: true,
    liabilities: true,
    netWorth: true,
    loansGiven: true,
  });

  const toggleCardVisibility = (cardKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleAmounts((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  // Financial overview numbers from real records
  const financial = stats.financialBreakdowns || {
    totalAssets: { total: stats.assetsTotalValue || 0, growthPercent: 12, categories: [] },
    totalLiabilities: { total: stats.payablesTotal || 0, growthPercent: 5, categories: [] },
    netWorth: { total: Math.max(0, (stats.assetsTotalValue || 0) - (stats.payablesTotal || 0)), growthPercent: 15, totalAssets: 0, totalLiabilities: 0 },
    loansGiven: { total: stats.moneyGivenRemaining || 0, activeCount: 2, loans: [] },
  };

  const totalAssets = financial.totalAssets.total;
  const totalLiabilities = financial.totalLiabilities.total;
  const netWorth = financial.netWorth.total;
  const loansGiven = financial.loansGiven.total;

  // ── Life Updates & Direction Single Slider State & Navigation ──
  const allUpdates: LifeDashboardUpdate[] = stats.sliderUpdates || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Viewed update IDs tracked in state & localStorage
  const [viewedUpdateIds, setViewedUpdateIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lv_viewed_update_ids");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const handleMarkAsViewed = (updateId: string) => {
    setViewedUpdateIds((prev) => {
      if (prev.includes(updateId)) return prev;
      const next = [...prev, updateId];
      try {
        localStorage.setItem("lv_viewed_update_ids", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const totalUpdates = allUpdates.length;

  const handlePrev = () => {
    if (totalUpdates <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalUpdates - 1));
  };

  const handleNext = () => {
    if (totalUpdates <= 1) return;
    setCurrentIndex((prev) => (prev < totalUpdates - 1 ? prev + 1 : 0));
  };

  // Mobile swipe gesture support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
  };

  const currentUpdate = allUpdates[currentIndex];

  // Helper to resolve icon for update card
  const renderUpdateIcon = (type: string) => {
    switch (type) {
      case "insurance":
        return <Shield className="w-6 h-6 text-rose-600 fill-rose-100 dark:fill-rose-950/60" />;
      case "shield_alert":
        return <ShieldAlert className="w-6 h-6 text-rose-600" />;
      case "shield_check":
        return <ShieldCheck className="w-6 h-6 text-emerald-600" />;
      case "wallet":
        return <Wallet className="w-6 h-6 text-amber-600" />;
      case "document":
        return <FileText className="w-6 h-6 text-indigo-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-rose-600" />;
    }
  };

  return (
    <div className="lv-dashboard w-full min-h-[calc(100vh-4rem)] text-slate-800 dark:text-slate-100 transition-colors">
      <style jsx global>{`
        body {
          background-color: #F7F6FC;
        }
        .dark body {
          background-color: #0B0A16;
        }
      `}</style>

      {/* Main Container — Samsung Galaxy S25 Ultra Mobile-First */}
      <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-4">

        {/* ══════════════════════════════════════════════════
            B. COMPACT WELCOME SECTION
        ══════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-white/80 dark:border-purple-900/40 shadow-[0_4px_24px_rgba(124,58,237,0.05)] transition-all"
          style={{
            background:
              "linear-gradient(135deg, rgba(238, 233, 254, 0.75) 0%, rgba(246, 244, 254, 0.9) 45%, rgba(230, 235, 255, 0.65) 100%)",
          }}
        >
          {/* Subtle Abstract Wave SVG Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-10 overflow-hidden">
            <svg
              className="absolute -right-12 -bottom-12 w-[340px] sm:w-[460px] h-[180px] sm:h-[220px]"
              viewBox="0 0 460 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M0 120 C 140 190 280 50 460 130 L 460 220 L 0 220 Z"
                fill="url(#welcome-wave-1)"
              />
              <path
                d="M40 150 C 180 80 320 200 460 90 L 460 220 L 40 220 Z"
                fill="url(#welcome-wave-2)"
                opacity="0.6"
              />
              <defs>
                <linearGradient id="welcome-wave-1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="welcome-wave-2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FBCFE8" stopOpacity="0.15" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Top Greeting & Date Row */}
          <div className="relative z-10 flex items-start justify-between gap-3">
            {/* Left: Greeting, Name & Motto */}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] sm:text-[13px] font-medium text-slate-600 dark:text-slate-300">
                {getGreetingText()}
              </p>
              <div className="flex items-center gap-2 mt-0.5 min-w-0">
                <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#1E1B4B] dark:text-white tracking-tight truncate leading-tight">
                  {firstName}
                </h1>
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] text-white shadow-xs shrink-0"
                  title="Verified Owner"
                  aria-label="Verified Owner"
                >
                  <Crown className="w-3 h-3 fill-white text-white" />
                </span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug">
                Stay organized. Take the right steps.
                <br className="hidden sm:inline" /> A more secure tomorrow.
              </p>
            </div>

            {/* Right: Compact Date Badge (Fri, Oct 23, 2026 / Week 43) */}
            <div className="shrink-0 text-right">
              <div className="inline-flex flex-col items-end px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-white/90 dark:border-slate-800 shadow-2xs backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-slate-700 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Week {weekNumber}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            C. LIFE UPDATES & DIRECTION — SINGLE UPDATE SLIDER
        ══════════════════════════════════════════════════ */}
        <section className="space-y-2">
          {totalUpdates > 0 && currentUpdate ? (
            <div
              className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(30,27,75,0.04)] p-4 sm:p-5 transition-all select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Floating Left/Right Chevron Controls on Tablet/Desktop */}
              {totalUpdates > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous update"
                    className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next update"
                    className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Slider Card Header: Priority Badge (Left) & Counter / Nav (Right) */}
              <div className="flex items-center justify-between gap-2 mb-3">
                {/* Priority Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 text-rose-600 dark:text-rose-400">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                    !
                  </div>
                  <span className="text-[11px] font-bold tracking-tight">
                    {currentUpdate.priorityBadge}
                  </span>
                </div>

                {/* Counter & Arrow Controls */}
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>
                    {currentIndex + 1} / {totalUpdates}
                  </span>
                  {totalUpdates > 1 && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Previous update"
                        className="w-5 h-5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Next update"
                        className="w-5 h-5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Slider Card Body: Title, Description & Right Icon */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] sm:text-[16px] font-extrabold text-[#1E1B4B] dark:text-white tracking-tight leading-snug">
                    {currentUpdate.title}
                  </h3>
                  <p className="text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {currentUpdate.shortDescription}
                  </p>
                </div>

                {/* Relevant Category Icon in Soft Container */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center shrink-0 shadow-2xs">
                  {renderUpdateIcon(currentUpdate.iconType)}
                </div>
              </div>

              {/* ── Two Compact Action Buttons (Final Approved Side-by-Side Design) ── */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Left Button — View / Action Status */}
                {viewedUpdateIds.includes(currentUpdate.id) ? (
                  // State 2: Viewed — Action Pending
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/50 py-2 px-3 flex items-center gap-2 select-none">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
                        Viewed
                      </p>
                      <p className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 truncate">
                        Action pending
                      </p>
                    </div>
                  </div>
                ) : (
                  // State 1: Mark as Viewed / I've seen this
                  <button
                    type="button"
                    onClick={() => handleMarkAsViewed(currentUpdate.id)}
                    className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 py-2 px-3 flex items-center gap-2 transition-all cursor-pointer text-left active:scale-[0.98]"
                    aria-label="Mark update as viewed"
                  >
                    <Eye className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-tight">
                        Mark as Viewed
                      </p>
                      <p className="text-[9px] text-rose-500/80 dark:text-rose-400/80 truncate">
                        I&apos;ve seen this
                      </p>
                    </div>
                  </button>
                )}

                {/* Right Button — Direct Action Navigation to Workspace */}
                <Link
                  href={currentUpdate.destinationUrl}
                  className="rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white py-2 px-3 flex items-center justify-between gap-2 shadow-xs transition-all active:scale-[0.98] group cursor-pointer"
                  aria-label={`${currentUpdate.actionButtonLabel} - Go to Workspace`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate leading-tight">
                      {currentUpdate.actionButtonLabel}
                    </p>
                    <p className="text-[9px] text-indigo-200 truncate">
                      {currentUpdate.actionSubtext || "Go to Workspace"}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/90 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              </div>

              {/* Slider Pagination Dots */}
              {totalUpdates > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-3 pt-1">
                  {allUpdates.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`transition-all duration-200 cursor-pointer ${
                        idx === currentIndex
                          ? "w-6 h-1.5 rounded-full bg-[#4F46E5]"
                          : "w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Empty State (Section 10 of Specification)
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(30,27,75,0.03)] p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-extrabold text-[#1E1B4B] dark:text-white">
                You&apos;re All Caught Up
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No important updates need your attention right now.
              </p>
              <Link
                href="/activity"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4F46E5] hover:text-indigo-700 mt-1"
              >
                View Activity & Notifications
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════
            D. FINANCIAL OVERVIEW — EXACTLY FOUR CARDS
        ══════════════════════════════════════════════════ */}
        <section className="space-y-2.5">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[#1E1B4B] dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-3.5 h-3.5" />
              </span>
              <span>Financial Overview</span>
            </h2>
            <Link
              href="/workspace?section=core_vault&category=finance_loans"
              className="text-[12px] font-bold text-[#4F46E5] hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Link>
          </div>

          {/* Strict 2×2 Grid of Financial Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* 1. Total Assets Card */}
            <div
              onClick={() => setSelectedDetailCard("assets")}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.03)] hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              role="button"
              tabIndex={0}
              aria-label="Open Total Assets breakdown"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/50">
                    <Home className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Total Assets
                  </span>
                </div>

                {/* Independent Eye Icon Button */}
                <button
                  type="button"
                  onClick={(e) => toggleCardVisibility("assets", e)}
                  aria-label={visibleAmounts.assets ? "Hide Total Assets amount" : "Show Total Assets amount"}
                  className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  {visibleAmounts.assets ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Amount Display */}
              <div className="my-2 min-w-0">
                <p className="text-[17px] sm:text-[19px] font-extrabold text-[#1E1B4B] dark:text-white truncate tracking-tight leading-tight">
                  {visibleAmounts.assets ? formatMoney(totalAssets, symbol) : `${symbol} ••••••`}
                </p>
              </div>

              {/* Sub-stat row with Growth & Wave Sparkline & Chevron */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <span>↗ +12%</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <WaveSparkline color="#0EA5E9" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            {/* 2. Total Liabilities Card */}
            <div
              onClick={() => setSelectedDetailCard("liabilities")}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.03)] hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              role="button"
              tabIndex={0}
              aria-label="Open Total Liabilities breakdown"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                    <Wallet className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Total Liabilities
                  </span>
                </div>

                {/* Independent Eye Icon Button */}
                <button
                  type="button"
                  onClick={(e) => toggleCardVisibility("liabilities", e)}
                  aria-label={visibleAmounts.liabilities ? "Hide Total Liabilities amount" : "Show Total Liabilities amount"}
                  className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  {visibleAmounts.liabilities ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Amount Display */}
              <div className="my-2 min-w-0">
                <p className="text-[17px] sm:text-[19px] font-extrabold text-[#1E1B4B] dark:text-white truncate tracking-tight leading-tight">
                  {visibleAmounts.liabilities ? formatMoney(totalLiabilities, symbol) : `${symbol} ••••••`}
                </p>
              </div>

              {/* Sub-stat row with Growth & Wave Sparkline & Chevron */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                  <span>↗ +5%</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <WaveSparkline color="#F43F5E" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            {/* 3. Net Worth Card */}
            <div
              onClick={() => setSelectedDetailCard("netWorth")}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.03)] hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              role="button"
              tabIndex={0}
              aria-label="Open Net Worth breakdown"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/50">
                    <PieChart className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Net Worth
                  </span>
                </div>

                {/* Independent Eye Icon Button */}
                <button
                  type="button"
                  onClick={(e) => toggleCardVisibility("netWorth", e)}
                  aria-label={visibleAmounts.netWorth ? "Hide Net Worth amount" : "Show Net Worth amount"}
                  className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  {visibleAmounts.netWorth ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Amount Display */}
              <div className="my-2 min-w-0">
                <p className="text-[17px] sm:text-[19px] font-extrabold text-[#1E1B4B] dark:text-white truncate tracking-tight leading-tight">
                  {visibleAmounts.netWorth ? formatMoney(netWorth, symbol) : `${symbol} ••••••`}
                </p>
              </div>

              {/* Sub-stat row with Growth & Bar Sparkline & Chevron */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <span>↗ +15%</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <BarSparkline color="#8B5CF6" />
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            {/* 4. Loans Given Card */}
            <div
              onClick={() => setSelectedDetailCard("loansGiven")}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.03)] hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col justify-between cursor-pointer active:scale-[0.98]"
              role="button"
              tabIndex={0}
              aria-label="Open Loans Given breakdown"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/50">
                    <HandCoins className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    Loans Given
                  </span>
                </div>

                {/* Independent Eye Icon Button */}
                <button
                  type="button"
                  onClick={(e) => toggleCardVisibility("loansGiven", e)}
                  aria-label={visibleAmounts.loansGiven ? "Hide Loans Given amount" : "Show Loans Given amount"}
                  className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  {visibleAmounts.loansGiven ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Amount Display */}
              <div className="my-2 min-w-0">
                <p className="text-[17px] sm:text-[19px] font-extrabold text-[#1E1B4B] dark:text-white truncate tracking-tight leading-tight">
                  {visibleAmounts.loansGiven ? formatMoney(loansGiven, symbol) : `${symbol} ••••••`}
                </p>
              </div>

              {/* Sub-stat row with Active Count & Mini Progress & Chevron */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {financial.loansGiven.activeCount} active
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-amber-500 rounded-full" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── Financial Details Breakdown Modal (Total Assets, Liabilities, Net Worth, Loans Given) ── */}
      <FinancialDetailsModal
        cardType={selectedDetailCard}
        onClose={() => setSelectedDetailCard(null)}
        breakdowns={stats.financialBreakdowns}
        symbol={symbol}
      />

      {/* ── Global Search Dialog Modal (triggered by ⌘K) ── */}
      <LifeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
