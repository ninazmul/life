"use client";

import { useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  Plus,
  Search,
  Eye,
  Shield,
  Trash2,
  Loader2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VaultRevealModal } from "@/components/life/shared/VaultRevealModal";
import { VaultListItem, createVaultItem, deleteVaultItem } from "@/lib/actions/lifeVault.actions";
import { VaultCategory } from "@/types";
import toast from "react-hot-toast";

interface VaultClientProps {
  initialItems: VaultListItem[];
  isVaultLocked?: boolean;
}

export function VaultClient({ initialItems, isVaultLocked = false }: VaultClientProps) {
  const [items, setItems] = useState<VaultListItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reveal Modal State
  const [revealTarget, setRevealTarget] = useState<{ id: string; title: string } | null>(null);
  const [revealModalOpen, setRevealModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [systemOrWebsite, setSystemOrWebsite] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [recoveryInfo, setRecoveryInfo] = useState("");
  const [category, setCategory] = useState<VaultCategory>("website");
  const [notes, setNotes] = useState("");

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.systemOrWebsite && item.systemOrWebsite.toLowerCase().includes(search.toLowerCase())) ||
      (item.username && item.username.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    "website",
    "business",
    "hosting",
    "domain",
    "email",
    "router",
    "server",
    "pin",
    "recovery",
    "other",
  ];

  const handleOpenReveal = (id: string, title: string) => {
    setRevealTarget({ id, title });
    setRevealModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !secret.trim()) {
      toast.error("Title and secret password/key are required.");
      return;
    }

    setLoading(true);
    try {
      await createVaultItem({
        title,
        systemOrWebsite,
        url,
        username,
        secret,
        recoveryInfo,
        category,
        notes,
      });

      toast.success(`Vault item "${title}" encrypted and stored!`);
      setAddModalOpen(false);

      // Add local preview item
      setItems([
        {
          _id: `vault-${Date.now()}`,
          title,
          systemOrWebsite,
          url,
          username,
          recoveryInfo,
          category,
          notes,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        ...items,
      ]);

      // Reset
      setTitle("");
      setSystemOrWebsite("");
      setUrl("");
      setUsername("");
      setSecret("");
      setRecoveryInfo("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to encrypt and store secret.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!confirm(`Permanently destroy encrypted secret for "${itemTitle}"?`)) return;
    try {
      await deleteVaultItem(id);
      setItems(items.filter((i) => i._id !== id));
      toast.success("Vault item destroyed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete vault item.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] tracking-tight">
              Secure Vault
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/80 shadow-2xs">
              AES-256-GCM
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Zero-knowledge encrypted storage for servers, hosting credentials, router logins, and recovery keys.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
          <span>Add Secret / Credential</span>
        </button>
      </div>

      {/* Vault Locked Alert Banner */}
      {isVaultLocked && (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-rose-50 border border-rose-200/90 shadow-[0_2px_12px_rgba(225,29,72,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  Authentication Path Locked
                </span>
                <span className="text-xs font-bold text-rose-700">
                  15 Consecutive Failed PIN Attempts
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Vault PIN verification is locked. Super Admins can unlock via Master PIN in Access Control.
              </p>
            </div>
          </div>
          <Link
            href="/access"
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs shrink-0 transition-colors"
          >
            <span>Resolve in Access Control</span>
          </Link>
        </div>
      )}

      {/* Security Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <span className="font-medium text-slate-600">
            Secrets are encrypted at rest with AES-256-GCM. Plaintext credentials are never returned in listings.
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#4F46E5] font-bold hidden sm:inline px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-indigo-100/80">
          Zero-Knowledge
        </span>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search credentials, websites, servers, or usernames..."
            className="pl-9.5 h-10 rounded-xl border border-slate-200/80 bg-white text-xs text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#4F46E5] text-white shadow-xs border border-indigo-600"
                  : "bg-white border border-slate-100/90 text-slate-600 hover:text-[#1E1B4B] hover:border-indigo-200/70 shadow-2xs"
              }`}
            >
              {cat === "all" ? "All Secrets" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vault Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-2xs">
            <KeyRound className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E1B4B]">No Vault Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Store root server passwords, Cloudflare credentials, router admin logins, and recovery seeds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            <span>Add Secret</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-200/70 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/70">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(item.lastUpdated || item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-[15px] text-[#1E1B4B] group-hover:text-[#4F46E5] transition-colors mt-2.5 line-clamp-1">
                  {item.title}
                </h3>

                <div className="mt-2.5 space-y-1.5 text-xs text-slate-500 font-mono">
                  {item.systemOrWebsite && (
                    <p className="truncate text-slate-700">
                      <span className="text-slate-400 font-sans">System:</span> {item.systemOrWebsite}
                    </p>
                  )}
                  {item.username && (
                    <p className="truncate text-slate-700">
                      <span className="text-slate-400 font-sans">Username:</span> {item.username}
                    </p>
                  )}
                  {item.url && (
                    <p className="truncate text-[#0284C7]">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {item.url}
                      </a>
                    </p>
                  )}
                </div>

                {item.recoveryInfo && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                    <span className="text-[#D97706] font-bold">Recovery:</span> {item.recoveryInfo}
                  </div>
                )}
              </div>

              {/* Reveal Action & Delete */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenReveal(item._id, item.title)}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
                  <span>Reveal Secret</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item._id, item.title)}
                  className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                  title="Delete secret"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reveal Modal */}
      <VaultRevealModal
        open={revealModalOpen}
        onOpenChange={setRevealModalOpen}
        itemId={revealTarget?.id || null}
        itemTitle={revealTarget?.title}
      />

      {/* Add Vault Secret Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-slate-100 bg-white text-slate-900 max-h-[90vh] overflow-y-auto shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span>Store Vault Secret</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Title *
              </label>
              <Input
                required
                placeholder="e.g. Core Mikrotik Router or AWS Root Account"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VaultCategory)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] focus:outline-none cursor-pointer"
                >
                  <option value="website">Website / Dashboard</option>
                  <option value="business">Business Account</option>
                  <option value="hosting">Hosting Provider</option>
                  <option value="domain">Domain Registrar</option>
                  <option value="email">Email System</option>
                  <option value="router">Router / Network Gateway</option>
                  <option value="server">Linux / Windows Server</option>
                  <option value="pin">PIN / Locker Code</option>
                  <option value="recovery">2FA Recovery Seed</option>
                  <option value="other">Other Secret</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  System / Platform Name
                </label>
                <Input
                  placeholder="e.g. Hetzner, AWS, Namecheap"
                  value={systemOrWebsite}
                  onChange={(e) => setSystemOrWebsite(e.target.value)}
                  className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Username / Login ID
                </label>
                <Input
                  placeholder="e.g. root, admin, nazmul@life.local"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-mono rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Login URL
                </label>
                <Input
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#4F46E5]">
                Secret / Password (Encrypted at rest with AES-256-GCM) *
              </label>
              <Input
                required
                type="password"
                placeholder="Enter sensitive password, API secret or recovery phrase..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="h-11 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] font-mono rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Recovery Codes / 2FA Hints
              </label>
              <Input
                placeholder="Backup codes, security questions..."
                value={recoveryInfo}
                onChange={(e) => setRecoveryInfo(e.target.value)}
                className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Encrypt & Save Secret</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
