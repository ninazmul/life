/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  ArrowLeft,
  Tag,
  Trash2,
  Loader2,
  ShieldAlert,
  Clock,
  Sparkles,
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
  const router = useRouter();
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
      toast.success("Information record saved successfully!");
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

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "personal":
        return "bg-[#EEF2FF] text-[#4F46E5] border-indigo-100";
      case "business":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "instruction":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "emergency":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "high":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "medium":
        return "bg-[#EEF2FF] text-[#4F46E5] border-indigo-100";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
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
                Important Information
              </h1>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100">
                {items.length}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Centralized repository for personal notes, business instructions, and emergency guidance.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Information
        </Button>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, instructions, summaries..."
            className="pl-10 h-10 rounded-xl border-slate-200/80 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#4F46E5] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap capitalize transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#4F46E5] text-white font-bold shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Information Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            No Information Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Add critical instructions, password references, server access notes, or family guidance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header chips */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-lg border ${getCategoryBadgeClass(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.isEmergency && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        Emergency
                      </span>
                    )}
                    <span
                      className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg border ${getPriorityBadgeClass(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>

                <h3 className="font-black text-sm text-[#1E1B4B] line-clamp-1">
                  {item.title}
                </h3>

                {item.summary && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium leading-relaxed">
                    {item.summary}
                  </p>
                )}

                <div className="mt-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 text-xs text-slate-700 font-mono line-clamp-4 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </div>
              </div>

              {/* Card Footer: Metadata & Delete */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item._id, item.title)}
                  className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete record"
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
        <DialogContent className="life-dialog sm:max-w-lg rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-[#1E1B4B] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span>Add Note / Information Record</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Title *
              </label>
              <Input
                required
                placeholder="e.g. Master Server Access or Family Safe Locker Code"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as LifeInfoCategory)
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="instruction">Instruction</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as LifePriority)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Related Person (Optional)
                </label>
                <select
                  value={relatedPersonId}
                  onChange={(e) => setRelatedPersonId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
                >
                  <option value="none">-- None --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Related Business (Optional)
                </label>
                <select
                  value={relatedBusinessId}
                  onChange={(e) => setRelatedBusinessId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:border-[#4F46E5] focus:outline-none"
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Summary (Short preview)
              </label>
              <Input
                placeholder="Brief summary..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs focus:bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Full Content / Detailed Instructions *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Write actionable details, location of items, step-by-step guidance..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono focus:bg-white focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center gap-3">
              <input
                type="checkbox"
                id="emergencyCheckbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
              />
              <label
                htmlFor="emergencyCheckbox"
                className="text-xs font-bold text-amber-900 cursor-pointer"
              >
                Mark as Critical Emergency Instruction (unlocked in Emergency Mode)
              </label>
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
                Save Information
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
