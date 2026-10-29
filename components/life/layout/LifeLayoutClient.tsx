"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { LifeSidebar } from "./LifeSidebar";
import { LifeHeader } from "./LifeHeader";
import { LifeVaultBottomNav } from "./LifeVaultBottomNav";
import { LifeBottomNav } from "./LifeBottomNav";
import { LifeMoreSheet } from "./LifeMoreSheet";
import { PWAProvider } from "../PWAProvider";
import { UserModuleAccess } from "@/lib/life/module-access";

interface LifeLayoutClientProps {
  children: React.ReactNode;
  userName?: string;
  isEmergencyActive?: boolean;
  peopleCount?: number;
  userAccess: UserModuleAccess;
}

export function LifeLayoutClient({
  children,
  userName = "Owner",
  isEmergencyActive = false,
  peopleCount,
  userAccess,
}: LifeLayoutClientProps) {
  const pathname = usePathname();

  const isProfile = pathname === "/profile";
  const isDashboard = pathname === "/";
  const isOwnerOrAdmin = Boolean(userAccess?.isOwner || userAccess?.isAdmin);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <PWAProvider>
      <div className="lv-shell flex min-h-screen bg-[#F7F6FC] transition-colors">
        {/* The sidebar filters modules using the same permissions enforced by each route. */}
        <LifeSidebar userAccess={userAccess} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
          {/* Top Header */}
          <LifeHeader
            userName={userName}
            avatarUrl={userAccess?.avatarUrl}
            isEmergencyActive={isEmergencyActive}
          />

          {/* Page Content — fluid & responsive */}
          <main
            className={`flex-1 ${
              isProfile
                ? "p-2 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-12"
                : isDashboard
                ? "p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-12"
                : "p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto"
            } w-full`}
          >
            {children}
          </main>

          {/* Keep the established owner navigation; invited users get their permission-filtered modules. */}
          {isOwnerOrAdmin ? (
            <LifeVaultBottomNav peopleCount={peopleCount} />
          ) : (
            <>
              <LifeBottomNav userAccess={userAccess} onOpenMore={() => setIsMoreOpen(true)} />
              <LifeMoreSheet open={isMoreOpen} onOpenChange={setIsMoreOpen} userAccess={userAccess} />
            </>
          )}
        </div>
      </div>
    </PWAProvider>
  );
}
