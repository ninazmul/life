/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  Briefcase,
  ClipboardCheck,
  Plus,
  MessageCircle,
  NotebookPen,
  ShieldCheck,
  FileText,
  Users,
  User,
  Wallet,
  Building2,
  Landmark,
  KeyRound,
  Contact,
  CheckSquare,
  AlertCircle,
  Clock,
  LockKeyhole,
  HeartHandshake,
  MessagesSquare,
  Shield,
  Siren,
  Sprout,
  Scale,
} from "lucide-react";
import { LifeDashboardStats } from "@/types";
import { UserModuleAccess } from "@/lib/life/module-access";
import { LifeSearchDialog } from "@/components/life/shared/LifeSearchDialog";
import {
  reviewAccessRequest,
  acknowledgeReleasedRequest,
} from "@/lib/actions/lifeRequest.actions";
import toast from "react-hot-toast";

// ── Types ──
interface LifeVaultDashboardProps {
  stats: LifeDashboardStats;
  userAccess?: UserModuleAccess;
}

// ── Quick Add Menu Items ──
const ADD_MENU_ITEMS = [
  { label: "Person", href: "/people", icon: User },
  { label: "Money Record", href: "/money", icon: Wallet },
  { label: "Business", href: "/business", icon: Building2 },
  { label: "Asset", href: "/assets", icon: Landmark },
  { label: "Vault Secret", href: "/vault", icon: KeyRound },
  { label: "Document", href: "/documents", icon: FileText },
  { label: "Contact", href: "/contacts", icon: Contact },
  { label: "Instruction", href: "/instructions", icon: CheckSquare },
  { label: "Note", href: "/lifenote", icon: NotebookPen },
  { label: "Legacy Letter", href: "/legacy", icon: Sprout },
];

// ── Avatar Component with Fallback ──
function PersonAvatar({
  name,
  avatarUrl,
  profilePhoto,
  size = 56,
  className = "",
}: {
  name: string;
  avatarUrl?: string;
  profilePhoto?: string;
  size?: number;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const src = avatarUrl || profilePhoto || "";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold shrink-0 shadow-inner ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ── Time Left Formatting Helper ──
function getTimeLeftText(expiresAt?: Date | string): string {
  if (!expiresAt) return "6h left to review";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h left to review`;
  return `${minutes}m left to review`;
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT: LIFE VAULT DASHBOARD
// ═══════════════════════════════════════════════════════
export function LifeVaultDashboard({
  stats,
  userAccess,
}: LifeVaultDashboardProps) {
  const router = useRouter();
  const badges = stats.dashboardBadges;
  const profile = stats.ownerProfile;
  const supportRoles = stats.supportRoleCounts;
  const pendingRequests = stats.pendingActionRequests || [];
  const releasedUpdates = stats.releasedUpdates || [];

  // Automatically determine state from live database records (Production Grade)
  const hasActionRequired = pendingRequests.length > 0 || releasedUpdates.length > 0;
  const urgentRequest = pendingRequests[0] || null;
  const pendingCount = pendingRequests.length;

  // Search dialog & Add dropdown state
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.name || userAccess?.name || "Shahidul Islam";
  const roleName =
    profile?.role === "super_admin" || userAccess?.isOwner
      ? "Owner"
      : profile?.role || "Owner";

  // Close add dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    if (addMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [addMenuOpen]);

  // Global search shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Handle Review Decision ──
  const handleDecision = useCallback(
    async (requestId: string, decision: "approve" | "reject") => {
      setDecidingId(requestId);
      try {
        const result = await reviewAccessRequest(requestId, decision);
        if (result.success) {
          toast.success(
            decision === "approve"
              ? "Access approved successfully"
              : "Access request rejected"
          );
          router.refresh();
        } else {
          toast.error(result.error || "Failed to submit decision");
        }
      } catch {
        toast.error("Network error. Please try again.");
      } finally {
        setDecidingId(null);
        setReviewingId(null);
      }
    },
    [router]
  );

  // ── Handle Released Update Acknowledgement ──
  const handleAcknowledge = useCallback(
    async (requestId: string) => {
      try {
        await acknowledgeReleasedRequest(requestId);
        toast.success("Update acknowledged");
        router.refresh();
      } catch {
        toast.error("Failed to acknowledge update");
      }
    },
    [router]
  );

  // ── People & Support Config (Exact visual matching reference) ──
  const peopleSupportItems = [
    {
      label: "Guardian",
      icon: Shield,
      count: supportRoles?.guardian !== undefined ? supportRoles.guardian : 1,
      href: "/people?role=guardian",
      color: "text-[#4F46E5]",
      bg: "bg-[#EEF2FF]",
    },
    {
      label: "Trusted People",
      icon: Users,
      count: supportRoles?.trustedPeople !== undefined ? supportRoles.trustedPeople : 5,
      href: "/people?role=trusted_person",
      color: "text-[#0284C7]",
      bg: "bg-[#E0F2FE]",
    },
    {
      label: "Advisors",
      icon: MessagesSquare,
      count: supportRoles?.advisors !== undefined ? supportRoles.advisors : 1,
      href: "/people?role=advisor",
      color: "text-[#D97706]",
      bg: "bg-[#FEF3C7]",
    },
    {
      label: "Caregivers",
      icon: HeartHandshake,
      count: supportRoles?.caregivers !== undefined ? supportRoles.caregivers : 2,
      href: "/people?role=caregiver",
      color: "text-[#16A34A]",
      bg: "bg-[#DCFCE7]",
    },
  ];

  // ── My Spaces Grid Config ──
  const spacesGrid = [
    {
      title: "Family Care",
      desc: "Care & responsibilities",
      icon: Users,
      href: "/information",
      iconColor: "text-white",
      iconBg: "bg-[#6366F1]",
      cardBg: "bg-[#EEF2FF]/90 border-indigo-100/70",
      chevronColor: "text-[#6366F1]",
    },
    {
      title: "Business",
      desc: "Operations & continuity",
      icon: Briefcase,
      href: "/business",
      iconColor: "text-white",
      iconBg: "bg-[#0284C7]",
      cardBg: "bg-[#E0F2FE]/90 border-sky-100/70",
      chevronColor: "text-[#0284C7]",
    },
    {
      title: "Responsibilities",
      desc: "Assign & follow up",
      icon: ClipboardCheck,
      href: "/instructions",
      iconColor: "text-[#16A34A]",
      iconBg: "bg-[#DCFCE7]",
      cardBg: "bg-white border-slate-100/90",
      chevronColor: "text-slate-300",
    },
    {
      title: "Emergency Plan",
      desc: "Urgent action plan",
      icon: Siren,
      href: "/contacts",
      iconColor: "text-[#DC2626]",
      iconBg: "bg-[#FEE2E2]",
      cardBg: "bg-white border-slate-100/90",
      chevronColor: "text-slate-300",
    },
    {
      title: "Legacy Plan",
      desc: "Future instructions",
      icon: Sprout,
      href: "/legacy",
      iconColor: "text-[#E11D48]",
      iconBg: "bg-[#FFE4E6]",
      cardBg: "bg-white border-slate-100/90",
      chevronColor: "text-slate-300",
    },
    {
      title: "Legal & Will",
      desc: "Legal guidance",
      icon: Scale,
      href: "/documents",
      iconColor: "text-[#4338CA]",
      iconBg: "bg-[#E0E7FF]",
      cardBg: "bg-white border-slate-100/90",
      chevronColor: "text-slate-300",
    },
  ];

  return (
    <div className="lcc-root w-full min-h-screen pb-20 md:pb-10 transition-colors">
      <style jsx global>{`
        body {
          background-color: #F7F6FC;
        }
      `}</style>

      {/* ─── Responsive Container: perfectly framed for mobile, tablet & desktop ─── */}
      {/* ─── Responsive Container: perfectly framed for mobile, tablet & desktop ─── */}
      <div className="w-full max-w-[480px] sm:max-w-xl md:max-w-2xl mx-auto px-1 sm:px-2 pt-1 sm:pt-2">

        {/* ─── Profile Section ─── */}
        {hasActionRequired ? (
          /* Compact Profile Row (When Action Required is active) */
          <div className="flex items-center justify-between px-1 py-1.5 mb-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <PersonAvatar
                name={displayName}
                avatarUrl={userAccess?.avatarUrl || profile?.avatarUrl}
                profilePhoto={userAccess?.avatarUrl || profile?.avatarUrl}
                size={42}
                className="ring-2 ring-white shadow-2xs"
              />
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-[#1E1B4B] truncate leading-tight">
                  {displayName}
                </h2>
                <p className="text-[12px] text-slate-500 font-medium leading-tight mt-0.5">
                  Personal workspace
                </p>
              </div>
            </div>

            <Link
              href={profile?.personId ? `/people/${profile.personId}` : "/settings"}
              className="text-[13px] font-bold text-[#4F46E5] hover:text-indigo-700 flex items-center gap-0.5 shrink-0 transition-colors"
            >
              Profile
              <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
            </Link>
          </div>
        ) : (
          /* Normal State: Full White Profile Card */
          <div className="bg-white rounded-3xl p-4 sm:p-5 mb-3 shadow-[0_2px_12px_rgba(30,27,75,0.04)] border border-slate-100/90 transition-all hover:shadow-[0_4px_16px_rgba(30,27,75,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <PersonAvatar
                  name={displayName}
                  avatarUrl={userAccess?.avatarUrl || profile?.avatarUrl}
                  profilePhoto={userAccess?.avatarUrl || profile?.avatarUrl}
                  size={56}
                  className="ring-2 ring-indigo-50 shadow-xs"
                />
                <div className="min-w-0">
                  <h2 className="text-[17px] sm:text-[18px] font-bold text-[#1E1B4B] truncate leading-tight">
                    {displayName}
                  </h2>
                  <p className="text-[13px] text-slate-500 font-medium leading-tight mt-0.5">
                    Personal workspace
                  </p>
                  <span className="inline-flex items-center mt-1.5 px-3 py-0.5 text-[11px] font-bold tracking-wide rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/60">
                    {roleName}
                  </span>
                </div>
              </div>

              <Link
                href={profile?.personId ? `/people/${profile.personId}` : "/settings"}
                className="text-[13px] sm:text-[14px] font-bold text-[#4F46E5] hover:text-indigo-700 flex items-center gap-0.5 shrink-0 transition-colors"
              >
                Profile
                <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        )}

        {/* ─── Action Required Banner Card (Automatically Shown If Pending) ─── */}
        {hasActionRequired && (
          <div className="mb-3 space-y-2.5">
            {/* Main Action Required Card */}
            {urgentRequest && (
            <div className="bg-[#FFFDF5] border border-amber-200/80 border-l-[4px] border-l-[#F59E0B] rounded-2xl p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(245,158,11,0.06)] transition-all">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.8} />
                  </div>
                  <span className="text-[14px] sm:text-[15px] font-bold text-[#1E1B4B]">
                    Action Required
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[11px] font-bold">
                    {pendingCount} pending
                  </span>
                </div>

                <Link
                  href="/requests"
                  className="text-[12px] sm:text-[13px] font-bold text-[#4F46E5] hover:text-indigo-700 flex items-center gap-0.5 transition-colors shrink-0"
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                </Link>
              </div>

              {/* Review Panel Expanded or Compact */}
              {reviewingId === urgentRequest._id ? (
                /* Inline Decision Panel */
                <div className="mt-2.5 p-3.5 bg-white rounded-xl border border-amber-100 shadow-xs">
                  <p className="text-[13px] font-bold text-[#1E1B4B] mb-1">
                    {urgentRequest.submittedByName} requested access
                  </p>
                  <p className="text-[12px] text-slate-600 mb-1">
                    <span className="font-semibold text-slate-700">Scope:</span>{" "}
                    {urgentRequest.requestedScope || urgentRequest.title}
                  </p>
                  <p className="text-[12px] text-slate-600 mb-1">
                    <span className="font-semibold text-slate-700">Reason:</span>{" "}
                    {urgentRequest.description}
                  </p>
                  {urgentRequest.expiresAt && (
                    <p className="text-[12px] text-slate-600 mb-2">
                      <span className="font-semibold text-slate-700">Deadline:</span>{" "}
                      {new Date(urgentRequest.expiresAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      (server time)
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handleDecision(urgentRequest._id, "approve")}
                      disabled={decidingId === urgentRequest._id}
                      className="flex-1 py-2 px-3 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {decidingId === urgentRequest._id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(urgentRequest._id, "reject")}
                      disabled={decidingId === urgentRequest._id}
                      className="flex-1 py-2 px-3 text-[13px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewingId(null)}
                      className="py-2 px-3 text-[13px] font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Compact Request Preview matching reference */
                <div>
                  <p className="text-[14px] font-bold text-[#1E1B4B]">
                    {urgentRequest.submittedByName} requested access
                  </p>
                  <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                    {urgentRequest.requestedScope || urgentRequest.title}
                  </p>

                  <div className="flex items-center justify-between mt-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-700">
                        <Clock className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.2} />
                        <span>{getTimeLeftText(urgentRequest.expiresAt)}</span>
                      </div>

                      {urgentRequest.autoRelease && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mt-1">
                          <LockKeyhole className="w-3 h-3 text-slate-400" strokeWidth={2} />
                          <span>Auto-release enabled for this item</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setReviewingId(urgentRequest._id)}
                      className="px-4 py-2 text-[13px] font-bold text-white bg-[#3B82F6] hover:bg-[#2563EB] active:scale-95 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      Review
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Released updates banner (if any) */}
            {releasedUpdates.map((update) => (
              <div
                key={update._id}
                className="bg-[#F0FDF4] border border-emerald-200/80 border-l-[4px] border-l-[#22C55E] rounded-2xl p-3.5 shadow-2xs flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-[13px] font-bold text-emerald-800">
                    Information released
                  </p>
                  <p className="text-[12px] text-slate-600 mt-0.5 truncate">
                    &quot;{update.requestedScope || update.title}&quot; auto-released to {update.submittedByName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAcknowledge(update._id)}
                  className="px-3.5 py-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Viewed
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ─── Quick Actions Row ─── */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 mb-3 shadow-[0_2px_12px_rgba(30,27,75,0.04)] border border-slate-100/90">
          <div className="flex items-center justify-around">
            {/* 1. Requests */}
            <Link
              href="/requests"
              className="flex flex-col items-center justify-center gap-1.5 flex-1 py-1 group min-h-[56px] transition-transform active:scale-95"
            >
              <div className="relative">
                <FileText
                  className="w-[23px] h-[23px] text-slate-600 group-hover:text-[#4F46E5] transition-colors"
                  strokeWidth={1.8}
                />
                {(pendingCount > 0 || (badges && badges.requestsCount > 0)) && (
                  <span className="absolute -top-1.5 -right-2 flex h-[16px] min-w-[16px] px-1 items-center justify-center rounded-full bg-[#EF4444] text-white text-[9px] font-bold ring-2 ring-white shadow-2xs">
                    {badges?.requestsCount || pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[12px] font-medium text-slate-600 group-hover:text-[#1E1B4B]">
                Requests
              </span>
            </Link>

            {/* 2. Notes */}
            <Link
              href="/lifenote"
              className="flex flex-col items-center justify-center gap-1.5 flex-1 py-1 group min-h-[56px] transition-transform active:scale-95"
            >
              <NotebookPen
                className="w-[23px] h-[23px] text-slate-600 group-hover:text-[#4F46E5] transition-colors"
                strokeWidth={1.8}
              />
              <span className="text-[12px] font-medium text-slate-600 group-hover:text-[#1E1B4B]">
                Notes
              </span>
            </Link>

            {/* 3. Messages */}
            <Link
              href="/requests"
              className="flex flex-col items-center justify-center gap-1.5 flex-1 py-1 group min-h-[56px] transition-transform active:scale-95"
            >
              <MessageCircle
                className="w-[23px] h-[23px] text-slate-600 group-hover:text-[#4F46E5] transition-colors"
                strokeWidth={1.8}
              />
              <span className="text-[12px] font-medium text-slate-600 group-hover:text-[#1E1B4B]">
                Messages
              </span>
            </Link>

            {/* 4. Security */}
            <Link
              href="/access"
              className="flex flex-col items-center justify-center gap-1.5 flex-1 py-1 group min-h-[56px] transition-transform active:scale-95"
            >
              <ShieldCheck
                className="w-[23px] h-[23px] text-slate-600 group-hover:text-[#4F46E5] transition-colors"
                strokeWidth={1.8}
              />
              <span className="text-[12px] font-medium text-slate-600 group-hover:text-[#1E1B4B]">
                Security
              </span>
            </Link>

            {/* 5. Add */}
            <div className="relative flex-1 flex justify-center" ref={addMenuRef}>
              <button
                type="button"
                onClick={() => setAddMenuOpen(!addMenuOpen)}
                className="flex flex-col items-center justify-center gap-1.5 py-1 min-h-[56px] group transition-transform active:scale-95 cursor-pointer w-full"
                aria-label="Add new record"
              >
                <div className="w-[23px] h-[23px] rounded-full border border-slate-300 flex items-center justify-center group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600" strokeWidth={2.4} />
                </div>
                <span className="text-[12px] font-medium text-slate-600 group-hover:text-[#1E1B4B]">
                  Add
                </span>
              </button>

              {/* Add Dropdown Menu */}
              {addMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Add
                    </p>
                  </div>
                  {ADD_MENU_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setAddMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#EEF2FF] transition-colors text-xs font-semibold text-slate-700"
                    >
                      <item.icon className="w-4 h-4 text-[#4F46E5]" strokeWidth={2} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── People & Support Section ─── */}
        <section className="mb-3 sm:mb-4">
          <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1E1B4B] px-1 mb-2.5">
            People & Support
          </h3>

          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(30,27,75,0.04)] border border-slate-100/90">
            <div className="flex items-start justify-around">
              {peopleSupportItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex flex-col items-center justify-center gap-1.5 flex-1 group min-h-[76px] transition-transform active:scale-95"
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs`}
                    >
                      <Icon className={`w-6 h-6 ${item.color}`} strokeWidth={1.9} />
                    </div>
                    <div className="text-center mt-0.5">
                      <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] block leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        {item.count} {item.count === 1 ? "person" : "people"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── My Spaces Section ─── */}
        <section className="mb-6">
          <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1E1B4B] px-1 mb-2.5">
            My Spaces
          </h3>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {spacesGrid.map((space) => {
              const Icon = space.icon;
              return (
                <Link
                  key={space.title}
                  href={space.href}
                  className={`${space.cardBg} rounded-2xl p-3 sm:p-3.5 border shadow-[0_2px_8px_rgba(30,27,75,0.03)] hover:shadow-md transition-all flex items-center gap-2.5 group active:scale-[0.98]`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${space.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs`}
                  >
                    <Icon className={`w-5 h-5 ${space.iconColor}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] sm:text-[14px] font-bold text-[#1E1B4B] truncate leading-tight group-hover:text-indigo-600 transition-colors">
                      {space.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                      {space.desc}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 ${space.chevronColor} group-hover:translate-x-0.5 transition-transform shrink-0`}
                    strokeWidth={2.4}
                  />
                </Link>
              );
            })}
          </div>
        </section>



      </div>

      {/* ─── Global Search Modal ─── */}
      <LifeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
