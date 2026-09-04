/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  AlertTriangle,
  Lock,
  Eye,
  Calendar,
  Tag,
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
import {
  ILifeInformation,
  LifeInfoCategory,
  LifePriority,
  LifeVisibility,
  ILifePerson,
  ILifeBusiness,
} from "@/types";
import {
  createInformation,
  deleteInformation,
} from "@/lib/actions/lifeInformation.actions";
import toast from "react-hot-toast";

interface InformationClientProps {
  initialItems: ILifeInformation[];
  people: ILifePerson[];
  businesses: ILifeBusiness[];
}

export function InformationClient({
  initialItems,
  people,
  businesses,
}: InformationClientProps) {
  const [items, setItems] = useState<ILifeInformation[]>(initialItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<LifeInfoCategory>("personal");
  const [priority, setPriority] = useState<LifePriority>("medium");
  const [visibility, setVisibility] = useState<LifeVisibility>("visible_now");
  const [relatedPersonId, setRelatedPersonId] = useState("none");
  const [relatedBusinessId, setRelatedBusinessId] = useState("none");
  const [isEmergency, setIsEmergency] = useState(false);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.summary &&
        item.summary.toLowerCase().includes(search.toLowerCase())) ||
      item.content.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    "personal",
    "business",
    "instruction",
    "emergency",
    "other",
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    setLoading(true);
    try {
      const created = await createInformation({
        title,
        summary,
        content,
        category,
        priority,
        visibility,
        relatedPersonId:
          relatedPersonId !== "none" ? relatedPersonId : undefined,
        relatedBusinessId:
          relatedBusinessId !== "none" ? relatedBusinessId : undefined,
        isEmergency,
      });

      setItems([created, ...items]);
      toast.success("Note / Information saved successfully!");
      setAddModalOpen(false);
      // Reset form
      setTitle("");
      setSummary("");
      setContent("");
      setIsEmergency(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save information.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${itemTitle}"?`)) return;
    try {
      await deleteInformation(id);
      setItems(items.filter((i) => i._id !== id));
      toast.success("Information deleted.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete information.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Information & Instructions
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralized repository for personal notes, business instructions,
            and emergency guidance.
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-sm shadow-emerald-950/30"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Information
        </Button>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, instructions, summaries..."
            className="pl-9 h-10 rounded-xl border-border bg-card text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap capitalize transition-all ${
                categoryFilter === cat
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Information Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-border text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">
            No Information Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add critical instructions, passwords references, server tips or
            family guidance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="p-4 rounded-2xl bg-card border border-border hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                {/* Header chips */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.isEmergency && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        Emergency
                      </span>
                    )}
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        item.priority === "critical"
                          ? "bg-red-900/30 text-red-400 border-red-700/50"
                          : item.priority === "high"
                            ? "bg-amber-900/30 text-amber-400 border-amber-700/50"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-foreground line-clamp-1">
                  {item.title}
                </h3>

                {item.summary && (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-medium">
                    {item.summary}
                  </p>
                )}

                <div className="mt-2.5 p-3 rounded-xl bg-muted text-xs text-slate-300 font-mono line-clamp-4 whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>

              {/* Card Footer: Metadata & Delete */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-slate-500">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
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

      {/* Add Information Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-lg rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Add Note / Information Record</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Title *
              </label>
              <Input
                required
                placeholder="e.g. Master Server Access or Family Safe Locker Code"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as LifeInfoCategory)
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="instruction">Instruction</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as LifePriority)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Related Person (Optional)
                </label>
                <select
                  value={relatedPersonId}
                  onChange={(e) => setRelatedPersonId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="none">-- None --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Related Business (Optional)
                </label>
                <select
                  value={relatedBusinessId}
                  onChange={(e) => setRelatedBusinessId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="none">-- None --</option>
                  {businesses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Summary (Short preview)
              </label>
              <Input
                placeholder="Brief summary..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Full Content / Detailed Instructions *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Write actionable details, location of items, step-by-step guidance..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emergencyCheckbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <label
                htmlFor="emergencyCheckbox"
                className="text-xs text-slate-300"
              >
                Mark as Critical Emergency Instruction (unlocked in Emergency
                Mode)
              </label>
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
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Information
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
