/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Pencil,
  Target,
  KeyRound,
  Lock,
  Home,
  Wallet,
  Coins,
  Receipt,
  User,
  HeartPulse,
  Users,
  FileText,
  TrendingUp,
  PieChart,
  Building2,
  CalendarDays,
  Lightbulb,
  Shield,
  Camera,
  Calendar,
  Info,
  Check,
  X,
  Upload,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProfileData, updateProfileData } from "@/lib/actions/lifeProfile.actions";

interface ProfileClientProps {
  initialData: ProfileData;
}

export function ProfileClient({ initialData }: ProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Edit form state
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    displayName: initialData.displayName || "",
    dateOfBirth: initialData.dateOfBirth || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    address: initialData.address || "",
    permanentAddress: initialData.permanentAddress || "",
    avatarUrl: initialData.avatarUrl || "",
  });

  const [avatarPreview, setAvatarPreview] = useState(initialData.avatarUrl || "");
  const [showPhotoChooser, setShowPhotoChooser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar initials helper
  const initials =
    (profile.name || "Shahidul Islam")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SI";

  // Financial values formatting helper
  const formatAmount = (val: number | undefined) => {
    if (val === undefined || val === null || val === 0) return "—";
    return val.toLocaleString("en-BD");
  };

  const currency = profile.financialSummary?.currencySymbol || "৳";

  // Handle Photo File Upload / Base64 conversion
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size must be less than 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setFormData((prev) => ({ ...prev, avatarUrl: result }));
      setShowPhotoChooser(false);
    };
    reader.readAsDataURL(file);
  };

  // Preset Avatar choices
  const PRESET_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
  ];

  // Submit edit form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updateProfileData({
          name: formData.name.trim(),
          displayName: formData.displayName.trim(),
          dateOfBirth: formData.dateOfBirth.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          permanentAddress: formData.permanentAddress.trim(),
          avatarUrl: formData.avatarUrl.trim(),
        });

        if (res.success && res.data) {
          setProfile(res.data);
          toast.success("Profile updated successfully!");
          setIsEditing(false);
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update profile");
        }
      } catch (err: any) {
        toast.error(err.message || "Something went wrong saving your profile");
      }
    });
  };

  // ─── Reusable section card item renderer for desktop ───────────────────────
  const SectionCard = ({
    href,
    iconBg,
    iconColor,
    icon: Icon,
    label,
    sub,
  }: {
    href: string;
    iconBg: string;
    iconColor: string;
    icon: React.ElementType;
    label: string;
    sub: string;
  }) => (
    <Link
      href={href}
      className="bg-white rounded-xl md:rounded-2xl p-2 md:p-3 border border-slate-100/90 shadow-[0_1px_6px_rgba(30,27,75,0.02)] hover:border-indigo-200/70 hover:shadow-md transition-all flex items-center justify-between group"
    >
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div
          className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] md:text-[13px] font-bold text-[#1E1B4B] leading-tight truncate">
            {label}
          </p>
          <p className="text-[9px] md:text-[11px] text-slate-400 font-medium leading-none mt-0.5 truncate">
            {sub}
          </p>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
    </Link>
  );

  const FinancialCard = ({
    href,
    icon: Icon,
    label,
    value,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    value: string;
  }) => (
    <Link
      href={href}
      className="bg-white rounded-xl md:rounded-2xl p-2 md:p-3.5 border border-slate-100/90 shadow-[0_1px_6px_rgba(30,27,75,0.02)] hover:border-indigo-200/70 hover:shadow-md transition-all flex items-center justify-between group"
    >
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] md:text-[12px] font-medium text-slate-500 leading-tight truncate">
            {label}
          </p>
          <p className="text-[12px] md:text-[15px] font-bold text-[#1E1B4B] leading-tight mt-0.5">
            {value}
          </p>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
    </Link>
  );

  return (
    <div className="w-full min-h-[calc(100vh-64px)] pb-16 md:pb-8 font-sans select-none sm:select-auto">
      <style jsx global>{`
        body {
          background-color: #F7F6FC;
        }
      `}</style>

      {/* ─── Responsive container: mobile optimized & fluid full width on desktop ─── */}
      <div className="w-full mx-auto px-1 sm:px-2 pt-1 sm:pt-2">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: MAIN PROFILE VIEW                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!isEditing ? (
          <>
            {/* ── Page Header / Title Row ── */}
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#1E1B4B] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                  aria-label="Back to dashboard"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <div>
                  <h1 className="text-[16px] sm:text-[18px] md:text-[20px] font-bold text-[#1E1B4B] leading-tight tracking-tight">
                    My Profile
                  </h1>
                  <p className="text-[11px] sm:text-[12px] text-slate-400 font-medium leading-none mt-0.5">
                    Life Command Center
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: profile.name || "",
                    displayName: profile.displayName || "",
                    dateOfBirth: profile.dateOfBirth || "",
                    phone: profile.phone || "",
                    email: profile.email || "",
                    address: profile.address || "",
                    permanentAddress: profile.permanentAddress || "",
                    avatarUrl: profile.avatarUrl || "",
                  });
                  setAvatarPreview(profile.avatarUrl || "");
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#4F46E5]/40 text-[#4F46E5] text-[12px] font-semibold hover:bg-[#EEF2FF]/60 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
                Edit profile
              </button>
            </div>

            {/* ── Main Responsive Layout: 1-col on mobile/tablet, 2-col full-width on desktop ── */}
            <div className="lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] lg:gap-6 lg:items-start space-y-3 sm:space-y-3.5 lg:space-y-0">
              
              {/* ── Left Column: Profile Card & Security Control (sticky on desktop) ── */}
              <div className="space-y-3 sm:space-y-3.5 lg:sticky lg:top-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] text-center transition-all">
                  {/* Profile Photo */}
                  <div className="relative inline-block mx-auto mb-2">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full object-cover ring-2 ring-indigo-50 shadow-sm mx-auto"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center text-[#4F46E5] font-extrabold text-[20px] sm:text-[22px] md:text-[26px] shadow-sm mx-auto">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Name & Workspace */}
                  <h2 className="text-[17px] sm:text-[19px] font-bold text-[#1E1B4B] leading-tight tracking-tight">
                    {profile.name || "Shahidul Islam"}
                  </h2>
                  <p className="text-[12px] text-slate-400 font-medium leading-none mt-1">
                    {profile.workspaceName || "Personal workspace"}
                  </p>

                  {/* Owner Badge */}
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-bold border border-indigo-100/70">
                      <Crown className="w-3 h-3 text-[#4F46E5]" strokeWidth={2.5} />
                      {profile.role || "Owner"}
                    </span>
                  </div>

                  {/* Edit Profile Button inside card */}
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          name: profile.name || "",
                          displayName: profile.displayName || "",
                          dateOfBirth: profile.dateOfBirth || "",
                          phone: profile.phone || "",
                          email: profile.email || "",
                          address: profile.address || "",
                          permanentAddress: profile.permanentAddress || "",
                          avatarUrl: profile.avatarUrl || "",
                        });
                        setAvatarPreview(profile.avatarUrl || "");
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3.5 rounded-xl border border-[#4F46E5]/40 text-[#4F46E5] text-[12px] font-semibold hover:bg-[#EEF2FF]/60 active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#4F46E5]" strokeWidth={2.2} />
                      Edit profile
                    </button>
                  </div>

                  {/* Quick Links Row: My Goals / Recovery / Only Me */}
                  <div className="grid grid-cols-3 divide-x divide-slate-100/90 border-t border-slate-100/90 mt-3 pt-2.5">
                    <Link
                      href="/instructions"
                      className="flex flex-col items-center gap-1 px-1 py-1 hover:bg-slate-50/70 rounded-lg transition-colors group"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.3} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10.5px] sm:text-[11px] font-bold text-[#1E1B4B] leading-tight">
                          My Goals
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/guardians"
                      className="flex flex-col items-center gap-1 px-1 py-1 hover:bg-slate-50/70 rounded-lg transition-colors group"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                        <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.3} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10.5px] sm:text-[11px] font-bold text-[#1E1B4B] leading-tight">
                          Recovery
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/access"
                      className="flex flex-col items-center gap-1 px-1 py-1 hover:bg-slate-50/70 rounded-lg transition-colors group"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.3} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10.5px] sm:text-[11px] font-bold text-[#1E1B4B] leading-tight">
                          Only Me
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Security & Control Card */}
                <Link
                  href="/access"
                  className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-100/90 shadow-[0_1px_6px_rgba(30,27,75,0.02)] hover:border-indigo-200/70 hover:shadow-xs transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] leading-tight truncate">
                        Your profile, your control
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-none mt-0.5 truncate">
                        Manage permissions in Security
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                </Link>
              </div>

              {/* ── Right Column: Financial Summary & Essentials ── */}
              <div className="space-y-3.5 sm:space-y-4">
                {/* Financial Summary */}
                <div>
                  <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#1E1B4B] mb-2 px-0.5">
                    Financial Summary
                  </h3>
                  <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2.5 sm:gap-3">
                    <FinancialCard
                      href="/assets"
                      icon={Home}
                      label="Property Value"
                      value={`${currency} ${formatAmount(profile.financialSummary?.propertyValue)}`}
                    />
                    <FinancialCard
                      href="/finance"
                      icon={Wallet}
                      label="Total Expense"
                      value={`${currency} ${formatAmount(profile.financialSummary?.totalExpense)}`}
                    />
                    <FinancialCard
                      href="/money"
                      icon={Coins}
                      label="Total Balance"
                      value={`${currency} ${formatAmount(profile.financialSummary?.totalBalance)}`}
                    />
                    <FinancialCard
                      href="/money"
                      icon={Receipt}
                      label="Total Loan"
                      value={`${currency} ${formatAmount(profile.financialSummary?.totalLoan)}`}
                    />
                  </div>
                </div>

                {/* Personal Essentials */}
                <div>
                  <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#1E1B4B] mb-2 px-0.5">
                    Personal Essentials
                  </h3>
                  <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2.5 sm:gap-3">
                    <SectionCard
                      href={profile.personId ? `/people/${profile.personId}` : "/information"}
                      iconBg="bg-[#EEF2FF]"
                      iconColor="text-[#4F46E5]"
                      icon={User}
                      label="Personal Details"
                      sub="Identity & important dates"
                    />
                    <SectionCard
                      href="/information"
                      iconBg="bg-[#FFE4E6]"
                      iconColor="text-[#E11D48]"
                      icon={HeartPulse}
                      label="Health Profile"
                      sub="Reports & care"
                    />
                    <SectionCard
                      href="/contacts"
                      iconBg="bg-[#FEF3C7]"
                      iconColor="text-[#D97706]"
                      icon={Users}
                      label="Emergency Contacts"
                      sub="People to call"
                    />
                    <SectionCard
                      href="/documents"
                      iconBg="bg-[#E0F2FE]"
                      iconColor="text-[#0284C7]"
                      icon={FileText}
                      label="Important Documents"
                      sub="IDs, certificates & files"
                    />
                    <SectionCard
                      href="/money"
                      iconBg="bg-[#DCFCE7]"
                      iconColor="text-[#16A34A]"
                      icon={TrendingUp}
                      label="Income Sources"
                      sub="Manage income categories"
                    />
                    <SectionCard
                      href="/finance"
                      iconBg="bg-[#FEF3C7]"
                      iconColor="text-[#D97706]"
                      icon={PieChart}
                      label="Expense Categories"
                      sub="Manage spending categories"
                    />
                    <SectionCard
                      href="/assets"
                      iconBg="bg-[#CCFBF1]"
                      iconColor="text-[#0D9488]"
                      icon={Building2}
                      label="Linked Assets"
                      sub="Properties & records"
                    />
                    <SectionCard
                      href="/money"
                      iconBg="bg-[#E0F2FE]"
                      iconColor="text-[#0284C7]"
                      icon={CalendarDays}
                      label="Loan Details"
                      sub="Borrowed & lent."
                    />
                  </div>
                </div>

                {/* Notice Bar */}
                <div className="bg-[#EEF2FF]/70 border border-indigo-100/70 rounded-xl py-2.5 px-3.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-[#4F46E5]">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0 text-[#4F46E5]" strokeWidth={2.2} />
                  <span>Open a section to add records and categories</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ═══════════════════════════════════════════════════════════════ */
          /* VIEW 2: EDIT PROFILE VIEW                                       */
          /* ═══════════════════════════════════════════════════════════════ */
          <div className="w-full">
            {/* ── Top Header Row ── */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#1E1B4B] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                  aria-label="Back to profile"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                </button>
                <div>
                  <h1 className="text-[17px] sm:text-[19px] md:text-[22px] font-bold text-[#1E1B4B] leading-tight tracking-tight">
                    Edit Profile
                  </h1>
                  <p className="text-[11px] sm:text-[12px] md:text-[13px] text-slate-400 font-medium leading-none mt-0.5">
                    Update your personal identity, contact details, and locations
                  </p>
                </div>
              </div>

              {/* Desktop Quick Action Buttons in Header */}
              <div className="hidden md:flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[#1E1B4B] text-[13px] font-semibold hover:bg-slate-50 active:scale-98 transition-all cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="profile-edit-form"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-[13px] font-bold active:scale-98 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isPending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            <form
              id="profile-edit-form"
              onSubmit={handleSaveProfile}
              className="space-y-3 sm:space-y-4"
            >
              {/* ── RESPONSIVE GRID: Mobile 1-col / Desktop 2-col ── */}
              <div className="md:grid md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] md:gap-6 md:items-start">

                {/* ── LEFT COLUMN: Avatar & Identity Card (sticky on desktop) ── */}
                <div className="md:self-start md:sticky md:top-6 space-y-3 md:space-y-4 mb-3 md:mb-0">
                  {/* Photo Edit Card */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 md:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.03)] text-center">
                    <div className="relative inline-block mx-auto mb-2">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={formData.name}
                          className="w-18 h-18 sm:w-22 sm:h-22 md:w-28 md:h-28 rounded-full object-cover ring-3 ring-indigo-50 shadow-sm mx-auto"
                        />
                      ) : (
                        <div className="w-18 h-18 sm:w-22 sm:h-22 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center text-[#4F46E5] font-extrabold text-[22px] sm:text-[26px] md:text-[32px] shadow-sm mx-auto">
                          {initials}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPhotoChooser(true)}
                        className="absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shadow-md hover:bg-indigo-700 active:scale-90 transition-all cursor-pointer ring-2 ring-white"
                        aria-label="Change photo badge"
                      >
                        <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.2} />
                      </button>
                    </div>

                    <div className="mb-2">
                      <p className="text-[14px] md:text-[15px] font-bold text-[#1E1B4B] truncate">
                        {formData.name || profile.name || "Your Name"}
                      </p>
                      <p className="text-[11px] md:text-[12px] text-slate-400 font-medium">
                        {profile.workspaceName || "Personal workspace"}
                      </p>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowPhotoChooser((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] md:text-[13px] font-semibold text-[#4F46E5] hover:bg-indigo-50/70 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#4F46E5]" />
                        {showPhotoChooser ? "Hide photo options" : "Change photo"}
                      </button>
                    </div>

                    {/* Photo Chooser Dropdown/Panel */}
                    {showPhotoChooser && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left animate-in fade-in duration-150">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-[#1E1B4B]">
                            Choose avatar preset
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPhotoChooser(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2.5">
                          {PRESET_AVATARS.map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setAvatarPreview(src);
                                setFormData((prev) => ({ ...prev, avatarUrl: src }));
                              }}
                              className={`w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                                avatarPreview === src
                                  ? "border-[#4F46E5] scale-105 shadow-sm"
                                  : "border-transparent hover:border-slate-300"
                              }`}
                            >
                              <img src={src} alt="preset" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-[11px] md:text-[12px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#4F46E5]" />
                            Upload from device
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                          Supported formats: JPG, PNG, GIF or WebP (max 3MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Security Note Card (Desktop left column) */}
                  <div className="hidden md:block bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_1px_6px_rgba(30,27,75,0.02)]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#1E1B4B]">
                          Identity Protection
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                          Profile details are stored privately in your encrypted vault. Updating your information synchronizes emergency contacts and directives automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Information Input Sections ── */}
                <div className="space-y-3 sm:space-y-4">

                  {/* ── Section 1: Basic Information ── */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 md:p-5 border border-slate-100/90 shadow-[0_2px_10px_rgba(30,27,75,0.03)] space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100/80">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div>
                        <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#1E1B4B]">
                          Basic Information
                        </h3>
                        <p className="text-[10.5px] sm:text-[11px] md:text-[12px] text-slate-400 font-medium">
                          Your official identity and display preferences
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-[11px] md:text-[12px] font-semibold text-slate-700 mb-1">
                          Full name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="e.g. Shahidul Islam"
                          className="w-full h-9 md:h-10 px-3 rounded-xl border border-slate-200 bg-white text-[12px] md:text-[13px] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all placeholder:text-slate-400 shadow-2xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] md:text-[12px] font-semibold text-slate-700 mb-1">
                          Display name
                        </label>
                        <input
                          type="text"
                          value={formData.displayName}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                          }
                          placeholder="e.g. Saurav"
                          className="w-full h-9 md:h-10 px-3 rounded-xl border border-slate-200 bg-white text-[12px] md:text-[13px] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all placeholder:text-slate-400 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] md:text-[12px] font-semibold text-slate-700 mb-1">
                        Date of birth
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                          }
                          className="w-full h-9 md:h-10 px-3 pr-9 rounded-xl border border-slate-200 bg-white text-[12px] md:text-[13px] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all placeholder:text-slate-400 shadow-2xs"
                        />
                        <Calendar className="w-4 h-4 text-[#4F46E5] absolute right-3 top-2.5 md:top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* ── Section 2: Contact Information ── */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 md:p-5 border border-slate-100/90 shadow-[0_2px_10px_rgba(30,27,75,0.03)] space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100/80">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div>
                        <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#1E1B4B]">
                          Contact Information
                        </h3>
                        <p className="text-[10.5px] sm:text-[11px] md:text-[12px] text-slate-400 font-medium">
                          Used for communications, security, and verification
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-[11px] md:text-[12px] font-semibold text-slate-700 mb-1">
                          Mobile number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            placeholder="+880 1XXX-XXXXXX"
                            className="w-full h-9 md:h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-[12px] md:text-[13px] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all placeholder:text-slate-400 font-mono shadow-2xs"
                          />
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 md:top-3 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] md:text-[12px] font-semibold text-slate-700 mb-1">
                          Email address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, email: e.target.value }))
                            }
                            placeholder="you@domain.com"
                            className="w-full h-9 md:h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-[12px] md:text-[13px] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all placeholder:text-slate-400 shadow-2xs"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 md:top-3 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 3: Address & Residence ── */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 md:p-5 border border-slate-100/90 shadow-[0_2px_10px_rgba(30,27,75,0.03)] space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100/80">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" strokeWidth={2.2} />
                      </div>
                      <div>
                        <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-[#1E1B4B]">
                          Address Details
                        </h3>
                        <p className="text-[10.5px] sm:text-[11px] md:text-[12px] text-slate-400 font-medium">
                          Current residence and permanent family location
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-[11px] md:text-[12px] font-semibold text-slate-700 mb-1">
                          Current address
                        </label>
                        <textarea
                          rows={3}
                          value={formData.address}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, address: e.target.value }))
                          }
                          placeholder="e.g. House 12, Road 4, Sector 7, Uttara, Dhaka"
                          className="w-full p-2.5 md:p-3 rounded-xl border border-slate-200 bg-white text-[12px] md:text-[13px] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all placeholder:text-slate-400 resize-none shadow-2xs leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] md:text-[12px] font-semibold text-slate-700 mb-1">
                          Permanent address
                        </label>
                        <textarea
                          rows={3}
                          value={formData.permanentAddress}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              permanentAddress: e.target.value,
                            }))
                          }
                          placeholder="e.g. Village/Town, Upazila, District"
                          className="w-full p-2.5 md:p-3 rounded-xl border border-slate-200 bg-white text-[12px] md:text-[13px] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all placeholder:text-slate-400 resize-none shadow-2xs leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Notice Banner ── */}
                  <div className="bg-[#EEF2FF]/80 border border-indigo-100/80 rounded-xl py-2.5 px-3.5 md:px-4 flex items-center gap-2.5 text-[11.5px] md:text-[12px] text-[#4F46E5] font-medium shadow-2xs">
                    <Info className="w-4 h-4 shrink-0 text-[#4F46E5]" />
                    <span>
                      Changes will update your personal profile, contacts directory, and dashboard records.
                    </span>
                  </div>

                  {/* ── Bottom Action Buttons ── */}
                  <div className="grid grid-cols-2 gap-2.5 md:gap-3 pt-1 pb-6 md:pb-8">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={isPending}
                      className="w-full h-10 md:h-11 rounded-xl bg-white border border-slate-200 text-[#1E1B4B] text-[12px] sm:text-[13px] md:text-[14px] font-semibold hover:bg-slate-50 active:scale-98 transition-all cursor-pointer shadow-2xs"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-10 md:h-11 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-[12px] sm:text-[13px] md:text-[14px] font-bold active:scale-98 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isPending ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
