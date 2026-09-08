"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Briefcase,
  Layers,
  Contact,
  FolderLock,
  HeartHandshake,
  ShieldAlert,
  History,
  Settings,
  X,
  BookOpen,
  Wallet,
  CheckSquare,
  Gift,
  ShieldCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { canAccessModule, UserModuleAccess } from "@/lib/life/module-access";

interface LifeMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAccess: UserModuleAccess;
}

export function LifeMoreSheet({ open, onOpenChange, userAccess }: LifeMoreSheetProps) {
  const pathname = usePathname();
  const { isOwner, isAdmin, permissions } = userAccess;
  const isSuperUser = isOwner || isAdmin;

  const allMoreItems = [
    {
      title: "1. Businesses & Partnerships",
      desc: "Companies, shares, partner equity & continuity",
      href: "/business",
      icon: Briefcase,
      color:
        "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/40",
    },
    {
      title: "2. Finance & Transactions",
      desc: "Financial support, repayment, installments & gifts",
      href: "/finance",
      icon: Wallet,
      color:
        "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/40",
    },
    {
      title: "3. Assets & Properties",
      desc: "Bank balances, property & valuations",
      href: "/assets",
      icon: Layers,
      color:
        "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800/40",
    },
    {
      title: "4. Instructions & Responsibilities",
      desc: "Directives, task assignments & emergency actions",
      href: "/instructions",
      icon: CheckSquare,
      color:
        "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/40",
    },
    {
      title: "5. Contact Directory",
      desc: "Emergency & key advisors (1-tap call)",
      href: "/contacts",
      icon: Contact,
      color:
        "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/40",
    },
    {
      title: "6. Documents Library",
      desc: "Private deeds, contracts & receipts",
      href: "/documents",
      icon: FolderLock,
      color:
        "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/40",
    },
    {
      title: "7. Personal & Legacy Messages",
      desc: "Private letters & instructions for designated people",
      href: "/legacy",
      icon: HeartHandshake,
      color:
        "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/40",
    },
    {
      title: "8. Beneficiaries",
      desc: "Designated recipients of legacy allocations",
      href: "/beneficiaries",
      icon: Gift,
      color:
        "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/40",
    },
    {
      title: "9. Guardians & Emergency Access",
      desc: "Trusted guardians, release approvals & safety state",
      href: "/guardians",
      icon: ShieldCheck,
      color:
        "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800/40",
    },
    {
      title: "10. Activity & Audit Log",
      desc: "Immutable logs of all sensitive actions",
      href: "/activity",
      icon: History,
      color:
        "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
    },
    {
      title: "11. Security & Backup",
      desc: "Database exports, restore test & security policy",
      href: "/settings",
      icon: ShieldAlert,
      color:
        "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800/40",
    },
    {
      title: "12. User Guide",
      desc: "How to use every module of LIFE Vault",
      href: "/guide",
      icon: BookOpen,
      color:
        "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800/40",
    },
    {
      title: "13. Settings",
      desc: "System preferences, roles & configuration",
      href: "/settings",
      icon: Settings,
      color:
        "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-slate-900 border-emerald-200 dark:border-slate-800",
    },
  ];

  // Filter modules by user permissions
  const moreItems = allMoreItems.filter((item) =>
    canAccessModule(item.href, permissions, isSuperUser)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="life-drawer max-h-[85vh] rounded-t-3xl border-t backdrop-blur-2xl p-0 overflow-hidden shadow-2xl"
      >
        <div
          className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-1"
          aria-hidden="true"
        />
        <SheetHeader className="px-6 py-3 flex flex-row items-center justify-between border-b border-border">
          <div className="min-w-0 pr-2">
            <SheetTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <span>{isSuperUser ? "All Life Modules" : "Your Modules"}</span>
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSuperUser
                ? "Personal Continuity & Legacy Command Center"
                : "Modules you have access to"}
            </p>
          </div>
        </SheetHeader>

        <div
          className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-2 pb-10"
          role="list"
          aria-label="Life modules list"
        >
          {moreItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                আপনার জন্য কোনো মডিউল নির্ধারিত হয়নি।
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please contact the Owner for module access.
              </p>
            </div>
          )}
          {moreItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={`${item.href}-${idx}`}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                    : "bg-card border-border hover:bg-muted/70 hover:border-muted-foreground/30"
                }`}
                role="listitem"
                aria-label={
                  isActive
                    ? `${item.title} — currently open`
                    : `Open ${item.title}`
                }
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${item.color}`}
                >
                  <Icon
                    className="w-5 h-5 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isActive
                          ? "text-emerald-600 dark:text-emerald-300"
                          : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </span>
                    {isActive && (
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
