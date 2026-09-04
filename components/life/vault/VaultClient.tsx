"use client";

import { useState } from "react";
import {
  KeyRound,
  Plus,
  Search,
  Eye,
  Shield,
  Trash2,
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
import { VaultRevealModal } from "@/components/life/shared/VaultRevealModal";
import { VaultListItem, createVaultItem, deleteVaultItem } from "@/lib/actions/lifeVault.actions";
import { VaultCategory } from "@/types";
import toast from "react-hot-toast";

interface VaultClientProps {
  initialItems: VaultListItem[];
}

export function VaultClient({ initialItems }: VaultClientProps) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Secure Vault
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              AES-256-GCM
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Zero-knowledge encrypted storage for servers, hosting credentials, master router logins, and emergency recovery codes.
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs gap-1.5 shadow-sm shadow-amber-950/30"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Secret / Credential
        </Button>
      </div>

      {/* Security Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <Shield className="w-4 h-4 shrink-0" />
          <span>
            Secrets are encrypted at rest. Plaintext passwords are never returned in listings.
          </span>
        </div>
        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold hidden sm:inline">
          Tamper-Resistant
        </span>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search credentials, websites, servers, or usernames..."
            className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap capitalize transition-all ${
                categoryFilter === cat
                  ? "bg-amber-600 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {cat === "all" ? "All Secrets" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vault Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
          <KeyRound className="w-8 h-8 text-amber-500/60 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Vault Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Store root server passwords, Cloudflare credentials, router admin logins, and recovery phrases.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Updated {new Date(item.lastUpdated || item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
                  {item.title}
                </h3>

                <div className="mt-2.5 space-y-1 text-xs text-slate-400 font-mono">
                  {item.systemOrWebsite && (
                    <p className="truncate text-foreground">System: {item.systemOrWebsite}</p>
                  )}
                  {item.username && (
                    <p className="truncate">Username: <span className="text-foreground">{item.username}</span></p>
                  )}
                  {item.url && (
                    <p className="truncate text-cyan-700 dark:text-cyan-300">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {item.url}
                      </a>
                    </p>
                  )}
                </div>

                {item.recoveryInfo && (
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-950/50 text-[11px] text-slate-400">
                    <span className="text-amber-700 dark:text-amber-300 font-bold">Recovery:</span> {item.recoveryInfo}
                  </div>
                )}
              </div>

              {/* Reveal Action & Delete */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <Button
                  size="sm"
                  onClick={() => handleOpenReveal(item._id, item.title)}
                  className="h-8 px-3 text-xs bg-amber-600/90 hover:bg-amber-600 text-white rounded-xl font-semibold gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" /> Reveal Secret
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item._id, item.title)}
                  className="h-7 w-7 p-0 text-slate-500 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
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
        <DialogContent className="life-dialog sm:max-w-md rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-300" />
              <span>Store Vault Secret</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Title *
              </label>
              <Input
                required
                placeholder="e.g. Core Mikrotik Router or AWS Root Account"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VaultCategory)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
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
                <label className="text-xs font-semibold text-slate-300">
                  System / Platform Name
                </label>
                <Input
                  placeholder="e.g. Hetzner, AWS, Namecheap"
                  value={systemOrWebsite}
                  onChange={(e) => setSystemOrWebsite(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Username / Login ID
                </label>
                <Input
                  placeholder="e.g. root, admin, nazmul@life.local"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Login URL
                </label>
                <Input
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-amber-300">
                Secret / Password (Encrypted at rest with AES-256-GCM) *
              </label>
              <Input
                required
                type="password"
                placeholder="Enter sensitive password, API secret or recovery phrase..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="h-11 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Recovery Codes / 2FA Hints
              </label>
              <Input
                placeholder="Backup codes, security questions..."
                value={recoveryInfo}
                onChange={(e) => setRecoveryInfo(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
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
                className="h-9 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Encrypt & Save Secret
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
