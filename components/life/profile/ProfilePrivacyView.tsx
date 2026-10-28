"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Shield,
  User,
  Heart,
  Users,
  ChevronRight,
  Lock,
  Calendar,
  X,
  Trash2,
  Loader2,
  Check,
  Info,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ProfileData,
  PrivacyPermissionItem,
  shareProfileSection,
  revokeProfileSectionAccess,
} from "@/lib/actions/lifeProfile.actions";
import toast from "react-hot-toast";

interface ProfilePrivacyViewProps {
  profile: ProfileData;
  onBack: () => void;
  onProfileUpdated: (updated: ProfileData) => void;
}

export function ProfilePrivacyView({
  profile,
  onBack,
  onProfileUpdated,
}: ProfilePrivacyViewProps) {
  const [isPending, startTransition] = useTransition();

  // Active section for sharing sheet: "personal" | "health" | "emergency" | null
  const [activeSection, setActiveSection] = useState<"personal" | "health" | "emergency" | null>(null);

  // Form State
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [expiryDate, setExpiryDate] = useState("");

  const sectionOptions = {
    personal: {
      title: "Share Personal Details",
      recordType: "profile_personal",
      options: [
        { id: "mobile_email", label: "Mobile number & email" },
        { id: "current_address", label: "Current residential address" },
        { id: "permanent_address", label: "Permanent address" },
        { id: "dob_nationality", label: "Date of birth & nationality" },
      ],
    },
    health: {
      title: "Share Health Profile",
      recordType: "profile_health",
      options: [
        { id: "blood_group", label: "Blood group" },
        { id: "allergies_conditions", label: "Allergies & chronic conditions" },
        { id: "current_medicines", label: "Current medicines & dosages" },
        { id: "reports_history", label: "Medical reports & surgical history" },
      ],
    },
    emergency: {
      title: "Share Emergency Contacts",
      recordType: "profile_emergency",
      options: [
        { id: "primary_contact", label: "Primary emergency contact info" },
        { id: "all_contacts", label: "All emergency contacts & numbers" },
      ],
    },
  };

  const openShareSheet = (sec: "personal" | "health" | "emergency") => {
    setActiveSection(sec);
    setSelectedPersonId(profile.availablePeople?.[0]?._id || "");
    setSelectedRecords(sectionOptions[sec].options.map((o) => o.id));
    setPermission("view");
    setExpiryDate("");
  };

  const handleRecordToggle = (recordId: string) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSaveAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSection) return;

    if (!selectedPersonId) {
      toast.error("Please select a person to share with");
      return;
    }

    if (selectedRecords.length === 0) {
      toast.error("Please select at least one record to share");
      return;
    }

    startTransition(async () => {
      const res = await shareProfileSection({
        section: activeSection,
        personId: selectedPersonId,
        selectedRecords,
        permission,
        expiryDate: expiryDate || undefined,
      });

      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Sharing permissions saved successfully!");
        setActiveSection(null);
      } else {
        toast.error(res.error || "Failed to update sharing access");
      }
    });
  };

  const handleRevoke = (permissionId: string) => {
    if (!confirm("Are you sure you want to revoke access? They will no longer see this information.")) {
      return;
    }

    startTransition(async () => {
      const res = await revokeProfileSectionAccess(permissionId);
      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Access revoked");
      } else {
        toast.error(res.error || "Failed to revoke access");
      }
    });
  };

  const activePermissions = profile.privacySummary?.permissions || [];
  const currentSectionPerms = activeSection
    ? activePermissions.filter((p) => p.recordType === sectionOptions[activeSection].recordType)
    : [];

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
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
            Profile Privacy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control who can see your details
          </p>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
        <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          All profile details are private by default. You can selectively share specific sections with trusted individuals and revoke access anytime.
        </p>
      </div>

      {/* 3 Privacy Rows Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {/* Row 1: Personal Details */}
        <div
          onClick={() => openShareSheet("personal")}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                Personal Details
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {profile.privacySummary?.personalStatus || "Only me"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Row 2: Health Profile */}
        <div
          onClick={() => openShareSheet("health")}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-800/60 flex items-center justify-center text-rose-500 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                Health Profile
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {profile.privacySummary?.healthStatus || "Only me"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Row 3: Emergency Contacts */}
        <div
          onClick={() => openShareSheet("emergency")}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center text-amber-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                Emergency Contacts
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {profile.privacySummary?.emergencyStatus || "Only me"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Share Section Bottom Sheet */}
      {activeSection && (
        <Sheet open={Boolean(activeSection)} onOpenChange={(open) => !open && setActiveSection(null)}>
          <SheetContent
            side="bottom"
            className="rounded-t-[32px] max-h-[92vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                  {sectionOptions[activeSection].title}
                </SheetTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose who can access and what details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccess} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Share With Person */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Share with people *
                </label>
                <select
                  required
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
                >
                  <option value="">Select people</option>
                  {profile.availablePeople?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation || "Contact"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Records Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Selected records *
                </label>
                <div className="space-y-2 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
                  {sectionOptions[activeSection].options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(opt.id)}
                        onChange={() => handleRecordToggle(opt.id)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permission */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Permission *
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as "view" | "edit")}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
                >
                  <option value="view">View only</option>
                  <option value="edit">View and suggest updates</option>
                </select>
              </div>

              {/* Access Expires */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Access expires <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
                />
              </div>

              {/* Info Notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 text-[11px] text-purple-800 dark:text-purple-300">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Only selected details are shared. This is not a public profile.
                </span>
              </div>

              {/* Existing Permissions List for this section */}
              {currentSectionPerms.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Currently Shared With ({currentSectionPerms.length})
                  </p>
                  <div className="space-y-2">
                    {currentSectionPerms.map((perm) => (
                      <div
                        key={perm._id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#1E1B4B] dark:text-slate-100">
                            {perm.personName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {perm.canView ? "View only" : "Restricted"} {perm.expiryDate ? `• Expires ${perm.expiryDate}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevoke(perm._id)}
                          className="h-7 px-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 pb-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Access"}
                </button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
