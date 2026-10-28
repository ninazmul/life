"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Pencil, Lock, User, FileText, MapPin, Check, X, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProfileData, updatePersonalDetails } from "@/lib/actions/lifeProfile.actions";
import toast from "react-hot-toast";

interface PersonalDetailsViewProps {
  profile: ProfileData;
  onBack: () => void;
  onProfileUpdated: (updated: ProfileData) => void;
}

export function PersonalDetailsView({
  profile,
  onBack,
  onProfileUpdated,
}: PersonalDetailsViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [fullName, setFullName] = useState(profile.name || "");
  const [preferredName, setPreferredName] = useState(profile.preferredName || "");
  const [dob, setDob] = useState(profile.dateOfBirth || "");
  const [nationality, setNationality] = useState(profile.nationality || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [email, setEmail] = useState(profile.email || "");
  const [currentAddress, setCurrentAddress] = useState(profile.address || "");
  const [permanentAddress, setPermanentAddress] = useState(profile.permanentAddress || "");
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  const openEditModal = () => {
    setFullName(profile.name || "");
    setPreferredName(profile.preferredName || "");
    setDob(profile.dateOfBirth || "");
    setNationality(profile.nationality || "");
    setPhone(profile.phone || "");
    setEmail(profile.email || "");
    setCurrentAddress(profile.address || "");
    setPermanentAddress(profile.permanentAddress || "");
    setSameAsCurrent(
      Boolean(profile.address && profile.address === profile.permanentAddress)
    );
    setIsEditing(true);
  };

  const handleSameAsCurrentToggle = (checked: boolean) => {
    setSameAsCurrent(checked);
    if (checked) {
      setPermanentAddress(currentAddress);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }

    startTransition(async () => {
      const res = await updatePersonalDetails({
        name: fullName.trim(),
        preferredName: preferredName.trim(),
        dateOfBirth: dob.trim(),
        nationality: nationality.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: currentAddress.trim(),
        permanentAddress: sameAsCurrent ? currentAddress.trim() : permanentAddress.trim(),
      });

      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Personal details updated!");
        setIsEditing(false);
      } else {
        toast.error(res.error || "Failed to update details");
      }
    });
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1E1B4B] dark:text-slate-100 leading-tight">
              Personal Details
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your identity, contact & address
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openEditModal}
          className="h-8 px-3 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-[#6D28D9] dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
        <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
        <span>This information is private by default and only visible when you share it.</span>
      </div>

      {/* 1. Identity Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-[#1E1B4B] dark:text-slate-100 font-bold text-sm">
          <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Identity
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Full name</p>
            <p className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 mt-0.5">
              {profile.name || "Shahidul Islam"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Preferred name</p>
            <p className="text-sm font-semibold text-[#1E1B4B] dark:text-slate-100 mt-0.5">
              {profile.preferredName || "Not added"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Date of birth</p>
            <p className="text-sm font-semibold text-[#1E1B4B] dark:text-slate-100 mt-0.5">
              {profile.dateOfBirth || "Not added"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Nationality</p>
            <p className="text-sm font-semibold text-[#1E1B4B] dark:text-slate-100 mt-0.5">
              {profile.nationality || "Not added"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Contact Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-[#1E1B4B] dark:text-slate-100 font-bold text-sm">
          <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Contact
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Mobile number</p>
            <p className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 mt-0.5">
              {profile.phone || "Not added"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Email address</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                {profile.email || "Not added"}
              </span>
              {profile.emailVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-full shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Address Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-[#1E1B4B] dark:text-slate-100 font-bold text-sm">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Address
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Current address</p>
            <p className="text-sm font-semibold text-[#1E1B4B] dark:text-slate-100 mt-0.5 leading-relaxed">
              {profile.address || "Not added"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Permanent address</p>
            <p className="text-sm font-semibold text-[#1E1B4B] dark:text-slate-100 mt-0.5 leading-relaxed">
              {profile.permanentAddress || "Not added"}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Personal Details Sheet */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent
          side="bottom"
          className="rounded-t-[32px] max-h-[92vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                Edit Personal Details
              </SheetTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your identity, contact & address information
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Identity Group */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Preferred name
                  </label>
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="e.g. Bangladeshi"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Contact Group */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1XXX XXXXXX"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Email address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Address Group */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Address
              </h3>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Current address
                  </label>
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => {
                      setCurrentAddress(e.target.value);
                      if (sameAsCurrent) setPermanentAddress(e.target.value);
                    }}
                    placeholder="House, Road, Area, City"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sameAsCurrent"
                    checked={sameAsCurrent}
                    onChange={(e) => handleSameAsCurrentToggle(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="sameAsCurrent" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    Permanent address is same as current address
                  </label>
                </div>

                {!sameAsCurrent && (
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Permanent address
                    </label>
                    <input
                      type="text"
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      placeholder="Village/City, District"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-3 pb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
    </div>
  );
}
