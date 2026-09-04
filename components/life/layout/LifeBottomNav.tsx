"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Wallet, KeyRound, Grid } from "lucide-react";

interface LifeBottomNavProps {
  onOpenMore: () => void;
  activeLoansCount?: number;
}

export function LifeBottomNav({
  onOpenMore,
  activeLoansCount = 0,
}: LifeBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "People",
      href: "/people",
      icon: Users,
      isActive: pathname.startsWith("/people"),
    },
    {
      label: "Money",
      href: "/money",
      icon: Wallet,
      isActive: pathname.startsWith("/money"),
      badge: activeLoansCount > 0 ? activeLoansCount : undefined,
    },
    {
      label: "Vault",
      href: "/vault",
      icon: KeyRound,
      isActive: pathname.startsWith("/vault"),
    },
  ];

  const isMoreActive =
    pathname.startsWith("/information") ||
    pathname.startsWith("/business") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/legacy") ||
    pathname.startsWith("/access") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/settings");

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 dark:bg-[#070a12]/95 backdrop-blur-xl border-t border-border shadow-[0_-10px_30px_rgba(15,23,42,0.08)] dark:shadow-none pb-safe"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative ${
                item.isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={
                item.isActive
                  ? `${item.label} (current tab)`
                  : `Go to ${item.label}`
              }
              aria-current={item.isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform shrink-0 ${
                    item.isActive ? "scale-110" : ""
                  }`}
                  strokeWidth={item.isActive ? 2.25 : 1.8}
                  aria-hidden="true"
                />
                {item.badge !== undefined && (
                  <span
                    className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold shrink-0"
                    aria-label={`${item.badge} pending`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">
                {item.label}
              </span>
              {item.isActive && (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative ${
            isMoreActive
              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={
            isMoreActive
              ? "More modules (current section open)"
              : "Open more Life modules"
          }
          aria-expanded={isMoreActive}
        >
          <Grid
            className={`w-5 h-5 transition-transform shrink-0 ${
              isMoreActive ? "scale-110" : ""
            }`}
            strokeWidth={isMoreActive ? 2.25 : 1.8}
            aria-hidden="true"
          />
          <span className="text-[11px] mt-1 tracking-tight">More</span>
          {isMoreActive && (
            <span
              className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </nav>
  );
}
