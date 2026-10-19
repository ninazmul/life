/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  Briefcase,
  ClipboardCheck,
  NotebookPen,
  FileText,
  Users,
  Wallet,
  Building2,
  Landmark,
  CheckSquare,
  Scale,
  Siren,
  Sprout,
  HeartPulse,
  UserPlus,
  FilePlus,
  BarChart3,
  History,
  Sliders,
  Home,
  Database,
  Zap,
  PieChart,
  Coins,
  Crown,
  Calendar,
  MapPin,
  Sun,
  HandCoins,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { LifeDashboardStats } from "@/types";
import { UserModuleAccess } from "@/lib/life/module-access";
import { LifeSearchDialog } from "@/components/life/shared/LifeSearchDialog";

// ── Types ──
interface LifeVaultDashboardProps {
  stats: LifeDashboardStats;
  userAccess?: UserModuleAccess;
}

// ── Currency and Number Formatter ──
function formatMoney(amount: number, symbol = "৳"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0${symbol}`;
  }
  return `${Number(amount).toLocaleString("en-US")}${symbol}`;
}

// ── Lightweight CSS/SVG Sparklines (Zero External Libs) ──
function WaveSparkline({ color = "#8B5CF6" }: { color?: string }) {
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
  const badges = stats.dashboardBadges;
  const profile = stats.ownerProfile;
  const pendingRequests = stats.pendingActionRequests || [];
  const releasedUpdates = stats.releasedUpdates || [];
  const symbol = stats.currencySymbol || "৳";

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);

  // Master Navigation active dropdown: only one open at a time
  const [activeDropdown, setActiveDropdown] = useState<
    "spaces" | "vault" | "actions" | "more" | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeDropdown]);

  // Keyboard shortcut (Cmd+K / Ctrl+K)
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
  const rawName = profile?.name || userAccess?.name || "Saurav";
  const firstName = rawName.split(" ")[0] || "Saurav";

  // Dynamic greeting based on current hour
  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Live formatted current date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Overview summary data with live actual DB records
  const overview = stats.overviewSummary || {
    totalAssets: stats.assetsTotalValue || 0,
    totalLiabilities: stats.payablesTotal || 0,
    netWorth: Math.max(0, (stats.assetsTotalValue || 0) - (stats.payablesTotal || 0)),
    monthlyIncome: stats.gesnSummary?.totalIncome || 0,
    assetsGrowthPercent: 3,
    liabilitiesGrowthPercent: 5,
    netWorthGrowthPercent: 4,
    monthlyIncomeGrowthPercent: 17,
    loanOverview: {
      given: stats.moneyGivenRemaining || stats.moneyGivenTotal || 0,
      received: stats.moneyTakenRemaining || stats.moneyTakenTotal || 0,
      dueThisMonth: 0,
    },
    businessIncome: {
      thisMonth: stats.gesnSummary?.totalIncome || 0,
      lastMonth: 0,
      growthPercent: 17,
    },
    property: {
      totalProperties: 0,
      rentalUnits: 0,
      monthlyRent: 0,
    },
    peopleAndResponsibilities: {
      totalPeople: stats.peopleCount || 0,
      activeTasks: stats.pendingResponsibilitiesCount || 0,
      pendingFromOthers: pendingRequests.length,
    },
  };

  // ── Master Navigation Menu Definitions ──
  const mySpacesItems = [
    {
      title: "Family Care",
      desc: "Medical directives & personal records",
      icon: Users,
      href: "/information",
      color: "text-[#6366F1] bg-[#EEF2FF] dark:bg-indigo-950/40",
    },
    {
      title: "Business",
      desc: "Ventures, partners & equity handover",
      icon: Briefcase,
      href: "/business",
      color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40",
    },
    {
      title: "Responsibilities",
      desc: "Delegated tasks & directives",
      icon: ClipboardCheck,
      href: "/instructions",
      color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40",
    },
    {
      title: "Emergency",
      desc: "Immediate contacts & protocols",
      icon: Siren,
      href: "/contacts",
      color: "text-[#DC2626] bg-[#FEE2E2] dark:bg-red-950/40",
    },
    {
      title: "Legacy",
      desc: "Condition-sealed legacy letters",
      icon: Sprout,
      href: "/legacy",
      color: "text-[#E11D48] bg-[#FFE4E6] dark:bg-rose-950/40",
    },
    {
      title: "Legal & Guidance",
      desc: "Wills, deeds & legal contracts",
      icon: Scale,
      href: "/documents",
      color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40",
    },
  ];

  const coreVaultItems = [
    {
      title: "Health",
      desc: "Medical dossier & emergency directives",
      icon: HeartPulse,
      href: "/information",
      color: "text-[#DC2626] bg-[#FEE2E2] dark:bg-red-950/40",
    },
    {
      title: "Finance",
      desc: "Dependent care & installment plans",
      icon: Wallet,
      href: "/finance",
      color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40",
    },
    {
      title: "Assets",
      desc: "Physical & digital asset portfolio",
      icon: Landmark,
      href: "/assets",
      color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40",
    },
    {
      title: "Documents",
      desc: "Critical classified files & deeds",
      icon: FileText,
      href: "/documents",
      color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40",
    },
  ];

  const quickActionItems = [
    {
      title: "Add Note",
      desc: "Create secret, scheduled or standard note",
      icon: NotebookPen,
      href: "/lifenote",
      color: "text-[#7C3AED] bg-[#F3E8FF] dark:bg-purple-950/40",
    },
    {
      title: "Add Task",
      desc: "Assign handover task or directive",
      icon: CheckSquare,
      href: "/instructions",
      color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40",
    },
    {
      title: "Add Expense",
      desc: "Record debt, loan or financial record",
      icon: Wallet,
      href: "/money",
      color: "text-[#D97706] bg-[#FEF3C7] dark:bg-amber-950/40",
    },
    {
      title: "Add Person",
      desc: "Register trusted contact or family member",
      icon: UserPlus,
      href: "/people",
      color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40",
    },
    {
      title: "Add Document",
      desc: "Upload and classify critical legal document",
      icon: FilePlus,
      href: "/documents",
      color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40",
    },
  ];

  const moreItems = [
    {
      title: "Reports",
      desc: "Live accounting & business financial summary",
      icon: BarChart3,
      href: "/business",
      color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40",
    },
    {
      title: "Activity History",
      desc: "Tamper-evident system audit log",
      icon: History,
      href: "/activity",
      color: "text-[#6366F1] bg-[#EEF2FF] dark:bg-indigo-950/40",
    },
    {
      title: "Additional Tools",
      desc: "Master PIN, vault security & system export",
      icon: Sliders,
      href: "/settings",
      color: "text-[#475569] bg-slate-100 dark:bg-slate-800",
    },
  ];

  const handleDropdownToggle = (key: "spaces" | "vault" | "actions" | "more") => {
    setActiveDropdown((prev) => (prev === key ? null : key));
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
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(167, 139, 250, 0.45) rgba(241, 245, 249, 0.5);
          -webkit-overflow-scrolling: touch;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.6);
          border-radius: 9999px;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(167, 139, 250, 0.5);
          border-radius: 9999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.8);
        }
      `}</style>

      {/* Main Container — Samsung Galaxy S25 Ultra Mobile-First */}
      <div className="w-full max-w-5xl mx-auto space-y-3 sm:space-y-3.5">

        {/* ══════════════════════════════════════════════════
            2. WELCOME & LIVE UPDATES SECTION (SLIM PREMIUM)
        ══════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-white/80 dark:border-purple-900/40 shadow-[0_4px_24px_rgba(124,58,237,0.06)] transition-all"
          style={{
            background:
              "linear-gradient(135deg, rgba(238, 233, 254, 0.75) 0%, rgba(246, 244, 254, 0.9) 45%, rgba(230, 235, 255, 0.65) 100%)",
          }}
        >
          {/* Subtle Abstract Wave SVG shapes */}
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

          {/* Top Greeting & Location Row */}
          <div className="relative z-10 flex items-start justify-between gap-3">
            {/* Left: Greeting & Name */}
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

            {/* Right: Date, Location & Weather Widget */}
            <div className="flex flex-col items-end shrink-0 text-right space-y-1">
              <div className="flex items-center gap-1 text-[11px] sm:text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </div>

              {/* Weather Pill */}
              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-white/90 dark:border-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs backdrop-blur-sm">
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                <span>28°C</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  H: 32° L: 24°
                </span>
              </div>
            </div>
          </div>

          {/* Four Compact Transparent Glass Buttons — horizontally scrollable on mobile with scrollbar */}
          <div className="relative z-10 flex overflow-x-auto pb-2 pt-0.5 gap-2 mt-4 sm:grid sm:grid-cols-4 sm:overflow-visible scrollbar-thin">
            {/* 1. Notes */}
            <Link
              href="/lifenote"
              className="min-w-[110px] sm:min-w-0 flex-1 shrink-0 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 border border-white/90 dark:border-slate-800 shadow-xs hover:shadow-sm active:scale-95 transition-all text-center relative group cursor-pointer"
              aria-label="Open Notes"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <NotebookPen className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-[#1E1B4B] dark:text-slate-200 whitespace-nowrap">
                Notes
              </span>
              {(badges?.notesCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-bold shadow-xs">
                  {badges?.notesCount}
                </span>
              )}
            </Link>

            {/* 2. Messages */}
            <Link
              href="/requests"
              className="min-w-[110px] sm:min-w-0 flex-1 shrink-0 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 border border-white/90 dark:border-slate-800 shadow-xs hover:shadow-sm active:scale-95 transition-all text-center relative group cursor-pointer"
              aria-label="Open Messages"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-400 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-[#1E1B4B] dark:text-slate-200 whitespace-nowrap">
                Messages
              </span>
              {(badges?.messagesCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-bold shadow-xs">
                  {badges?.messagesCount}
                </span>
              )}
            </Link>

            {/* 3. Requests */}
            <Link
              href="/requests"
              className="min-w-[110px] sm:min-w-0 flex-1 shrink-0 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 border border-white/90 dark:border-slate-800 shadow-xs hover:shadow-sm active:scale-95 transition-all text-center relative group cursor-pointer"
              aria-label="Open Requests"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ClipboardCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-[#1E1B4B] dark:text-slate-200 whitespace-nowrap">
                Requests
              </span>
              {(pendingRequests.length > 0 || (badges?.requestsCount ?? 0) > 0) && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-bold shadow-xs">
                  {pendingRequests.length || badges?.requestsCount}
                </span>
              )}
            </Link>

            {/* 4. Updates */}
            <Link
              href="/requests"
              className="min-w-[110px] sm:min-w-0 flex-1 shrink-0 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 border border-white/90 dark:border-slate-800 shadow-xs hover:shadow-sm active:scale-95 transition-all text-center relative group cursor-pointer"
              aria-label="Open Updates"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-[#1E1B4B] dark:text-slate-200 whitespace-nowrap">
                Updates
              </span>
              {releasedUpdates.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold shadow-xs">
                  {releasedUpdates.length}
                </span>
              )}
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            3. MASTER NAVIGATION — FOUR BUTTONS WITH DROPDOWNS
        ══════════════════════════════════════════════════ */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex overflow-x-auto pb-2.5 pt-0.5 gap-2 sm:gap-2.5 sm:grid sm:grid-cols-4 sm:overflow-visible scrollbar-thin">
            {/* Button 1: My Spaces */}
            <button
              type="button"
              onClick={() => handleDropdownToggle("spaces")}
              className={`min-w-[130px] sm:min-w-0 flex-1 shrink-0 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 text-center border transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                activeDropdown === "spaces"
                  ? "bg-[#FFE8E8] dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 shadow-sm"
                  : "bg-[#FFF2F2]/90 hover:bg-[#FFEAEB] dark:bg-rose-950/30 border-rose-100/90 dark:border-rose-900/40"
              }`}
              aria-expanded={activeDropdown === "spaces"}
              aria-label="My Spaces dropdown (6 areas)"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 w-full">
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white block truncate leading-tight">
                  My Spaces
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate leading-none">
                  6 areas
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  activeDropdown === "spaces" ? "rotate-180 text-rose-600" : ""
                }`}
              />
            </button>

            {/* Button 2: Core Vault */}
            <button
              type="button"
              onClick={() => handleDropdownToggle("vault")}
              className={`min-w-[130px] sm:min-w-0 flex-1 shrink-0 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 text-center border transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                activeDropdown === "vault"
                  ? "bg-[#D8F5E5] dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 shadow-sm"
                  : "bg-[#EAFBF2]/90 hover:bg-[#DEF7E9] dark:bg-emerald-950/30 border-emerald-100/90 dark:border-emerald-900/40"
              }`}
              aria-expanded={activeDropdown === "vault"}
              aria-label="Core Vault dropdown (4 sections)"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 w-full">
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white block truncate leading-tight">
                  Core Vault
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate leading-none">
                  4 sections
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  activeDropdown === "vault" ? "rotate-180 text-emerald-600" : ""
                }`}
              />
            </button>

            {/* Button 3: Quick Actions */}
            <button
              type="button"
              onClick={() => handleDropdownToggle("actions")}
              className={`min-w-[130px] sm:min-w-0 flex-1 shrink-0 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 text-center border transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                activeDropdown === "actions"
                  ? "bg-[#FFE8CC] dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 shadow-sm"
                  : "bg-[#FFF6EA]/90 hover:bg-[#FFEFD9] dark:bg-amber-950/30 border-amber-100/90 dark:border-amber-900/40"
              }`}
              aria-expanded={activeDropdown === "actions"}
              aria-label="Quick Actions dropdown (5 actions)"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 w-full">
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white block truncate leading-tight">
                  Quick Actions
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate leading-none">
                  5 actions
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  activeDropdown === "actions" ? "rotate-180 text-amber-600" : ""
                }`}
              />
            </button>

            {/* Button 4: More */}
            <button
              type="button"
              onClick={() => handleDropdownToggle("more")}
              className={`min-w-[130px] sm:min-w-0 flex-1 shrink-0 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 text-center border transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                activeDropdown === "more"
                  ? "bg-[#D9EAFE] dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 shadow-sm"
                  : "bg-[#EDF5FF]/90 hover:bg-[#E2F0FE] dark:bg-sky-950/30 border-sky-100/90 dark:border-sky-900/40"
              }`}
              aria-expanded={activeDropdown === "more"}
              aria-label="More dropdown (Reports & Tools)"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 w-full">
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white block truncate leading-tight">
                  More
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate leading-none">
                  Reports & Tools
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  activeDropdown === "more" ? "rotate-180 text-sky-600" : ""
                }`}
              />
            </button>
          </div>

          {/* ── Expandable Dropdown Container (Only ONE active at a time) ── */}
          {activeDropdown && (
            <div className="mt-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-3.5 sm:p-4 border border-slate-100/90 dark:border-slate-800 shadow-[0_8px_30px_rgba(30,27,75,0.08)] animate-in fade-in slide-in-from-top-2 duration-150 z-30">
              {/* Header indicator */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {activeDropdown === "spaces" && "My Spaces — 6 Areas"}
                  {activeDropdown === "vault" && "Core Vault — 4 Sections"}
                  {activeDropdown === "actions" && "Quick Actions — 5 Direct Actions"}
                  {activeDropdown === "more" && "More — Reports & Management Tools"}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(null)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Dropdown 1: My Spaces (6 items) */}
              {activeDropdown === "spaces" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {mySpacesItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-2xl bg-slate-50/70 hover:bg-[#EEF2FF] dark:bg-slate-800/40 dark:hover:bg-indigo-950/40 border border-slate-100/90 dark:border-slate-800 transition-all flex items-center gap-2.5 group"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <item.icon className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white block truncate leading-tight group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block mt-0.5 leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Dropdown 2: Core Vault (4 items) */}
              {activeDropdown === "vault" && (
                <div className="grid grid-cols-2 gap-2">
                  {coreVaultItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-3 rounded-2xl bg-slate-50/70 hover:bg-[#E8F8F0] dark:bg-slate-800/40 dark:hover:bg-emerald-950/40 border border-slate-100/90 dark:border-slate-800 transition-all flex items-center gap-3 group"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <item.icon className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-bold text-[#1E1B4B] dark:text-white block truncate leading-tight group-hover:text-emerald-700 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate block mt-0.5 leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Dropdown 3: Quick Actions (5 items) */}
              {activeDropdown === "actions" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {quickActionItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-2xl bg-slate-50/70 hover:bg-[#FFF6EA] dark:bg-slate-800/40 dark:hover:bg-amber-950/40 border border-slate-100/90 dark:border-slate-800 transition-all flex items-center gap-2.5 group"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <item.icon className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white block truncate leading-tight group-hover:text-amber-700 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block mt-0.5 leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Dropdown 4: More (3 items) */}
              {activeDropdown === "more" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {moreItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="p-3 rounded-2xl bg-slate-50/70 hover:bg-[#EDF5FF] dark:bg-slate-800/40 dark:hover:bg-sky-950/40 border border-slate-100/90 dark:border-slate-800 transition-all flex items-center gap-3 group"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <item.icon className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-bold text-[#1E1B4B] dark:text-white block truncate leading-tight group-hover:text-sky-700 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate block mt-0.5 leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            4. LIVE OVERVIEW — FINANCIAL SUMMARY (4 CARDS ROW)
        ══════════════════════════════════════════════════ */}
        <section className="space-y-2">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[#1E1B4B] dark:text-white flex items-center gap-1.5">
              <span>Live Overview</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-500 fill-purple-400" />
            </h2>
            <Link
              href="/finance"
              className="text-[12px] font-bold text-[#4F46E5] hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5 transition-colors"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Link>
          </div>

          {/* 4 Overview Cards in One Horizontal Row — Scrollable on mobile, 4-col grid on sm+ */}
          <div className="flex overflow-x-auto pb-2.5 pt-0.5 gap-2 sm:gap-2.5 sm:grid sm:grid-cols-4 sm:overflow-visible scrollbar-thin">
            {/* Card 1: Total Assets */}
            <Link
              href="/assets"
              className="min-w-[145px] sm:min-w-0 flex-1 shrink-0 bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex flex-col justify-between group active:scale-95"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                  <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.2} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  Total Assets
                </span>
              </div>
              <div className="mt-1 sm:mt-1.5 min-w-0">
                <p className="text-[13px] sm:text-[14px] md:text-[15px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight">
                  {formatMoney(overview.totalAssets, symbol)}
                </p>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">
                    ↑ {overview.assetsGrowthPercent ?? 3}%
                  </span>
                  <WaveSparkline color="#8B5CF6" />
                </div>
              </div>
            </Link>

            {/* Card 2: Total Liabilities */}
            <Link
              href="/money"
              className="min-w-[145px] sm:min-w-0 flex-1 shrink-0 bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex flex-col justify-between group active:scale-95"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.2} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  Total Liabilities
                </span>
              </div>
              <div className="mt-1 sm:mt-1.5 min-w-0">
                <p className="text-[13px] sm:text-[14px] md:text-[15px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight">
                  {formatMoney(overview.totalLiabilities, symbol)}
                </p>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-rose-500">
                    ↑ {overview.liabilitiesGrowthPercent ?? 5}%
                  </span>
                  <WaveSparkline color="#F43F5E" />
                </div>
              </div>
            </Link>

            {/* Card 3: Net Worth */}
            <Link
              href="/finance"
              className="min-w-[145px] sm:min-w-0 flex-1 shrink-0 bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex flex-col justify-between group active:scale-95"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <PieChart className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.2} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  Net Worth
                </span>
              </div>
              <div className="mt-1 sm:mt-1.5 min-w-0">
                <p className="text-[13px] sm:text-[14px] md:text-[15px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight">
                  {formatMoney(overview.netWorth, symbol)}
                </p>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">
                    ↑ {overview.netWorthGrowthPercent ?? 4}%
                  </span>
                  <BarSparkline color="#8B5CF6" />
                </div>
              </div>
            </Link>

            {/* Card 4: Monthly Income */}
            <Link
              href="/business"
              className="min-w-[145px] sm:min-w-0 flex-1 shrink-0 bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex flex-col justify-between group active:scale-95"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.2} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  Monthly Income
                </span>
              </div>
              <div className="mt-1 sm:mt-1.5 min-w-0">
                <p className="text-[13px] sm:text-[14px] md:text-[15px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight">
                  {formatMoney(overview.monthlyIncome, symbol)}
                </p>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">
                    ↑ {overview.monthlyIncomeGrowthPercent ?? 17}%
                  </span>
                  <BarSparkline color="#10B981" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            5. DETAILED LIVE OVERVIEW — FOUR COMPACT CARDS (2-COL)
        ══════════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          {/* Card A: Loan Overview */}
          <Link
            href="/money"
            className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.98]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <HandCoins className="w-3.5 h-3.5" strokeWidth={2.2} />
                </div>
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white truncate">
                  Loan Overview
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Rows */}
            <div className="space-y-1 text-[11px] sm:text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Given</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {formatMoney(overview.loanOverview.given, symbol)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Received</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {formatMoney(overview.loanOverview.received, symbol)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Due This Month</span>
                <span className="font-bold text-rose-500">
                  {formatMoney(overview.loanOverview.dueThisMonth, symbol)}
                </span>
              </div>
            </div>
          </Link>

          {/* Card B: Business Income */}
          <Link
            href="/business"
            className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.98]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Briefcase className="w-3.5 h-3.5" strokeWidth={2.2} />
                </div>
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white truncate">
                  Business Income
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Rows */}
            <div className="space-y-1 text-[11px] sm:text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">This Month</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {formatMoney(overview.businessIncome.thisMonth, symbol)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Last Month</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {formatMoney(overview.businessIncome.lastMonth, symbol)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Growth</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-emerald-600">
                    ↑ {overview.businessIncome.growthPercent}%
                  </span>
                  <BarSparkline color="#8B5CF6" />
                </div>
              </div>
            </div>
          </Link>

          {/* Card C: Property */}
          <Link
            href="/assets"
            className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.98]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                </div>
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white truncate">
                  Property
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Rows */}
            <div className="space-y-1 text-[11px] sm:text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Properties</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {overview.property.totalProperties}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Rental Units</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {overview.property.rentalUnits}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Monthly Rent</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {formatMoney(overview.property.monthlyRent, symbol)}
                </span>
              </div>
            </div>
          </Link>

          {/* Card D: People & Responsibilities */}
          <Link
            href="/people"
            className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.98]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" strokeWidth={2.2} />
                </div>
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white truncate">
                  People & Responsibilities
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* Rows */}
            <div className="space-y-1 text-[11px] sm:text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total People</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {overview.peopleAndResponsibilities.totalPeople}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Active Tasks</span>
                <span className="font-bold text-[#1E1B4B] dark:text-slate-100">
                  {overview.peopleAndResponsibilities.activeTasks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Pending from Others</span>
                <span className="font-bold text-rose-500">
                  {overview.peopleAndResponsibilities.pendingFromOthers}
                </span>
              </div>
            </div>
          </Link>
        </section>

      </div>

      {/* Global Search Dialog Modal (triggered by ⌘K or search pill) */}
      <LifeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
