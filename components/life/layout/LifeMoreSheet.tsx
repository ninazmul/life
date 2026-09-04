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
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface LifeMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LifeMoreSheet({ open, onOpenChange }: LifeMoreSheetProps) {
  const pathname = usePathname();

  const moreItems = [
    {
      title: "Information & Notes",
      desc: "Personal, instructions & emergency data",
      href: "/information",
      icon: FileText,
      color:
        "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/40",
    },
    {
      title: "Business & Continuity",
      desc: '"If I Am Not Available" checklist',
      href: "/business",
      icon: Briefcase,
      color:
        "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/40",
    },
    {
      title: "Assets Portfolio",
      desc: "Bank balances, property & valuations",
      href: "/assets",
      icon: Layers,
      color:
        "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800/40",
    },
    {
      title: "Contact Directory",
      desc: "Emergency & key advisors (1-tap call)",
      href: "/contacts",
      icon: Contact,
      color:
        "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/40",
    },
    {
      title: "Documents Library",
      desc: "Private deeds, contracts & receipts",
      href: "/documents",
      icon: FolderLock,
      color:
        "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/40",
    },
    {
      title: "Legacy Messages",
      desc: "Private letters for designated people",
      href: "/legacy",
      icon: HeartHandshake,
      color:
        "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/40",
    },
    {
      title: "Access & Emergency",
      desc: "Delegate admin & Emergency protocol",
      href: "/access",
      icon: ShieldAlert,
      color:
        "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800/40",
    },
    {
      title: "Activity & Audit Trail",
      desc: "Vault reveals & system log",
      href: "/activity",
      icon: History,
      color:
        "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
    },
    {
      title: "Settings & Backup",
      desc: "Security PIN, PWA & offline backup",
      href: "/settings",
      icon: Settings,
      color:
        "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-slate-900 border-emerald-200 dark:border-slate-800",
    },
  ];

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
              <span>All Life Modules</span>
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personal Continuity & Legacy Command Center
            </p>
          </div>
        </SheetHeader>

        <div
          className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-2 pb-10"
          role="list"
          aria-label="Life modules list"
        >
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
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
