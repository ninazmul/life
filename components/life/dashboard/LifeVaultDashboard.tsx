/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Heart,
  Wallet,
  Briefcase,
  Home as HomeIcon,
  Lock,
  ScrollText,
  ShieldAlert,
  Scale,
  Plus,
  MessageCircle,
  NotebookPen,
  ShieldCheck,
  Inbox,
  Pause,
  Users,
  FileText,
  User,
  Building2,
  Landmark,
  KeyRound,
  Contact,
  CheckSquare,
  Shield,
  Coins,
  ArrowRight,
} from "lucide-react";
import { LifeDashboardStats } from "@/types";
import { UserModuleAccess } from "@/lib/life/module-access";
import { LifeSearchDialog } from "@/components/life/shared/LifeSearchDialog";

// ── Types ──
interface LifeVaultDashboardProps {
  stats: LifeDashboardStats;
  userAccess?: UserModuleAccess;
}

// ── Add Menu Items ──
const ADD_MENU_ITEMS = [
  { label: "Person", href: "/people", icon: User },
  { label: "Money Record", href: "/money", icon: Wallet },
  { label: "Business", href: "/business", icon: Building2 },
  { label: "Asset", href: "/assets", icon: Landmark },
  { label: "Vault Secret", href: "/vault", icon: KeyRound },
  { label: "Document", href: "/documents", icon: FileText },
  { label: "Contact", href: "/contacts", icon: Contact },
  { label: "Instruction", href: "/instructions", icon: CheckSquare },
  { label: "Note", href: "/lifenote", icon: NotebookPen },
  { label: "Legacy Letter", href: "/legacy", icon: ScrollText },
];

// ── Avatar Helper with Clerk Avatar & Error Fallback ──
function PersonAvatar({
  name,
  avatarUrl,
  profilePhoto,
  size = 48,
  className = "",
}: {
  name: string;
  avatarUrl?: string;
  profilePhoto?: string;
  size?: number;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const src = avatarUrl || profilePhoto || "";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export function LifeVaultDashboard({
  stats,
  userAccess,
}: LifeVaultDashboardProps) {
  const badges = stats.dashboardBadges;
  const profile = stats.ownerProfile;
  const trustedPeople = stats.trustedPeople || [];
  const setupReminders = stats.setupReminders || [];
  const urgentItems = stats.urgentItems || [];
  const currency = stats.currencySymbol || "৳";

  // Dynamic Spaces with Live Metric Badges
  const spaces = [
    {
      title: "Family & Health",
      desc: "Care & medical responsibilities",
      metric: `${stats.peopleCount || 0} Registered`,
      icon: Heart,
      href: "/information",
      color: "text-rose-600",
      iconBg: "bg-rose-100",
    },
    {
      title: "Finance & Money",
      desc: "Cash ledger, receivables & support",
      metric: `Receivable: ${currency}${stats.moneyGivenRemaining?.toLocaleString() || "0"}`,
      icon: Wallet,
      href: "/money",
      color: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      title: "Business Continuity",
      desc: "Ventures, partner equity & servers",
      metric: `${stats.businessCount || 0} Ventures`,
      icon: Briefcase,
      href: "/business",
      color: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "Properties & Assets",
      desc: "Real estate, vehicles & valuables",
      metric: `${currency}${stats.assetsTotalValue?.toLocaleString() || "0"}`,
      icon: HomeIcon,
      href: "/assets",
      color: "text-amber-600",
      iconBg: "bg-amber-100",
    },
    {
      title: "Private Vault",
      desc: "AES-256 encrypted passwords & keys",
      metric: "Encrypted & Concealed",
      icon: Lock,
      href: "/vault",
      color: "text-indigo-600",
      iconBg: "bg-indigo-100",
    },
    {
      title: "Legacy Plan",
      desc: "Sealed messages for the future",
      metric: `${stats.legacyCount || 0} Letters`,
      icon: ScrollText,
      href: "/legacy",
      color: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      title: "Emergency Plan",
      desc: "Immediate contacts & trustees",
      metric: `${stats.trustedGuardiansCount || 0} Guardians Ready`,
      icon: ShieldAlert,
      href: "/contacts",
      color: "text-red-600",
      iconBg: "bg-red-100",
    },
    {
      title: "Legal & Documents",
      desc: "Deeds, wills & legal directives",
      metric: `${stats.documentsCount || 0} Documents`,
      icon: Scale,
      href: "/documents",
      color: "text-slate-600",
      iconBg: "bg-slate-100",
    },
  ];

  // Combine reminders: setup + urgent
  const allReminders = [
    ...setupReminders.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      link: r.link,
      category: r.category || "Setup",
    })),
    ...urgentItems.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.dueText || u.category,
      link: u.link,
      category: u.category || "Urgent",
    })),
  ];

  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(
    new Set()
  );
  const [currentReminderIdx, setCurrentReminderIdx] = useState(0);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const trustedScrollRef = useRef<HTMLDivElement>(null);

  // Filter out dismissed reminders
  const activeReminders = allReminders.filter(
    (r) => !dismissedReminders.has(r.id)
  );
  const currentReminder =
    activeReminders.length > 0
      ? activeReminders[currentReminderIdx % activeReminders.length]
      : null;

  // Close add menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setAddMenuOpen(false);
      }
    }
    if (addMenuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [addMenuOpen]);

  // Keyboard shortcut for search
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

  const handleDismissReminder = (id: string) => {
    setDismissedReminders((prev) => new Set([...prev, id]));
  };

  const handleNextReminder = () => {
    if (activeReminders.length > 1) {
      setCurrentReminderIdx((prev) => (prev + 1) % activeReminders.length);
    }
  };

  const handlePrevReminder = () => {
    if (activeReminders.length > 1) {
      setCurrentReminderIdx(
        (prev) => (prev - 1 + activeReminders.length) % activeReminders.length
      );
    }
  };

  const scrollTrusted = (direction: "left" | "right") => {
    if (trustedScrollRef.current) {
      const scrollAmount = direction === "left" ? -260 : 260;
      trustedScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const displayName = profile?.name || userAccess?.name || "Owner";
  const firstName = displayName.split(" ")[0];
  const roleName =
    profile?.role === "super_admin" || userAccess?.isOwner
      ? "Owner"
      : profile?.role || "Member";

  return (
    <div className="lv-dashboard min-h-screen pb-24 md:pb-12 w-full">
      {/* ─── Header: Mobile Bar (< md) vs Desktop Welcome Bar (>= md) ─── */}
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between px-1 pt-1 pb-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 shrink-0">
            <Image
              src="/assets/images/logo.png"
              alt="Life Vault Logo"
              fill
              className="object-contain"
              priority
              sizes="36px"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--lv-navy)]">
            Life Vault
          </span>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-[var(--lv-navy)]" strokeWidth={2} />
        </button>
      </div>

      {/* Desktop & Tablet Top Bar */}
      <div className="hidden md:flex items-center justify-between mb-6 pb-3 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--lv-navy)] tracking-tight">
              Welcome back, {firstName}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-indigo-600 text-white shadow-xs">
              {roleName}
            </span>
          </div>
          <p className="text-xs lg:text-sm text-slate-500 font-medium mt-0.5">
            Personal Legacy, Encrypted Secrets & Continuity Workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-emerald-200/80 text-emerald-700 text-xs font-semibold shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Vault Active & Encrypted
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search records...</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* ─── Metric Highlights Strip (Tablet & Desktop: hidden on xs, flex on sm+) ─── */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-5 lg:mb-6">
        <Link
          href="/assets"
          className="lv-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group border border-transparent hover:border-amber-100"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Coins className="w-5.5 h-5.5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Asset Portfolio
            </p>
            <p className="text-base lg:text-lg font-extrabold text-[var(--lv-navy)] truncate mt-0.5">
              {currency}
              {stats.assetsTotalValue?.toLocaleString() || "0"}
            </p>
          </div>
        </Link>

        <Link
          href="/money"
          className="lv-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group border border-transparent hover:border-emerald-100"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Wallet className="w-5.5 h-5.5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Net Receivables
            </p>
            <p className="text-base lg:text-lg font-extrabold text-[var(--lv-navy)] truncate mt-0.5">
              {currency}
              {stats.moneyGivenRemaining?.toLocaleString() || "0"}
            </p>
          </div>
        </Link>

        <Link
          href="/guardians"
          className="lv-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group border border-transparent hover:border-indigo-100"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Shield className="w-5.5 h-5.5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Continuity Trustees
            </p>
            <p className="text-base lg:text-lg font-extrabold text-[var(--lv-navy)] truncate mt-0.5">
              {stats.trustedGuardiansCount || 0} Guardians Ready
            </p>
          </div>
        </Link>

        <Link
          href="/people"
          className="lv-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5 group border border-transparent hover:border-rose-100"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5.5 h-5.5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Continuity Circle
            </p>
            <p className="text-base lg:text-lg font-extrabold text-[var(--lv-navy)] truncate mt-0.5">
              {stats.peopleCount || trustedPeople.length} People Recorded
            </p>
          </div>
        </Link>
      </div>

      {/* ─── Responsive Adaptive Grid (Single-col mobile/tablet, 2-col on lg+) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
        {/* ─── PROFILE & SHORTCUTS SECTION (Order 1 on mobile/tablet, Right Column on Desktop) ─── */}
        <div className="col-span-12 lg:col-span-4 lg:order-2 space-y-4 sm:space-y-5">
          {/* Profile Card */}
          <div className="lv-card p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <PersonAvatar
                name={displayName}
                avatarUrl={userAccess?.avatarUrl || profile?.avatarUrl}
                profilePhoto={userAccess?.avatarUrl || profile?.avatarUrl}
                size={56}
                className="ring-2 ring-indigo-200 ring-offset-2"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-[var(--lv-navy)] truncate">
                  {displayName}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Personal workspace
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-600 text-white">
                    {roleName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate hidden sm:inline">
                    • {profile?.emergencyInfoStatus || "Protocols Configured"}
                  </span>
                </div>
              </div>
              <Link
                href={
                  profile?.personId
                    ? `/people/${profile.personId}`
                    : "/settings"
                }
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 shrink-0 hover:translate-x-0.5 transition-transform"
              >
                Profile
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Desktop / Tablet Vault Completion Meter */}
            <div className="hidden sm:block mt-3.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-medium">
                  Vault Readiness
                </span>
                <span className="font-bold text-indigo-600">
                  {profile?.profileCompletion ?? 85}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${profile?.profileCompletion ?? 85}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shortcuts Row (Mobile/Tablet) vs Action Hub (Desktop) */}
          <div className="lv-card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2.5 px-1 lg:flex hidden">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Shortcuts
              </h4>
            </div>

            <div className="flex items-center justify-around lg:grid lg:grid-cols-2 lg:gap-2.5">
              {/* Requests */}
              <Link
                href="/requests"
                className="lv-shortcut-btn flex flex-col lg:flex-row lg:items-center lg:gap-2.5 items-center justify-center gap-1 relative lg:p-2.5 lg:rounded-xl lg:bg-slate-50 hover:lg:bg-indigo-50 transition-all flex-1 py-1"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <Inbox
                    className="w-5 h-5 text-[var(--lv-navy)]"
                    strokeWidth={1.8}
                  />
                  {badges && badges.requestsCount > 0 && (
                    <span className="absolute top-1 right-1/2 translate-x-4 lg:right-2 lg:top-2 lg:translate-x-0 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                      {badges.requestsCount}
                    </span>
                  )}
                </div>
                <div className="text-center lg:text-left">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-700 block">
                    Requests
                  </span>
                  <span className="text-[10px] text-slate-400 hidden lg:block">
                    Inbound Center
                  </span>
                </div>
              </Link>

              {/* Notes */}
              <Link
                href="/lifenote"
                className="lv-shortcut-btn flex flex-col lg:flex-row lg:items-center lg:gap-2.5 items-center justify-center gap-1 flex-1 py-1 lg:p-2.5 lg:rounded-xl lg:bg-slate-50 hover:lg:bg-indigo-50 transition-all"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <NotebookPen
                    className="w-5 h-5 text-[var(--lv-navy)]"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="text-center lg:text-left">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-700 block">
                    Notes
                  </span>
                  <span className="text-[10px] text-slate-400 hidden lg:block">
                    Private Memos
                  </span>
                </div>
              </Link>

              {/* Messages */}
              <Link
                href="/requests"
                className="lv-shortcut-btn flex flex-col lg:flex-row lg:items-center lg:gap-2.5 items-center justify-center gap-1 relative flex-1 py-1 lg:p-2.5 lg:rounded-xl lg:bg-slate-50 hover:lg:bg-indigo-50 transition-all"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <MessageCircle
                    className="w-5 h-5 text-[var(--lv-navy)]"
                    strokeWidth={1.8}
                  />
                  {badges && badges.messagesCount > 0 && (
                    <span className="absolute top-1 right-1/2 translate-x-4 lg:right-2 lg:top-2 lg:translate-x-0 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                      {badges.messagesCount}
                    </span>
                  )}
                </div>
                <div className="text-center lg:text-left">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-700 block">
                    Messages
                  </span>
                  <span className="text-[10px] text-slate-400 hidden lg:block">
                    Direct Chat
                  </span>
                </div>
              </Link>

              {/* Security */}
              <Link
                href="/access"
                className="lv-shortcut-btn flex flex-col lg:flex-row lg:items-center lg:gap-2.5 items-center justify-center gap-1 flex-1 py-1 lg:p-2.5 lg:rounded-xl lg:bg-slate-50 hover:lg:bg-indigo-50 transition-all"
              >
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <ShieldCheck
                    className="w-5 h-5 text-[var(--lv-navy)]"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="text-center lg:text-left">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-700 block">
                    Security
                  </span>
                  <span className="text-[10px] text-slate-400 hidden lg:block">
                    Emergency Switch
                  </span>
                </div>
              </Link>

              {/* Add Button */}
              <div
                className="relative flex-1 flex justify-center lg:col-span-2"
                ref={addMenuRef}
              >
                <button
                  onClick={() => setAddMenuOpen(!addMenuOpen)}
                  className="lv-shortcut-btn flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-2 items-center justify-center gap-1 w-full py-1 lg:py-2.5 lg:rounded-xl lg:bg-indigo-50 hover:lg:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 lg:w-5 lg:h-5 flex items-center justify-center shrink-0">
                    <Plus
                      className="w-5 h-5 text-[var(--lv-navy)] lg:text-indigo-700"
                      strokeWidth={1.8}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-700 lg:text-indigo-700">
                    Add Record
                  </span>
                </button>

                {/* Dropdown Menu */}
                {addMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Quick Add Record
                      </p>
                    </div>
                    {ADD_MENU_ITEMS.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setAddMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-indigo-50 transition-colors text-sm text-slate-700 font-medium"
                      >
                        <item.icon
                          className="w-4 h-4 text-indigo-500"
                          strokeWidth={1.8}
                        />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop-Only Trusted People Widget (In Right Column) */}
          <div className="hidden lg:block lv-card p-4">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Trusted People
                </h4>
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded-full">
                  {trustedPeople.length}
                </span>
              </div>
              <Link
                href="/people"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View All &rarr;
              </Link>
            </div>

            {trustedPeople.length === 0 ? (
              <div className="text-center py-6 px-3 bg-slate-50 rounded-xl">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  No contacts recorded yet
                </p>
                <Link
                  href="/people"
                  className="inline-block mt-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  + Add first trusted person
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {trustedPeople.slice(0, 5).map((person) => (
                  <Link
                    key={person._id}
                    href={`/people/${person._id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <PersonAvatar
                      name={person.name}
                      avatarUrl={person.avatarUrl}
                      profilePhoto={person.profilePhoto}
                      size={40}
                      className="group-hover:ring-2 group-hover:ring-indigo-300 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--lv-navy)] truncate group-hover:text-indigo-600 transition-colors">
                        {person.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {person.relation || person.role || "Member"}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── PRIMARY WORKSPACES SECTION (Order 2 on mobile/tablet, Left Column on Desktop) ─── */}
        <div className="col-span-12 lg:col-span-8 lg:order-1 flex flex-col gap-4 sm:gap-5">
          {/* Trusted People Carousel (Mobile & Tablet: < lg) */}
          {trustedPeople.length > 0 && (
            <div className="order-1 lg:hidden mb-1">
              <div className="flex items-center justify-between px-1 mb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--lv-navy)]">
                    Trusted People
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold">
                    {trustedPeople.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => scrollTrusted("left")}
                    className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollTrusted("right")}
                    className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <Link
                    href="/people"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 ml-2"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <div
                ref={trustedScrollRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {trustedPeople.map((person) => (
                  <Link
                    key={person._id}
                    href={`/people/${person._id}`}
                    className="flex flex-col items-center gap-1.5 shrink-0 group p-1"
                  >
                    <PersonAvatar
                      name={person.name}
                      avatarUrl={person.avatarUrl}
                      profilePhoto={person.profilePhoto}
                      size={52}
                      className="group-hover:ring-2 group-hover:ring-indigo-300 group-hover:ring-offset-2 transition-all group-hover:scale-105"
                    />
                    <div className="text-center max-w-[70px]">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-700 block truncate group-hover:text-indigo-600 transition-colors">
                        {person.name.split(" ")[0]}
                      </span>
                      {person.relation && (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {person.relation}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* "My Spaces" Multi-Column Matrix */}
          <div className="order-2 lg:order-2">
            <div className="flex items-center justify-between px-1 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--lv-navy)]">
                  My Spaces
                </h3>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Integrated management for continuous family, business, and
                  confidential records
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                8 Modules Active
              </span>
            </div>

            {/* Grid: 2-col on mobile, 3-col on tablet, 2-col on desktop within the 8-col area */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2.5 sm:gap-3.5 lg:gap-4">
              {spaces.map((space) => {
                const Icon = space.icon;
                return (
                  <Link
                    key={space.title}
                    href={space.href}
                    className="lv-card p-3.5 sm:p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group border border-transparent hover:border-indigo-100 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${space.iconBg} transition-transform group-hover:scale-105`}
                        >
                          <Icon
                            className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${space.color}`}
                            strokeWidth={2}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-[var(--lv-navy)] truncate group-hover:text-indigo-600 transition-colors">
                            {space.title}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                            {space.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1 hidden sm:block" />
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 text-[10px] sm:text-[11px] truncate">
                        {space.metric}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-600 group-hover:underline shrink-0">
                        Access &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Action Reminder Banner (e.g. Choose a Guardian) */}
          {currentReminder && (
            <div className="order-3 lg:order-1 lv-card p-4 sm:p-5 bg-gradient-to-r from-white via-indigo-50/20 to-purple-50/20 border border-indigo-100 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                    <ShieldCheck className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-[var(--lv-navy)] truncate">
                        {currentReminder.title}
                      </h4>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                        {currentReminder.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {currentReminder.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end ml-auto sm:ml-0">
                  {activeReminders.length > 1 && (
                    <div className="flex items-center gap-1 mr-1 bg-slate-100/80 px-2 py-1 rounded-lg">
                      <span className="text-[11px] text-slate-500 font-semibold mr-0.5">
                        {(currentReminderIdx % activeReminders.length) + 1}/
                        {activeReminders.length}
                      </span>
                      <button
                        onClick={handlePrevReminder}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 transition-colors"
                        aria-label="Previous alert"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleNextReminder}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-slate-600 transition-colors"
                        aria-label="Next alert"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleDismissReminder(currentReminder.id)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <Pause className="w-4 h-4" />
                  </button>

                  <Link
                    href={currentReminder.link}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>Review Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Global Search Modal ─── */}
      <LifeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
