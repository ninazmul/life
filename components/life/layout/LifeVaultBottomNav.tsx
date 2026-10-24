"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, LayoutGrid } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "People", href: "/people", icon: Users },
  { label: "Workspace", href: "/workspace", icon: LayoutGrid },
];

interface LifeVaultBottomNavProps {
  peopleCount?: number;
}

export function LifeVaultBottomNav({ peopleCount = 0 }: LifeVaultBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100/90 dark:border-slate-800 shadow-[0_-2px_12px_rgba(30,27,75,0.04)] pb-safe"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="max-w-[480px] sm:max-w-xl md:max-w-2xl mx-auto flex items-center justify-around h-16 px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-all duration-200 relative ${
                isActive
                  ? "bg-[#EDE9FE] dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 font-bold px-5 py-1.5 rounded-2xl shadow-2xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium py-1 px-4"
              }`}
              aria-label={
                isActive ? `${item.label} (current)` : `Go to ${item.label}`
              }
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative inline-flex items-center justify-center">
                <Icon
                  className="w-5 h-5 shrink-0"
                  strokeWidth={isActive ? 2.4 : 1.9}
                  aria-hidden="true"
                />
                {item.label === "People" && typeof peopleCount === "number" && peopleCount > 0 && (
                  <span
                    className="absolute -top-1 -right-3 px-1 py-[0.5px] min-w-[15px] text-[9px] font-bold leading-none rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700 text-center shadow-2xs"
                    aria-label={`${peopleCount} people registered`}
                  >
                    {peopleCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
