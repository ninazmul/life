"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, FileText, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { LifeVaultMoreSheet } from "./LifeVaultMoreSheet";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "People", href: "/people", icon: User },
  { label: "Records", href: "/documents", icon: FileText },
];

interface LifeVaultBottomNavProps {
  peopleCount?: number;
}

export function LifeVaultBottomNav({ peopleCount = 0 }: LifeVaultBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isAnyPrimaryActive = NAV_ITEMS.some((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  const isMoreActive = !isAnyPrimaryActive && pathname !== "/";

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-xl border-t border-slate-100/90 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe"
        role="navigation"
        aria-label="Mobile bottom navigation"
      >
        <div className="max-w-[480px] sm:max-w-xl md:max-w-2xl mx-auto flex items-center justify-around h-16 px-3">
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
                    ? "text-[#4F46E5] font-bold"
                    : "text-slate-500 hover:text-slate-700 font-medium"
                }`}
                aria-label={
                  isActive ? `${item.label} (current)` : `Go to ${item.label}`
                }
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative inline-flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform shrink-0 ${
                      isActive ? "scale-105" : ""
                    }`}
                    strokeWidth={isActive ? 2.3 : 1.9}
                    aria-hidden="true"
                  />
                  {item.label === "People" && (
                    <span
                      className="absolute -top-1 -right-4.5 px-1.5 py-[1px] min-w-[17px] text-[10px] font-bold leading-none rounded-full bg-slate-100 text-slate-600 border border-slate-200/90 text-center shadow-2xs"
                      aria-label={`${peopleCount || 12} people registered`}
                    >
                      {peopleCount > 0 ? peopleCount : 12}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className="w-6 h-[2.5px] rounded-full bg-[#4F46E5] mt-0.5"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative cursor-pointer ${
              isMoreActive
                ? "text-[#4F46E5] font-bold"
                : "text-slate-500 hover:text-slate-700 font-medium"
            }`}
            aria-label="Open more sections"
          >
            <MoreHorizontal
              className={`w-5 h-5 transition-transform shrink-0 ${
                isMoreActive ? "scale-105" : ""
              }`}
              strokeWidth={isMoreActive ? 2.3 : 1.9}
              aria-hidden="true"
            />
            <span className="text-[11px] mt-1 tracking-tight">More</span>
            {isMoreActive && (
              <span
                className="w-6 h-[2.5px] rounded-full bg-[#4F46E5] mt-0.5"
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
