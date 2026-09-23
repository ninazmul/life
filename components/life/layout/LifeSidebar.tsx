"use client";

import { useState, useEffect } from "react";
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
  BookOpen,
  Coins,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { canAccessModule, UserModuleAccess } from "@/lib/life/module-access";

interface LifeSidebarProps {
  activeCareCount?: number;
  userAccess: UserModuleAccess;
}

export function LifeSidebar({ activeCareCount = 0, userAccess }: LifeSidebarProps) {
  const pathname = usePathname();
  const { isOwner, isAdmin, permissions } = userAccess;
  const isSuperUser = isOwner || isAdmin;
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("life-sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("life-sidebar-collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          title: "People & Access",
          url: "/people",
          icon: Users,
          isActive: pathname.startsWith("/people"),
        },
        {
          title: "Financial Care",
          url: "/finance",
          icon: Wallet,
          isActive: pathname.startsWith("/finance") || pathname.startsWith("/money"),
          badge: activeCareCount > 0 ? activeCareCount : undefined,
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
          title: "Instructions & Responsibilities",
          url: "/instructions",
          icon: FileText,
          isActive: pathname.startsWith("/instructions"),
        },
        {
          title: "LifeNote",
          url: "/lifenote",
          icon: NotebookPen,
          isActive: pathname.startsWith("/lifenote"),
        },
        {
          title: "Important Information",
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
          title: "Assets & Properties",
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
        {
          title: "Beneficiaries",
          url: "/beneficiaries",
          icon: HeartHandshake,
          isActive: pathname.startsWith("/beneficiaries"),
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
          title: "Emergency & Guardians",
          url: "/guardians",
          icon: ShieldAlert,
          isActive: pathname.startsWith("/guardians"),
        },
        {
          title: "Access & Emergency Control",
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
          title: "Security & Settings",
          url: "/settings",
          icon: Settings,
          isActive: pathname.startsWith("/settings"),
        },
      ],
    },
    {
      title: "Help",
      items: [
        {
          title: "User Guide",
          url: "/guide",
          icon: BookOpen,
          isActive: pathname.startsWith("/guide"),
        },
      ],
    },
  ];

  // Filter each section's items by user permissions, then remove empty sections
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canAccessModule(item.url, permissions, isSuperUser)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-sidebar-border bg-sidebar-background shrink-0 h-screen sticky top-0 overflow-y-auto transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      aria-label="Main navigation"
    >
      {/* Brand Header */}
      <div
        className={`p-3.5 border-b border-sidebar-border flex items-center transition-all ${
          isCollapsed ? "flex-col gap-2.5 justify-center px-2" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 shrink-0">
            <Image
              src="/assets/images/logo.png"
              alt="Life Official Logo"
              fill
              className="object-contain"
              priority
              sizes="32px"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-sidebar-foreground/95">
                  Life
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  PWA
                </span>
              </div>
              <span className="text-[11px] text-sidebar-foreground/70 font-medium truncate">
                Legacy & Continuity
              </span>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-1.5 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-colors shrink-0 cursor-pointer"
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className={`flex-1 py-4 space-y-5 overflow-y-auto overflow-x-hidden ${isCollapsed ? "px-2" : "px-3"}`}>
        {filteredSections.map((section, sIdx) => (
          <nav
            key={section.title}
            className="space-y-1"
            aria-label={section.title}
          >
            {isCollapsed ? (
              sIdx > 0 && <div className="my-2 border-t border-sidebar-border/60 mx-1" />
            ) : (
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/50 px-3 mb-1.5">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    title={isCollapsed ? item.title : undefined}
                    className={`flex items-center rounded-xl text-xs font-medium transition-all group relative ${
                      isCollapsed
                        ? "justify-center p-2.5"
                        : "justify-between px-3 py-2"
                    } ${
                      item.isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 shadow-xs"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }`}
                    aria-label={
                      item.isActive
                        ? `${item.title} (current page)`
                        : `Navigate to ${item.title}`
                    }
                    aria-current={item.isActive ? "page" : undefined}
                  >
                    <div className={`flex items-center min-w-0 ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${
                          item.isActive
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-sidebar-foreground/50"
                        }`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </div>

                    {!isCollapsed && (item as any).badge !== undefined && (
                      <span
                        className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold shrink-0"
                        aria-label={`${(item as any).badge} active items`}
                      >
                        {(item as any).badge}
                      </span>
                    )}

                    {isCollapsed && (item as any).badge !== undefined && (
                      <span
                        className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-sidebar-background shrink-0"
                        aria-label={`${(item as any).badge} active items`}
                      />
                    )}

                    {item.isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-500 dark:bg-emerald-400"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        ))}
      </div>

      {/* Security Footer Info */}
      {isCollapsed ? (
        <div
          className="p-2.5 m-2 rounded-xl bg-sidebar-accent/70 border border-sidebar-border flex items-center justify-center"
          title="Vault AES-256 · v1.0 PWA"
        >
          <span
            className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="p-3 m-3 rounded-xl bg-sidebar-accent/70 border border-sidebar-border text-[11px] text-sidebar-foreground/60 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
              aria-hidden="true"
            />
            Vault AES-256
          </span>
          <span className="text-[10px] font-mono text-sidebar-foreground/50 shrink-0">
            v1.0 PWA
          </span>
        </div>
      )}
    </aside>
  );
}
