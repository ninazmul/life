"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Command, ShieldAlert, BookOpen, Bell, Check, ExternalLink, Lock, CheckCircle2, Clock } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LifeSearchDialog } from "@/components/life/shared/LifeSearchDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/actions/lifeNotification.actions";
import { ILifeNotification } from "@/types";

interface LifeHeaderProps {
  userName?: string;
  isEmergencyActive?: boolean;
}

export function LifeHeader({
  userName = "Owner",
  isEmergencyActive = false,
}: LifeHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<ILifeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchNotifs = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const data = await getMyNotifications();
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(data?.unreadCount ?? 0);
    } catch {
      // silent fallback
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // 60s polling only when tab is visible

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifs();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifs]);

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

  const handleMarkAllRead = async () => {
    setNotifLoading(true);
    await markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setNotifLoading(false);
  };

  const handleNotificationClick = async (notif: ILifeNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif._id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 w-full border-b border-border bg-background/85 backdrop-blur-xl transition-colors"
        role="banner"
      >
        {/* Left: Life Official Logo & Greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group min-w-0"
            aria-label="Go to Life Home Dashboard"
          >
            <div className="relative w-9 h-9 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/assets/images/logo.png"
                alt="Life Logo"
                fill
                className="object-contain"
                priority
                sizes="36px"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-extrabold tracking-tight text-foreground shrink-0">
                  Life
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  Vault
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[130px] sm:max-w-[200px]">
                {getGreeting()}, {userName.split(" ")[0]}
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Emergency Chip + Search + Notifications + Guide + Theme Toggle + User Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {isEmergencyActive && (
            <Link
              href="/access"
              className="flex h-9 items-center gap-1.5 px-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-bold animate-pulse hover:bg-red-500/25 active:scale-95 transition-all shrink-0"
              aria-label="Emergency Access is Active — go to Emergency Protocol"
            >
              <ShieldAlert
                className="w-4 h-4 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Emergency Active</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 md:w-auto items-center justify-center md:justify-start px-0 md:px-3 rounded-xl border border-border bg-card/60 dark:bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 text-xs font-medium gap-2 transition-all shrink-0 shadow-none"
            aria-label="Open global search (⌘K)"
            title="Quick Search (⌘K)"
          >
            <Search
              className="w-4 h-4 text-muted-foreground shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="hidden md:inline text-xs text-muted-foreground font-normal">
              Quick Search...
            </span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-semibold bg-muted dark:bg-background/80 px-1.5 py-0.5 rounded-md border border-border text-muted-foreground shrink-0 font-mono">
              <Command
                className="w-2.5 h-2.5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              K
            </kbd>
          </button>

          {/* In-App Notifications Bell (§16) */}
          <DropdownMenu onOpenChange={(open) => open && fetchNotifs()}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 dark:bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all shrink-0"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 sm:w-96 p-0 rounded-2xl bg-popover/95 backdrop-blur-xl border border-border shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-3.5 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={notifLoading}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    <p>No notifications yet</p>
                    <p className="text-[10px] mt-1 text-muted-foreground/70">
                      You will be alerted about note releases, unlock requests, and access updates.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnlock = notif.type === "unlock_request";
                    const isRelease = notif.type === "note_released" || notif.type === "scheduled_release";
                    return (
                      <DropdownMenuItem
                        key={notif._id}
                        asChild
                        className={`p-3 cursor-pointer rounded-none focus:bg-accent/80 transition-colors ${
                          !notif.isRead ? "bg-emerald-500/5 dark:bg-emerald-500/10" : ""
                        }`}
                      >
                        <Link
                          href={notif.link || "#"}
                          onClick={() => handleNotificationClick(notif)}
                          className="flex items-start gap-3 w-full"
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isUnlock
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : isRelease
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                            }`}
                          >
                            {isUnlock ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : isRelease ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs truncate ${!notif.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                                {notif.title}
                              </p>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-muted-foreground/70 font-mono mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/guide"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 dark:bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all shrink-0"
            aria-label="Open User Guide"
            title="User Guide"
          >
            <BookOpen className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          </Link>

          <ThemeToggle />

          <div className="pl-1 sm:pl-1.5 border-l border-border flex items-center shrink-0">
            <UserButton
              afterSwitchSessionUrl="/"
              userProfileMode="modal"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 rounded-xl ring-1 ring-border shadow-xs",
                  // Backdrop: center on desktop, stretch on mobile (CSS handles full-screen)
                  modalBackdrop: "items-center justify-center",
                  // Modal content: full-width mobile via CSS, capped at 900px on desktop
                  modalContent:
                    "w-full max-w-[900px] min-h-0 max-h-[90dvh] overflow-hidden rounded-2xl sm:rounded-3xl",
                  // Inner card: column on mobile, row on desktop
                  card: "w-full h-full min-h-0 flex flex-col sm:flex-row shadow-none rounded-2xl sm:rounded-3xl overflow-hidden",
                  // Nav bar: horizontal scroll on mobile, vertical sidebar on desktop
                  navbar:
                    "flex flex-row sm:flex-col w-full sm:w-52 sm:min-w-[13rem] border-b sm:border-b-0 sm:border-r border-border bg-muted/30 p-2 sm:p-3 gap-1 overflow-x-auto sm:overflow-x-visible shrink-0",
                  navbarButton:
                    "text-xs sm:text-sm whitespace-nowrap shrink-0",
                  // Scrollable content area
                  pageScrollBox:
                    "flex-1 overflow-y-auto p-4 sm:p-6 min-h-0",
                  page: "w-full",
                  profileSection: "gap-3",
                  profileSectionTitle: "text-sm font-semibold",
                  formFieldLabel: "text-xs font-medium",
                  formFieldInput: "text-sm h-10",
                  headerTitle: "text-base sm:text-lg font-bold",
                  headerSubtitle: "text-xs text-muted-foreground",
                },
              }}
            />
          </div>
        </div>
      </header>

      <LifeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
