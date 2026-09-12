/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  FolderLock,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  Clock,
  Wallet,
  Coins,
  HeartHandshake,
  AlertCircle,
  UserCheck,
  UserX,
  ExternalLink,
  MoreVertical,
  Pencil,
  Building2,
  User,
  Loader2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  updatePerson,
  setPersonAccountStatus,
} from "@/lib/actions/lifePeople.actions";
import toast from "react-hot-toast";
import type {
  ILifeDocument,
  ILifeContact,
  ILifePerson,
  AccountStatus,
} from "@/types";

// ============================================================
// Brand SVG Icons (Matching Reference UI)
// ============================================================

function FacebookIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M15.5 12.05h-2.35v8.4h-3.48v-8.4H7.85v-2.97h1.82V7.12c0-1.8 1.1-2.78 2.7-2.78.77 0 1.58.07 1.97.12v2.29h-1.35c-.87 0-1.04.41-1.04 1.02v1.31h2.53l-.33 2.97z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function MessengerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#0084FF" />
      <path
        d="M12 4.5c-4.14 0-7.5 3.13-7.5 7 0 2.21 1.09 4.17 2.8 5.42v2.58l2.48-1.36c.7.2 1.45.31 2.22.31 4.14 0 7.5-3.13 7.5-7s-3.36-6.95-7.5-6.95zm.77 9.42l-1.96-2.09-3.83 2.09 4.21-4.47 2.01 2.09 3.78-2.09-4.21 4.47z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function InstagramIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FD5949" />
          <stop offset="50%" stopColor="#D6249F" />
          <stop offset="100%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#igGradient)" />
      <path
        d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-8.6a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z"
        fill="#FFFFFF"
      />
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4.5"
        stroke="#FFFFFF"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function TikTokIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#000000" />
      <path
        d="M16.5 8.2c-.85-.5-1.42-1.35-1.54-2.35h-2.1v9.65a2.15 2.15 0 11-2.15-2.15c.24 0 .47.04.68.12V11.3a4.28 4.28 0 00-.68-.05 4.28 4.28 0 104.28 4.28V9.82c1.03.73 2.3 1.18 3.66 1.18V8.87c-.82 0-1.59-.25-2.15-.67z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function TelegramIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        d="M6.2 11.9l9.9-4.1c.5-.2.9.1.7.7l-1.7 8c-.1.6-.5.7-1 .4l-2.7-2-1.3 1.2c-.1.2-.3.3-.6.3l.2-2.8 5-4.5c.2-.2 0-.3-.3-.1l-6.2 3.9-2.7-.8c-.6-.2-.6-.6.1-.8z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function LinkedInIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        d="M6.8 9.3h2.6v8.4H6.8V9.3zM8.1 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.2 9.3h2.5v1.2h.04c.35-.66 1.22-1.36 2.5-1.36 2.68 0 3.17 1.76 3.17 4.05v4.5h-2.6v-4c0-.95-.02-2.18-1.33-2.18-1.33 0-1.54 1.04-1.54 2.11v4.07h-2.6V9.3z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function YouTubeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path d="M10 8.5l5.5 3.5-5.5 3.5V8.5z" fill="#FFFFFF" />
    </svg>
  );
}

function WebsiteIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#10B981" />
      <path
        d="M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm5.9 7H14.7c-.1-1.6-.5-3.1-1.1-4.2 2 .7 3.5 2.3 4.3 4.2zm-4.7 0H10.8c.1-1.5.5-3 1.2-4.1.7 1.1 1.1 2.6 1.2 4.1zm-3.4 0H6.1c.8-1.9 2.3-3.5 4.3-4.2-.6 1.1-1 2.6-1.1 4.2zm-1.1 1.5h3.2c.1 1.5.5 3 1.1 4.2-2-.7-3.5-2.3-4.3-4.2zm4.5 0h2.4c-.1 1.5-.5 3-1.2 4.1-.7-1.1-1.1-2.6-1.2-4.1zm3.7 0h3.2c-.8 1.9-2.3 3.5-4.3 4.2.6-1.1 1-2.6 1.1-4.2z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// ============================================================
// Types & Interface
// ============================================================

interface PersonData {
  person: ILifePerson & {
    personalMessage?: string;
    responsibilities?: string[];
    businessInstructions?: string[];
    isLoginEnabled?: boolean;
    accountStatus?: string;
  };
  financialCare: any[];
  moneyRecords: any[];
  documents: ILifeDocument[];
  contacts: ILifeContact[];
  notes: any[];
  instructions: any[];
  responsibilities: any[];
  messages: any[];
}

interface PersonDetailClientProps {
  personData: PersonData;
  currentUser?: {
    isOwner: boolean;
    isAdmin: boolean;
    personId?: string;
  };
}

export function PersonDetailClient({
  personData,
  currentUser,
}: PersonDetailClientProps) {
  const [person, setPerson] = useState(personData.person);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("contact_social");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit contact & social links form state
  const [editForm, setEditForm] = useState({
    phone: person.phone || "",
    whatsapp: person.whatsapp || "",
    email: person.email || "",
    facebook: person.socialLinks?.facebook || "",
    messenger: person.socialLinks?.messenger || "",
    instagram: person.socialLinks?.instagram || "",
    tiktok: person.socialLinks?.tiktok || "",
    telegram: person.socialLinks?.telegram || "",
    linkedin: person.socialLinks?.linkedin || "",
    youtube: person.socialLinks?.youtube || "",
    website: person.socialLinks?.website || "",
  });

  const isSuperUser = currentUser?.isOwner || currentUser?.isAdmin;
  const isSelf = currentUser?.personId && String(currentUser.personId) === String(person._id);
  const canEdit = isSuperUser || isSelf;

  const handleToggleLock = async () => {
    const newStatus = person.status === "locked" ? "active" : "locked";
    setLoading(true);
    try {
      const updated = await updatePerson(person._id, {
        status: newStatus as any,
        accountStatus: newStatus as any,
      });
      setPerson((prev) => ({
        ...prev,
        status: newStatus as any,
        accountStatus: newStatus as any,
      }));
      toast.success(
        newStatus === "locked"
          ? `${person.name} access has been locked.`
          : `${person.name} access has been unlocked.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLogin = async () => {
    const newLoginState = person.isLoginEnabled === false;
    setLoading(true);
    try {
      await updatePerson(person._id, {
        isLoginEnabled: newLoginState,
      });
      setPerson((prev) => ({
        ...prev,
        isLoginEnabled: newLoginState,
      }));
      toast.success(
        newLoginState
          ? `Login enabled for ${person.name}.`
          : `Login disabled for ${person.name}.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update login status.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountStatusChange = async (newStatus: AccountStatus) => {
    setLoading(true);
    try {
      await setPersonAccountStatus(person._id, newStatus);
      setPerson((prev) => ({
        ...prev,
        accountStatus: newStatus,
        status: newStatus === "archived" ? "archived" : newStatus === "locked" ? "locked" : "active",
        isLoginEnabled: newStatus === "active",
      }));
      toast.success(`Account status set to ${newStatus.replace("_", " ")}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContactSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const socialPayload = {
        facebook: editForm.facebook.trim(),
        messenger: editForm.messenger.trim(),
        instagram: editForm.instagram.trim(),
        tiktok: editForm.tiktok.trim(),
        telegram: editForm.telegram.trim(),
        linkedin: editForm.linkedin.trim(),
        youtube: editForm.youtube.trim(),
        website: editForm.website.trim(),
      };

      await updatePerson(person._id, {
        phone: editForm.phone.trim(),
        whatsapp: editForm.whatsapp.trim(),
        email: editForm.email.trim(),
        socialLinks: socialPayload,
      });

      setPerson((prev) => ({
        ...prev,
        phone: editForm.phone.trim(),
        whatsapp: editForm.whatsapp.trim(),
        email: editForm.email.trim(),
        socialLinks: socialPayload,
      }));

      toast.success("Contact & social links updated successfully.");
      setEditModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save links.";
      toast.error(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const getPriorityLabel = (p?: number) => {
    if (p === 1) return "Priority 1 (Primary)";
    if (p === 2) return "Priority 2 (Secondary)";
    if (p === 3) return "Priority 3 (Tertiary)";
    return "Not Assigned";
  };

  const getSocialUrl = (platform: string, rawValue?: string): string => {
    if (!rawValue) return "#";
    const val = rawValue.trim();
    if (val.startsWith("http://") || val.startsWith("https://")) return val;

    const clean = val.replace(/^@/, "");
    switch (platform) {
      case "facebook":
        return `https://facebook.com/${clean}`;
      case "messenger":
        return `https://m.me/${clean}`;
      case "instagram":
        return `https://instagram.com/${clean}`;
      case "tiktok":
        return `https://www.tiktok.com/@${clean}`;
      case "telegram":
        return `https://t.me/${clean}`;
      case "linkedin":
        return `https://www.linkedin.com/in/${clean}`;
      case "youtube":
        return `https://www.youtube.com/${val.startsWith("@") ? val : "@" + val}`;
      case "website":
        return `https://${val}`;
      default:
        return `https://${val}`;
    }
  };

  // Supported Social Platforms (Only shown if value exists!)
  const socialPlatforms = [
    {
      id: "facebook",
      name: "Facebook",
      icon: FacebookIcon,
      value: person.socialLinks?.facebook,
    },
    {
      id: "messenger",
      name: "Messenger",
      icon: MessengerIcon,
      value: person.socialLinks?.messenger,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: InstagramIcon,
      value: person.socialLinks?.instagram,
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: TikTokIcon,
      value: person.socialLinks?.tiktok,
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: TelegramIcon,
      value: person.socialLinks?.telegram,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: LinkedInIcon,
      value: person.socialLinks?.linkedin,
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: YouTubeIcon,
      value: person.socialLinks?.youtube,
    },
    {
      id: "website",
      name: "Website",
      icon: WebsiteIcon,
      value: person.socialLinks?.website,
    },
  ];

  // STRICT RULE: Only show an icon/link when that information exists.
  const activeSocials = socialPlatforms.filter(
    (p) => Boolean(p.value && p.value.trim() !== "")
  );

  const isSuperAdmin =
    person.role === "super_admin" ||
    person.role === "owner" ||
    (person.userRole as string) === "super_admin";

  const getSubTitle = () => {
    if (person.designation) return person.designation;
    if (person.role === "super_admin" || person.role === "owner") return "Super Admin";
    if (person.role === "admin") return "Administrator";
    if (person.role === "guardian") return "Guardian";
    if (person.relation) return person.relation;
    return "Individual User";
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16">
      {/* ============================================================ */}
      {/* Top Bar (Matching Reference Design)                           */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <Link
            href="/people"
            className="p-1 -ml-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
            aria-label="Back to People & Access"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {activeTab === "contact_social"
                ? "Contact & Social Links"
                : `${person.name}'s Profile`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTab === "contact_social"
                ? "View and manage contact information and social links"
                : "Manage profile, private data, permissions, and continuity records"}
            </p>
          </div>
        </div>

        {/* Action Controls / Status */}
        <div className="flex items-center gap-2">
          {isSuperUser && (
            <div className="hidden sm:flex items-center gap-1.5 bg-secondary border border-border px-2.5 py-1 rounded-xl">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Status:
              </span>
              <select
                value={person.accountStatus || person.status || "active"}
                onChange={(e) =>
                  handleAccountStatusChange(e.target.value as AccountStatus)
                }
                disabled={loading}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="active" className="bg-card text-foreground">
                  Active
                </option>
                <option value="locked" className="bg-card text-foreground">
                  Locked
                </option>
                <option value="disabled" className="bg-card text-foreground">
                  Disabled
                </option>
                <option value="archived" className="bg-card text-foreground">
                  Archived
                </option>
              </select>
            </div>
          )}

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditForm({
                  phone: person.phone || "",
                  whatsapp: person.whatsapp || "",
                  email: person.email || "",
                  facebook: person.socialLinks?.facebook || "",
                  messenger: person.socialLinks?.messenger || "",
                  instagram: person.socialLinks?.instagram || "",
                  tiktok: person.socialLinks?.tiktok || "",
                  telegram: person.socialLinks?.telegram || "",
                  linkedin: person.socialLinks?.linkedin || "",
                  youtube: person.socialLinks?.youtube || "",
                  website: person.socialLinks?.website || "",
                });
                setEditModalOpen(true);
              }}
              className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Edit Links</span>
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Person Header Card (Exact Match to Reference UI)             */}
      {/* ============================================================ */}
      <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs relative overflow-hidden transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Mint Squircle Initial Avatar */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-800 dark:text-emerald-200 font-extrabold text-xl sm:text-2xl shrink-0">
              {person.name ? person.name.charAt(0).toUpperCase() : "U"}
            </div>

            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-foreground truncate">
                {person.name}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {getSubTitle()}
              </p>
            </div>
          </div>

          {/* Badges on the right */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {isSuperAdmin && (
              <div className="hidden xs:flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold tracking-wider uppercase">
                <Shield className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                <span>Super Admin</span>
              </div>
            )}

            <span
              className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                person.status === "active" || person.accountStatus === "active"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800/60"
              }`}
            >
              {(person.accountStatus || person.status || "active").toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 8 Profile Sections / Tabs                                     */}
      {/* ============================================================ */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-secondary p-1 rounded-2xl border border-border flex overflow-x-auto scrollbar-none max-w-full justify-start h-auto gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="contact_social"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Contact & Social
          </TabsTrigger>
          <TabsTrigger
            value="message"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Personal Message
          </TabsTrigger>
          <TabsTrigger
            value="instructions"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Instructions & Responsibilities (
            {(personData.instructions?.length || 0) +
              (person.responsibilities?.length || 0)}
            )
          </TabsTrigger>
          <TabsTrigger
            value="financial_care"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Financial Care (
            {(personData.financialCare?.length || 0) +
              (personData.moneyRecords?.length || 0)}
            )
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Important Contacts ({personData.contacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Documents ({personData.documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="access_info"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Access Information
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB 1: OVERVIEW                                              */}
        {/* ============================================================ */}
        <TabsContent value="overview" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profile Summary</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-bold text-foreground">{person.name}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Relation / Role:</span>
                  <span className="font-semibold text-foreground">
                    {person.relation}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Mobile Phone:</span>
                  <span className="font-semibold text-foreground">
                    {person.phone || "Not provided"}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Login Email:</span>
                  <span className="font-semibold text-foreground break-all">
                    {person.email || "Not linked"}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Account Status:</span>
                  <span className="font-bold capitalize text-emerald-600">
                    {person.accountStatus || person.status}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Emergency Priority:</span>
                  <span className="font-bold text-amber-600">
                    {getPriorityLabel(person.emergencyPriority)}
                  </span>
                </p>
                {person.address && (
                  <p className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-foreground text-right">
                      {person.address}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Assigned Information Counts</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Social Links Active:</span>
                  <span className="font-bold text-foreground">
                    {activeSocials.length}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Financial Care Records:</span>
                  <span className="font-bold text-foreground">
                    {(personData.financialCare?.length || 0) +
                      (personData.moneyRecords?.length || 0)}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Assigned Documents:</span>
                  <span className="font-bold text-foreground">
                    {personData.documents?.length || 0}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Assigned Instructions:</span>
                  <span className="font-bold text-foreground">
                    {(personData.instructions?.length || 0) +
                      (person.responsibilities?.length || 0)}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Important Contacts:</span>
                  <span className="font-bold text-foreground">
                    {personData.contacts?.length || 0}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Guardian Status:</span>
                  <span className="font-bold text-foreground">
                    {person.guardianStatus
                      ? `${person.guardianType || "Active"} Guardian`
                      : "Not a Guardian"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: CONTACT & SOCIAL (Exact Match to Reference UI)        */}
        {/* ============================================================ */}
        <TabsContent value="contact_social" className="space-y-5 outline-none">
          {/* 1. Contact Information Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-foreground">
                Contact Information
              </h3>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3 text-muted-foreground/70" />
                <span>Visible to assigned users</span>
              </span>
            </div>

            <div className="rounded-3xl bg-card border border-border shadow-xs overflow-hidden divide-y divide-border">
              {/* Mobile Phone */}
              {person.phone ? (
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        Mobile
                      </p>
                      <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                        {person.phone}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${person.phone}`}
                    className="h-8 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              ) : null}

              {/* WhatsApp */}
              {person.whatsapp || person.phone ? (
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        WhatsApp
                      </p>
                      <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                        {person.whatsapp || person.phone}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${(person.whatsapp || person.phone || "").replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </a>
                </div>
              ) : null}

              {/* Email */}
              {person.email ? (
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-border flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        Email
                      </p>
                      <p className="text-xs text-muted-foreground font-medium break-all mt-0.5">
                        {person.email}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`mailto:${person.email}`}
                    className="h-8 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-border text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                </div>
              ) : null}

              {/* Fallback if no contact info */}
              {!person.phone && !person.whatsapp && !person.email && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No contact information provided yet. Click below to add details.
                </div>
              )}
            </div>
          </div>

          {/* 2. Social Links Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-foreground">Social Links</h3>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3 text-muted-foreground/70" />
                <span>Visible to assigned users</span>
              </span>
            </div>

            {/* ONLY show linked platforms. If not linked, hide completely! */}
            {activeSocials.length === 0 ? (
              <div className="p-6 text-center rounded-3xl bg-card border border-dashed border-border text-xs text-muted-foreground space-y-1.5">
                <Share2 className="w-8 h-8 mx-auto text-muted-foreground/40 mb-1" />
                <p className="font-semibold text-foreground">
                  No social profiles linked yet
                </p>
                <p className="text-[11px]">
                  Add Facebook, Instagram, TikTok, Messenger, LinkedIn or Website links.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeSocials.map((platform) => {
                  const Icon = platform.icon;
                  const targetUrl = getSocialUrl(platform.id, platform.value);

                  return (
                    <a
                      key={platform.id}
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-6 h-6 shrink-0" />
                        <span className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors truncate">
                          {platform.name}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground/70 group-hover:text-foreground transition-colors shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Edit Contact & Social Links Button (Exact Reference Match) */}
          {canEdit && (
            <button
              onClick={() => {
                setEditForm({
                  phone: person.phone || "",
                  whatsapp: person.whatsapp || "",
                  email: person.email || "",
                  facebook: person.socialLinks?.facebook || "",
                  messenger: person.socialLinks?.messenger || "",
                  instagram: person.socialLinks?.instagram || "",
                  tiktok: person.socialLinks?.tiktok || "",
                  telegram: person.socialLinks?.telegram || "",
                  linkedin: person.socialLinks?.linkedin || "",
                  youtube: person.socialLinks?.youtube || "",
                  website: person.socialLinks?.website || "",
                });
                setEditModalOpen(true);
              }}
              className="w-full h-12 rounded-2xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/60 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Contact & Social Links</span>
            </button>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: PERSONAL MESSAGE                                      */}
        {/* ============================================================ */}
        <TabsContent value="message" className="outline-none">
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Private Message for {person.name}</span>
            </h3>
            {person.personalMessage ? (
              <div className="p-4 rounded-2xl bg-secondary border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap font-serif">
                {person.personalMessage}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No active personal message has been set yet for this profile.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 4: INSTRUCTIONS & RESPONSIBILITIES                       */}
        {/* ============================================================ */}
        <TabsContent value="instructions" className="space-y-4 outline-none">
          <div className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Assigned Instructions & Duties</span>
            </h3>
            {personData.instructions?.length > 0 ||
            person.responsibilities?.length ? (
              <div className="space-y-2.5">
                {personData.instructions?.map((inst: any) => (
                  <div
                    key={inst._id}
                    className="p-3.5 rounded-xl bg-secondary border border-border flex items-start justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {inst.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {inst.details || inst.summary}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-600">
                      {inst.priority || "Normal"}
                    </span>
                  </div>
                ))}
                {person.responsibilities?.map((r: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-secondary border border-border flex items-center gap-2 text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No instructions or responsibilities assigned.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 5: FINANCIAL CARE                                        */}
        {/* ============================================================ */}
        <TabsContent value="financial_care" className="outline-none space-y-3">
          {(!personData.financialCare || personData.financialCare.length === 0) &&
          (!personData.moneyRecords || personData.moneyRecords.length === 0) ? (
            <div className="p-8 text-center rounded-3xl border border-dashed border-border text-xs text-muted-foreground">
              No financial care records associated with {person.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personData.financialCare?.map((rec: any) => (
                <div
                  key={rec._id}
                  className="p-4 rounded-2xl bg-card border border-border flex justify-between items-center shadow-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {(rec.supportType || "Financial Care").replace("_", " ")}
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-1">
                      {rec.currency || "BDT"}{" "}
                      {(rec.totalAmount || 0).toLocaleString()}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Remaining:{" "}
                      <strong className="text-emerald-600">
                        {rec.currency || "BDT"}{" "}
                        {(rec.remainingBalance || 0).toLocaleString()}
                      </strong>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      rec.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {(rec.status || "active").replace("_", " ")}
                  </span>
                </div>
              ))}
              {personData.moneyRecords?.map((rec: any) => (
                <div
                  key={rec._id}
                  className="p-4 rounded-2xl bg-card border border-border flex justify-between items-center shadow-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                      {rec.type === "given"
                        ? "Care Provided"
                        : rec.type === "taken"
                          ? "Care Received"
                          : rec.type}
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-1">
                      {rec.currency || "BDT"}{" "}
                      {(rec.amount || 0).toLocaleString()}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Outstanding:{" "}
                      <strong className="text-cyan-600">
                        {rec.currency || "BDT"}{" "}
                        {(rec.remainingAmount || 0).toLocaleString()}
                      </strong>
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary border border-border">
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 6: IMPORTANT CONTACTS                                    */}
        {/* ============================================================ */}
        <TabsContent value="contacts" className="outline-none space-y-3">
          {!personData.contacts || personData.contacts.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed border-border text-xs text-muted-foreground">
              No private contacts designated for {person.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personData.contacts.map((contact: any) => (
                <div
                  key={contact._id}
                  className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs"
                >
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {contact.name}
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      {contact.category || "General"}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-1.5 rounded-lg bg-secondary text-emerald-600 hover:bg-emerald-50 text-xs font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="p-1.5 rounded-lg bg-secondary text-sky-600 hover:bg-sky-50 text-xs font-semibold"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 7: DOCUMENTS                                             */}
        {/* ============================================================ */}
        <TabsContent value="documents" className="outline-none space-y-3">
          {!personData.documents || personData.documents.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed border-border text-xs text-muted-foreground">
              No private documents assigned to {person.name}.
            </div>
          ) : (
            <div className="space-y-2">
              {personData.documents.map((doc: any) => (
                <div
                  key={doc._id}
                  className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FolderLock className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {doc.title}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {doc.category}
                      </span>
                    </div>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="text-xs text-indigo-600 font-semibold"
                  >
                    <a href={`/api/documents/${doc._id}/download`}>Download</a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 8: ACCESS INFORMATION                                    */}
        {/* ============================================================ */}
        <TabsContent value="access_info" className="outline-none">
          <div className="p-5 rounded-3xl bg-card border border-border space-y-4 text-xs shadow-xs">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Module & Feature Permissions</span>
            </h3>

            {isSuperUser && (
              <div className="p-4 rounded-2xl bg-secondary/80 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground">Login Access Control</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Toggle whether this account can log in via Clerk.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleLogin}
                    disabled={loading}
                    className="h-8 rounded-xl text-xs font-medium gap-1.5 border-border"
                  >
                    {person.isLoginEnabled === false ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Enable Login
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5 text-amber-600" />
                        Disable Login
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleLock}
                    disabled={loading}
                    className={`h-8 rounded-xl text-xs font-medium gap-1.5 ${
                      person.status === "locked"
                        ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        : "border-red-200 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {person.status === "locked" ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Lock
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-foreground">
              <div className="p-3 rounded-xl bg-secondary border border-border flex justify-between items-center">
                <span>Personal Message & Notes</span>
                <span
                  className={
                    person.permissions?.canViewPersonal
                      ? "text-emerald-600 font-bold"
                      : "text-muted-foreground"
                  }
                >
                  {person.permissions?.canViewPersonal
                    ? "Allowed ✓"
                    : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border flex justify-between items-center">
                <span>Business Continuity Access</span>
                <span
                  className={
                    person.permissions?.canViewBusiness
                      ? "text-emerald-600 font-bold"
                      : "text-muted-foreground"
                  }
                >
                  {person.permissions?.canViewBusiness
                    ? "Allowed ✓"
                    : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border flex justify-between items-center">
                <span>Financial Care Access</span>
                <span
                  className={
                    person.permissions?.canViewFinancial
                      ? "text-emerald-600 font-bold"
                      : "text-muted-foreground"
                  }
                >
                  {person.permissions?.canViewFinancial
                    ? "Allowed ✓"
                    : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border flex justify-between items-center">
                <span>Vault Secrets Reveal</span>
                <span
                  className={
                    person.permissions?.canRevealVault
                      ? "text-emerald-600 font-bold"
                      : "text-muted-foreground"
                  }
                >
                  {person.permissions?.canRevealVault
                    ? "Allowed ✓"
                    : "Restricted ✕"}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Authorization is enforced server-side. Non-owner accounts cannot
              bypass restrictions.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* Edit Contact & Social Links Modal                            */}
      {/* ============================================================ */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="life-dialog sm:max-w-lg rounded-3xl border border-border bg-card text-foreground shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-600" />
              <span>Edit Contact & Social Links</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveContactSocial} className="space-y-4 pt-2 text-xs">
            {/* Direct Contact Fields */}
            <div className="space-y-3 pb-3 border-b border-border">
              <h4 className="font-bold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                Primary Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    Mobile Phone Number
                  </label>
                  <Input
                    placeholder="+8801700000000"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">
                    WhatsApp Number
                  </label>
                  <Input
                    placeholder="+8801700000000"
                    value={editForm.whatsapp}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        whatsapp: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Social Links Fields */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                Social Profiles & Links
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Leave empty to hide the platform from your profile.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <FacebookIcon className="w-4 h-4" />
                    <span>Facebook</span>
                  </label>
                  <Input
                    placeholder="username or profile link"
                    value={editForm.facebook}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        facebook: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MessengerIcon className="w-4 h-4" />
                    <span>Messenger</span>
                  </label>
                  <Input
                    placeholder="username or link"
                    value={editForm.messenger}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        messenger: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <InstagramIcon className="w-4 h-4" />
                    <span>Instagram</span>
                  </label>
                  <Input
                    placeholder="@username or profile link"
                    value={editForm.instagram}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        instagram: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TikTokIcon className="w-4 h-4" />
                    <span>TikTok</span>
                  </label>
                  <Input
                    placeholder="@username or link"
                    value={editForm.tiktok}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        tiktok: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TelegramIcon className="w-4 h-4" />
                    <span>Telegram</span>
                  </label>
                  <Input
                    placeholder="@username or link"
                    value={editForm.telegram}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        telegram: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <LinkedInIcon className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </label>
                  <Input
                    placeholder="profile URL or username"
                    value={editForm.linkedin}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        linkedin: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <YouTubeIcon className="w-4 h-4" />
                    <span>YouTube</span>
                  </label>
                  <Input
                    placeholder="@channel or URL"
                    value={editForm.youtube}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        youtube: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                    <WebsiteIcon className="w-4 h-4" />
                    <span>Website</span>
                  </label>
                  <Input
                    placeholder="https://example.com"
                    value={editForm.website}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                disabled={savingEdit}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingEdit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold gap-1.5"
              >
                {savingEdit ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
