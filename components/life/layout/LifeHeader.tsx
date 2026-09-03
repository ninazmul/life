"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Command, ShieldAlert } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LifeSearchDialog } from "@/components/life/shared/LifeSearchDialog";

interface LifeHeaderProps {
  userName?: string;
  isEmergencyActive?: boolean;
}

export function LifeHeader({ userName = "Owner", isEmergencyActive = false }: LifeHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut listener for ⌘K / Ctrl+K
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

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 w-full border-b border-slate-200/80 dark:border-slate-850 bg-white/85 dark:bg-[#070a12]/85 backdrop-blur-xl transition-colors">
        {/* Left: Life Official Logo & Greeting */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/assets/images/logo.png"
                alt="Life Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  Life
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Vault
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px] sm:max-w-[200px]">
                {getGreeting()}, {userName.split(" ")[0]}
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Emergency Chip + Search Button + Theme Toggle + User Avatar */}
        <div className="flex items-center gap-2">
          {/* Emergency Alert Indicator if Active */}
          {isEmergencyActive && (
            <Link
              href="/access"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-bold animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Emergency Active</span>
            </Link>
          )}

          {/* Quick Search Button */}
          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className="h-8.5 px-2.5 sm:px-3 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-medium gap-2 transition-all shadow-none"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline text-xs text-slate-400 font-normal">
              Quick Search...
            </span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-semibold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Clerk User Profile */}
          <div className="pl-1 border-l border-slate-200 dark:border-slate-800 flex items-center">
            <UserButton afterSwitchSessionUrl="/" />
          </div>
        </div>
      </header>

      {/* Global Search Command Palette */}
      <LifeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
