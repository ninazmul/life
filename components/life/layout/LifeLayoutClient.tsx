"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LifeSidebar } from "./LifeSidebar";
import { LifeHeader } from "./LifeHeader";
import { LifeBottomNav } from "./LifeBottomNav";
import { LifeMoreSheet } from "./LifeMoreSheet";
import { PWAProvider } from "../PWAProvider";
import { UserModuleAccess } from "@/lib/life/module-access";

interface LifeLayoutClientProps {
  children: React.ReactNode;
  userName?: string;
  isEmergencyActive?: boolean;
  userAccess: UserModuleAccess;
}

export function LifeLayoutClient({
  children,
  userName = "Owner",
  isEmergencyActive = false,
  userAccess,
}: LifeLayoutClientProps) {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const pathname = usePathname();

  // The new Life Vault dashboard (/) and profile (/profile) share the same clean theme & layout.
  // For all other pages, use the existing chrome (sidebar, header, bottom nav).
  const isDashboard = pathname === "/";
  const isProfile = pathname === "/profile";

  if (isDashboard || isProfile) {
    return (
      <PWAProvider>
        <div className="lv-shell flex min-h-screen transition-colors">
          {/* Desktop Sidebar (visible on desktop for consistency) */}
          <LifeSidebar userAccess={userAccess} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
            {/* Top Header — always visible across all views */}
            <LifeHeader
              userName={userName}
              isEmergencyActive={isEmergencyActive}
            />

            {/* Page Content — fluid full width responsive layout for mobile, tablet and desktop */}
            <main
              className={`flex-1 ${
                isProfile
                  ? "p-2 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-12"
                  : "p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-12"
              } w-full`}
            >
              {children}
            </main>
          </div>
        </div>
      </PWAProvider>
    );
  }

  return (
    <PWAProvider>
      <div className="life-shell flex min-h-screen bg-background text-foreground transition-colors">
        {/* Desktop Responsive Sidebar */}
        <LifeSidebar userAccess={userAccess} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
          {/* Top Header */}
          <LifeHeader
            userName={userName}
            isEmergencyActive={isEmergencyActive}
          />

          {/* Page Content */}
          <main className="flex-1 p-3 sm:p-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* Mobile Native Bottom Navigation */}
          <LifeBottomNav
            onOpenMore={() => setMoreSheetOpen(true)}
            userAccess={userAccess}
          />

          {/* Mobile Native "More" Sheet */}
          <LifeMoreSheet
            open={moreSheetOpen}
            onOpenChange={setMoreSheetOpen}
            userAccess={userAccess}
          />
        </div>
      </div>
    </PWAProvider>
  );
}
