/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  KeyRound,
  FileText,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  HeartHandshake,
  ShieldAlert,
  Contact,
  FolderLock,
  History,
  Settings,
  Coins,
  Heart,
  User,
  PhoneCall,
  Gift,
  Shield,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Percent,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LifeDashboardStats } from "@/types";
import { canAccessModule, UserModuleAccess } from "@/lib/life/module-access";
import { getGesnReports } from "@/lib/actions/gesnReports.actions";

interface LifeDashboardClientProps {
  stats: LifeDashboardStats;
  userAccess?: UserModuleAccess;
}

export function LifeDashboardClient({ stats, userAccess }: LifeDashboardClientProps) {
  const router = useRouter();
  const isSuperUser = userAccess ? userAccess.isOwner || userAccess.isAdmin : true;
  const ownerPersonId = stats.ownerProfile?.personId || userAccess?.personId;
  const ownerProfileUrl = ownerPersonId ? `/people/${ownerPersonId}` : "/people";
  const ownerName = stats.ownerProfile?.name || userAccess?.name || "Nazmul Islam";
  const ownerAvatar = stats.ownerProfile?.avatarUrl || userAccess?.avatarUrl;
  const estateCompletion = Math.round(
    Math.min(
      100,
      ((stats.beneficiariesCount || 0) > 0 ? 35 : 0) +
      (stats.assetsTotalValue > 0 ? 35 : 0) +
      ((stats.legacyCount || 0) > 0 ? 30 : 0) ||
      60
    )
  );

  const permissions = userAccess?.permissions || {
    canViewPersonal: true,
    canViewBusiness: true,
    canViewFinancial: true,
    canViewSensitive: true,
    canRevealVault: true,
    canManageAccess: true,
    canAccessEmergency: true,
  };

  // Module access checks
  const hasFinanceAccess = canAccessModule("/finance", permissions, isSuperUser);
  const hasMoneyAccess = canAccessModule("/money", permissions, isSuperUser);
  const hasPeopleAccess = canAccessModule("/people", permissions, isSuperUser);
  const hasVaultAccess = canAccessModule("/vault", permissions, isSuperUser);
  const hasBusinessAccess = canAccessModule("/business", permissions, isSuperUser);
  const hasAssetsAccess = canAccessModule("/assets", permissions, isSuperUser);
  const hasGuardiansAccess = canAccessModule("/guardians", permissions, isSuperUser);
  const hasInstructionsAccess = canAccessModule("/instructions", permissions, isSuperUser);
  const hasActivityAccess = canAccessModule("/activity", permissions, isSuperUser);
  const hasDocumentsAccess = canAccessModule("/documents", permissions, isSuperUser);
  const hasLegacyAccess = canAccessModule("/legacy", permissions, isSuperUser);
  const hasBeneficiariesAccess = canAccessModule("/beneficiaries", permissions, isSuperUser);
  const hasContactsAccess = canAccessModule("/contacts", permissions, isSuperUser);
  const hasInfoAccess = canAccessModule("/information", permissions, isSuperUser);

  const hasAccessControlAccess = canAccessModule("/access", permissions, isSuperUser);
  const hasSettingsAccess = canAccessModule("/settings", permissions, isSuperUser);

  // Financial Overview Interactive State
  const [financeTab, setFinanceTab] = useState<"business" | "personal" | "combined">("business");
  const [gesnPeriod, setGesnPeriod] = useState<string>("thisMonth");
  const [gesnData, setGesnData] = useState(stats.gesnSummary || null);
  const [isPendingGesn, startGesnTransition] = useTransition();

  const handlePeriodChange = (period: string) => {
    setGesnPeriod(period);
    startGesnTransition(async () => {
      try {
        const res = await getGesnReports({ period });
        if (res.success && res.data) {
          setGesnData({
            totalIncome: res.data.summary.totalIncome || 0,
            totalExpenses: res.data.summary.totalExpenses || 0,
            netProfit: res.data.summary.netProfit || 0,
            profitMarginPercent: res.data.summary.profitMarginPercent || 0,
            incomeCount: res.data.summary.incomeCount || 0,
            expenseCount: res.data.summary.expenseCount || 0,
            topCategories: (res.data.categories || [])
              .filter((c: any) => (c.total || 0) > 0)
              .sort((a: any, b: any) => (b.total || 0) - (a.total || 0))
              .slice(0, 6)
              .map((c: any) => ({
                name: c.category?.name || "Uncategorized",
                type: c.category?.type || "Expense",
                total: c.total || 0,
                count: c.count || 0,
                color: c.category?.color || (c.category?.type === "Income" ? "#10b981" : "#ef4444"),
              })),
          });
        }
      } catch {
        // preserve current state on transient failure
      }
    });
  };

  // Filter urgent items by module permissions
  const filteredUrgentItems = stats.urgentItems.filter((item) =>
    canAccessModule(item.link, permissions, isSuperUser)
  );

  // Define all possible directory cards with permissions
  const allDirectoryCards = [
    {
      title: "Secure Vault",
      href: "/vault",
      desc: "Web credentials, server keys & master PINs",
      icon: KeyRound,
      badge: "AES-256",
      badgeValue: "AES-256",
      color: "amber",
      hasAccess: hasVaultAccess,
    },
    {
      title: "Business Continuity",
      href: "/business",
      desc: "\"If I Am Not Available\" checklist & equity",
      icon: Briefcase,
      badge: `${stats.businessCount} plans`,
      badgeValue: stats.businessCount,
      color: "cyan",
      hasAccess: hasBusinessAccess,
    },
    {
      title: "Financial Care",
      href: "/finance",
      desc: "Financial care provided, received, installments & tracking",
      icon: Wallet,
      badge: `${stats.upcomingPaymentsCount} active`,
      badgeValue: stats.upcomingPaymentsCount,
      color: "emerald",
      hasAccess: hasFinanceAccess || hasMoneyAccess,
    },
    {
      title: "Assets & Properties",
      href: "/assets",
      desc: "Bank balances, properties & valuable holdings",
      icon: Layers,
      badge: `৳${stats.assetsTotalValue.toLocaleString()}`,
      badgeValue: `৳${stats.assetsTotalValue.toLocaleString()}`,
      color: "indigo",
      hasAccess: hasAssetsAccess,
    },
    {
      title: "Instructions & Responsibilities",
      href: "/instructions",
      desc: "Assigned tasks & critical handovers",
      icon: FileText,
      badge: `${stats.pendingResponsibilitiesCount} tasks`,
      badgeValue: stats.pendingResponsibilitiesCount,
      color: "sky",
      hasAccess: hasInstructionsAccess,
    },
    {
      title: "Emergency & Guardians",
      href: "/guardians",
      desc: "Multi-party consensus & emergency protocol",
      icon: ShieldAlert,
      badge: `${stats.trustedGuardiansCount} guardians`,
      badgeValue: stats.trustedGuardiansCount,
      color: "rose",
      hasAccess: hasGuardiansAccess,
    },
    {
      title: "Documents & Files",
      href: "/documents",
      desc: "Passports, deeds, certificates & contracts",
      icon: FolderLock,
      badge: "Encrypted",
      badgeValue: "Encrypted",
      color: "purple",
      hasAccess: hasDocumentsAccess,
    },
    {
      title: "Important Information",
      href: "/information",
      desc: "Critical bank details, server info & guidelines",
      icon: FileText,
      badge: "Encrypted",
      badgeValue: "Encrypted",
      color: "sky",
      hasAccess: hasInfoAccess,
    },
    {
      title: "Beneficiaries",
      href: "/beneficiaries",
      desc: "Asset allocations & nominee designations",
      icon: HeartHandshake,
      badge: "Designated",
      badgeValue: "Designated",
      color: "rose",
      hasAccess: hasBeneficiariesAccess,
    },
    {
      title: "Emergency Contacts",
      href: "/contacts",
      desc: "Lawyers, doctors, accountants & trusted people",
      icon: Contact,
      badge: "Emergency",
      badgeValue: "Emergency",
      color: "amber",
      hasAccess: hasContactsAccess,
    },
    {
      title: "Legacy Messages",
      href: "/legacy",
      desc: "Personal letters, voice notes & posthumous release",
      icon: HeartHandshake,
      badge: "Sealed",
      badgeValue: "Sealed",
      color: "purple",
      hasAccess: hasLegacyAccess,
    },
    {
      title: "Access & Emergency Control",
      href: "/access",
      desc: "Emergency trigger, user roles & module permissions",
      icon: ShieldAlert,
      badge: "Security",
      badgeValue: "Security",
      color: "red",
      hasAccess: hasAccessControlAccess,
    },
    {
      title: "Activity & Audit Log",
      href: "/activity",
      desc: "Immutable logs of all sensitive actions & changes",
      icon: History,
      badge: "Audit",
      badgeValue: "Audit",
      color: "slate",
      hasAccess: hasActivityAccess,
    },
    {
      title: "Security & Settings",
      href: "/settings",
      desc: "Master PIN, database backup, restore & preferences",
      icon: Settings,
      badge: "System",
      badgeValue: "System",
      color: "teal",
      hasAccess: hasSettingsAccess,
    },
  ];

  // Filter cards to only those the user can access
  const visibleCards = allDirectoryCards.filter((card) => card.hasAccess);

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. Life Command Center Title + Description                   */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-xs ring-1 ring-emerald-500/10 dark:bg-slate-950/70 sm:p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500" />
        <div className="relative z-10 space-y-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
              <Sparkles
                className="w-3.5 h-3.5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>
                {isSuperUser
                  ? "Personal Legacy & Continuity Active"
                  : "Authorized Access Portal"}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {isSuperUser ? "Life Command Center" : "Your Life Vault Portal"}
              </h1>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5 translate-y-[-1px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Vault Armed &amp; Protected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isSuperUser
                ? "Wealth, continuity, emergency & legacy — all in one secure place."
                : "Your assigned modules, instructions & continuity protocols."}
            </p>
          </div>

          {/* 2. My Life Profile — Primary Full-Width Card                  */}
          {/* ============================================================ */}
          <section aria-label="My Life Profile Card">
            <div
              onClick={() => router.push(ownerProfileUrl)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(ownerProfileUrl);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Open My Life Profile"
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer ring-1 ring-border/50"
            >
              {/* Top subtle accent gradient */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-80" />

              {/* Top Header Row (Matching Reference UI Style) */}
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {/* Mint Squircle Initial Avatar */}
                  {ownerAvatar ? (
                    <img
                      src={ownerAvatar}
                      alt={ownerName}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-emerald-300/60 dark:border-emerald-800/60 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-800 dark:text-emerald-200 font-black text-2xl sm:text-3xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      {ownerName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        My Life Profile
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-black text-foreground tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {ownerName}
                    </h2>
                    <p className="text-xs sm:text-sm italic text-muted-foreground font-medium truncate mt-0.5">
                      Personal · Medical · Life History · Private Records
                    </p>
                  </div>
                </div>

                {/* Badges on the right matching reference UI */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {isSuperUser && (
                    <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold tracking-wider uppercase">
                      <Shield className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                      <span>Super Admin</span>
                    </div>
                  )}
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60">
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* Concise Summary Grid */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                {/* 1. Profile Completion */}
                <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Profile Completion
                  </span>
                  <div className="my-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground font-mono mb-1">
                      <span>{stats.ownerProfile?.profileCompletion || 85}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${stats.ownerProfile?.profileCompletion || 85}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                    Comprehensive
                  </span>
                </div>

                {/* 2. Medical Information Status */}
                <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Medical Status
                  </span>
                  <div className="my-1.5 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground truncate">
                      {stats.ownerProfile?.medicalInfoStatus || "Configured & Active"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium truncate">
                    Emergency Ready
                  </span>
                </div>

                {/* 3. Documents Added */}
                <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Documents Added
                  </span>
                  <div className="my-1.5 flex items-center gap-1.5">
                    <FolderLock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground font-mono">
                      {stats.ownerProfile?.documentsAddedCount || stats.documentsCount || 0} Files
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium truncate">
                    Encrypted Vault
                  </span>
                </div>

                {/* 4. Private Records */}
                <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Private Records
                  </span>
                  <div className="my-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground font-mono">
                      {stats.ownerProfile?.privateRecordsCount || stats.infoCount || 0} Records
                    </span>
                  </div>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium truncate">
                    Confidential Notes
                  </span>
                </div>

                {/* 5. Emergency Information Status */}
                <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Emergency Info
                  </span>
                  <div className="my-1.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground truncate">
                      {stats.ownerProfile?.emergencyInfoStatus || "Protocols Ready"}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate">
                    Active Guardians
                  </span>
                </div>

                {/* 6. Last Updated */}
                <div className="p-3 rounded-2xl bg-secondary/60 border border-border/70 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Last Updated
                  </span>
                  <div className="my-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-foreground truncate">
                      {new Date(stats.ownerProfile?.lastUpdated || Date.now()).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium truncate">
                    Synchronized
                  </span>
                </div>
              </div>

              {/* Bottom Action Row (Matching Reference UI buttons) */}
              <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="h-8.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-sm"
                  >
                    <Link
                      href={ownerProfileUrl}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="View My Profile"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>My Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8.5 px-3 py-1 rounded-xl border-border bg-background hover:bg-secondary text-foreground text-xs font-semibold gap-1.5"
                  >
                    <Link
                      href="/information"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Add Information"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Add Information</span>
                    </Link>
                  </Button>
                </div>

                <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline-flex items-center gap-1">
                  Click card to open full profile <ArrowRight className="w-3 h-3 text-emerald-500" />
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Six Quick Action Buttons (2 columns × 3 rows)              */}
      {/* ============================================================ */}
      <section aria-label="Major Life Management Modules" className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Core Life Management</span>
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground">
            6 Primary Modules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 1. Financial Care */}
          <Link
            href="/finance"
            className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border hover:border-emerald-500/50 hover:bg-accent/40 transition-all group shadow-xs flex items-center justify-between min-h-[82px]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5 shrink-0" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  Financial Care
                </h3>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                  {stats.upcomingPaymentsCount || 0} Active · {stats.overduePaymentsCount || 0} Due
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
          </Link>

          {/* 2. Estate & Wasiyyah */}
          <Link
            href="/beneficiaries"
            className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:bg-accent/40 transition-all group shadow-xs flex items-center justify-between min-h-[82px]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5 shrink-0" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  Estate & Wasiyyah
                </h3>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5 truncate">
                  {estateCompletion}% Complete
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
          </Link>

          {/* 3. Roles & Responsibilities */}
          <Link
            href="/instructions"
            className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border hover:border-sky-500/50 hover:bg-accent/40 transition-all group shadow-xs flex items-center justify-between min-h-[82px]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5 shrink-0" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                  Roles & Responsibilities
                </h3>
                <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5 truncate">
                  {stats.pendingResponsibilitiesCount || stats.instructionsCount || 0} Assigned
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
          </Link>

          {/* 4. Emergency Contacts & Help */}
          <Link
            href="/contacts"
            className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border hover:border-amber-500/50 hover:bg-accent/40 transition-all group shadow-xs flex items-center justify-between min-h-[82px]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5 shrink-0" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                  Emergency Contacts & Help
                </h3>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                  {stats.contactsCount || stats.trustedGuardiansCount || 0} Verified
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
          </Link>

          {/* 5. Security & Access */}
          <Link
            href="/access"
            className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border hover:border-rose-500/50 hover:bg-accent/40 transition-all group shadow-xs flex items-center justify-between min-h-[82px]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5 shrink-0" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                  Security & Access
                </h3>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                  {stats.emergencyModeStatus === "Active"
                    ? "1 Alert"
                    : (stats.pendingAccessRequestsCount || 0) > 0
                      ? `${stats.pendingAccessRequestsCount} Requests`
                      : "Protected"}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
          </Link>

          {/* 6. Instructions & Messages */}
          <Link
            href="/legacy"
            className="p-4 sm:p-4.5 rounded-2xl bg-card border border-border hover:border-indigo-500/50 hover:bg-accent/40 transition-all group shadow-xs flex items-center justify-between min-h-[82px]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 shrink-0" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  Instructions & Messages
                </h3>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                  {(stats.instructionsCount || 0) + (stats.legacyCount || 0) || stats.infoCount || 0} Saved
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
          </Link>
        </div>
      </section>

      {/* §24 Continuity & Safety State */}
      <section className="space-y-2.5" aria-label="Continuity & Safety Readiness">
        {stats.activeRecoveryPending && (
          <div className="p-4 rounded-3xl bg-red-500/15 border-2 border-red-500/60 shadow-lg shadow-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-600 text-white">
                    {stats.isVaultLocked ? "Vault Locked (48h)" : "Emergency 48h Countdown"}
                  </span>
                  <span className="text-xs font-bold text-red-700 dark:text-red-300">
                    Active Recovery Protocol
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  An emergency continuity event is currently in its 48-hour cancellation period. Super Admins can manage or cancel with Master PIN.
                </p>
              </div>
            </div>
            <Link
              href="/access"
              className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white gap-1.5 shadow-sm shrink-0"
            >
              <span>Manage in Access Control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Continuity & Safety State</span>
          </h2>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${stats.activeRecoveryPending
            ? "text-red-600 bg-red-500/10 border-red-500/20 animate-pulse"
            : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
            }`}>
            {stats.activeRecoveryPending ? "Recovery Active (48h)" : "System Operational"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Owner Safety Status */}
          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Owner Safety</span>
            <div className="my-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${stats.ownerSafetyStatus === "emergency" ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                  }`}
              />
              <span className="text-sm font-extrabold capitalize text-foreground">
                {stats.ownerSafetyStatus || "Safe"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Check-in Active</span>
          </div>

          {/* Emergency Mode Status */}
          {hasGuardiansAccess ? (
            <Link
              href="/guardians"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-red-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">Emergency Mode</span>
              <div className="my-1">
                <span
                  className={`text-sm font-extrabold ${stats.emergencyModeStatus === "Active" ? "text-red-600" : "text-foreground"
                    }`}
                >
                  {stats.emergencyModeStatus || "Normal"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Protocol Ready</span>
            </Link>
          ) : (
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Emergency Mode</span>
              <div className="my-1">
                <span className="text-sm font-extrabold text-foreground">
                  {stats.emergencyModeStatus || "Normal"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Protocol Ready</span>
            </div>
          )}

          {/* Trusted Guardians - Only if has Guardians access */}
          {hasGuardiansAccess && (
            <Link
              href="/guardians"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">Guardians</span>
              <div className="my-1">
                <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {stats.trustedGuardiansCount || 0}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Multi-Party Trust</span>
            </Link>
          )}

          {/* Pending Responsibilities - Only if has Instructions access */}
          {hasInstructionsAccess && (
            <Link
              href="/instructions"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">Responsibilities</span>
              <div className="my-1">
                <span className="text-lg font-extrabold text-foreground font-mono">
                  {stats.pendingResponsibilitiesCount || 0}
                </span>
              </div>
              <span className="text-[10px] text-amber-600 font-medium">In Progress</span>
            </Link>
          )}

          {/* Business Continuity Readiness - Only if has Business access */}
          {hasBusinessAccess && (
            <Link
              href="/business"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">Continuity Ready</span>
              <div className="my-1">
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {stats.businessContinuityReadiness}%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">If Not Available</span>
            </Link>
          )}

          {/* Upcoming / Overdue Payments - Only if has Finance access */}
          {hasFinanceAccess && (
            <Link
              href="/finance"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">Financial Care</span>
              <div className="my-1">
                <span className="text-sm font-extrabold text-foreground">
                  {stats.upcomingPaymentsCount || 0} Active
                </span>
              </div>
              <span
                className={`text-[10px] font-medium ${(stats.overduePaymentsCount || 0) > 0 ? "text-red-500" : "text-muted-foreground"
                  }`}
              >
                {stats.overduePaymentsCount || 0} Overdue
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Requires Attention - Filtered by module permissions */}
      {filteredUrgentItems.length > 0 && (
        <section className="space-y-2.5" aria-label="Items requiring attention">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle
                className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Requires Attention</span>
            </h2>
            <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
              {filteredUrgentItems.length} Urgent
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUrgentItems.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className={`p-3.5 rounded-2xl border transition-all hover:scale-[1.01] flex items-center justify-between group min-w-0 ${item.severity === "high"
                  ? "bg-red-500/10 border-red-500/25 hover:border-red-500/50"
                  : "bg-amber-500/10 border-amber-500/25 hover:border-amber-500/50"
                  }`}
                aria-label={`Urgent: ${item.title} (${item.severity} priority)`}
              >
                <div className="min-w-0 pr-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 inline-block ${item.severity === "high"
                      ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                      }`}
                  >
                    {item.category}
                  </span>
                  <h3 className="text-xs font-semibold text-foreground mt-1 truncate group-hover:text-foreground">
                    {item.title}
                  </h3>
                  {item.dueText && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock
                        className="w-3 h-3 text-muted-foreground shrink-0"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      {item.dueText}
                    </p>
                  )}
                </div>
                <ArrowRight
                  className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Financial Care & Cash Flow Command Overview - Only shown to users with Financial or Super Admin access */}
      {(hasMoneyAccess || hasFinanceAccess) && (
        <section className="space-y-4" aria-label="Financial and cash flow overview">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
                <Wallet
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="truncate">Financial & Cash Flow Overview</span>
              </h2>

              {/* Real-time sync badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>ACC.GESN.NET Live</span>
              </div>
            </div>

            {/* View Filter Segmented Controls & Link */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="inline-flex p-1 rounded-xl bg-secondary/80 border border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFinanceTab("business")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    financeTab === "business"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Accounting & Cash Flow
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceTab("personal")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    financeTab === "personal"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Personal Care
                </button>
                <button
                  type="button"
                  onClick={() => setFinanceTab("combined")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    financeTab === "combined"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
              </div>

              <Link
                href="/finance"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200 flex items-center gap-1 shrink-0 whitespace-nowrap pl-1"
              >
                Detailed Ledger{" "}
                <ArrowRight
                  className="w-3.5 h-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* 1. Real-time Accounting & Cash Flow Section (ACC.GESN.NET) */}
          {(financeTab === "business" || financeTab === "combined") && (
            <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    Business Accounting & Performance
                  </span>
                  {isPendingGesn && (
                    <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin shrink-0" />
                  )}
                </div>

                {/* Period Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { label: "This Month", value: "thisMonth" },
                    { label: "Today", value: "today" },
                    { label: "Last 7 Days", value: "last7days" },
                    { label: "Last 30 Days", value: "last30days" },
                    { label: "This Year", value: "thisYear" },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handlePeriodChange(p.value)}
                      disabled={isPendingGesn}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                        gesnPeriod === p.value
                          ? "bg-emerald-600 text-white font-semibold shadow-xs"
                          : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accounting KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Revenue / Income */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Total Revenue
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      ৳{(gesnData?.totalIncome || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    {gesnData?.incomeCount || 0} Credited transactions
                  </span>
                </div>

                {/* Total Operating Expenses */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-rose-500/20 hover:border-rose-500/40 transition-all flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Operating Expenses
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <TrendingDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                      ৳{(gesnData?.totalExpenses || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    {gesnData?.expenseCount || 0} Debited entries
                  </span>
                </div>

                {/* Net Cash Flow / Profit */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border hover:border-border/80 transition-all flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Net Cash Flow
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="my-1.5">
                    <span
                      className={`text-xl sm:text-2xl font-extrabold font-mono ${
                        (gesnData?.netProfit || 0) >= 0
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {(gesnData?.netProfit || 0) >= 0 ? "+" : ""}
                      ৳{(gesnData?.netProfit || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    {(gesnData?.netProfit || 0) >= 0 ? "Operating Surplus" : "Operating Deficit"}
                  </span>
                </div>

                {/* Profit Margin & Efficiency */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border hover:border-border/80 transition-all flex flex-col justify-between min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Profit Margin
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Percent className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
                      {(gesnData?.profitMarginPercent || 0).toFixed(1)}%
                    </span>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, gesnData?.profitMarginPercent || 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium truncate">
                    Margin on total revenue
                  </span>
                </div>
              </div>

              {/* Top Categories Distribution Preview */}
              {gesnData?.topCategories && gesnData.topCategories.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Top Expense & Revenue Categories
                    </span>
                    <Link
                      href="/finance"
                      className="text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      View All in Ledger
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {gesnData.topCategories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/80 shrink-0 text-xs shadow-2xs"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#10b981" }}
                        />
                        <span className="font-semibold text-foreground truncate max-w-[120px]">
                          {cat.name}
                        </span>
                        <span className="font-bold text-muted-foreground font-mono text-[11px]">
                          ৳{cat.total.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({cat.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Personal Financial Care & Support Section (LIFE Vault) */}
          {(financeTab === "personal" || financeTab === "combined") && (
            <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    Personal Financial Care & Mutual Assistance
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {stats.upcomingPaymentsCount || 0} Active · {stats.overduePaymentsCount || 0} Overdue
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Care Provided */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border shadow-2xs flex flex-col justify-between min-h-[104px]">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Financial Care Provided
                  </span>
                  <div className="my-1">
                    <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono">
                      ৳{stats.moneyGivenTotal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
                    Remaining: ৳{stats.moneyGivenRemaining.toLocaleString()}
                  </span>
                </div>

                {/* 2. Receivable Due */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 shadow-2xs flex flex-col justify-between min-h-[104px]">
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <ArrowDownLeft
                      className="w-3 h-3 text-emerald-600 dark:text-emerald-300 shrink-0"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    Receivable
                  </span>
                  <div className="my-1">
                    <span className="text-lg sm:text-xl font-extrabold text-emerald-800 dark:text-emerald-200 font-mono break-all">
                      ৳{stats.receivablesTotal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-medium truncate">
                    Due to me
                  </span>
                </div>

                {/* 3. Repaid / Returned so far */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border shadow-2xs flex flex-col justify-between min-h-[104px]">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                    Recovered / Repaid
                  </span>
                  <div className="my-1">
                    <span className="text-lg sm:text-xl font-extrabold text-teal-700 dark:text-teal-300 font-mono">
                      ৳{(stats.supportRepaidTotal || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium truncate">
                    Collected back
                  </span>
                </div>

                {/* 4. Care Received */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border shadow-2xs flex flex-col justify-between min-h-[104px]">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Care Received
                  </span>
                  <div className="my-1">
                    <span className="text-lg sm:text-xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                      ৳{stats.moneyTakenTotal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium truncate">
                    Outstanding: ৳{stats.moneyTakenRemaining.toLocaleString()}
                  </span>
                </div>

                {/* 5. Payable */}
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 shadow-2xs flex flex-col justify-between min-h-[104px]">
                  <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <ArrowUpRight
                      className="w-3 h-3 text-rose-600 dark:text-rose-300 shrink-0"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    Payable
                  </span>
                  <div className="my-1">
                    <span className="text-lg sm:text-xl font-extrabold text-rose-800 dark:text-rose-200 font-mono break-all">
                      ৳{stats.payablesTotal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-rose-700/80 dark:text-rose-300/80 font-medium truncate">
                    I need to return
                  </span>
                </div>

                {/* 6. Active Investments */}
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border shadow-2xs flex flex-col justify-between min-h-[104px]">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Investment Made
                  </span>
                  <div className="my-1">
                    <span className="text-lg sm:text-xl font-extrabold text-cyan-700 dark:text-cyan-300 font-mono">
                      ৳{stats.investedTotal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium truncate">
                    Active ventures
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Life Directory / Assigned Modules Section */}
      <section className="space-y-3" aria-label="Life modules directory">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          {isSuperUser ? "Life Core Directory" : "Your Permitted Modules"}
        </h2>

        {visibleCards.length === 0 ? (
          <div className="p-8 rounded-3xl bg-card border border-border text-center">
            <p className="text-sm font-semibold text-foreground">
              আপনার জন্য কোনো মডিউল নির্ধারিত হয়নি।
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please contact the Owner to assign permissions for your account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-emerald-500/50 hover:bg-accent transition-all group min-h-[120px] flex flex-col"
                  aria-label={`${card.title} — ${card.badge}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                      <Icon
                        className="w-5 h-5 shrink-0"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono shrink-0 truncate max-w-[60%]">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                    {card.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Activity & Audit - Only shown if user has activity access */}
      {hasActivityAccess && stats.recentActivities.length > 0 && (
        <section
          className="space-y-3"
          aria-label="Recent activity and audit log"
        >
          <div className="flex items-center justify-between px-1 gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
              <Clock
                className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="truncate">Recent Activity & Audit</span>
            </h2>
            <Link
              href="/activity"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Full Log{" "}
              <ArrowRight
                className="w-3 h-3 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {stats.recentActivities.map((act) => (
              <div
                key={act._id}
                className="p-3 sm:p-4 flex items-center justify-between text-xs gap-2"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-emerald-700 dark:text-emerald-300 shrink-0">
                    <ShieldCheck
                      className="w-4 h-4 shrink-0"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium truncate">
                      {act.details}
                    </p>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      By {act.actorEmail} •{" "}
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 px-2 py-0.5 rounded bg-secondary border border-border">
                  {act.action.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
