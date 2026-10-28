/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  User,
  LayoutGrid,
  Users,
  Phone,
  Mail,
  UserPlus,
  MapPin,
  FileText,
  Check,
  Star,
  AlertTriangle,
  Info,
  Send,
  Loader2,
  X,
} from "lucide-react";
import { createPerson } from "@/lib/actions/lifePeople.actions";
import toast from "react-hot-toast";

const CATEGORY_OPTIONS = [
  "Family Member",
  "Guardian",
  "Staff",
  "Business Partner",
  "Friend",
  "General User",
  "Other",
];

const RELATIONSHIP_OPTIONS = [
  "Wife / Husband",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Uncle / Aunt",
  "Cousin",
  "Other Relative",
  "Friend",
  "Employee",
  "Colleague",
  "Business Partner",
  "Guardian",
  "Advisor",
  "Caregiver",
  "Other",
];

interface AddPersonClientProps {
  onSuccess?: (person: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function AddPersonClient({
  onSuccess,
  onCancel,
  isModal = false,
}: AddPersonClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [category, setCategory] = useState("Family Member");
  const [relationship, setRelationship] = useState("Brother");
  const [customRelationship, setCustomRelationship] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [inviteAsUser, setInviteAsUser] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");
  const [shortNote, setShortNote] = useState("");

  // Status & Tags
  const [isActiveTag, setIsActiveTag] = useState(true);
  const [isImportantTag, setIsImportantTag] = useState(false);
  const [isEmergencyContactTag, setIsEmergencyContactTag] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo upload handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size must be under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (overrideInvite?: boolean) => {
    const shouldInvite = overrideInvite !== undefined ? overrideInvite : inviteAsUser;

    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    const effectiveRelation =
      relationship === "Other" && customRelationship.trim()
        ? customRelationship.trim()
        : relationship;

    if (!effectiveRelation.trim()) {
      toast.error("Relationship is required.");
      return;
    }

    if (shouldInvite && !emailAddress.trim()) {
      toast.error("Valid email address is required to invite as a user.");
      return;
    }

    if (emailAddress.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress.trim())) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const tags: string[] = [];
      if (isActiveTag) tags.push("active");
      if (isImportantTag) tags.push("important");
      if (isEmergencyContactTag) tags.push("emergency_contact");

      const result = await createPerson({
        name: fullName.trim(),
        category,
        relation: effectiveRelation,
        phone: mobileNumber.trim(),
        whatsapp: mobileNumber.trim(),
        email: emailAddress.trim(),
        location: locationAddress.trim(),
        address: locationAddress.trim(),
        shortNote: shortNote.trim(),
        tags,
        isImportant: isImportantTag,
        isEmergencyContact: isEmergencyContactTag,
        inviteAsUser: shouldInvite,
        profilePhoto: photoPreview,
        avatarUrl: photoPreview,
        status: isActiveTag ? "active" : "locked",
      });

      if (!result.success) {
        toast.error(result.error || "Failed to save person.");
        return;
      }

      toast.success(
        shouldInvite
          ? `Person created and invitation sent to ${emailAddress}!`
          : `Profile for ${result.data.name} saved!`
      );

      if (onSuccess) {
        onSuccess(result.data);
      } else {
        router.push("/people");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save person.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className={`w-full ${isModal ? "p-1 sm:p-2" : "max-w-2xl mx-auto pb-24 pt-2 sm:pt-4 px-3 sm:px-6"}`}>
      {/* Top Header */}
      {!isModal ? (
        <div className="mb-5 sm:mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#4F46E5] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
            Add Person
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Create a contact or invite a user to Life VAULT
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#1E1B4B]">Add Person</h2>
            <p className="text-xs text-slate-500 font-medium">Create a contact or invite a user to Life VAULT</p>
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form Content */}
      <div className={isModal ? "space-y-4 pt-1" : "bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-5"}>
        {/* Profile Photo Section */}
        <div className="flex items-center gap-4 sm:gap-5 pb-1">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#EEF2FF] border-2 border-indigo-100 flex items-center justify-center overflow-hidden shadow-2xs">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
              )}
            </div>

            {/* Camera action badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload profile photo"
              className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#6366F1] hover:bg-indigo-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[#1E1B4B]">
              Profile Photo
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload a photo to easily identify this person.
            </p>
            {photoPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-[#1E1B4B] flex items-center gap-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              required
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>
        </div>

        {/* Category & Relationship (2 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-[#1E1B4B] flex items-center gap-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 pl-10 pr-8 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all font-medium appearance-none cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Relationship */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-[#1E1B4B] flex items-center gap-1">
              Relationship <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Users className="w-4 h-4" />
              </div>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full h-11 pl-10 pr-8 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all font-medium appearance-none cursor-pointer"
              >
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {relationship === "Other" && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-600">
              Specify Custom Relationship
            </label>
            <input
              type="text"
              value={customRelationship}
              onChange={(e) => setCustomRelationship(e.target.value)}
              placeholder="e.g. Mentor, Landlord, Caretaker"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        )}

        {/* Mobile Number */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-[#1E1B4B]">
            Mobile Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+880 1712 345678"
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-[#1E1B4B] flex items-center gap-1">
            Email Address
            {inviteAsUser && <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="Enter email address"
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>
        </div>

        {/* Invite as User Toggle Card */}
        <div className="p-4 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-[#6D28D9] flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#1E1B4B]">
                Invite as User
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                If enabled, an invitation will be sent to this email.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={inviteAsUser}
              onChange={(e) => setInviteAsUser(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6D28D9]"></div>
          </label>
        </div>

        {/* Location / Address */}
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-[#1E1B4B]">
            Location / Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="Enter location or address"
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>
        </div>

        {/* Short Note / Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-[#1E1B4B]">
              Short Note / Description
            </label>
            <span className="text-[11px] font-semibold text-slate-400">
              {shortNote.length}/300
            </span>
          </div>
          <div className="relative">
            <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              value={shortNote}
              onChange={(e) => {
                if (e.target.value.length <= 300) setShortNote(e.target.value);
              }}
              rows={3}
              placeholder="Add a short note about this person..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all font-medium resize-none"
            />
          </div>
        </div>

        {/* Status / Tag Pills */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-bold text-[#1E1B4B]">
            Status / Tag
          </label>
          <div className="flex flex-wrap gap-2">
            {/* Active Pill */}
            <button
              type="button"
              onClick={() => setIsActiveTag(!isActiveTag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isActiveTag
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-2xs"
                  : "bg-slate-50 text-slate-500 border-slate-200/70 hover:bg-slate-100"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  isActiveTag ? "bg-emerald-600 text-white" : "bg-slate-300 text-white"
                }`}
              >
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
              </div>
              <span>Active</span>
            </button>

            {/* Important Pill */}
            <button
              type="button"
              onClick={() => setIsImportantTag(!isImportantTag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isImportantTag
                  ? "bg-amber-50 text-amber-700 border-amber-200/90 shadow-2xs"
                  : "bg-slate-50 text-slate-500 border-slate-200/70 hover:bg-slate-100"
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isImportantTag ? "fill-amber-500 text-amber-500" : "text-slate-400"
                }`}
              />
              <span>Important</span>
            </button>

            {/* Emergency Contact Pill */}
            <button
              type="button"
              onClick={() => setIsEmergencyContactTag(!isEmergencyContactTag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isEmergencyContactTag
                  ? "bg-rose-50 text-rose-700 border-rose-200/90 shadow-2xs"
                  : "bg-slate-50 text-slate-500 border-slate-200/70 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  isEmergencyContactTag ? "text-rose-600" : "text-slate-400"
                }`}
              />
              <span>Emergency Contact</span>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-2.5 text-xs text-sky-800 font-medium">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Without email, this person can be saved as a contact only.</span>
        </div>

        {/* Action Buttons: Cancel + Save */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="w-full h-11 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 active:scale-98 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="w-full h-11 rounded-2xl bg-[#6366F1] hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : inviteAsUser ? (
              <span>Save & Send Invite</span>
            ) : (
              <span>Save Person</span>
            )}
          </button>
        </div>

        {/* Secondary Send Invite Button at Bottom */}
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
          className="w-full p-3 rounded-2xl border border-purple-200/80 bg-[#FAF5FF] hover:bg-purple-100/60 active:scale-98 text-left transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60 group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-200/80 text-[#6D28D9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Send className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs sm:text-sm font-bold text-[#6D28D9]">
              Send Invite
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Send invitation to join Life VAULT
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
