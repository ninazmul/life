/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
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
  Gem,
  Zap,
  ChevronDown,
  Archive,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  X,
  ChevronUp,
  NotebookPen,
  Receipt,
  ClipboardList,
  MessageCircle,
  CircleDollarSign,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LifeDashboardStats, ILifeCategory, MainCategoryKey } from "@/types";
import { canAccessModule, UserModuleAccess } from "@/lib/life/module-access";
import { getGesnReports } from "@/lib/actions/gesnReports.actions";
import {
  getCategoriesAndSubcategories,
  createSubcategory,
  updateSubcategory,
  reorderSubcategories,
  archiveSubcategory,
  deleteSubcategory,
} from "@/lib/actions/lifeCategory.actions";
import { MAIN_CATEGORIES } from "@/lib/config/lifeCategories";
import toast from "react-hot-toast";

interface LifeDashboardClientProps {
  stats: LifeDashboardStats;
  userAccess?: UserModuleAccess;
}

export function LifeDashboardClient({
  stats,
  userAccess,
}: LifeDashboardClientProps) {
  const isSuperUser = Boolean(
    userAccess?.isOwner ||
    userAccess?.isAdmin ||
    userAccess?.role === "super_admin" ||
    userAccess?.role === "admin" ||
    userAccess?.role === "administrator",
  );
  const [subcatModalOpen, setSubcatModalOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<
    Record<string, ILifeCategory[]>
  >({});
  const [subcatLoading, setSubcatLoading] = useState(false);
  const [selectedMainCat, setSelectedMainCat] =
    useState<MainCategoryKey>("financial_care");
  const [newSubcatName, setNewSubcatName] = useState("");
  const [editingSubcat, setEditingSubcat] = useState<ILifeCategory | null>(
    null,
  );
  const [editSubcatName, setEditSubcatName] = useState("");
  const [subcatSaving, setSubcatSaving] = useState(false);

  const loadSubcategories = useCallback(async () => {
    setSubcatLoading(true);
    try {
      const data = await getCategoriesAndSubcategories();
      setSubcategories(data);
    } catch {
      // silent
    } finally {
      setSubcatLoading(false);
    }
  }, []);

  const handleAddSubcategory = async () => {
    if (!newSubcatName.trim()) return;
    setSubcatSaving(true);
    try {
      await createSubcategory({
        mainCategory: selectedMainCat,
        name: newSubcatName.trim(),
      });
      setNewSubcatName("");
      await loadSubcategories();
      toast.success("Subcategory added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add subcategory.");
    } finally {
      setSubcatSaving(false);
    }
  };

  const handleEditSubcategory = async () => {
    if (!editingSubcat || !editSubcatName.trim()) return;
    setSubcatSaving(true);
    try {
      await updateSubcategory(editingSubcat._id, {
        name: editSubcatName.trim(),
      });
      setEditingSubcat(null);
      setEditSubcatName("");
      await loadSubcategories();
      toast.success("Subcategory updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update.");
    } finally {
      setSubcatSaving(false);
    }
  };

  const handleArchiveSubcategory = async (id: string) => {
    setSubcatSaving(true);
    try {
      await archiveSubcategory(id);
      await loadSubcategories();
      toast.success("Subcategory archived.");
    } catch (err: any) {
      toast.error(err.message || "Failed to archive.");
    } finally {
      setSubcatSaving(false);
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Delete this subcategory? This cannot be undone.")) return;
    setSubcatSaving(true);
    try {
      await deleteSubcategory(id);
      await loadSubcategories();
      toast.success("Subcategory deleted.");
    } catch (err: any) {
      toast.error(err.message || "Cannot delete — records may be linked.");
    } finally {
      setSubcatSaving(false);
    }
  };

  const handleMoveSubcategory = async (
    catKey: string,
    index: number,
    direction: "up" | "down",
  ) => {
    const cats = [...(subcategories[catKey] || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= cats.length) return;
    [cats[index], cats[newIndex]] = [cats[newIndex], cats[index]];
    const orderedIds = cats.map((c) => c._id);
    try {
      await reorderSubcategories(orderedIds);
      await loadSubcategories();
    } catch {
      toast.error("Failed to reorder.");
    }
  };

  const ownerPersonId = stats.ownerProfile?.personId || userAccess?.personId;
  const ownerProfileUrl = ownerPersonId
    ? `/people/${ownerPersonId}`
    : "/people";
  const ownerName =
    stats.ownerProfile?.name || userAccess?.name || "Nazmul Islam";
  const ownerAvatar = stats.ownerProfile?.avatarUrl || userAccess?.avatarUrl;
  const estateCompletion = Math.round(
    Math.min(
      100,
      ((stats.beneficiariesCount || 0) > 0 ? 35 : 0) +
        (stats.assetsTotalValue > 0 ? 35 : 0) +
        ((stats.legacyCount || 0) > 0 ? 30 : 0) || 60,
    ),
  );

  const currency = "SAR";
  const totalIncomeReceived = stats.gesnSummary?.totalIncome || 64995;
  const availableCash = stats.gesnSummary?.netProfit || 42719;
  const assetsAndInvestments =
    (stats.assetsTotalValue || 0) + (stats.investedTotal || 0) || 70000;
  const totalNetWorth =
    (stats.assetsTotalValue || 0) +
      (stats.gesnSummary?.netProfit || 0) +
      (stats.receivablesTotal || 0) || 47719;

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
  const hasFinanceAccess = canAccessModule(
    "/finance",
    permissions,
    isSuperUser,
  );
  const hasMoneyAccess = canAccessModule("/money", permissions, isSuperUser);
  const hasPeopleAccess = canAccessModule("/people", permissions, isSuperUser);
  const hasVaultAccess = canAccessModule("/vault", permissions, isSuperUser);
  const hasBusinessAccess = canAccessModule(
    "/business",
    permissions,
    isSuperUser,
  );
  const hasAssetsAccess = canAccessModule("/assets", permissions, isSuperUser);
  const hasGuardiansAccess = canAccessModule(
    "/guardians",
    permissions,
    isSuperUser,
  );
  const hasInstructionsAccess = canAccessModule(
    "/instructions",
    permissions,
    isSuperUser,
  );
  const hasActivityAccess = canAccessModule(
    "/activity",
    permissions,
    isSuperUser,
  );
  const hasDocumentsAccess = canAccessModule(
    "/documents",
    permissions,
    isSuperUser,
  );
  const hasLegacyAccess = canAccessModule("/legacy", permissions, isSuperUser);
  const hasBeneficiariesAccess = canAccessModule(
    "/beneficiaries",
    permissions,
    isSuperUser,
  );
  const hasContactsAccess = canAccessModule(
    "/contacts",
    permissions,
    isSuperUser,
  );
  const hasInfoAccess = canAccessModule(
    "/information",
    permissions,
    isSuperUser,
  );
  const hasLifeNoteAccess = canAccessModule(
    "/lifenote",
    permissions,
    isSuperUser,
  );

  const hasAccessControlAccess = canAccessModule(
    "/access",
    permissions,
    isSuperUser,
  );
  const hasSettingsAccess = canAccessModule(
    "/settings",
    permissions,
    isSuperUser,
  );

  // Financial Overview Interactive State
  const [financeTab, setFinanceTab] = useState<
    "business" | "personal" | "combined"
  >("business");
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
                color:
                  c.category?.color ||
                  (c.category?.type === "Income" ? "#10b981" : "#ef4444"),
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
    canAccessModule(item.link, permissions, isSuperUser),
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
      desc: '"If I Am Not Available" checklist & equity',
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
      title: "LifeNote",
      href: "/lifenote",
      desc: "Personal notes, locked messages & emergency releases",
      icon: NotebookPen,
      badge: "Private",
      badgeValue: "Private",
      color: "violet",
      hasAccess: hasLifeNoteAccess,
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

  // Define 6 Quick Actions with permission status for top dropdown
  const quickActionsList = [
    {
      title: "Financial Care",
      href: "/finance",
      desc: `${stats.upcomingPaymentsCount || 0} Active · ${stats.overduePaymentsCount || 0} Due`,
      icon: Wallet,
      color:
        "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
      hasAccess: hasFinanceAccess || hasMoneyAccess,
    },
    {
      title: "Estate & Wasiyyah",
      href: "/beneficiaries",
      desc: `${estateCompletion}% Complete`,
      icon: Gift,
      color:
        "text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/20",
      hasAccess: hasBeneficiariesAccess,
    },
    {
      title: "Roles & Responsibilities",
      href: "/instructions",
      desc: `${stats.pendingResponsibilitiesCount || stats.instructionsCount || 0} Assigned`,
      icon: Briefcase,
      color: "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/20",
      hasAccess: hasInstructionsAccess,
    },
    {
      title: "Emergency Contacts & Help",
      href: "/contacts",
      desc: `${stats.contactsCount || stats.trustedGuardiansCount || 0} Verified`,
      icon: PhoneCall,
      color:
        "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20",
      hasAccess: hasContactsAccess,
    },
    {
      title: "Security & Access",
      href: "/access",
      desc:
        stats.emergencyModeStatus === "Active"
          ? "1 Alert"
          : (stats.pendingAccessRequestsCount || 0) > 0
            ? `${stats.pendingAccessRequestsCount} Requests`
            : "Protected",
      icon: ShieldAlert,
      color:
        "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/20",
      hasAccess: hasAccessControlAccess,
    },
    {
      title: "Instructions & Messages",
      href: "/legacy",
      desc: `${(stats.instructionsCount || 0) + (stats.legacyCount || 0) || stats.infoCount || 0} Saved`,
      icon: FileText,
      color:
        "text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
      hasAccess: hasLegacyAccess,
    },
    {
      title: "LifeNote",
      href: "/lifenote",
      desc: `Notes, messages & locked releases`,
      icon: NotebookPen,
      color:
        "text-violet-700 dark:text-violet-300 bg-violet-500/10 border-violet-500/20",
      hasAccess: hasLifeNoteAccess,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ============================================================ */}
      {/* 1. Life Command Center Section on Top (Header + Dropdown)   */}
      {/* ============================================================ */}
      <section aria-label="Life Command Center" className="relative">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-background dark:from-emerald-950/30 dark:via-background dark:to-background p-3.5 sm:p-4.5 lg:p-5 shadow-xs">
          {/* Subtle botanical leaves watermark on top-right */}
          <div className="pointer-events-none absolute -right-3 -top-4 w-24 h-24 sm:w-32 sm:h-32 text-emerald-600/10 dark:text-emerald-400/10 select-none">
            <svg
              viewBox="0 0 200 200"
              fill="currentColor"
              className="w-full h-full"
            >
              <path d="M120 15 C80 50, 40 100, 50 160 C70 170, 110 155, 140 120 C170 85, 175 40, 120 15 Z M95 65 C120 90, 130 120, 130 120 C130 120, 105 110, 85 90 C75 80, 85 70, 95 65 Z" />
              <path
                d="M160 40 C140 70, 120 110, 130 150 C145 155, 170 145, 185 120 C200 95, 195 60, 160 40 Z"
                opacity="0.6"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Left: Badge, Title & Shortened Subtitle */}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-[11px] font-semibold mb-1 shadow-2xs max-w-full">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">
                  Personal Legacy & Continuity Active
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Life Command Center
              </h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Private wealth, continuity & legacy organized.
              </p>
            </div>

            {/* Right: Action Buttons - All three stay on one line with matching UI */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold text-xs shadow-xs hover:shadow transition-all shrink-0 whitespace-nowrap cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300/30 shrink-0" />
                    <span>Quick Actions</span>
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-200 shrink-0 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-2 rounded-2xl bg-popover/95 backdrop-blur-md border border-border shadow-xl z-50 animate-in fade-in-50 zoom-in-95"
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Quick Actions Navigation</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {quickActionsList.length} Available
                    </span>
                  </div>
                  <div className="space-y-1">
                    {quickActionsList.map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <DropdownMenuItem
                          key={idx}
                          asChild
                          className="cursor-pointer rounded-xl focus:bg-accent p-2.5 transition-colors"
                        >
                          <Link
                            href={action.href}
                            className="flex items-center justify-between w-full gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${action.color}`}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">
                                  {action.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {action.desc}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                  {isSuperUser && (
                    <>
                      <div className="border-t border-border my-1" />
                      <DropdownMenuItem
                        className="cursor-pointer rounded-xl focus:bg-accent p-2.5 transition-colors"
                        onClick={() => {
                          loadSubcategories();
                          setSubcatModalOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/20">
                              <Layers className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                Manage Subcategories
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                Add, edit, reorder, archive
                              </p>
                            </div>
                          </div>
                          <Settings className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border-border/80 bg-background/90 hover:bg-secondary text-foreground text-xs font-semibold gap-1.5 shadow-2xs hover:shadow-xs transition-all shrink-0 whitespace-nowrap"
              >
                <Link href="/information">
                  <Plus
                    className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                    strokeWidth={2.5}
                  />
                  <span>Info.</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border-border/80 bg-background/90 hover:bg-secondary text-foreground text-xs font-semibold gap-1.5 shadow-2xs hover:shadow-xs transition-all shrink-0 whitespace-nowrap"
              >
                <Link href="/finance">
                  <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Income</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. My Life Profile & Financial Overview Card                 */}
      {/* ============================================================ */}
      <section aria-label="My Life Profile and Financial Overview">
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-3.5 sm:p-6 shadow-sm ring-1 ring-border/50">
          {/* Profile Header & Details */}
          <div className="group/profile">
            {/* User Details Row */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName}
                  className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl object-cover border border-emerald-300/60 dark:border-emerald-800/60 shadow-xs shrink-0 group-hover/profile:border-emerald-500/60 transition-colors"
                />
              ) : (
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover/profile:scale-105 transition-transform">
                  <User className="w-7 h-7 sm:w-10 sm:h-10" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={ownerProfileUrl}
                    aria-label={`Open ${ownerName}'s profile`}
                    className="min-w-0 truncate text-left text-lg sm:text-2xl font-black text-foreground tracking-tight hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors uppercase font-heading"
                  >
                    {ownerName}
                  </Link>
                  <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0">
                    <span className="hidden sm:inline">View Profile</span>
                    <Link
                      href={ownerProfileUrl}
                      aria-label={`Open ${ownerName}'s profile`}
                      className="rounded-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5 hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                <p className="text-xs sm:text-sm italic text-muted-foreground font-medium truncate mt-0.5">
                  Personal · Medical · Life History
                </p>
              </div>
            </div>

            {/* Separator */}
            <div className="my-3.5 sm:my-4 border-t border-border" />

            {/* ── 4 Quick-Action Icons ── */}
            <div className="flex items-center justify-around sm:justify-start sm:gap-6 px-1">
              {/* 1. Requests */}
              <Link
                href="/requests"
                title={isSuperUser ? "Requests Inbox" : "Request Center"}
                aria-label={isSuperUser ? "Requests Inbox" : "Request Center"}
                className="group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25 transition-all hover:scale-105 active:scale-95"
              >
                {(stats.dashboardBadges?.requestsCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs z-10">
                    {(stats.dashboardBadges?.requestsCount ?? 0) > 9
                      ? "9+"
                      : stats.dashboardBadges?.requestsCount}
                  </span>
                )}
                {isSuperUser ? (
                  <Inbox className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.9]" />
                ) : (
                  <ClipboardList className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.9]" />
                )}
              </Link>

              {/* 2. Messages */}
              <Link
                href="/requests?tab=messages"
                title="Messages"
                aria-label="Messages"
                className="group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 transition-all hover:scale-105 active:scale-95"
              >
                {(stats.dashboardBadges?.messagesCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs z-10">
                    {(stats.dashboardBadges?.messagesCount ?? 0) > 9
                      ? "9+"
                      : stats.dashboardBadges?.messagesCount}
                  </span>
                )}
                <MessageCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.9]" />
              </Link>

              {/* 3. Notes */}
              <Link
                href="/lifenote"
                title="Notes & Directives"
                aria-label="Notes & Directives"
                className="group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400 hover:bg-violet-500/20 dark:hover:bg-violet-500/25 transition-all hover:scale-105 active:scale-95"
              >
                {(stats.dashboardBadges?.notesCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs z-10">
                    {(stats.dashboardBadges?.notesCount ?? 0) > 9
                      ? "9+"
                      : stats.dashboardBadges?.notesCount}
                  </span>
                )}
                <NotebookPen className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.9]" />
              </Link>

              {/* 4. Financial Overview */}
              <Link
                href="/finance"
                title="Financial Overview"
                aria-label="Financial Overview"
                className="group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/25 transition-all hover:scale-105 active:scale-95"
              >
                {(stats.dashboardBadges?.financialCount ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs z-10">
                    {(stats.dashboardBadges?.financialCount ?? 0) > 9
                      ? "9+"
                      : stats.dashboardBadges?.financialCount}
                  </span>
                )}
                <CircleDollarSign className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.9]" />
              </Link>
            </div>
          </div>

          {/* Separator Line */}
          <div className="my-3.5 sm:my-5 border-t border-border" />

          {/* Financial Overview for Admin/Super Admin OR Personal Support & Commitments for other users */}
          {isSuperUser ? (
            <div>
              <div className="flex items-center justify-between mb-2.5 sm:mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    Financial Overview
                  </h2>
                </div>
                <Link
                  href="/finance"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>All Finances</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {/* 1. Total Income Received */}
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium truncate">
                      Total Income
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                      {totalIncomeReceived.toLocaleString()}{" "}
                      <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        SAR
                      </span>
                    </span>
                  </div>
                </div>

                {/* 2. Available Cash */}
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium truncate">
                      Available Cash
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                      {availableCash.toLocaleString()}{" "}
                      <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        SAR
                      </span>
                    </span>
                  </div>
                </div>

                {/* 3. Assets & Investments */}
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium truncate">
                      Investments
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-base font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                      {assetsAndInvestments.toLocaleString()}{" "}
                      <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        SAR
                      </span>
                    </span>
                  </div>
                </div>

                {/* 4. Total Net Worth */}
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium truncate">
                      Net Worth
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-base font-extrabold text-sky-700 dark:text-sky-400 font-mono">
                      {totalNetWorth.toLocaleString()}{" "}
                      <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        SAR
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2.5 sm:mb-3 px-0.5">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    Personal Support & Commitments
                  </h2>
                </div>
                <Link
                  href="/finance"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {/* 1. Total Support Received */}
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium truncate">
                      Total Received
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-base font-extrabold text-foreground font-mono">
                      {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                      {(
                        stats.personalFinancialSummary?.totalReceived || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 2. Repayable Commitment */}
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium truncate">
                      Repayable Support
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                      {(
                        stats.personalFinancialSummary?.repayableAmount || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 3. Total Returned */}
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium truncate">
                      Total Returned
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                      {(
                        stats.personalFinancialSummary?.totalRepaid || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 4. Remaining Balance */}
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-secondary/40 border border-border/70 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-medium truncate">
                      Remaining to Return
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-xs sm:text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                      {(
                        stats.personalFinancialSummary?.remainingBalance || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Row */}
              <div className="mt-3 sm:mt-3.5 pt-3 sm:pt-3.5 border-t border-border flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 flex-wrap">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial h-8 sm:h-9 px-3 sm:px-4 rounded-xl border-border bg-background hover:bg-secondary text-foreground text-xs font-semibold gap-1.5 shadow-2xs"
                >
                  <Link href="/finance">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Financial Support</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial h-8 sm:h-9 px-3 sm:px-4 rounded-xl border-border bg-background hover:bg-secondary text-foreground text-xs font-semibold gap-1.5 shadow-2xs"
                >
                  <Link href="/information">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>My Information</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* §24 Continuity & Safety State */}
      <section
        className="space-y-2.5"
        aria-label="Continuity & Safety Readiness"
      >
        {stats.activeRecoveryPending && (
          <div className="p-4 rounded-3xl bg-red-500/15 border-2 border-red-500/60 shadow-lg shadow-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-600 text-white">
                    {stats.isVaultLocked
                      ? "Vault Locked (48h)"
                      : "Emergency 48h Countdown"}
                  </span>
                  <span className="text-xs font-bold text-red-700 dark:text-red-300">
                    Active Recovery Protocol
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  An emergency continuity event is currently in its 48-hour
                  cancellation period. Super Admins can manage or cancel with
                  Master PIN.
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
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              stats.activeRecoveryPending
                ? "text-red-600 bg-red-500/10 border-red-500/20 animate-pulse"
                : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
            }`}
          >
            {stats.activeRecoveryPending
              ? "Recovery Active (48h)"
              : "System Operational"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Owner Safety Status */}
          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Owner Safety
            </span>
            <div className="my-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  stats.ownerSafetyStatus === "emergency"
                    ? "bg-red-500 animate-pulse"
                    : "bg-emerald-500"
                }`}
              />
              <span className="text-sm font-extrabold capitalize text-foreground">
                {stats.ownerSafetyStatus || "Safe"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Check-in Active
            </span>
          </div>

          {/* Emergency Mode Status */}
          {hasGuardiansAccess ? (
            <Link
              href="/guardians"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-red-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                Emergency Mode
              </span>
              <div className="my-1">
                <span
                  className={`text-sm font-extrabold ${
                    stats.emergencyModeStatus === "Active"
                      ? "text-red-600"
                      : "text-foreground"
                  }`}
                >
                  {stats.emergencyModeStatus || "Normal"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Protocol Ready
              </span>
            </Link>
          ) : (
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Emergency Mode
              </span>
              <div className="my-1">
                <span className="text-sm font-extrabold text-foreground">
                  {stats.emergencyModeStatus || "Normal"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Protocol Ready
              </span>
            </div>
          )}

          {/* Trusted Guardians - Only if has Guardians access */}
          {hasGuardiansAccess && (
            <Link
              href="/guardians"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                Guardians
              </span>
              <div className="my-1">
                <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {stats.trustedGuardiansCount || 0}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Multi-Party Trust
              </span>
            </Link>
          )}

          {/* Pending Responsibilities - Only if has Instructions access */}
          {hasInstructionsAccess && (
            <Link
              href="/instructions"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                Responsibilities
              </span>
              <div className="my-1">
                <span className="text-lg font-extrabold text-foreground font-mono">
                  {stats.pendingResponsibilitiesCount || 0}
                </span>
              </div>
              <span className="text-[10px] text-amber-600 font-medium">
                In Progress
              </span>
            </Link>
          )}

          {/* Business Continuity Readiness - Only if has Business access */}
          {hasBusinessAccess && (
            <Link
              href="/business"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                Continuity Ready
              </span>
              <div className="my-1">
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {stats.businessContinuityReadiness}%
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                If Not Available
              </span>
            </Link>
          )}

          {/* Upcoming / Overdue Payments - Only if has Finance access */}
          {hasFinanceAccess && (
            <Link
              href="/finance"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                Financial Care
              </span>
              <div className="my-1">
                <span className="text-sm font-extrabold text-foreground">
                  {stats.upcomingPaymentsCount || 0} Active
                </span>
              </div>
              <span
                className={`text-[10px] font-medium ${
                  (stats.overduePaymentsCount || 0) > 0
                    ? "text-red-500"
                    : "text-muted-foreground"
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

      {/* Financial Care & Cash Flow Command Overview - Admin sees Business & Personal, other users only see Personal */}
      {(hasMoneyAccess ||
        hasFinanceAccess ||
        Boolean(
          stats.personalFinancialSummary &&
          (stats.personalFinancialSummary.recordsCount ?? 0) > 0,
        )) && (
        <section
          className="space-y-4"
          aria-label="Financial and cash flow overview"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
                <Wallet
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="truncate">
                  {isSuperUser
                    ? "Financial & Cash Flow Overview"
                    : "Personal Financial Care & Mutual Assistance"}
                </span>
              </h2>

              {/* Real-time sync badge (Admin / Super Admin only) */}
              {isSuperUser ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>ACC.GESN.NET Live</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <HeartHandshake className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Personal & Connected Records</span>
                </div>
              )}
            </div>

            {/* View Filter Segmented Controls & Link */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isSuperUser && (
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
              )}

              <Link
                href="/finance"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200 flex items-center gap-1 shrink-0 whitespace-nowrap pl-1"
              >
                {isSuperUser ? "Detailed Ledger" : "View All Records"}{" "}
                <ArrowRight
                  className="w-3.5 h-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* 1. Real-time Accounting & Cash Flow Section (ACC.GESN.NET) - Strictly Admin & Super Admin */}
          {isSuperUser &&
            (financeTab === "business" || financeTab === "combined") && (
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
                        {(gesnData?.totalIncome || 0).toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-1.5">
                          SAR
                        </span>
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
                        {(gesnData?.totalExpenses || 0).toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-1.5">
                          SAR
                        </span>
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
                        {(gesnData?.netProfit || 0).toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-1.5">
                          SAR
                        </span>
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium truncate">
                      {(gesnData?.netProfit || 0) >= 0
                        ? "Operating Surplus"
                        : "Operating Deficit"}
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
                {gesnData?.topCategories &&
                  gesnData.topCategories.length > 0 && (
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
                              style={{
                                backgroundColor: cat.color || "#10b981",
                              }}
                            />
                            <span className="font-semibold text-foreground truncate max-w-[120px]">
                              {cat.name}
                            </span>
                            <span className="font-bold text-muted-foreground font-mono text-[11px]">
                              {cat.total.toLocaleString()}
                              <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
                                SAR
                              </span>
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
          {(!isSuperUser ||
            financeTab === "personal" ||
            financeTab === "combined") && (
            <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-foreground">
                    {isSuperUser
                      ? "Personal Financial Care & Mutual Assistance"
                      : "Mutual Assistance & Support Commitments"}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {stats.upcomingPaymentsCount || 0} Active ·{" "}
                  {stats.overduePaymentsCount || 0} Overdue
                </span>
              </div>

              {isSuperUser ? (
                /* Admin & Super Admin view: Full personal financial ledger & balances */
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
              ) : (
                /* Non-admin view: Only his own data or data assigned / connected to him */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* 1. Support Received / Allocated */}
                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border shadow-2xs flex flex-col justify-between min-h-[104px]">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Coins className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Support Received
                    </span>
                    <div className="my-1">
                      <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono">
                        {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                        {(
                          stats.personalFinancialSummary?.totalReceived || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium truncate">
                      {stats.personalFinancialSummary?.recordsCount || 0}{" "}
                      Connected record
                      {(stats.personalFinancialSummary?.recordsCount || 0) === 1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  {/* 2. Repayable Commitment */}
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 shadow-2xs flex flex-col justify-between min-h-[104px]">
                    <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      Repayable Support
                    </span>
                    <div className="my-1">
                      <span className="text-lg sm:text-xl font-extrabold text-blue-800 dark:text-blue-200 font-mono">
                        {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                        {(
                          stats.personalFinancialSummary?.repayableAmount || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-700/80 dark:text-blue-300/80 font-medium truncate">
                      Returnable commitment
                    </span>
                  </div>

                  {/* 3. Total Returned */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 shadow-2xs flex flex-col justify-between min-h-[104px]">
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Total Returned
                    </span>
                    <div className="my-1">
                      <span className="text-lg sm:text-xl font-extrabold text-emerald-800 dark:text-emerald-200 font-mono">
                        {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                        {(
                          stats.personalFinancialSummary?.totalRepaid || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-medium truncate">
                      Settled so far
                    </span>
                  </div>

                  {/* 4. Remaining to Return */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 shadow-2xs flex flex-col justify-between min-h-[104px]">
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      Remaining Balance
                    </span>
                    <div className="my-1">
                      <span className="text-lg sm:text-xl font-extrabold text-amber-800 dark:text-amber-200 font-mono">
                        {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                        {(
                          stats.personalFinancialSummary?.remainingBalance || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-medium truncate">
                      Pending to return
                    </span>
                  </div>

                  {/* 5. Gift & Grant Allocations */}
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 shadow-2xs flex flex-col justify-between min-h-[104px]">
                    <span className="text-[11px] font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                      Gift & Grant Care
                    </span>
                    <div className="my-1">
                      <span className="text-lg sm:text-xl font-extrabold text-purple-800 dark:text-purple-200 font-mono">
                        {stats.personalFinancialSummary?.currency || "BDT"}{" "}
                        {(
                          stats.personalFinancialSummary?.giftAmount || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-700/80 dark:text-purple-300/80 font-medium truncate">
                      Non-repayable assistance
                    </span>
                  </div>

                  {/* 6. Active Commitments / Due Status */}
                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border shadow-2xs flex flex-col justify-between min-h-[104px]">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <HeartHandshake className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                      Commitment Status
                    </span>
                    <div className="my-1">
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        {stats.upcomingPaymentsCount || 0} Active
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium truncate ${(stats.overduePaymentsCount || 0) > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground"}`}
                    >
                      {(stats.overduePaymentsCount || 0) > 0
                        ? `${stats.overduePaymentsCount} Overdue`
                        : "All on schedule"}
                    </span>
                  </div>
                </div>
              )}
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
                    <span
                      className="text-[11px] text-muted-foreground truncate block"
                      suppressHydrationWarning
                    >
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

      {/* ============================================================ */}
      {/* Subcategory Management Modal                                 */}
      {/* ============================================================ */}
      <Dialog open={subcatModalOpen} onOpenChange={setSubcatModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl border border-border bg-card shadow-2xl p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-teal-500" />
              Manage Subcategories
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organize subcategories under each of the 6 main categories.
            </p>
          </DialogHeader>

          {/* Main Category Tabs */}
          <div className="px-5 pt-3 flex overflow-x-auto scrollbar-none gap-1.5">
            {MAIN_CATEGORIES.map((mc) => (
              <button
                key={mc.key}
                onClick={() => setSelectedMainCat(mc.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedMainCat === mc.key
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-secondary text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {mc.title}
              </button>
            ))}
          </div>

          {/* Subcategory List */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
            {subcatLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (subcategories[selectedMainCat] || []).length === 0 ? (
              <div className="text-center py-10">
                <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No subcategories yet.
                </p>
              </div>
            ) : (
              (subcategories[selectedMainCat] || []).map((cat, idx) => (
                <div
                  key={cat._id}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border transition-all ${
                    cat.isArchived
                      ? "bg-secondary/50 border-border/60 opacity-60"
                      : "bg-card border-border hover:border-emerald-500/30"
                  }`}
                >
                  {/* Reorder Controls */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() =>
                        handleMoveSubcategory(selectedMainCat, idx, "up")
                      }
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronUp className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() =>
                        handleMoveSubcategory(selectedMainCat, idx, "down")
                      }
                      disabled={
                        idx ===
                        (subcategories[selectedMainCat]?.length || 1) - 1
                      }
                      className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    {editingSubcat?._id === cat._id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editSubcatName}
                          onChange={(e) => setEditSubcatName(e.target.value)}
                          className="h-7 text-xs flex-1 border-emerald-500/40 bg-secondary"
                          autoFocus
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleEditSubcategory()
                          }
                        />
                        <Button
                          size="sm"
                          onClick={handleEditSubcategory}
                          disabled={subcatSaving}
                          className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSubcat(null)}
                          className="h-7 px-1.5 text-[10px] rounded-lg"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {cat.name}
                        </span>
                        {cat.isArchived && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Archived
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingSubcat?._id !== cat._id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingSubcat(cat);
                          setEditSubcatName(cat.name);
                        }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {!cat.isArchived && (
                        <button
                          onClick={() => handleArchiveSubcategory(cat._id)}
                          className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSubcategory(cat._id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add New Subcategory */}
          <div className="px-5 pb-5 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                placeholder="New subcategory name..."
                value={newSubcatName}
                onChange={(e) => setNewSubcatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubcategory()}
                className="h-9 text-xs flex-1 border-border bg-secondary"
              />
              <Button
                onClick={handleAddSubcategory}
                disabled={subcatSaving || !newSubcatName.trim()}
                className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-sm"
              >
                {subcatSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
