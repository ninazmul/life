"use client";

import { useState } from "react";
import { LifeSidebar } from "./LifeSidebar";
import { LifeHeader } from "./LifeHeader";
import { LifeBottomNav } from "./LifeBottomNav";
import { LifeMoreSheet } from "./LifeMoreSheet";
import { PWAProvider } from "../PWAProvider";

interface LifeLayoutClientProps {
  children: React.ReactNode;
  userName?: string;
  isEmergencyActive?: boolean;
}

export function LifeLayoutClient({
  children,
  userName = "Owner",
  isEmergencyActive = false,
}: LifeLayoutClientProps) {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  return (
    <PWAProvider>
      <div className="life-shell flex min-h-screen bg-background text-foreground transition-colors">
        {/* Desktop Responsive Sidebar */}
        <LifeSidebar />

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
          <LifeBottomNav onOpenMore={() => setMoreSheetOpen(true)} />

          {/* Mobile Native "More" Sheet */}
          <LifeMoreSheet
            open={moreSheetOpen}
            onOpenChange={setMoreSheetOpen}
          />
        </div>
      </div>
    </PWAProvider>
  );
}
