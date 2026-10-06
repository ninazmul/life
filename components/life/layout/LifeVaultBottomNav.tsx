"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { LifeVaultMoreSheet } from "./LifeVaultMoreSheet";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "People", href: "/people", icon: Users },
  { label: "Records", href: "/documents", icon: FileText },
];

export function LifeVaultBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isAnyPrimaryActive = NAV_ITEMS.some((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  const isMoreActive = !isAnyPrimaryActive && pathname !== "/";

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100 pb-safe"
        role="navigation"
        aria-label="Mobile bottom navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
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
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative ${
                  isActive
                    ? "text-indigo-600 font-semibold"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                aria-label={
                  isActive ? `${item.label} (current)` : `Go to ${item.label}`
                }
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-5 h-5 transition-transform shrink-0 ${
                    isActive ? "scale-110" : ""
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  aria-hidden="true"
                />
                <span className="text-[11px] mt-0.5 tracking-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className="absolute -top-0 w-8 h-0.5 rounded-full bg-indigo-600"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative ${
              isMoreActive
                ? "text-indigo-600 font-semibold"
                : "text-slate-400 hover:text-slate-600"
            }`}
            aria-label="Open more sections"
          >
            <MoreHorizontal
              className={`w-5 h-5 transition-transform shrink-0 ${
                isMoreActive ? "scale-110" : ""
              }`}
              strokeWidth={isMoreActive ? 2.2 : 1.8}
              aria-hidden="true"
            />
            <span className="text-[11px] mt-0.5 tracking-tight">More</span>
            {isMoreActive && (
              <span
                className="absolute -top-0 w-8 h-0.5 rounded-full bg-indigo-600"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </nav>

      <LifeVaultMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
