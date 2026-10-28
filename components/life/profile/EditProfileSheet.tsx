"use client";

import { useState, useTransition } from "react";
import { X, Camera, Check, Info, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProfileData, updateBasicProfile } from "@/lib/actions/lifeProfile.actions";
import { PhotoPickerModal } from "./PhotoPickerModal";
import toast from "react-hot-toast";

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  onProfileUpdated: (updated: ProfileData) => void;
}

export function EditProfileSheet({
  open,
  onOpenChange,
  profile,
  onProfileUpdated,
}: EditProfileSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(profile.name || "");
  const [preferredName, setPreferredName] = useState(profile.preferredName || "");
  const [countryCode, setCountryCode] = useState("+880");
  const [phone, setPhone] = useState(
    profile.phone ? profile.phone.replace(/^\+880\s?/, "") : ""
  );
  const [about, setAbout] = useState(profile.about || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");

  // Sync state when profile changes or sheet opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFullName(profile.name || "");
      setPreferredName(profile.preferredName || "");
      setPhone(profile.phone ? profile.phone.replace(/^\+880\s?/, "") : "");
      setAbout(profile.about || "");
      setAvatarUrl(profile.avatarUrl || "");
    }
    onOpenChange(nextOpen);
  };

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SI";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = fullName.trim();
    if (!cleanName) {
      toast.error("Full name is required");
      return;
    }

    if (about.length > 200) {
      toast.error("About text must be 200 characters or fewer");
      return;
    }

    const formattedPhone = phone.trim() ? `${countryCode} ${phone.trim()}` : "";

    startTransition(async () => {
      const res = await updateBasicProfile({
        name: cleanName,
        preferredName: preferredName.trim(),
        phone: formattedPhone,
        about: about.trim(),
        avatarUrl,
      });

      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Profile updated successfully!");
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-[32px] max-h-[92vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                Edit Profile
              </SheetTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your basic information
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Scroll Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Avatar Section */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-purple-100 dark:ring-purple-900/40 shadow-sm bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-extrabold">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoPickerOpen(true)}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 transition-transform active:scale-90"
                  aria-label="Change photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPhotoPickerOpen(true)}
                className="mt-2.5 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-[#6D28D9] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Change Photo
              </button>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                Full name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full legal name"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-[#1E1B4B] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Preferred Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Preferred name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="Enter preferred name"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-[#1E1B4B] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mobile number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-11 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="+880">+880 (BD)</option>
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+971">+971 (UAE)</option>
                  <option value="+966">+966 (KSA)</option>
                  <option value="+91">+91 (IN)</option>
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXX XXXXXX"
                  className="flex-1 h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-[#1E1B4B] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                {profile.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Verified
                  </span>
                )}
              </div>
              <input
                type="email"
                disabled
                value={profile.email || ""}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-start gap-1 mt-1 leading-tight">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-600" />
                To change your email, you need to verify your new email address in Account Security.
              </p>
            </div>

            {/* About You */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  About you <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {about.length}/200
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell us a little about yourself..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-sm text-[#1E1B4B] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 pb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Reusable Photo Picker Modal */}
      <PhotoPickerModal
        open={photoPickerOpen}
        onOpenChange={setPhotoPickerOpen}
        currentAvatarUrl={avatarUrl}
        userName={fullName || profile.name}
        onPhotoSelected={(url) => setAvatarUrl(url)}
        onPhotoRemoved={() => setAvatarUrl("")}
      />
    </>
  );
}
