"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Wallet,
  KeyRound,
  FileText,
  Briefcase,
  Layers,
  Contact,
  FolderLock,
  HeartHandshake,
  ShieldAlert,
  History,
  Settings,
} from "lucide-react";

interface LifeSidebarProps {
  activeLoansCount?: number;
}

export function LifeSidebar({ activeLoansCount = 0 }: LifeSidebarProps) {
  const pathname = usePathname();

  const sections = [
    {
      title: "Core Command",
      items: [
        {
          title: "Home Dashboard",
          url: "/",
          icon: Home,
          isActive: pathname === "/",
        },
        {
          title: "People Directory",
          url: "/people",
          icon: Users,
          isActive: pathname.startsWith("/people"),
        },
        {
          title: "Money Management",
          url: "/money",
          icon: Wallet,
          isActive: pathname.startsWith("/money"),
          badge: activeLoansCount > 0 ? activeLoansCount : undefined,
        },
        {
          title: "Secure Vault",
          url: "/vault",
          icon: KeyRound,
          isActive: pathname.startsWith("/vault"),
        },
      ],
    },
    {
      title: "Records & Continuity",
      items: [
        {
          title: "Information & Notes",
          url: "/information",
          icon: FileText,
          isActive: pathname.startsWith("/information"),
        },
        {
          title: "Business & Continuity",
          url: "/business",
          icon: Briefcase,
          isActive: pathname.startsWith("/business"),
        },
        {
          title: "Assets Portfolio",
          url: "/assets",
          icon: Layers,
          isActive: pathname.startsWith("/assets"),
        },
        {
          title: "Contact Directory",
          url: "/contacts",
          icon: Contact,
          isActive: pathname.startsWith("/contacts"),
        },
        {
          title: "Documents Library",
          url: "/documents",
          icon: FolderLock,
          isActive: pathname.startsWith("/documents"),
        },
      ],
    },
    {
      title: "Legacy & Security",
      items: [
        {
          title: "Legacy Messages",
          url: "/legacy",
          icon: HeartHandshake,
          isActive: pathname.startsWith("/legacy"),
        },
        {
          title: "Access & Emergency",
          url: "/access",
          icon: ShieldAlert,
          isActive: pathname.startsWith("/access"),
        },
        {
          title: "Activity & Audit",
          url: "/activity",
          icon: History,
          isActive: pathname.startsWith("/activity"),
        },
        {
          title: "Settings & Backup",
          url: "/settings",
          icon: Settings,
          isActive: pathname.startsWith("/settings"),
        },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-850 bg-white dark:bg-[#070a12] shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30 shrink-0">
          <Image
            src="/assets/images/logo.png"
            alt="Life Official Logo"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
              Life
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              PWA
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium truncate">
            Legacy & Continuity
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-3 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 px-3 mb-1.5">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                      item.isActive
                        ? "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          item.isActive
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                      <span>{item.title}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                        {item.badge}
                      </span>
                    )}

                    {item.isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 dark:bg-emerald-400 rounded-r-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Security Footer Info */}
      <div className="p-3 m-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Vault AES-256
        </span>
        <span className="text-[10px] font-mono text-slate-400">v1.0 PWA</span>
      </div>
    </aside>
  );
}
