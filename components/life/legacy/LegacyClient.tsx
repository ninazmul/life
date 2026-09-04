/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  HeartHandshake,
  Plus,
  Mail,
  Eye,
  EyeOff,
  User,
  Calendar,
  Lock,
  Trash2,
  Send,
  Loader2,
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
        "Title, designated recipient and letter message are required.",
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
        messages.map((m) => (m._id === id ? { ...m, isReleased: next } : m)),
      );
      toast.success(
        next
          ? "Letter released and visible to recipient!"
          : "Letter concealed and protected.",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Personal Legacy Messages
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {messages.length} Letters
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Private heartfelt letters and confidential instructions designated
            for loved ones and trusted partners.
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs gap-1.5 shadow-sm shadow-rose-950/30"
        >
          <Plus className="w-3.5 h-3.5" />
          Write Legacy Message
        </Button>
      </div>

      {/* Legacy Emotional Quote Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-3.5">
        <HeartHandshake className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          &quot;If I become unavailable, the people I care about should
          understand what was intended for them, who to trust, and what personal
          message I left behind.&quot;
        </p>
      </div>

      {/* Letters List */}
      {messages.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-border text-center space-y-3">
          <Mail className="w-8 h-8 text-rose-400/60 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">
            No Legacy Letters Written
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Write private letters for your wife, brother, parents, or partners
            with custom release triggers.
          </p>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-8.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
          >
            + Write First Letter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {messages.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-3xl bg-card border border-border hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/40">
                      To: {item.recipientName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      item.isReleased
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {item.isReleased ? "Released" : "Concealed"}
                  </span>
                </div>

                <h3 className="font-bold text-base text-foreground mt-2.5 line-clamp-1">
                  {item.title}
                </h3>

                <div className="mt-3 p-4 rounded-2xl bg-muted border border-border text-xs text-slate-300 font-serif leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {item.message}
                </div>

                {item.releaseCondition && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Release Condition:{" "}
                    <span className="text-slate-400">
                      {item.releaseCondition}
                    </span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedLetter(item)}
                    className="h-8 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-rose-400" /> Read Letter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleToggleRelease(item._id, item.isReleased)
                    }
                    className="h-8 px-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    {item.isReleased ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item._id, item.title)}
                  className="h-7 w-7 p-0 text-slate-500 hover:text-red-400"
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
          <DialogContent className="sm:max-w-xl rounded-3xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <span className="text-xs uppercase font-bold text-rose-400">
                  Private Legacy Letter
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(selectedLetter.createdAt).toLocaleDateString()}
                </span>
              </div>
              <DialogTitle className="text-xl font-serif font-bold text-slate-100 pt-1">
                {selectedLetter.title}
              </DialogTitle>
              <p className="text-xs text-slate-400 font-sans">
                Dedicated to:{" "}
                <strong className="text-slate-200">
                  {selectedLetter.recipientName}
                </strong>
              </p>
            </DialogHeader>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-serif whitespace-pre-wrap mt-3">
              {selectedLetter.message}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => setSelectedLetter(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Letter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Write Legacy Letter Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-rose-400" />
              <span>Compose Legacy Letter</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Letter Title *
              </label>
              <Input
                required
                placeholder="e.g. A letter to my Wife / Advice for Sabbir"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Designated Recipient *
                </label>
                <select
                  required
                  value={recipientPersonId}
                  onChange={(e) => setRecipientPersonId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-rose-500 focus:outline-none"
                >
                  <option value="">-- Choose Person --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Visibility Rule
                </label>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as LifeVisibility)
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-rose-500 focus:outline-none"
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Release Conditions / Instructions
              </label>
              <Input
                placeholder="e.g. Release only in case of medical emergency or after 1 year"
                value={releaseCondition}
                onChange={(e) => setReleaseCondition(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Personal Message / Letter Body *
              </label>
              <textarea
                required
                rows={6}
                placeholder="Write your personal words, wisdom, financial instructions or private thoughts..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-rose-500 focus:outline-none font-serif leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
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
