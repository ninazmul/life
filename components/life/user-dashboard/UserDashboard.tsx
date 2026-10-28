/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  FileText,
  Lock,
  MessageSquare,
  Wallet,
  Heart,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Megaphone,
  BookOpen,
} from "lucide-react";
import Image from "next/image";
import { UserModuleAccess } from "@/lib/life/module-access";
import { UserDashboardData } from "@/lib/actions/lifeUserDashboard.actions";
import { UserNotesSection } from "./UserNotesSection";
import { UserSecureFuture } from "./UserSecureFuture";
import { UserRequestsSection } from "./UserRequestsSection";
import { UserLoanDetail } from "./UserLoanDetail";
import { UserSupportDetail } from "./UserSupportDetail";
import { UserDocumentsView } from "./UserDocumentsView";
import { UserResponsibilitiesView } from "./UserResponsibilitiesView";

// ── Types ──
interface UserDashboardProps {
  data: UserDashboardData;
  userAccess: UserModuleAccess;
  ownerName?: string;
}

type ActiveSection =
  | null
  | "notes"
  | "secure"
  | "requests"
  | "loan"
  | "support"
  | "documents"
  | "responsibilities";

// ── Helpers ──
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  if (h < 21) return "Good Evening";
  return "Good Night";
}

function getFirstName(name: string): string {
  return name.split(" ")[0] || "User";
}

function formatMoney(amount: number, symbol = "৳"): string {
  if (isNaN(amount) || amount === 0) return `${symbol} 0`;
  return `${symbol} ${Number(amount).toLocaleString("en-US")}`;
}

// ── Update Priority Config ──
const PRIORITY_CONFIG = {
  action_required: {
    bg: "bg-red-50",
    border: "border-red-100",
    badge: "bg-red-500 text-white",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
  important: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    badge: "bg-amber-500 text-white",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  info: {
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    badge: "bg-indigo-500 text-white",
    icon: CheckCircle2,
    iconColor: "text-indigo-500",
  },
};

// ═══════════════════════════════════════════════
// MAIN USER DASHBOARD COMPONENT
// ═══════════════════════════════════════════════
export function UserDashboard({ data, userAccess, ownerName }: UserDashboardProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [updateIndex, setUpdateIndex] = useState(0);
  const [loanVisible, setLoanVisible] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);

  const userName = getFirstName(userAccess.name || "User");
  const greeting = getGreeting();
  const updates = data.updates || [];
  const currentUpdate = updates[updateIndex] || null;
  const { overview, badges, notificationCount } = data;

  // ── Swipe handling ──
  const goNext = useCallback(() => {
    if (updateIndex < updates.length - 1) setUpdateIndex((i) => i + 1);
  }, [updateIndex, updates.length]);

  const goPrev = useCallback(() => {
    if (updateIndex > 0) setUpdateIndex((i) => i - 1);
  }, [updateIndex]);

  // ── Section Navigation ──
  const openSection = (section: ActiveSection) => setActiveSection(section);
  const closeSection = () => setActiveSection(null);

  // ── If a section is open, render that section ──
  if (activeSection === "notes") {
    return <UserNotesSection onBack={closeSection} ownerName={ownerName} />;
  }
  if (activeSection === "secure") {
    return <UserSecureFuture onBack={closeSection} />;
  }
  if (activeSection === "requests") {
    return <UserRequestsSection onBack={closeSection} />;
  }
  if (activeSection === "loan") {
    return <UserLoanDetail onBack={closeSection} />;
  }
  if (activeSection === "support") {
    return <UserSupportDetail onBack={closeSection} ownerName={ownerName} />;
  }
  if (activeSection === "documents") {
    return <UserDocumentsView onBack={closeSection} ownerName={ownerName} />;
  }
  if (activeSection === "responsibilities") {
    return <UserResponsibilitiesView onBack={closeSection} ownerName={ownerName} />;
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-3 sm:space-y-4">
      {/* ── Greeting ── */}
      <div className="pt-1">
        <h1 className="text-lg sm:text-xl font-extrabold text-[#1E1B4B] leading-tight">
          {greeting}, <span className="text-[#4F46E5]">{userName}</span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
          Your updates, guidance and shared information.
        </p>
      </div>

      {/* ── Life Updates & Direction ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Megaphone className="w-3.5 h-3.5 text-[#4F46E5]" />
            </div>
            <h2 className="text-sm sm:text-[15px] font-bold text-[#1E1B4B]">
              Life Updates & Direction
            </h2>
          </div>
          {updates.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400">
                {updateIndex + 1} / {updates.length}
              </span>
              <button
                onClick={goPrev}
                disabled={updateIndex === 0}
                className="w-6 h-6 rounded-full border border-slate-200/80 bg-white flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors"
                aria-label="Previous update"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <button
                onClick={goNext}
                disabled={updateIndex >= updates.length - 1}
                className="w-6 h-6 rounded-full border border-slate-200/80 bg-white flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors"
                aria-label="Next update"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          )}
        </div>

        {/* Update Card */}
        {currentUpdate ? (
          <div
            className={`rounded-2xl border p-4 transition-all ${
              PRIORITY_CONFIG[currentUpdate.priority]?.bg || "bg-white"
            } ${PRIORITY_CONFIG[currentUpdate.priority]?.border || "border-slate-100"}`}
          >
            {/* Priority Badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                {(() => {
                  const Icon = PRIORITY_CONFIG[currentUpdate.priority]?.icon || AlertCircle;
                  return (
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        PRIORITY_CONFIG[currentUpdate.priority]?.iconColor || "text-slate-500"
                      }`}
                    />
                  );
                })()}
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  PRIORITY_CONFIG[currentUpdate.priority]?.badge || "bg-slate-100 text-slate-600"
                }`}
              >
                {currentUpdate.priorityLabel}
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="text-sm sm:text-[15px] font-bold text-[#1E1B4B] leading-snug mb-1">
              {currentUpdate.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
              {currentUpdate.description}
            </p>
            {currentUpdate.deadline && (
              <p className="text-[10px] text-slate-400 mb-3">
                Deadline: {currentUpdate.deadline}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                className={`flex-1 h-9 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  currentUpdate.leftButtonState === "viewed" || currentUpdate.leftButtonState === "viewed_pending"
                    ? "bg-white/60 text-emerald-600 border border-emerald-100"
                    : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {currentUpdate.leftButtonState === "viewed" || currentUpdate.leftButtonState === "viewed_pending" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {currentUpdate.leftButtonLabel}
              </button>
              <button
                onClick={() => openSection(currentUpdate.rightButtonAction as ActiveSection)}
                className="flex-1 h-9 rounded-xl bg-[#4F46E5] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#4338CA] transition-colors"
              >
                {currentUpdate.rightButtonLabel}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-[#1E1B4B] mb-0.5">You&apos;re All Caught Up</p>
            <p className="text-[11px] text-slate-500">No updates need your attention right now.</p>
          </div>
        )}
      </div>

      {/* ── Three Section Buttons ── */}
      <div className="grid grid-cols-3 gap-2">
        {/* Notes & Instructions */}
        <button
          onClick={() => openSection("notes")}
          className="group relative bg-white rounded-xl border border-slate-100/90 px-2.5 py-3 flex flex-col items-center gap-1.5 hover:border-indigo-200 hover:shadow-sm transition-all"
        >
          {badges.notesNew > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center min-w-[18px] px-1">
              {badges.notesNew}
            </span>
          )}
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 leading-tight text-center">
            Notes &<br />Instructions
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-[#4F46E5] transition-colors" />
        </button>

        {/* Secure & Future */}
        <button
          onClick={() => openSection("secure")}
          className="group relative bg-white rounded-xl border border-slate-100/90 px-2.5 py-3 flex flex-col items-center gap-1.5 hover:border-indigo-200 hover:shadow-sm transition-all"
        >
          {badges.secureNew > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center min-w-[18px] px-1">
              {badges.secureNew}
            </span>
          )}
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <Lock className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 leading-tight text-center">
            Secure &<br />Future
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-[#4F46E5] transition-colors" />
        </button>

        {/* My Requests */}
        <button
          onClick={() => openSection("requests")}
          className="group relative bg-white rounded-xl border border-slate-100/90 px-2.5 py-3 flex flex-col items-center gap-1.5 hover:border-indigo-200 hover:shadow-sm transition-all"
        >
          {badges.requestsNew > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center min-w-[18px] px-1">
              {badges.requestsNew}
            </span>
          )}
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 leading-tight text-center">
            My<br />Requests
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-[#4F46E5] transition-colors" />
        </button>
      </div>

      {/* ── My Overview ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[#1E1B4B]" />
          </div>
          <h2 className="text-sm sm:text-[15px] font-bold text-[#1E1B4B]">My Overview</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* My Loan */}
          {overview.hasLoan && (
            <button
              onClick={() => openSection("loan")}
              className="bg-white rounded-2xl border border-slate-100/90 p-3.5 text-left hover:shadow-sm hover:border-indigo-100 transition-all group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-sky-600" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setLoanVisible((v) => !v); }}
                  className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  aria-label={loanVisible ? "Hide amount" : "Show amount"}
                >
                  {loanVisible ? (
                    <EyeOff className="w-3 h-3 text-slate-400" />
                  ) : (
                    <Eye className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mb-0.5">My Loan</p>
              <p className="text-base sm:text-lg font-extrabold text-[#1E1B4B] leading-tight">
                {loanVisible ? formatMoney(overview.loanTotal) : "৳ •••••"}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-slate-400 font-medium">{overview.loanLabel}</p>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#4F46E5] transition-colors" />
              </div>
            </button>
          )}

          {/* My Support */}
          {overview.hasSupport && (
            <button
              onClick={() => openSection("support")}
              className="bg-white rounded-2xl border border-slate-100/90 p-3.5 text-left hover:shadow-sm hover:border-indigo-100 transition-all group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-emerald-600" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSupportVisible((v) => !v); }}
                  className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                  aria-label={supportVisible ? "Hide amount" : "Show amount"}
                >
                  {supportVisible ? (
                    <EyeOff className="w-3 h-3 text-slate-400" />
                  ) : (
                    <Eye className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mb-0.5">My Support</p>
              <p className="text-base sm:text-lg font-extrabold text-[#1E1B4B] leading-tight">
                {supportVisible ? formatMoney(overview.supportTotal) : "৳ •••••"}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-slate-400 font-medium">{overview.supportLabel}</p>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#4F46E5] transition-colors" />
              </div>
            </button>
          )}

          {/* Shared Documents */}
          {overview.hasDocuments && (
            <button
              onClick={() => openSection("documents")}
              className="bg-white rounded-2xl border border-slate-100/90 p-3.5 text-left hover:shadow-sm hover:border-indigo-100 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mb-0.5">Shared Documents</p>
              <p className="text-base sm:text-lg font-extrabold text-[#1E1B4B] leading-tight">
                {overview.documentsCount} <span className="text-xs font-bold text-slate-400">available</span>
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-slate-400 font-medium">View only</p>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#4F46E5] transition-colors" />
              </div>
            </button>
          )}

          {/* My Responsibilities */}
          {overview.hasResponsibilities && (
            <button
              onClick={() => openSection("responsibilities")}
              className="bg-white rounded-2xl border border-slate-100/90 p-3.5 text-left hover:shadow-sm hover:border-indigo-100 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mb-0.5">My Responsibilities</p>
              <p className="text-base sm:text-lg font-extrabold text-[#1E1B4B] leading-tight">
                {overview.responsibilitiesPending > 0 ? (
                  <>{overview.responsibilitiesPending} <span className="text-xs font-bold text-slate-400">pending</span></>
                ) : (
                  <>{overview.responsibilitiesOngoing} <span className="text-xs font-bold text-slate-400">ongoing</span></>
                )}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-slate-400 font-medium">
                  {overview.responsibilitiesPending > 0 && overview.responsibilitiesOngoing > 0
                    ? `${overview.responsibilitiesOngoing} ongoing`
                    : overview.responsibilitiesPending > 0
                    ? "Awaiting response"
                    : "Active"}
                </p>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#4F46E5] transition-colors" />
              </div>
            </button>
          )}

          {/* Empty state if no overview cards */}
          {!overview.hasLoan && !overview.hasSupport && !overview.hasDocuments && !overview.hasResponsibilities && (
            <div className="col-span-2 bg-white rounded-2xl border border-slate-100/90 p-6 text-center">
              <p className="text-xs text-slate-400 font-medium">No shared information available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Privacy Footer ── */}
      <div className="flex items-center justify-center gap-1.5 py-4 pb-8">
        <Lock className="w-3 h-3 text-slate-400" />
        <p className="text-[10px] text-slate-400 font-medium">
          Only information shared with you appears here.
        </p>
      </div>
    </div>
  );
}
