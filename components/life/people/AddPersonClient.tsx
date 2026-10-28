/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Upload,
  Plus,
  ChevronDown,
  Info,
  Loader2,
  AlertTriangle,
  User,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createPerson,
  checkPersonDuplicate,
} from "@/lib/actions/lifePeople.actions";

const SUGGESTED_CONNECTIONS = [
  "Family",
  "Relative",
  "Friend",
  "Staff",
  "Business Partner",
  "Other Contact",
];

const RELATIONSHIP_OPTIONS = [
  "Brother",
  "Wife",
  "Husband",
  "Father",
  "Mother",
  "Son",
  "Daughter",
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
  const [connections, setConnections] = useState<string[]>(["Family"]);
  const [relationship, setRelationship] = useState("Brother");
  const [mobileNumber, setMobileNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ownerNote, setOwnerNote] = useState("");

  // Toggles
  const [isImportant, setIsImportant] = useState(false);
  const [isEmergencyContact, setIsEmergencyContact] = useState(false);
  const [inviteToVault, setInviteToVault] = useState(false);

  // Custom connection tag selector
  const [showAddTagSelector, setShowAddTagSelector] = useState(false);
  const [customTag, setCustomTag] = useState("");

  // Duplicate warning
  const [duplicateMatch, setDuplicateMatch] = useState<any | null>(null);
  const [forceProceed, setForceProceed] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size must be under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Toggle connection tag
  const handleAddConnection = (tag: string) => {
    const clean = tag.trim();
    if (!clean || connections.includes(clean)) return;
    setConnections([...connections, clean]);
    setShowAddTagSelector(false);
    setCustomTag("");
  };

  const handleRemoveConnection = (tag: string) => {
    if (connections.length <= 1) {
      toast.error("At least one connection tag is required.");
      return;
    }
    setConnections(connections.filter((c) => c !== tag));
  };

  // Check Duplicate on blur
  const handleCheckDuplicate = async () => {
    if (forceProceed || (!fullName.trim() && !emailAddress.trim())) return;
    const res = await checkPersonDuplicate({
      name: fullName.trim(),
      email: emailAddress.trim(),
      phone: mobileNumber.trim(),
    });
    if (res.hasPotentialMatch && res.matches.length > 0) {
      setDuplicateMatch(res.matches[0]);
    } else {
      setDuplicateMatch(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (inviteToVault && !emailAddress.trim()) {
      toast.error(
        "An email address is required to invite someone to Life VAULT."
      );
      return;
    }

    setSubmitting(true);
    try {
      const createPayload: any = {
        name: fullName.trim(),
        connections,
        category: connections[0] || "Other",
        relation: relationship,
        phone: mobileNumber.trim(),
        email: emailAddress.trim(),
        address: locationAddress.trim(),
        dateOfBirth: dateOfBirth.trim(),
        ownerNote: ownerNote.trim(),
        isImportant,
        isEmergencyContact,
        inviteAsUser: inviteToVault,
        profilePhoto: photoPreview,
        avatarUrl: photoPreview,
        forceCreate: forceProceed,
      };

      const res = await createPerson(createPayload);
      if (!res.success) {
        if (res.duplicateFound) {
          setDuplicateMatch(res.existingPerson);
          toast.error(res.error || "A contact with this email already exists.");
        } else {
          toast.error(res.error || "Failed to save contact.");
        }
        setSubmitting(false);
        return;
      }

      if (res.inviteSent) {
        toast.success(`Contact saved and invitation sent to ${emailAddress}!`);
      } else if (inviteToVault && res.inviteMessage) {
        toast.success(`Contact saved! (Note: ${res.inviteMessage})`);
      } else {
        toast.success(`Contact saved for ${res.data?.name || fullName}!`);
      }

      if (onSuccess) {
        onSuccess(res.data);
      } else {
        router.push("/people");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save person.");
    } finally {
      setSubmitting(false);
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
    <div
      className={`w-full ${
        isModal
          ? "p-1 sm:p-2"
          : "max-w-lg mx-auto pb-24 pt-2 sm:pt-4 px-3 sm:px-4"
      }`}
    >
      {/* Top Header: ✕ Add Person */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-extrabold text-[#1E1B4B]">
            Add Person
          </h1>
        </div>
      </div>

      {/* Main Form Content */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(30,27,75,0.03)] space-y-4 text-xs font-medium text-slate-700"
      >
        {/* Duplicate Match Alert */}
        {duplicateMatch && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-900">
                  Potential existing contact found:
                </p>
                <p className="text-[11px] text-amber-800 font-medium">
                  <span className="font-bold">{duplicateMatch.name}</span>
                  {duplicateMatch.email && ` • ${duplicateMatch.email}`}
                  {duplicateMatch.phone && ` • ${duplicateMatch.phone}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-amber-200/80">
              <button
                type="button"
                onClick={() => router.push(`/people/${duplicateMatch._id}`)}
                className="px-3 py-1 rounded-xl bg-white border border-amber-300 text-amber-800 text-[11px] font-bold hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                Open Existing Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setForceProceed(true);
                  setDuplicateMatch(null);
                }}
                className="px-3 py-1 rounded-xl text-slate-600 text-[11px] font-bold hover:bg-amber-100/60 transition-colors cursor-pointer"
              >
                Keep Separate Record
              </button>
            </div>
          </div>
        )}

        {/* Photo (optional) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600">
            Photo <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors font-bold text-xs text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Upload photo
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={() => setPhotoPreview("")}
                className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
              >
                Remove
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
        </div>

        {/* Full Name * */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={handleCheckDuplicate}
            placeholder="Enter full name"
            className="w-full text-xs rounded-xl border border-slate-200/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] font-medium shadow-2xs"
          />
        </div>

        {/* Connections (Multiple Selection) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700">
            Connections
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {connections.map((conn) => (
              <span
                key={conn}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EEF2FF] text-[#4F46E5] font-bold text-xs border border-indigo-100"
              >
                {conn}
                <button
                  type="button"
                  onClick={() => handleRemoveConnection(conn)}
                  className="w-3.5 h-3.5 hover:text-red-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* + Add tag Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAddTagSelector((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-dashed border-slate-300 text-slate-600 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors font-bold text-xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add tag
              </button>

              {showAddTagSelector && (
                <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl p-2.5 z-40 space-y-2 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold px-1">
                    Suggested tags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_CONNECTIONS.filter(
                      (s) => !connections.includes(s)
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddConnection(s)}
                        className="text-[11px] text-slate-600 bg-slate-50 hover:bg-[#EEF2FF] hover:text-[#4F46E5] px-2 py-1 rounded-lg border border-slate-200/80 transition-colors font-medium cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddConnection(customTag);
                        }
                      }}
                      placeholder="Custom tag..."
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#4F46E5]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddConnection(customTag)}
                      className="px-2.5 py-1 bg-[#4F46E5] text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relationship (optional) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700">
            Relationship <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full text-xs appearance-none rounded-xl border border-slate-200/90 px-3 py-2.5 pr-8 bg-white text-slate-800 focus:outline-none focus:border-[#4F46E5] font-medium shadow-2xs cursor-pointer"
            >
              {RELATIONSHIP_OPTIONS.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Mobile (optional) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700">
            Mobile <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            onBlur={handleCheckDuplicate}
            placeholder="+880 17*****"
            className="w-full text-xs rounded-xl border border-slate-200/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] font-medium shadow-2xs"
          />
        </div>

        {/* Email (optional) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700">
            Email <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            onBlur={handleCheckDuplicate}
            placeholder="name@example.com"
            className="w-full text-xs rounded-xl border border-slate-200/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] font-medium shadow-2xs"
          />
        </div>

        {/* Collapsible: More Details */}
        <div className="border border-slate-200/70 rounded-2xl p-3 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setShowMoreDetails((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-bold text-[#1E1B4B] cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showMoreDetails ? "rotate-180" : ""
                }`}
              />
              <span>More details</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              Address, birthday and owner-only note
            </span>
          </button>

          {showMoreDetails && (
            <div className="mt-3 space-y-3 pt-3 border-t border-slate-200/60">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full text-xs bg-white rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full text-xs bg-white rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Owner-Only Note{" "}
                  <span className="font-normal text-slate-400">
                    (Private to you)
                  </span>
                </label>
                <textarea
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                  placeholder="Write a private note only you can view..."
                  rows={2}
                  className="w-full text-xs bg-white rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:border-[#4F46E5] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-2.5 pt-1">
          {/* Important */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#1E1B4B]">Important</span>
              <span className="text-[11px] text-slate-400" title="Pin to priority directory views">ⓘ</span>
            </div>
            <button
              type="button"
              onClick={() => setIsImportant((v) => !v)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                isImportant ? "bg-[#4F46E5]" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  isImportant ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Emergency Contact */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#1E1B4B]">
                Emergency contact
              </span>
              <span className="text-[11px] text-slate-400" title="Identify for urgent protocols">ⓘ</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEmergencyContact((v) => !v)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                isEmergencyContact ? "bg-[#4F46E5]" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  isEmergencyContact ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Invite to Life VAULT */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white">
            <div>
              <span className="text-xs font-bold text-[#1E1B4B]">
                Invite to Life VAULT
              </span>
              <p className="text-[10px] text-slate-400 font-medium">
                Requires an email. Sharing is configured separately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInviteToVault((v) => !v)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                inviteToVault ? "bg-[#4F46E5]" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  inviteToVault ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Helper Callout */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-medium">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Save a contact without creating a user account.</span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            <span>Save Contact</span>
          </button>
        </div>
      </form>
    </div>
  );
}
