"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  Search,
  FolderLock,
  KeyRound,
  User,
  FileText,
  HeartHandshake,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrashItem,
  restoreTrashItem,
  permanentlyDeleteTrashItem,
} from "@/lib/actions/lifeTrash.actions";
import toast from "react-hot-toast";

interface TrashClientProps {
  initialItems: TrashItem[];
  isOwner: boolean;
}

export function TrashClient({ initialItems, isOwner }: TrashClientProps) {
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [purgeDialogItem, setPurgeDialogItem] = useState<TrashItem | null>(null);
  const [purging, setPurging] = useState(false);

  const getItemIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FolderLock className="w-4 h-4 text-indigo-500" />;
      case "vault":
        return <KeyRound className="w-4 h-4 text-amber-500" />;
      case "person":
        return <User className="w-4 h-4 text-blue-500" />;
      case "legacy":
        return <HeartHandshake className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-emerald-500" />;
    }
  };

  const handleRestore = async (item: TrashItem) => {
    setLoadingId(item.id);
    try {
      const res = await restoreTrashItem(item.itemType, item.id);
      if (res.success) {
        toast.success(`"${item.title}" restored successfully.`);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        toast.error(res.error || "Failed to restore item.");
      }
    } catch {
      toast.error("Failed to restore item.");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePurge = async () => {
    if (!purgeDialogItem) return;
    setPurging(true);
    try {
      const res = await permanentlyDeleteTrashItem(
        purgeDialogItem.itemType,
        purgeDialogItem.id
      );
      if (res.success) {
        toast.success(`"${purgeDialogItem.title}" permanently removed.`);
        setItems((prev) => prev.filter((i) => i.id !== purgeDialogItem.id));
        setPurgeDialogItem(null);
      } else {
        toast.error(res.error || "Failed to permanently delete item.");
      }
    } catch {
      toast.error("Failed to permanently delete item.");
    } finally {
      setPurging(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (typeFilter !== "all" && item.itemType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Security & Settings
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Trash & Recovery System
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Safely restore accidentally removed documents, vault records, profiles, and instructions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-secondary border border-border text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} in trash
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items in trash..."
            className="pl-9 h-10 rounded-2xl border-border bg-card text-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["all", "document", "vault", "person", "information", "instruction", "legacy"].map(
            (t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize border transition-all whitespace-nowrap ${
                  typeFilter === t
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary"
                }`}
              >
                {t === "all" ? "All Items" : t}
              </button>
            )
          )}
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card space-y-3">
          <Trash2 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Trash is empty</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {items.length === 0
              ? "There are no deleted records currently in the system. Deleted items are held here safely until purged."
              : "No items match your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={`${item.itemType}-${item.id}`}
              className="p-4 sm:p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-border/80 shadow-sm"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                  {getItemIcon(item.itemType)}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border">
                      {item.itemType}
                    </span>
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.subtitle}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Deleted {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "recently"}
                    {item.deletedBy ? ` by ${item.deletedBy}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestore(item)}
                  disabled={loadingId === item.id}
                  className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  {loadingId === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  Restore
                </Button>

                {isOwner && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPurgeDialogItem(item)}
                    className="h-8 rounded-xl text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Purge
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purge Confirmation Modal */}
      <Dialog
        open={!!purgeDialogItem}
        onOpenChange={(open) => !open && setPurgeDialogItem(null)}
      >
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-border bg-card text-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Permanently Delete Item?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">
                &ldquo;{purgeDialogItem?.title}&rdquo;
              </strong>
              ? This action is irreversible and the record cannot be recovered.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPurgeDialogItem(null)}
              disabled={purging}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePurge}
              disabled={purging}
              className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold gap-1.5"
            >
              {purging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
