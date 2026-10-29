/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  FileText,
  Lock,
  Shield,
  Clock,
  Wallet,
  AlertCircle,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Briefcase,
  Users,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Check,
  ClipboardList,
  Heart,
  Landmark,
  UserX,
  Send,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { AddEditPersonModal } from "./AddEditPersonModal";
import {
  archivePerson,
  disconnectPersonAccount,
  cancelPersonInvitation,
  checkPersonArchiveSummary,
  updatePerson,
} from "@/lib/actions/lifePeople.actions";
import { sendPersonInvitation } from "@/lib/actions/lifeInvitation.actions";
import type { ILifePerson } from "@/types";

interface PersonDetailClientProps {
  personData: {
    person: ILifePerson;
    financialCare: any[];
    moneyRecords: any[];
    documents: any[];
    contacts: any[];
    notes: any[];
    instructions: any[];
    responsibilities: any[];
    messages: any[];
    assets: any[];
    guardianRecord?: any;
    businessRecords?: any[];
    recordPermissions?: any[];
  };
  currentUser: {
    isOwner: boolean;
    isAdmin: boolean;
    personId?: string;
  };
}

// Avatar color helper
function getInitials(name: string): string {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 1).toUpperCase();
}

function getShortName(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || parts[0];
}

// Masking helper: +880 17*****
function maskPhone(phone: string): string {
  if (!phone) return "";
  if (phone.length <= 6) return phone;
  const prefix = phone.slice(0, 7);
  return `${prefix}*****`;
}

// Masking helper: sabbir.a***@gmail.com
function maskEmail(email: string): string {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, Math.min(8, user.length));
  return `${visible}***@${domain}`;
}

export function PersonDetailClient({
  personData,
  currentUser,
}: PersonDetailClientProps) {
  const router = useRouter();
  const [person, setPerson] = useState<ILifePerson>(personData.person);

  // Section Selector: "overview" (Screen 2) | "linked_records" (Screen 3) | "access_roles" (Screen 4)
  const [activeSection, setActiveSection] = useState<
    "overview" | "linked_records" | "access_roles"
  >("overview");

  // Filter for Linked Records screen
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>("all");

  // Privacy Eye Toggles
  const [revealPhone, setRevealPhone] = useState(false);
  const [revealEmail, setRevealEmail] = useState(false);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [ownerNoteDraft, setOwnerNoteDraft] = useState(
    person.ownerNote || person.shortNote || person.notes || ""
  );
  const [savingNote, setSavingNote] = useState(false);

  // Archive safety modal
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveSummary, setArchiveSummary] = useState<any | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Account status check
  const isConnected = Boolean(
    person.clerkUserId || person.registrationStatus === "active_user"
  );
  const isInvitePending = person.registrationStatus === "invitation_sent";

  // Connections and relationship tags
  const tags: string[] = [];
  if (person.relation && person.relation.toLowerCase() !== "other") {
    tags.push(person.relation);
  }
  const conns =
    Array.isArray(person.connections) && person.connections.length > 0
      ? person.connections
      : person.category
      ? [person.category === "Family Member" ? "Family" : person.category]
      : [];

  for (const c of conns) {
    if (!tags.includes(c)) tags.push(c);
  }

  // Handle Note Save
  const handleSaveOwnerNote = async () => {
    setSavingNote(true);
    try {
      await updatePerson(String(person._id), {
        ownerNote: ownerNoteDraft.trim(),
        shortNote: ownerNoteDraft.trim(),
      });
      setPerson((prev) => ({
        ...prev,
        ownerNote: ownerNoteDraft.trim(),
        shortNote: ownerNoteDraft.trim(),
      }));
      toast.success("Owner-only note saved.");
      setShowNoteModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  };

  // Open Archive Confirm
  const handleOpenArchive = async () => {
    setShowMoreMenu(false);
    const summary = await checkPersonArchiveSummary(String(person._id));
    setArchiveSummary(summary);
    setShowArchiveConfirm(true);
  };

  // Confirm Archive
  const handleConfirmArchive = async () => {
    setArchiving(true);
    try {
      await archivePerson(String(person._id));
      toast.success(`${person.name} has been archived.`);
      router.push("/people");
    } catch (err: any) {
      toast.error(err.message || "Failed to archive person.");
    } finally {
      setArchiving(false);
    }
  };

  // Disconnect Account
  const handleDisconnectAccount = async () => {
    setShowMoreMenu(false);
    if (
      !confirm(
        `Are you sure you want to unlink the verified login account for ${person.name}?`
      )
    )
      return;
    const res = await disconnectPersonAccount(String(person._id));
    if (res.success) {
      toast.success("Account unlinked.");
      setPerson((prev) => ({
        ...prev,
        clerkUserId: undefined,
        registrationStatus: "not_invited",
        isLoginEnabled: false,
      }));
    } else {
      toast.error(res.error || "Failed to disconnect account.");
    }
  };

  // Cancel Invitation
  const handleCancelInvitation = async () => {
    setShowMoreMenu(false);
    const res = await cancelPersonInvitation(String(person._id));
    if (res.success) {
      toast.success("Invitation cancelled.");
      setPerson((prev) => ({
        ...prev,
        registrationStatus: "not_invited",
      }));
    } else {
      toast.error(res.error || "Failed to cancel invitation.");
    }
  };

  // Send / Resend Invitation
  const handleSendInvitation = async () => {
    setShowMoreMenu(false);
    if (!person.email) {
      toast.error("An email address is required to send an invitation.");
      return;
    }
    setSendingInvite(true);
    try {
      const res = await sendPersonInvitation(String(person._id), person.email);
      if (res.success) {
        const link =
          res.data?.invitationUrl ||
          (res.data?.token
            ? `${window.location.origin}/sign-up?invite_token=${res.data.token}`
            : "");
        if (link) {
          navigator.clipboard.writeText(link).catch(() => {});
          toast.success("Invitation resent! Link copied to clipboard.");
        } else {
          toast.success(`Invitation sent to ${person.email}!`);
        }
        setPerson((prev) => ({
          ...prev,
          registrationStatus: "invitation_sent",
          invitationUrl: res.data?.invitationUrl || prev.invitationUrl,
          invitationToken: res.data?.token || prev.invitationToken,
        }));
      } else {
        toast.error(res.message || "Failed to send invitation.");
      }
    } finally {
      setSendingInvite(false);
    }
  };

  // Copy invitation link directly to clipboard
  const handleCopyInvitationLink = () => {
    setShowMoreMenu(false);
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://life.gesn.net";
    const link =
      person.invitationUrl ||
      (person.invitationToken
        ? `${origin}/sign-up?invite_token=${person.invitationToken}`
        : `${origin}/sign-up`);
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard!");
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Build Linked Records List
  const allLinkedRecords: any[] = [];

  // 1. Business
  const businessList = personData.businessRecords || [];
  for (const b of businessList) {
    allLinkedRecords.push({
      id: b._id,
      title: b.name || "GESN employment",
      type: "work_business",
      categoryLabel: "Work & Business",
      icon: Briefcase,
      iconBg: "bg-sky-50 text-sky-600",
      tags: ["Linked • Private"],
      link: "/business",
      actionLabel: "Open record",
    });
  }
  if (conns.includes("Staff") && businessList.length === 0) {
    allLinkedRecords.push({
      id: "staff-record",
      title: "GESN employment",
      type: "work_business",
      categoryLabel: "Work & Business",
      icon: Briefcase,
      iconBg: "bg-sky-50 text-sky-600",
      tags: ["Linked • Private"],
      link: "/business",
      actionLabel: "Open record",
    });
  }

  // 2. Finance / SiS Care
  const financialList = personData.financialCare || [];
  const moneyList = personData.moneyRecords || [];
  if (financialList.length > 0 || moneyList.length > 0) {
    allLinkedRecords.push({
      id: "sis-care-record",
      title: "SiS Care",
      type: "finance_assets",
      categoryLabel: "Finance & Assets",
      icon: Wallet,
      iconBg: "bg-emerald-50 text-emerald-600",
      tags: ["Shared selected records"],
      link: "/finance",
      actionLabel: "Open record",
    });
  }

  // 3. Responsibilities
  for (const r of personData.responsibilities || []) {
    allLinkedRecords.push({
      id: r._id,
      title: r.title || "Essential service operations",
      type: "responsibilities",
      categoryLabel: "Responsibilities",
      icon: ClipboardList,
      iconBg: "bg-indigo-50 text-[#4F46E5]",
      tags: [
        "Available now",
        r.completionStatus === "completed" ? "Completed" : "In progress",
      ],
      link: "/instructions",
      actionLabel: "Open record",
    });
  }

  // 4. Instructions
  for (const inst of personData.instructions || []) {
    allLinkedRecords.push({
      id: inst._id,
      title: inst.title || "Business continuity instructions",
      type: "instructions",
      categoryLabel: "Instructions",
      icon: FileText,
      iconBg: "bg-amber-50 text-amber-600",
      tags: ["Locked for recipient • Timed request"],
      link: "/instructions",
      actionLabel: "Open record",
    });
  }

  // 5. Emergency Contacts
  for (const c of personData.contacts || []) {
    allLinkedRecords.push({
      id: c._id,
      title: c.name || "Emergency contacts",
      type: "emergency",
      categoryLabel: "Emergency",
      icon: Users,
      iconBg: "bg-red-50 text-red-600",
      tags: ["Available now"],
      link: "/contacts",
      actionLabel: "Open record",
    });
  }

  // 6. Legacy & Legal
  for (const m of personData.messages || []) {
    allLinkedRecords.push({
      id: m._id,
      title: m.title || "Future handover",
      type: "legacy_legal",
      categoryLabel: "Legacy & Legal",
      icon: Landmark,
      iconBg: "bg-purple-50 text-purple-600",
      tags: ["Guardian approval"],
      link: "/legacy",
      actionLabel: "Open record",
    });
  }

  // Filter linked records by type
  const filteredRecords = allLinkedRecords.filter((rec) => {
    if (recordTypeFilter === "all") return true;
    return rec.type === recordTypeFilter;
  });

  const initials = getInitials(person.name);
  const shortName = getShortName(person.name);

  return (
    <div className="w-full max-w-lg mx-auto space-y-3.5 pb-24 pt-1 sm:pt-2">
      {/* ══════════════════════════════════════════════════════════ */}
      {/* TOP HEADER: Dynamic per Screen (Screen 2 vs 3 vs 4)        */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === "overview" ? (
        /* Screen 2 Top Subheader: < People */
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push("/people")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#4F46E5] transition-colors py-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>People</span>
          </button>
        </div>
      ) : (
        /* Screen 3 & 4 Top Subheader: < [AS] [Sabbir] [Connected] [...] */
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setActiveSection("overview")}
              className="text-slate-600 hover:text-[#4F46E5] transition-colors p-1 cursor-pointer shrink-0"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Small circle avatar */}
            <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
              {person.profilePhoto || person.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.profilePhoto || person.avatarUrl}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Short name */}
            <span className="font-bold text-xs sm:text-sm text-[#1E1B4B] truncate">
              {shortName}
            </span>

            {/* Connected badge */}
            {isConnected ? (
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Connected
              </span>
            ) : isInvitePending ? (
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                Invite pending
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60 shrink-0">
                Contact only
              </span>
            )}
          </div>

          {/* More Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu((v) => !v)}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-slate-100 shadow-xl p-1.5 z-40 space-y-0.5 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95">
                {isInvitePending && (
                  <button
                    type="button"
                    onClick={handleCancelInvitation}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-amber-700"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel Invitation
                  </button>
                )}

                {person.email && !isConnected && (
                  <button
                    type="button"
                    onClick={handleSendInvitation}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-[#4F46E5]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isInvitePending ? "Resend Invitation" : "Send Invitation"}
                  </button>
                )}

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnectAccount}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Disconnect Account
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenArchive}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-slate-600 border-t border-slate-100 mt-1 pt-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  Archive Person
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SCREEN 2 ONLY: Full Profile Card & 3 Action Buttons        */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === "overview" && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.03)] space-y-3.5">
          <div className="flex items-center gap-3.5">
            {/* Avatar circle */}
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-base shrink-0 overflow-hidden shadow-2xs">
              {person.profilePhoto || person.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.profilePhoto || person.avatarUrl}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Name & Tags */}
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] leading-tight truncate">
                {person.name}
              </h1>

              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}

                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : isInvitePending ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Invite pending
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                    Contact only
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── 3 Quick Action Buttons Row ── */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
            {/* Message Button */}
            {isConnected ? (
              <Link
                href="/requests"
                className="py-2 rounded-xl bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="Internal messaging is available only for connected accounts."
                className="py-2 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center gap-1.5 font-bold text-xs cursor-not-allowed"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            )}

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs shadow-2xs cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>

            {/* More Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu((v) => !v)}
                className="w-full py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 font-bold text-xs shadow-2xs cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                <span>More</span>
              </button>

              {/* Dropdown Menu */}
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-slate-100 shadow-xl p-1.5 z-40 space-y-0.5 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95">
                  {isInvitePending && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopyInvitationLink}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-[#4F46E5] font-bold cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Invitation Link
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelInvitation}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-amber-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel Invitation
                      </button>
                    </>
                  )}

                  {person.email && !isConnected && (
                    <button
                      type="button"
                      onClick={handleSendInvitation}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-[#4F46E5] cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isInvitePending
                        ? "Resend Invitation"
                        : "Send Invitation"}
                    </button>
                  )}

                  {isConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnectAccount}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-rose-600 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Disconnect Account
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenArchive}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 text-slate-600 border-t border-slate-100 mt-1 pt-1.5 cursor-pointer"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    Archive Person
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pending Invitation Banner with 1-Tap Copy Link & Resend ── */}
      {isInvitePending && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Invitation Pending</span>
            </div>
            <p className="text-[11px] text-amber-700 truncate mt-0.5 font-medium">
              Invited as {person.email || "user"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyInvitationLink}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60 font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            >
              <Copy className="w-3 h-3 text-amber-700" />
              <span>Copy Link</span>
            </button>
            <button
              type="button"
              onClick={handleSendInvitation}
              disabled={sendingInvite}
              className="px-2.5 py-1.5 rounded-xl bg-[#4F46E5] text-white hover:bg-indigo-700 font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>{sendingInvite ? "Sending..." : "Resend"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Section Selector Dropdown Row (Across all 3 screens) ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Profile</span>
          <div className="relative">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as any)}
              className="text-xs font-bold appearance-none bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 pr-6 text-[#1E1B4B] focus:outline-none focus:border-[#4F46E5] shadow-2xs cursor-pointer"
            >
              <option value="overview">Overview</option>
              <option value="linked_records">Linked Records</option>
              <option value="access_roles">Access & Roles</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {activeSection === "overview" && (
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Owner view
          </span>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SCREEN 2: OVERVIEW SECTION                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === "overview" && (
        <div className="space-y-3">
          {/* Card 1: Contact Information */}
          <div className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] space-y-2.5">
            <h2 className="text-xs font-bold text-[#1E1B4B]">
              Contact information
            </h2>

            {/* Mobile Row: +880 17***** 👁️ */}
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 pt-0.5">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {person.phone
                    ? revealPhone
                      ? person.phone
                      : maskPhone(person.phone)
                    : "No phone registered"}
                </span>
                {person.phone && (
                  <button
                    type="button"
                    onClick={() => setRevealPhone((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={revealPhone ? "Mask phone" : "Reveal phone"}
                  >
                    {revealPhone ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {person.phone && (
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${person.phone}`}
                    className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                    title="Call"
                  >
                    <Phone className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(person.phone || "", "Phone number")}
                    className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                    title="Copy phone"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Email Row: sabbir.a***@gmail.com 👁️ */}
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {person.email
                    ? revealEmail
                      ? person.email
                      : maskEmail(person.email)
                    : "No email address"}
                </span>
                {person.email && (
                  <button
                    type="button"
                    onClick={() => setRevealEmail((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={revealEmail ? "Mask email" : "Reveal email"}
                  >
                    {revealEmail ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {person.email && (
                <div className="flex items-center gap-1">
                  <a
                    href={`mailto:${person.email}`}
                    className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                    title="Send email"
                  >
                    <Mail className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(person.email || "", "Email address")}
                    className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                    title="Copy email"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Work & Business Summary */}
          <button
            type="button"
            onClick={() => {
              setActiveSection("linked_records");
              setRecordTypeFilter("work_business");
            }}
            className="w-full text-left bg-white rounded-2xl border border-slate-100/90 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] hover:border-indigo-100 transition-all flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E1B4B]">
                  Work & Business
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {businessList.length > 0
                    ? `${businessList.length} business record${
                        businessList.length === 1 ? "" : "s"
                      }`
                    : conns.includes("Staff")
                    ? "1 employment record"
                    : "No active employment record"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5] transition-colors shrink-0" />
          </button>

          {/* Card 3: Finance & Assets Summary */}
          <button
            type="button"
            onClick={() => {
              setActiveSection("linked_records");
              setRecordTypeFilter("finance_assets");
            }}
            className="w-full text-left bg-white rounded-2xl border border-slate-100/90 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] hover:border-indigo-100 transition-all flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E1B4B]">
                  Finance & Assets
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {financialList.length > 0 || moneyList.length > 0
                    ? "SiS Care linked"
                    : "No shared financial ledger"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5] transition-colors shrink-0" />
          </button>

          {/* Card 4: Life Continuity Summary */}
          <button
            type="button"
            onClick={() => {
              setActiveSection("linked_records");
              setRecordTypeFilter("responsibilities");
            }}
            className="w-full text-left bg-white rounded-2xl border border-slate-100/90 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] hover:border-indigo-100 transition-all flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E1B4B]">
                  Life Continuity
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {(personData.responsibilities || []).length > 0
                    ? `${(personData.responsibilities || []).length} responsibilities`
                    : "0 active directives"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5] transition-colors shrink-0" />
          </button>

          {/* Card 5: Owner-Only Note */}
          <button
            type="button"
            onClick={() => setShowNoteModal(true)}
            className="w-full text-left bg-[#EEF2FF] rounded-2xl border border-indigo-100 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] hover:border-indigo-200 transition-all flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#1E1B4B]">
                  Owner-only note
                </h3>
                <p className="text-[11px] text-slate-600 font-medium line-clamp-1">
                  {person.ownerNote || person.shortNote || "Only visible to you."}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-[#4F46E5] transition-colors shrink-0" />
          </button>

          {/* Info Helper Note */}
          <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400 font-medium">
            <span>ⓘ</span>
            <span>Linking a record does not share it.</span>
          </div>

          {/* Big Primary Action: View Linked Records */}
          <button
            type="button"
            onClick={() => setActiveSection("linked_records")}
            className="w-full py-3 rounded-2xl bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-bold text-xs shadow-xs cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>View linked records</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SCREEN 3: LINKED RECORDS & CONTINUITY                     */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === "linked_records" && (
        <div className="space-y-3">
          {/* Subheader & Type Filter Dropdown */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Connected Records ({filteredRecords.length})
            </h2>

            {/* Linked Type Filter Dropdown */}
            <div className="relative">
              <select
                value={recordTypeFilter}
                onChange={(e) => setRecordTypeFilter(e.target.value)}
                className="text-xs font-bold appearance-none bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 pr-6 text-[#1E1B4B] focus:outline-none focus:border-[#4F46E5] shadow-2xs cursor-pointer"
              >
                <option value="all">All linked types</option>
                <option value="work_business">Work & Business</option>
                <option value="finance_assets">Finance & Assets</option>
                <option value="responsibilities">Responsibilities</option>
                <option value="instructions">Instructions</option>
                <option value="emergency">Emergency</option>
                <option value="legacy_legal">Legacy & Legal</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2">
              <p className="text-xs font-bold text-[#1E1B4B]">
                No linked records in this category
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Records linked from Life Workspace will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRecords.map((rec, idx) => {
                const Icon = rec.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => router.push(rec.link)}
                    className="bg-white rounded-2xl border border-slate-100/90 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] hover:border-indigo-100 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${rec.iconBg}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h3 className="text-xs sm:text-sm font-bold text-[#1E1B4B] truncate group-hover:text-[#4F46E5] transition-colors">
                          {rec.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {rec.categoryLabel}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {rec.tags.map((t: string) => (
                            <span
                              key={t}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                t === "Available now"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : t === "In progress"
                                  ? "bg-sky-50 text-sky-700 border border-sky-100"
                                  : t.includes("Locked")
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : t === "Guardian approval"
                                  ? "bg-purple-50 text-purple-700 border border-purple-100"
                                  : t.includes("Shared")
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Open Action (Button or Arrow) */}
                    {rec.type === "finance_assets" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(rec.link);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-[#4F46E5] font-bold text-xs flex items-center gap-1 shrink-0 transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>Open record</span>
                      </button>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5] transition-colors shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Helper Callout */}
          <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400 font-medium pt-1">
            <span>ⓘ</span>
            <span>Opens the original workspace record.</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SCREEN 4: ACCESS & ROLES SECTION                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === "access_roles" && (
        <div className="space-y-3">
          {/* Section 1: Shared Access */}
          <div className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#1E1B4B]">Shared access</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 text-slate-700">
                <span>GESN agreement</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  View only
                </span>
              </div>
              <div className="flex items-center justify-between py-1 text-slate-700">
                <span>Selected business records</span>
                <span className="text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                  View
                </span>
              </div>
            </div>

            <Link
              href="/access"
              className="w-full py-2 rounded-xl bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100 transition-colors flex items-center justify-center font-bold text-xs"
            >
              Manage shared access
            </Link>
          </div>

          {/* Section 2: Future Access */}
          <div className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#1E1B4B]">Future access</h3>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-800">
                Business continuity instructions
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  ⚠️ 7-day request policy
                </span>
              </div>
            </div>

            <Link
              href="/instructions"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline pt-1"
            >
              <span>Open release rules</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Section 3: Recovery Guardian */}
          <div className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E1B4B]">
                    Recovery Guardian
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Helps verify account recovery
                  </p>
                </div>
              </div>

              {personData.guardianRecord?.isRecoveryGuardian ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Accepted
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Not assigned
                </span>
              )}
            </div>

            <Link
              href="/guardians"
              className="w-full py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center font-bold text-xs"
            >
              Open recovery settings
            </Link>
          </div>

          {/* Section 4: Continuity Reviewer */}
          <div className="bg-white rounded-2xl border border-slate-100/90 p-4 shadow-[0_2px_12px_rgba(30,27,75,0.02)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1E1B4B]">
                    Continuity Reviewer
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Separate appointment required
                  </p>
                </div>
              </div>

              {personData.guardianRecord?.isContinuityGuardian &&
              personData.guardianRecord?.invitationStatus === "accepted" ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Accepted
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Not assigned
                </span>
              )}
            </div>

            <Link
              href="/guardians"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline pt-1"
            >
              <span>Open continuity settings</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Helper Callout */}
          <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400 font-medium pt-1">
            <span>ⓘ</span>
            <span>Relationship tags do not grant permissions.</span>
          </div>
        </div>
      )}

      {/* ── Screen 5: Edit Person Modal ── */}
      {showEditModal && (
        <AddEditPersonModal
          isOpen={showEditModal}
          personToEdit={person}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => {
            setPerson(updated);
          }}
        />
      )}

      {/* ── Owner-Only Note Edit Modal ── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1E1B4B]">
                  Owner-Only Private Note
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              This note is private and strictly visible to you. It will never be
              shared with the connected user or third parties.
            </p>

            <textarea
              value={ownerNoteDraft}
              onChange={(e) => setOwnerNoteDraft(e.target.value)}
              placeholder="Write a private note regarding this individual..."
              rows={4}
              className="w-full text-xs border border-slate-200/90 rounded-2xl p-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] font-medium resize-none shadow-2xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingNote}
                onClick={handleSaveOwnerNote}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingNote ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive Confirmation Modal ── */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E1B4B]">
                  Archive {person.name}?
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Controlled directory status change
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 font-medium">
              <p>
                Archiving removes this person from the main directory while
                preserving all historical records, linked finances, and document
                references.
              </p>
              {archiveSummary && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                  <p>
                    • Active Duties/Instructions:{" "}
                    <span className="font-bold text-slate-800">
                      {archiveSummary.dutiesCount}
                    </span>
                  </p>
                  <p>
                    • Financial/SiS Care Records:{" "}
                    <span className="font-bold text-slate-800">
                      {archiveSummary.financialCount}
                    </span>
                  </p>
                  <p>
                    • Guardian Appointments:{" "}
                    <span className="font-bold text-slate-800">
                      {archiveSummary.isGuardian ? "Active" : "None"}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiving}
                onClick={handleConfirmArchive}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {archiving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>Confirm Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
