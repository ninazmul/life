"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  FolderLock,
  KeyRound,
  User,
  FileText,
  HeartHandshake,
  Loader2,
  ChevronLeft,
} from "lucide-react";
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

const typeIconConfig: Record<string, { icon: React.ReactNode; bg: string }> = {
  document: { icon: <FolderLock className="w-4 h-4 text-[#4338CA]" />, bg: "bg-[#E0E7FF]" },
  vault: { icon: <KeyRound className="w-4 h-4 text-[#D97706]" />, bg: "bg-[#FEF3C7]" },
  person: { icon: <User className="w-4 h-4 text-[#0284C7]" />, bg: "bg-[#E0F2FE]" },
  legacy: { icon: <HeartHandshake className="w-4 h-4 text-[#E11D48]" />, bg: "bg-[#FFE4E6]" },
  information: { icon: <FileText className="w-4 h-4 text-[#4F46E5]" />, bg: "bg-[#EEF2FF]" },
  instruction: { icon: <FileText className="w-4 h-4 text-[#7C3AED]" />, bg: "bg-[#F5F3FF]" },
};

const typeFilterLabels: Record<string, string> = {
  all: "All Items",
  document: "Documents",
  vault: "Vault",
  person: "People",
  information: "Information",
  instruction: "Instructions",
  legacy: "Legacy",
};

export function TrashClient({ initialItems, isOwner }: TrashClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [purgeDialogItem, setPurgeDialogItem] = useState<TrashItem | null>(null);
  const [purging, setPurging] = useState(false);

  const getTypeConfig = (type: string) =>
    typeIconConfig[type] || { icon: <FileText className="w-4 h-4 text-slate-400" />, bg: "bg-slate-50" };

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
    <div className="space-y-5 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl bg-white border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#1E1B4B] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] tracking-tight">
                Trash & Recovery
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] border border-rose-100/60">
                {items.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Safely restore or permanently remove deleted records
            </p>
          </div>
        </div>
      </div>

      {/* Search & Type Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items in trash..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200/80 bg-white text-xs text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {Object.entries(typeFilterLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === type
                  ? "bg-[#4F46E5] text-white font-bold shadow-xs"
                  : "bg-white border border-slate-100 text-slate-600 hover:border-indigo-200 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-10 text-center rounded-2xl md:rounded-3xl border border-dashed border-slate-200 bg-white">
          <div className="w-14 h-14 rounded-2xl bg-[#FFE4E6] flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-7 h-7 text-[#E11D48]" />
          </div>
          <h3 className="text-sm font-bold text-[#1E1B4B] mb-1">Trash is Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {items.length === 0
              ? "No deleted records in the system. Deleted items are held here safely until purged."
              : "No items match your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const config = getTypeConfig(item.itemType);
            return (
              <div
                key={`${item.itemType}-${item.id}`}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_1px_6px_rgba(30,27,75,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-200/70 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#1E1B4B] truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100/60">
                        {item.itemType}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.subtitle}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Deleted {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "recently"}
                      {item.deletedBy ? ` by ${item.deletedBy}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleRestore(item)}
                    disabled={loadingId === item.id}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#DCFCE7] border border-emerald-100/60 text-[#16A34A] text-[11px] font-bold hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Restore
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => setPurgeDialogItem(item)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-red-50/80 border border-red-100/60 text-[#DC2626] text-[11px] font-bold hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Purge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Purge Confirmation Modal */}
      <Dialog
        open={!!purgeDialogItem}
        onOpenChange={(open) => !open && setPurgeDialogItem(null)}
      >
        <DialogContent className="sm:max-w-md rounded-3xl p-0 border-0 overflow-hidden">
          <div className="p-6 space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                </div>
                <DialogTitle className="text-base font-bold text-[#DC2626]">
                  Permanently Delete Item?
                </DialogTitle>
              </div>
            </DialogHeader>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#1E1B4B]">
                &ldquo;{purgeDialogItem?.title}&rdquo;
              </strong>
              ? This action is irreversible and the record cannot be recovered.
            </DialogDescription>

            <DialogFooter className="gap-2 sm:gap-0 pt-1">
              <button
                onClick={() => setPurgeDialogItem(null)}
                disabled={purging}
                className="h-9 px-4 rounded-xl bg-white border border-slate-200/80 text-xs font-medium text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePurge}
                disabled={purging}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {purging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Permanently
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
