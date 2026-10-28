"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Crown,
  Pencil,
  Lock,
  User,
  Heart,
  Users,
  Shield,
  KeyRound,
  ChevronRight,
  Circle,
} from "lucide-react";
import { ProfileData } from "@/lib/actions/lifeProfile.actions";
import { LifeVaultBottomNav } from "@/components/life/layout/LifeVaultBottomNav";
import { EditProfileSheet } from "./EditProfileSheet";
import { PhotoPickerModal } from "./PhotoPickerModal";
import { PersonalDetailsView } from "./PersonalDetailsView";
import { HealthProfileView } from "./HealthProfileView";
import { EmergencyContactsView } from "./EmergencyContactsView";
import { ProfilePrivacyView } from "./ProfilePrivacyView";
import { AccountSecurityView } from "./AccountSecurityView";

type ProfileSubView =
  | "main"
  | "personal_details"
  | "health_profile"
  | "emergency_contacts"
  | "profile_privacy"
  | "account_security";

interface ProfileClientProps {
  initialData: ProfileData;
  peopleCount?: number;
}

export function ProfileClient({ initialData, peopleCount = 0 }: ProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(initialData);
  const [activeView, setActiveView] = useState<ProfileSubView>("main");

  // Bottom sheets & Modals
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  // Sync with browser history for natural Back button behaviour
  const handleNavigateView = (view: ProfileSubView) => {
    setActiveView(view);
    if (typeof window !== "undefined") {
      window.history.pushState({ view }, "", view === "main" ? "/profile" : `/profile?tab=${view}`);
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        setActiveView(e.state.view);
      } else {
        setActiveView("main");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleProfileUpdated = (updated: ProfileData) => {
    setProfile(updated);
  };

  const initials =
    (profile.name || "Shahidul Islam")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SI";

  return (
    <div className="min-h-screen bg-[#F7F6FC] dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="max-w-[480px] sm:max-w-xl md:max-w-2xl mx-auto px-4 pt-4 sm:pt-6 pb-24">
        {/* ───────────────── SUB-VIEWS ───────────────── */}
        {activeView === "personal_details" && (
          <PersonalDetailsView
            profile={profile}
            onBack={() => handleNavigateView("main")}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {activeView === "health_profile" && (
          <HealthProfileView
            profile={profile}
            onBack={() => handleNavigateView("main")}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {activeView === "emergency_contacts" && (
          <EmergencyContactsView
            profile={profile}
            onBack={() => handleNavigateView("main")}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {activeView === "profile_privacy" && (
          <ProfilePrivacyView
            profile={profile}
            onBack={() => handleNavigateView("main")}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {activeView === "account_security" && (
          <AccountSecurityView
            profile={profile}
            onBack={() => handleNavigateView("main")}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {/* ───────────────── MAIN PROFILE PAGE (VIEW 1) ───────────────── */}
        {activeView === "main" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#1E1B4B] dark:text-slate-100 leading-tight">
                  My Profile
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your personal information & care
                </p>
              </div>
            </div>

            {/* Compact Identity Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-4">
              <div className="flex items-center gap-4">
                {/* Avatar with Camera Icon */}
                <div className="relative shrink-0">
                  <div
                    onClick={() => setPhotoPickerOpen(true)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-purple-100 dark:ring-purple-900/40 shadow-sm bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-extrabold cursor-pointer"
                  >
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoPickerOpen(true)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs transition-transform active:scale-90"
                    aria-label="Change profile photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Identity Information */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] dark:text-slate-100 truncate">
                    {profile.name || "Shahidul Islam"}
                  </h2>

                  {/* Badges Row: Role + Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 px-2 py-0.5 rounded-full">
                      <Crown className="w-3 h-3 text-amber-500" />
                      {profile.role || "Owner"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-2 py-0.5 rounded-full capitalize">
                      <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                      {profile.accountStatus || "Active"}
                    </span>
                  </div>

                  {/* Privacy Notice */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 pt-0.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Private by default</span>
                  </div>
                </div>
              </div>

              {/* Edit Profile Button */}
              <button
                type="button"
                onClick={() => setEditProfileOpen(true)}
                className="w-full h-10 rounded-2xl border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-slate-900 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-[#6D28D9] dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </div>

            {/* Section 1: Personal Essentials */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Personal Essentials
              </h3>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {/* Row 1: Personal Details */}
                <div
                  onClick={() => handleNavigateView("personal_details")}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100/80 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                        Personal Details
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Identity, contact & address
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Row 2: Health Profile */}
                <div
                  onClick={() => handleNavigateView("health_profile")}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center text-rose-500 shrink-0">
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                        Health Profile
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Medical history, reports & care
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Row 3: Emergency Contacts */}
                <div
                  onClick={() => handleNavigateView("emergency_contacts")}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                        Emergency Contacts
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Trusted people to reach
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            </div>

            {/* Section 2: Privacy & Account */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                Privacy & Account
              </h3>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {/* Row 1: Profile Privacy */}
                <div
                  onClick={() => handleNavigateView("profile_privacy")}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                        Profile Privacy
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Control who can see your details
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Row 2: Account Security */}
                <div
                  onClick={() => handleNavigateView("account_security")}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100/80 dark:border-sky-800/60 flex items-center justify-center text-sky-600 shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                        Account Security
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sign-in, verification & recovery
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Bottom Sheet */}
        <EditProfileSheet
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          profile={profile}
          onProfileUpdated={handleProfileUpdated}
        />

        {/* Direct Photo Picker Modal (from Avatar Camera Badge on Main Screen) */}
        <PhotoPickerModal
          open={photoPickerOpen}
          onOpenChange={setPhotoPickerOpen}
          currentAvatarUrl={profile.avatarUrl}
          userName={profile.name}
          onPhotoSelected={async (url) => {
            const { updateBasicProfile } = await import("@/lib/actions/lifeProfile.actions");
            const res = await updateBasicProfile({
              name: profile.name,
              avatarUrl: url,
            });
            if (res.success && res.data) {
              setProfile(res.data);
            }
          }}
          onPhotoRemoved={async () => {
            const { removeProfilePhoto } = await import("@/lib/actions/lifeProfile.actions");
            const res = await removeProfilePhoto();
            if (res.success && res.data) {
              setProfile(res.data);
            }
          }}
        />
      </div>

      {/* Bottom Navigation: Home | People | Workspace (neutral state, none active) */}
      <LifeVaultBottomNav peopleCount={peopleCount} />
    </div>
  );
}
