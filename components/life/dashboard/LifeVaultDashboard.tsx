/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
  Home,
  Database,
  PieChart,
  Coins,
  Crown,
  Calendar,
  MapPin,
  Sun,
  HandCoins,
  Sparkles,
  ShieldCheck,
  Lock,
  Baby,
  FolderKanban,
  Globe2,
  UserCog,
  Fingerprint,
  AlertTriangle,
  ScrollText,
  X,
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
  const symbol = stats.currencySymbol || "৳";

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);



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
  const rawName = profile?.name || userAccess?.name || "Owner";
  const firstName = rawName.split(" ")[0] || "Owner";

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
    loanOverview: {
      given: stats.moneyGivenRemaining || stats.moneyGivenTotal || 0,
      received: stats.moneyTakenRemaining || stats.moneyTakenTotal || 0,
      dueThisMonth: 0,
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

  // ── Notes/Requests/Duties badge counts ──
  const notesCount = badges?.notesCount ?? 0;
  const requestsCount = (pendingRequests.length > 0 ? pendingRequests.length : badges?.requestsCount ?? 0);
  const dutiesCount = stats.pendingResponsibilitiesCount ?? 0;

  // ── Master Navigation Menu Definitions ──
  // 6.1 My Spaces — 6 Sections
  const mySpacesItems = [
    {
      title: "Family Care",
      desc: "Family members, relationships & care",
      icon: Users,
      href: "/information",
      color: "text-[#6366F1] bg-[#EEF2FF] dark:bg-indigo-950/40",
    },
    {
      title: "Kids",
      desc: "Children's info, education & planning",
      icon: Baby,
      href: "/people",
      color: "text-[#EC4899] bg-[#FCE7F3] dark:bg-pink-950/40",
    },
    {
      title: "Staff & Office",
      desc: "Employees, office operations",
      icon: UserCog,
      href: "/people",
      color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40",
    },
    {
      title: "Business",
      desc: "Ventures, partners & operations",
      icon: Briefcase,
      href: "/business",
      color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40",
    },
    {
      title: "Projects",
      desc: "Personal & business projects",
      icon: FolderKanban,
      href: "/instructions",
      color: "text-[#D97706] bg-[#FEF3C7] dark:bg-amber-950/40",
    },
    {
      title: "Community",
      desc: "Social relationships & activities",
      icon: Globe2,
      href: "/people",
      color: "text-[#7C3AED] bg-[#F3E8FF] dark:bg-purple-950/40",
    },
  ];

  // 6.2 Core Vault — 6 Sections
  const coreVaultItems = [
    {
      title: "Personal",
      desc: "Personal identity & essential info",
      icon: Fingerprint,
      href: "/information",
      color: "text-[#6366F1] bg-[#EEF2FF] dark:bg-indigo-950/40",
    },
    {
      title: "Health",
      desc: "Medical info, medications & records",
      icon: HeartPulse,
      href: "/information",
      color: "text-[#DC2626] bg-[#FEE2E2] dark:bg-red-950/40",
    },
    {
      title: "Finance & Loans",
      desc: "Income, expenses, loans & payables",
      icon: Wallet,
      href: "/finance",
      color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40",
    },
    {
      title: "Assets & Property",
      desc: "Land, houses & personal assets",
      icon: Landmark,
      href: "/assets",
      color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40",
    },
    {
      title: "Documents",
      desc: "Legal papers, certificates & files",
      icon: FileText,
      href: "/documents",
      color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40",
    },
    {
      title: "Digital Vault",
      desc: "Digital accounts & secure records",
      icon: Lock,
      href: "/vault",
      color: "text-[#7C3AED] bg-[#F3E8FF] dark:bg-purple-950/40",
    },
  ];

  // 6.3 Continuity — 6 Sections
  const continuityItems = [
    {
      title: "Responsibilities",
      desc: "Assign & monitor delegated duties",
      icon: ClipboardCheck,
      href: "/instructions",
      color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40",
    },
    {
      title: "Instructions",
      desc: "Important instructions for people",
      icon: ScrollText,
      href: "/instructions",
      color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40",
    },
    {
      title: "Emergency",
      desc: "Emergency contacts & procedures",
      icon: Siren,
      href: "/contacts",
      color: "text-[#DC2626] bg-[#FEE2E2] dark:bg-red-950/40",
    },
    {
      title: "Access Control",
      desc: "Manage who can access information",
      icon: ShieldCheck,
      href: "/access",
      color: "text-[#D97706] bg-[#FEF3C7] dark:bg-amber-950/40",
    },
    {
      title: "After-Death",
      desc: "Posthumous instructions & handover",
      icon: Sprout,
      href: "/legacy",
      color: "text-[#E11D48] bg-[#FFE4E6] dark:bg-rose-950/40",
    },
    {
      title: "Will & Legal",
      desc: "Wills, guardianship & legal plans",
      icon: Scale,
      href: "/documents",
      color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40",
    },
  ];



  // ── Live Overview data — 6 cards ──
  const loansGiven = overview.loanOverview?.given ?? stats.moneyGivenRemaining ?? 0;
  const propertyCount = overview.property?.totalProperties ?? 0;

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
        @keyframes lv-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lv-dropdown-enter {
          animation: lv-slide-down 0.2s ease-out forwards;
        }
      `}</style>

      {/* Main Container — Samsung Galaxy S25 Ultra Mobile-First */}
      <div className="w-full max-w-5xl mx-auto space-y-3 sm:space-y-3.5">

        {/* ══════════════════════════════════════════════════
            1. WELCOME HERO SECTION (COMPACT)
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

          {/* ── Smart Information Cards: Notes | Requests | Duties ── */}
          <div className="relative z-10 grid grid-cols-3 gap-2 mt-3.5">
            {/* Notes */}
            <Link
              href="/lifenote"
              className="bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 border border-white/90 dark:border-slate-800 shadow-xs hover:shadow-sm active:scale-95 transition-all text-center relative group cursor-pointer"
              aria-label="Open Notes"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <NotebookPen className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-[#1E1B4B] dark:text-slate-200 whitespace-nowrap">
                Notes
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              {notesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-bold shadow-xs">
                  {notesCount}
                </span>
              )}
            </Link>

            {/* Requests */}
            <Link
              href="/requests"
              className="bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 border border-white/90 dark:border-slate-800 shadow-xs hover:shadow-sm active:scale-95 transition-all text-center relative group cursor-pointer"
              aria-label="Open Requests"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ClipboardCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-[#1E1B4B] dark:text-slate-200 whitespace-nowrap">
                Requests
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              {requestsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-bold shadow-xs">
                  {requestsCount}
                </span>
              )}
            </Link>

            {/* Duties */}
            <Link
              href="/instructions"
              className="bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 border border-white/90 dark:border-slate-800 shadow-xs hover:shadow-sm active:scale-95 transition-all text-center relative group cursor-pointer"
              aria-label="Open Duties"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-[#1E1B4B] dark:text-slate-200 whitespace-nowrap">
                Duties
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              {dutiesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-bold shadow-xs">
                  {dutiesCount}
                </span>
              )}
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            2. UNIFIED LIFE WORKSPACE ENTRY CARD
        ══════════════════════════════════════════════════ */}
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[#1E1B4B] dark:text-white">
              Life Workspace
            </h2>
            <Link
              href="/workspace"
              className="text-[12px] font-bold text-[#4F46E5] hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5 transition-colors"
            >
              Open Workspace
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Link>
          </div>

          <Link
            href="/workspace"
            className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99]"
            aria-label="Open Unified Life Workspace"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <FolderKanban className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] sm:text-[15px] font-bold text-[#1E1B4B] dark:text-white tracking-tight leading-tight">
                    Life Workspace
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                    Unified
                  </span>
                </div>
                <p className="text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 truncate leading-snug">
                  All your information, records and management in one place.
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:border-indigo-200 transition-all flex items-center justify-center shrink-0 shadow-2xs">
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} />
            </div>
          </Link>
        </section>

        {/* ══════════════════════════════════════════════════
            3. LIVE OVERVIEW — 6 CARDS IN 2×3 GRID
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

          {/* 6 Overview Cards — strict 2×3 grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Card 1: Total Assets */}
            <Link
              href="/workspace?section=core_vault&category=assets_property"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex items-start gap-2.5 group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                <Home className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Total Assets
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
                <p className="text-[15px] sm:text-[16px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight mt-0.5">
                  {formatMoney(overview.totalAssets, symbol)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <WaveSparkline color="#0EA5E9" />
                </div>
              </div>
            </Link>

            {/* Card 2: Total Liabilities */}
            <Link
              href="/workspace?section=core_vault&category=finance_loans&filter=loans_received"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex items-start gap-2.5 group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Total Liabilities
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
                <p className="text-[15px] sm:text-[16px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight mt-0.5">
                  {formatMoney(overview.totalLiabilities, symbol)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <WaveSparkline color="#F43F5E" />
                </div>
              </div>
            </Link>

            {/* Card 3: Net Worth */}
            <Link
              href="/workspace?section=core_vault&category=finance_loans&filter=all"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex items-start gap-2.5 group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                <PieChart className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Net Worth
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
                <p className="text-[15px] sm:text-[16px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight mt-0.5">
                  {formatMoney(overview.netWorth, symbol)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <BarSparkline color="#8B5CF6" />
                </div>
              </div>
            </Link>

            {/* Card 4: Monthly Income */}
            <Link
              href="/workspace?section=core_vault&category=finance_loans&filter=income"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex items-start gap-2.5 group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Monthly Income
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
                <p className="text-[15px] sm:text-[16px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight mt-0.5">
                  {formatMoney(overview.monthlyIncome, symbol)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <BarSparkline color="#10B981" />
                </div>
              </div>
            </Link>

            {/* Card 5: Loans Given */}
            <Link
              href="/workspace?section=core_vault&category=finance_loans&filter=loans_given"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex items-start gap-2.5 group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <HandCoins className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Loans Given
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
                <p className="text-[15px] sm:text-[16px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight mt-0.5">
                  {formatMoney(loansGiven, symbol)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <BarSparkline color="#D97706" />
                </div>
              </div>
            </Link>

            {/* Card 6: Property */}
            <Link
              href="/workspace?section=core_vault&category=assets_property"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex items-start gap-2.5 group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Property
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                </div>
                <p className="text-[15px] sm:text-[16px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight mt-0.5">
                  {propertyCount}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Rental Units: {overview.property?.rentalUnits ?? 0}
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            4. QUICK SUMMARY — 4 COMPACT CARDS
        ══════════════════════════════════════════════════ */}
        <section className="space-y-2">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[#1E1B4B] dark:text-white">
              Quick Summary
            </h2>
            <Link
              href="/guide"
              className="text-[12px] font-bold text-[#4F46E5] hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5 transition-colors"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            </Link>
          </div>

          {/* 4 Summary Cards — responsive: 4-col on wider mobile, 2×2 on narrow */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* People */}
            <Link
              href="/people"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Users className="w-3 h-3" strokeWidth={2.4} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-bold text-slate-600 dark:text-slate-300">
                    People
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </div>
              <p className="text-[18px] sm:text-[20px] font-extrabold text-[#1E1B4B] dark:text-white leading-tight">
                {stats.peopleCount || 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Active Tasks: {overview.peopleAndResponsibilities?.activeTasks ?? 0}
              </p>
            </Link>

            {/* Tasks */}
            <Link
              href="/instructions"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <CheckSquare className="w-3 h-3" strokeWidth={2.4} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-bold text-slate-600 dark:text-slate-300">
                    Tasks
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </div>
              <p className="text-[18px] sm:text-[20px] font-extrabold text-[#1E1B4B] dark:text-white leading-tight">
                {stats.pendingResponsibilitiesCount ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Due This Week
              </p>
            </Link>

            {/* Overdue */}
            <Link
              href="/money"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3 h-3" strokeWidth={2.4} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-bold text-slate-600 dark:text-slate-300">
                    Overdue
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </div>
              <p className="text-[18px] sm:text-[20px] font-extrabold text-[#1E1B4B] dark:text-white leading-tight">
                {stats.overduePaymentsCount ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Payments / Tasks
              </p>
            </Link>

            {/* Documents */}
            <Link
              href="/documents"
              className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-md transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <FileText className="w-3 h-3" strokeWidth={2.4} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-bold text-slate-600 dark:text-slate-300">
                    Documents
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </div>
              <p className="text-[18px] sm:text-[20px] font-extrabold text-[#1E1B4B] dark:text-white leading-tight">
                {stats.documentsCount ?? 0}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Need Review
              </p>
            </Link>
          </div>
        </section>

      </div>

      {/* Global Search Dialog Modal (triggered by ⌘K or search pill) */}
      <LifeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
