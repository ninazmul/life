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
      color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/40",
    },
    {
      title: "Business & Continuity",
      desc: '"If I Am Not Available" checklist',
      href: "/business",
      icon: Briefcase,
      color: "text-amber-400 bg-amber-950/60 border-amber-800/40",
    },
    {
      title: "Assets Portfolio",
      desc: "Bank balances, property & valuations",
      href: "/assets",
      icon: Layers,
      color: "text-cyan-400 bg-cyan-950/60 border-cyan-800/40",
    },
    {
      title: "Contact Directory",
      desc: "Emergency & key advisors (1-tap call)",
      href: "/contacts",
      icon: Contact,
      color: "text-sky-400 bg-sky-950/60 border-sky-800/40",
    },
    {
      title: "Documents Library",
      desc: "Private deeds, contracts & receipts",
      href: "/documents",
      icon: FolderLock,
      color: "text-indigo-400 bg-indigo-950/60 border-indigo-800/40",
    },
    {
      title: "Legacy Messages",
      desc: "Private letters for designated people",
      href: "/legacy",
      icon: HeartHandshake,
      color: "text-rose-400 bg-rose-950/60 border-rose-800/40",
    },
    {
      title: "Access & Emergency",
      desc: "Delegate admin & Emergency protocol",
      href: "/access",
      icon: ShieldAlert,
      color: "text-red-400 bg-red-950/60 border-red-800/40",
    },
    {
      title: "Activity & Audit Trail",
      desc: "Vault reveals & system log",
      href: "/activity",
      icon: History,
      color: "text-slate-400 bg-slate-900 border-slate-800",
    },
    {
      title: "Settings & Backup",
      desc: "Security PIN, PWA & offline backup",
      href: "/settings",
      icon: Settings,
      color: "text-emerald-400 bg-slate-900 border-slate-800",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-3xl border-t border-slate-800 bg-slate-950/98 backdrop-blur-2xl p-0 overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto mt-3 mb-1" />
        <SheetHeader className="px-6 py-3 flex flex-row items-center justify-between border-b border-slate-800/60">
          <div>
            <SheetTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>All Life Modules</span>
            </SheetTitle>
            <p className="text-xs text-slate-400">
              Personal Continuity & Legacy Command Center
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-2 pb-10">
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
                    ? "bg-slate-900/90 border-emerald-500/50 shadow-sm"
                    : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/80 hover:border-slate-700"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isActive ? "text-emerald-400" : "text-slate-200"
                      }`}
                    >
                      {item.title}
                    </span>
                    {isActive && (
                      <span className="text-[10px] uppercase font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
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
