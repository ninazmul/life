"use client";

import { usePathname } from "next/navigation";
import { LifeSidebar } from "./LifeSidebar";
import { LifeHeader } from "./LifeHeader";
import { LifeVaultBottomNav } from "./LifeVaultBottomNav";
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
  const pathname = usePathname();

  const isProfile = pathname === "/profile";
  const isDashboard = pathname === "/";

  return (
    <PWAProvider>
      <div className="lv-shell flex min-h-screen bg-[#F7F6FC] transition-colors">
        {/* Desktop Responsive Sidebar */}
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

          {/* Mobile Native Bottom Navigation — Always visible on mobile */}
          <LifeVaultBottomNav />
        </div>
      </div>
    </PWAProvider>
  );
}
