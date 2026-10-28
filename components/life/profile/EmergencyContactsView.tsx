"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Phone,
  Eye,
  MoreVertical,
  ShieldAlert,
  Star,
  Trash2,
  X,
  Loader2,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ProfileData,
  EmergencyContactItem,
  addEmergencyContact,
  setPrimaryEmergencyContact,
  removeEmergencyContact,
} from "@/lib/actions/lifeProfile.actions";
import toast from "react-hot-toast";

interface EmergencyContactsViewProps {
  profile: ProfileData;
  onBack: () => void;
  onProfileUpdated: (updated: ProfileData) => void;
}

export function EmergencyContactsView({
  profile,
  onBack,
  onProfileUpdated,
}: EmergencyContactsViewProps) {
  const [isPending, startTransition] = useTransition();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContactItem | null>(null);

  // Form State
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const openAddModal = (contact?: EmergencyContactItem) => {
    if (contact) {
      setEditingContact(contact);
      setSelectedPersonId(contact._id);
      setRelationship(contact.relation);
      setPhone(contact.phone);
      setIsPrimary(contact.isPrimary);
    } else {
      setEditingContact(null);
      setSelectedPersonId(profile.availablePeople?.[0]?._id || "");
      setRelationship("");
      setPhone("");
      // If no emergency contacts exist, default isPrimary to true
      setIsPrimary(!profile.emergencyContacts || profile.emergencyContacts.length === 0);
    }
    setAddSheetOpen(true);
  };

  const handlePersonSelectChange = (personId: string) => {
    setSelectedPersonId(personId);
    const found = profile.availablePeople?.find((p) => p._id === personId);
    if (found) {
      setRelationship(found.relation || "");
      setPhone(found.phone || "");
    }
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) {
      toast.error("Please select a person from People");
      return;
    }

    startTransition(async () => {
      const res = await addEmergencyContact({
        personId: selectedPersonId,
        relationship: relationship.trim(),
        phone: phone.trim(),
        isPrimary,
      });

      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success(editingContact ? "Emergency contact updated!" : "Emergency contact added!");
        setAddSheetOpen(false);
      } else {
        toast.error(res.error || "Failed to save emergency contact");
      }
    });
  };

  const handleSetPrimary = (personId: string) => {
    startTransition(async () => {
      const res = await setPrimaryEmergencyContact(personId);
      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Designated as Primary Emergency Contact");
      } else {
        toast.error(res.error || "Failed to set primary");
      }
    });
  };

  const handleRemove = (personId: string, name: string) => {
    if (!confirm(`Remove "${name}" from emergency contacts? (Their profile in People will be preserved)`)) {
      return;
    }

    startTransition(async () => {
      const res = await removeEmergencyContact(personId);
      if (res.success && res.data) {
        onProfileUpdated(res.data);
        toast.success("Emergency contact removed");
      } else {
        toast.error(res.error || "Failed to remove emergency contact");
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
              Emergency Contacts
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trusted people to reach
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="h-8 px-3 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Linked from People Notice Banner */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs text-slate-600 dark:text-slate-300">
        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Contacts are linked from your People directory. You can add existing people as emergency contacts without duplicating records.
        </p>
      </div>

      {/* Emergency Contacts List */}
      {(!profile.emergencyContacts || profile.emergencyContacts.length === 0) ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100/90 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 stroke-[1.75]" />
          </div>
          <p className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
            No emergency contacts added
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Add a primary contact and backups who can be reached quickly in critical situations.
          </p>
          <button
            type="button"
            onClick={() => openAddModal()}
            className="mt-2 h-9 px-4 rounded-xl bg-purple-50 text-[#6D28D9] border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Primary Contact
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {profile.emergencyContacts.map((contact) => {
            const initials =
              contact.name
                .split(" ")
                .filter(Boolean)
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "EC";

            return (
              <div
                key={contact._id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                      {contact.avatarUrl ? (
                        <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                          {contact.name}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {contact.relation}
                      </p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        {contact.phone || "No phone added"}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                      contact.isPrimary
                        ? "bg-purple-50 dark:bg-purple-950/60 text-[#6D28D9] dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200"
                    }`}
                  >
                    {contact.isPrimary ? "Primary Contact" : "Backup Contact"}
                  </span>
                </div>

                {/* Card Action Row: Call | View | More Menu */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="h-8 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-[#6D28D9] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                    )}
                    <Link
                      href={`/people/${contact._id}`}
                      className="h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Link>
                  </div>

                  {/* More Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl w-48 p-1.5 shadow-lg">
                      <DropdownMenuItem
                        onClick={() => openAddModal(contact)}
                        className="text-xs font-medium cursor-pointer rounded-xl py-2"
                      >
                        Edit Emergency Contact
                      </DropdownMenuItem>
                      {!contact.isPrimary && (
                        <DropdownMenuItem
                          onClick={() => handleSetPrimary(contact._id)}
                          className="text-xs font-medium cursor-pointer rounded-xl py-2 text-purple-700 dark:text-purple-300"
                        >
                          <Star className="w-3.5 h-3.5 mr-1.5" />
                          Set as Primary
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleRemove(contact._id, contact.name)}
                        className="text-xs font-medium cursor-pointer rounded-xl py-2 text-rose-600 focus:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Remove from Emergency
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Emergency Contact Sheet */}
      <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="rounded-t-[32px] max-h-[90vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                {editingContact ? "Edit Emergency Contact" : "Add Emergency Contact"}
              </SheetTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a person from your People directory
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddSheetOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveContact} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select from People *
              </label>
              <select
                required
                disabled={Boolean(editingContact)}
                value={selectedPersonId}
                onChange={(e) => handlePersonSelectChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium disabled:bg-slate-100 disabled:opacity-60"
              >
                <option value="">Choose a person</option>
                {profile.availablePeople?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.relation || "Contact"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Relationship *
              </label>
              <input
                type="text"
                required
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Spouse, Brother, Father, Mother"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX XXXXXX"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            {/* Set as Primary Contact Toggle */}
            <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">
                  Set as Primary Contact
                </p>
                <p className="text-[11px] text-slate-400">
                  You can only have one primary contact.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            <div className="pt-3 pb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAddSheetOpen(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
