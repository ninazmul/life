"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Settings,
  Inbox,
  Clock,
  Database,
  ChevronRight,
  Shield,
  LifeBuoy,
  Users,
} from "lucide-react";
import { getToolsSupportOverview } from "@/lib/actions/lifeToolsSupport.actions";
import { SecurityRecoverySection } from "./SecurityRecoverySection";
import { RequestsApprovalsSection } from "./RequestsApprovalsSection";
import { RecoveryGuardiansSection } from "./RecoveryGuardiansSection";
import { AccountRecoveryView } from "./AccountRecoveryView";
import { AppSettingsSection } from "./AppSettingsSection";
import { ActivityHistorySection } from "./ActivityHistorySection";
import { DataBackupSection } from "./DataBackupSection";

export type ToolsSection =
  | "overview"
  | "security_recovery"
  | "app_settings"
  | "requests_approvals"
  | "activity_history"
  | "data_backup"
  | "recovery_guardians"
  | "account_recovery";

interface ToolsSupportPageProps {
  onBack: () => void;
  initialSection?: string;
  initialFilter?: string;
}

export function ToolsSupportPage({
  onBack,
  initialSection = "overview",
  initialFilter,
}: ToolsSupportPageProps) {
  const [activeSection, setActiveSection] = useState<ToolsSection>(
    (initialSection as ToolsSection) || "overview"
  );
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await getToolsSupportOverview();
      if (res.success && res.data) {
        setOverviewData(res.data);
      }
    } catch (err) {
      console.error("Error loading tools overview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleBackToOverview = () => {
    if (activeSection === "recovery_guardians" || activeSection === "account_recovery") {
      setActiveSection("security_recovery");
    } else {
      setActiveSection("overview");
    }
  };

  // Section Header Info
  const getSectionHeader = () => {
    switch (activeSection) {
      case "security_recovery":
        return {
          title: "Security & Recovery",
          subtitle: "Login protection, sessions, and secure account recovery",
        };
      case "app_settings":
        return {
          title: "App Settings",
          subtitle: "Language, appearance, and general preferences",
        };
      case "requests_approvals":
        return {
          title: "Requests & Approvals",
          subtitle: "Unified inbox for authorized review requests",
        };
      case "activity_history":
        return {
          title: "Activity History",
          subtitle: "History of relevant, important actions",
        };
      case "data_backup":
        return {
          title: "Data & Backup",
          subtitle: "Authorized exports, backup status, and recovery utilities",
        };
      case "recovery_guardians":
        return {
          title: "Recovery Guardians",
          subtitle: "Guardians who verify identity to restore account access",
        };
      case "account_recovery":
        return {
          title: "Account Recovery",
          subtitle: "Verified restoration for locked or compromised accounts",
        };
      default:
        return {
          title: "Tools & Support",
          subtitle: "Security, settings and account tools.",
        };
    }
  };

  const headerInfo = getSectionHeader();

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={activeSection === "overview" ? onBack : handleBackToOverview}
          aria-label="Go back"
          className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-[#1E1B4B] tracking-tight truncate">
            {headerInfo.title}
          </h1>
          <p className="text-[12px] text-slate-500 font-normal truncate mt-0.2">
            {headerInfo.subtitle}
          </p>
        </div>
      </div>

      {/* SCREEN 1: 5 MAIN SECTIONS OVERVIEW */}
      {activeSection === "overview" && (
        <div className="space-y-4 pt-1">
          {/* Stack of 5 Compact Section Cards */}
          <div className="space-y-3">
            {/* Card 1: Security & Recovery */}
            <button
              type="button"
              onClick={() => setActiveSection("security_recovery")}
              className="w-full bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-indigo-100 transition-all flex items-center gap-3.5 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] border border-sky-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-[#1E1B4B] group-hover:text-indigo-600 transition-colors">
                    Security & Recovery
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                    {overviewData?.securitySummary?.statusLabel || "Protection"}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                  Login protection, sessions, and secure account recovery
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Card 2: App Settings */}
            <button
              type="button"
              onClick={() => setActiveSection("app_settings")}
              className="w-full bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-indigo-100 transition-all flex items-center gap-3.5 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h3 className="text-[15px] font-bold text-[#1E1B4B] group-hover:text-indigo-600 transition-colors">
                  App Settings
                </h3>
                <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                  Language, appearance, and general preferences
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Card 3: Requests & Approvals */}
            <button
              type="button"
              onClick={() => setActiveSection("requests_approvals")}
              className="w-full bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-indigo-100 transition-all flex items-center gap-3.5 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-[#1E1B4B] group-hover:text-indigo-600 transition-colors">
                    Requests & Approvals
                  </h3>
                  {overviewData?.pendingRequestsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
                      {overviewData.pendingRequestsCount} Pending
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                  Unified inbox for authorized review requests
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Card 4: Activity History */}
            <button
              type="button"
              onClick={() => setActiveSection("activity_history")}
              className="w-full bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-indigo-100 transition-all flex items-center gap-3.5 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h3 className="text-[15px] font-bold text-[#1E1B4B] group-hover:text-indigo-600 transition-colors">
                  Activity History
                </h3>
                <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                  History of relevant, important actions
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Card 5: Data & Backup */}
            <button
              type="button"
              onClick={() => setActiveSection("data_backup")}
              className="w-full bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-indigo-100 transition-all flex items-center gap-3.5 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h3 className="text-[15px] font-bold text-[#1E1B4B] group-hover:text-indigo-600 transition-colors">
                  Data & Backup
                </h3>
                <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                  Authorized exports, backup status, and recovery utilities
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>

          {/* Footer Requirement */}
          <div className="text-center pt-3 pb-6">
            <p className="text-xs text-slate-400 font-normal">
              Private by default. Access stays under your control.
            </p>
          </div>
        </div>
      )}

      {/* SCREEN 2: SECURITY & RECOVERY */}
      {activeSection === "security_recovery" && (
        <SecurityRecoverySection
          overviewData={overviewData}
          onNavigateToGuardians={() => setActiveSection("recovery_guardians")}
          onNavigateToRecovery={() => setActiveSection("account_recovery")}
          onRefresh={fetchOverview}
        />
      )}

      {/* SCREEN 3: REQUESTS & APPROVALS */}
      {activeSection === "requests_approvals" && (
        <RequestsApprovalsSection onRefresh={fetchOverview} />
      )}

      {/* SCREEN 4: RECOVERY GUARDIANS */}
      {activeSection === "recovery_guardians" && (
        <RecoveryGuardiansSection onRefresh={fetchOverview} />
      )}

      {/* SCREEN 5: ACCOUNT RECOVERY */}
      {activeSection === "account_recovery" && (
        <AccountRecoveryView onBack={() => setActiveSection("security_recovery")} />
      )}

      {/* INNER VIEW: APP SETTINGS */}
      {activeSection === "app_settings" && (
        <AppSettingsSection
          initialSettings={overviewData?.settings}
          onRefresh={fetchOverview}
        />
      )}

      {/* INNER VIEW: ACTIVITY HISTORY */}
      {activeSection === "activity_history" && <ActivityHistorySection />}

      {/* INNER VIEW: DATA & BACKUP */}
      {activeSection === "data_backup" && (
        <DataBackupSection
          lastBackupDate={overviewData?.lastBackupDate}
          onRefresh={fetchOverview}
        />
      )}
    </div>
  );
}
