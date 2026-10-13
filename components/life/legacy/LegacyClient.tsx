/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  Plus,
  Mail,
  Eye,
  EyeOff,
  Trash2,
  Send,
  Loader2,
  ArrowLeft,
  Calendar,
  Lock,
  Unlock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ILifeLegacyMessage, ILifePerson, LifeVisibility } from "@/types";
import {
  createLegacyMessage,
  toggleLegacyRelease,
  deleteLegacyMessage,
} from "@/lib/actions/lifeLegacy.actions";
import toast from "react-hot-toast";

interface LegacyClientProps {
  initialMessages: ILifeLegacyMessage[];
  people: ILifePerson[];
}

export function LegacyClient({ initialMessages, people }: LegacyClientProps) {
  const router = useRouter();
  const [messages, setMessages] =
    useState<ILifeLegacyMessage[]>(initialMessages);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Read message modal
  const [selectedLetter, setSelectedLetter] =
    useState<ILifeLegacyMessage | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [recipientPersonId, setRecipientPersonId] = useState("");
  const [message, setMessage] = useState("");
  const [releaseCondition, setReleaseCondition] = useState("");
  const [visibility, setVisibility] =
    useState<LifeVisibility>("admin_can_release");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !recipientPersonId || !message.trim()) {
      toast.error(
        "Title, designated recipient and letter message are required."
      );
      return;
    }

    setLoading(true);
    try {
      const created = await createLegacyMessage({
        title,
        recipientPersonId,
        message,
        visibility,
        releaseCondition,
      });

      setMessages([created, ...messages]);
      toast.success("Legacy letter preserved in your private vault.");
      setAddModalOpen(false);
      // Reset
      setTitle("");
      setMessage("");
      setReleaseCondition("");
      setRecipientPersonId("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create legacy message.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRelease = async (id: string, current: boolean) => {
    const next = !current;
    try {
      await toggleLegacyRelease(id, next);
      setMessages(
        messages.map((m) => (m._id === id ? { ...m, isReleased: next } : m))
      );
      toast.success(
        next
          ? "Letter released and visible to recipient!"
          : "Letter concealed and protected."
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle release.");
    }
  };

  const handleDelete = async (id: string, letterTitle: string) => {
    if (!confirm(`Permanently destroy legacy letter "${letterTitle}"?`)) return;
    try {
      await deleteLegacyMessage(id);
      setMessages(messages.filter((m) => m._id !== id));
      toast.success("Letter destroyed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete legacy message.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 p-0 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
                Personal Legacy Messages
              </h1>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] border border-rose-100">
                {messages.length} Letters
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Heartfelt letters and confidential guidance designated for loved ones and trusted partners.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Write Legacy Message
        </Button>
      </div>

      {/* Legacy Emotional Quote Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50/80 via-white to-indigo-50/40 border border-rose-100 shadow-[0_2px_12px_rgba(225,29,72,0.03)] text-xs text-rose-950 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <HeartHandshake className="w-4 h-4" />
        </div>
        <p className="leading-relaxed font-serif italic text-slate-700 pt-1">
          &quot;If I become unavailable, the people I care about should understand what was intended for them, who to trust, and what personal message I left behind.&quot;
        </p>
      </div>

      {/* Letters List */}
      {messages.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto shadow-xs">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            No Legacy Letters Written
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Write private letters for your family, siblings, parents, or partners with custom release triggers.
          </p>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            + Write First Letter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {messages.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-[#E11D48] bg-[#FFE4E6] px-2.5 py-0.5 rounded-lg border border-rose-200/80">
                    To: {item.recipientName}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-lg border ${
                      item.isReleased
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1"
                        : "bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1"
                    }`}
                  >
                    {item.isReleased ? (
                      <>
                        <Unlock className="w-2.5 h-2.5 text-emerald-600" />
                        Released
                      </>
                    ) : (
                      <>
                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                        Concealed
                      </>
                    )}
                  </span>
                </div>

                <h3 className="font-black text-base text-[#1E1B4B] mt-3 line-clamp-1">
                  {item.title}
                </h3>

                <div className="mt-3 p-4 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700 font-serif leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {item.message}
                </div>

                {item.releaseCondition && (
                  <p className="text-[11px] font-medium text-slate-500 mt-2.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 text-slate-400" />
                    <span>Condition: </span>
                    <span className="text-slate-700 font-semibold">
                      {item.releaseCondition}
                    </span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedLetter(item)}
                    className="h-8 px-3 text-xs bg-[#EEF2FF] hover:bg-indigo-100 text-[#4F46E5] rounded-xl font-bold gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#4F46E5]" /> Read Letter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleToggleRelease(item._id, item.isReleased)
                    }
                    className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-bold gap-1 cursor-pointer"
                    title={item.isReleased ? "Conceal Letter" : "Release Letter"}
                  >
                    {item.isReleased ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Conceal
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        Release
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item._id, item.title)}
                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete letter"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read Letter Modal */}
      {selectedLetter && (
        <Dialog
          open={Boolean(selectedLetter)}
          onOpenChange={(open) => !open && setSelectedLetter(null)}
        >
          <DialogContent className="life-dialog sm:max-w-xl rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between pr-4">
                <span className="text-xs uppercase font-black text-[#E11D48] tracking-wider">
                  Private Legacy Letter
                </span>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(selectedLetter.createdAt).toLocaleDateString()}
                </span>
              </div>
              <DialogTitle className="text-xl font-serif font-black text-[#1E1B4B] pt-1">
                {selectedLetter.title}
              </DialogTitle>
              <p className="text-xs text-slate-500 font-medium">
                Dedicated to:{" "}
                <strong className="text-slate-800 font-bold">
                  {selectedLetter.recipientName}
                </strong>
              </p>
            </DialogHeader>

            <div className="p-6 rounded-2xl bg-amber-50/40 border border-amber-100/90 text-sm text-slate-800 leading-relaxed font-serif whitespace-pre-wrap mt-4 shadow-xs">
              {selectedLetter.message}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedLetter(null)}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Close Letter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Write Legacy Letter Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-lg rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-[#1E1B4B] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span>Compose Legacy Letter</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Letter Title *
              </label>
              <Input
                required
                placeholder="e.g. A letter to my Wife / Advice for Sabbir"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Designated Recipient *
                </label>
                <select
                  required
                  value={recipientPersonId}
                  onChange={(e) => setRecipientPersonId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  <option value="">-- Choose Person --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Visibility Rule
                </label>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as LifeVisibility)
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  <option value="admin_can_release">
                    Admin Can Release (Default)
                  </option>
                  <option value="emergency_only">
                    Emergency Only (Unlocked upon emergency)
                  </option>
                  <option value="visible_now">Visible Now to Recipient</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Release Conditions / Instructions
              </label>
              <Input
                placeholder="e.g. Release only in case of medical emergency or after 1 year"
                value={releaseCondition}
                onChange={(e) => setReleaseCondition(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Personal Message / Letter Body *
              </label>
              <textarea
                required
                rows={6}
                placeholder="Write your personal words, wisdom, financial instructions or private thoughts..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-serif leading-relaxed focus:bg-white focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="h-9 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold rounded-xl gap-2 shadow-xs transition-all cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Preserve Message
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
