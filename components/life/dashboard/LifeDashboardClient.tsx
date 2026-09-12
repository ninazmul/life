/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LifeDashboardStats } from "@/types";
import { canAccessModule, UserModuleAccess } from "@/lib/life/module-access";

interface LifeDashboardClientProps {
  stats: LifeDashboardStats;
  userAccess?: UserModuleAccess;
}

export function LifeDashboardClient({ stats, userAccess }: LifeDashboardClientProps) {
  const isSuperUser = userAccess ? userAccess.isOwner || userAccess.isAdmin : true;
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

  // Filter urgent items by module permissions
  const filteredUrgentItems = stats.urgentItems.filter((item) =>
    canAccessModule(item.link, permissions, isSuperUser)
  );

  // Define all possible directory cards with permissions
  // Define all possible directory cards with permissions
  const allDirectoryCards = [
    {
      title: "People & Access",
      href: "/people",
      desc: "Family, trusted contacts, roles & access permissions",
      icon: Users,
      badge: `${stats.peopleCount} entries`,
      badgeValue: stats.peopleCount,
      color: "emerald",
      hasAccess: hasPeopleAccess,
    },
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
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm ring-1 ring-emerald-500/10 dark:bg-slate-950/70 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {isSuperUser ? "Life Command Center" : "Your Life Vault Portal"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mt-1 leading-relaxed">
              {isSuperUser
                ? "Your private wealth, business continuity, emergency instructions, and legacy messages organized securely in one place."
                : "Secure access to your assigned modules, instructions, and business continuity protocols."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {hasFinanceAccess && (
              <Button
                asChild
                size="sm"
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <Link href="/finance" aria-label="Financial Care">
                  <Plus
                    className="w-3.5 h-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Financial Care
                </Link>
              </Button>
            )}
            {hasPeopleAccess && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl border-border bg-background hover:bg-accent text-foreground text-xs font-medium gap-1.5 shadow-sm"
              >
                <Link href="/people" aria-label="People Directory">
                  <Users
                    className="w-3.5 h-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  People Directory
                </Link>
              </Button>
            )}
            {!hasFinanceAccess && !hasPeopleAccess && hasBusinessAccess && (
              <Button
                asChild
                size="sm"
                className="h-9 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs gap-1.5 shadow-md shadow-cyan-950/40"
              >
                <Link href="/business" aria-label="Business Continuity">
                  <Briefcase
                    className="w-3.5 h-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Business Continuity
                </Link>
              </Button>
            )}
            {!hasFinanceAccess && !hasPeopleAccess && !hasBusinessAccess && hasInstructionsAccess && (
              <Button
                asChild
                size="sm"
                className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs gap-1.5 shadow-md shadow-sky-950/40"
              >
                <Link href="/instructions" aria-label="My Instructions">
                  <FileText
                    className="w-3.5 h-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  My Instructions
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* §24 Continuity & Safety State */}
      <section className="space-y-2.5" aria-label="Continuity & Safety Readiness">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Continuity & Safety State</span>
          </h2>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            System Operational
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Owner Safety Status */}
          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Owner Safety</span>
            <div className="my-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  stats.ownerSafetyStatus === "emergency" ? "bg-red-500 animate-pulse" : "bg-emerald-500"
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
                  className={`text-sm font-extrabold ${
                    stats.emergencyModeStatus === "Active" ? "text-red-600" : "text-foreground"
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
                className={`text-[10px] font-medium ${
                  (stats.overduePaymentsCount || 0) > 0 ? "text-red-500" : "text-muted-foreground"
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
                className={`p-3.5 rounded-2xl border transition-all hover:scale-[1.01] flex items-center justify-between group min-w-0 ${
                  item.severity === "high"
                    ? "bg-red-500/10 border-red-500/25 hover:border-red-500/50"
                    : "bg-amber-500/10 border-amber-500/25 hover:border-amber-500/50"
                }`}
                aria-label={`Urgent: ${item.title} (${item.severity} priority)`}
              >
                <div className="min-w-0 pr-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 inline-block ${
                      item.severity === "high"
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

      {/* Financial Care Overview - Only shown to users with Financial or Super Admin access */}
      {(hasMoneyAccess || hasFinanceAccess) && (
        <section className="space-y-3" aria-label="Financial Care overview">
          <div className="flex items-center justify-between px-1 gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
              <Wallet
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="truncate">Financial Care Overview</span>
            </h2>
            <Link
              href="/finance"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200 flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Detailed Financial Care{" "}
              <ArrowRight
                className="w-3 h-3 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[104px]">
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

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[104px]">
              <span className="text-[11px] font-medium text-muted-foreground">
                Financial Care Received
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

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[104px]">
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

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[104px]">
              <span className="text-[11px] font-medium text-muted-foreground">
                Investment Received
              </span>
              <div className="my-1">
                <span className="text-lg sm:text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                  ৳{stats.investmentReceivedTotal.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium truncate">
                External equity
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 shadow-sm flex flex-col justify-between min-h-[104px]">
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

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 shadow-sm flex flex-col justify-between min-h-[104px]">
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
          </div>
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
