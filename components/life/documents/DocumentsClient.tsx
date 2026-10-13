/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderLock,
  Plus,
  Search,
  File,
  Download,
  ExternalLink,
  Shield,
  Trash2,
  Loader2,
  ArrowLeft,
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
  ILifeDocument,
  DocumentCategory,
  ILifePerson,
  ILifeBusiness,
} from "@/types";
import {
  createDocument,
  deleteDocument,
} from "@/lib/actions/lifeDocument.actions";
import toast from "react-hot-toast";

interface DocumentsClientProps {
  initialDocuments: ILifeDocument[];
  people: ILifePerson[];
  businesses: ILifeBusiness[];
}

export function DocumentsClient({
  initialDocuments,
  people,
  businesses,
}: DocumentsClientProps) {
  const [documents, setDocuments] = useState<ILifeDocument[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("agreement");
  const [relatedPersonId, setRelatedPersonId] = useState("none");
  const [relatedBusinessId, setRelatedBusinessId] = useState("none");
  const [notes, setNotes] = useState("");

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      search === "" ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    "agreement",
    "receipt",
    "business",
    "property",
    "bank",
    "loan",
    "identity",
    "medical",
    "other",
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) {
      toast.error("Document title and valid URL/file are required.");
      return;
    }

    setLoading(true);
    try {
      const created = await createDocument({
        title,
        fileUrl,
        category,
        relatedPersonId: relatedPersonId !== "none" ? relatedPersonId : undefined,
        relatedBusinessId: relatedBusinessId !== "none" ? relatedBusinessId : undefined,
        notes,
      });

      setDocuments([created, ...documents]);
      toast.success(`Document "${created.title}" added to private vault library!`);
      setAddModalOpen(false);
      // Reset
      setTitle("");
      setFileUrl("");
      setNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add document.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (!confirm(`Delete document "${docTitle}"?`)) return;
    try {
      await deleteDocument(id);
      setDocuments(documents.filter((d) => d._id !== id));
      toast.success("Document removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove document.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-600 hover:text-[#4F46E5] hover:border-indigo-100 shadow-xs transition-all active:scale-95 shrink-0"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
                Private Documents Library
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/80">
                {documents.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Encrypted metadata and access-gated storage for contracts, title deeds, financial care records, and receipts.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Document
        </Button>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search document title or category..."
            className="pl-9 h-10 rounded-xl border-slate-200/80 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap capitalize transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#4F46E5] text-white shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 shadow-xs"
              }`}
            >
              {cat === "all" ? "All Documents" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-2 shadow-xs">
          <FolderLock className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-black text-[#1E1B4B]">No Documents Uploaded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Store scanned copies of passport/NID, property registrations, financial care agreements, and company trade licenses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc._id}
              className="p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-white border border-slate-100/90 hover:border-indigo-200/70 hover:shadow-md transition-all flex flex-col justify-between group shadow-[0_2px_12px_rgba(30,27,75,0.04)]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                    doc.category === 'agreement' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    doc.category === 'property' || doc.category === 'business' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                    doc.category === 'bank' || doc.category === 'receipt' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    doc.category === 'loan' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    doc.category === 'medical' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    'bg-purple-50 text-purple-700 border-purple-100'
                  }`}>
                    {doc.category}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {doc.fileType?.split("/")[1] || "DOC"}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/80 shrink-0 shadow-xs">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[#1E1B4B] group-hover:text-[#4F46E5] transition-colors line-clamp-1">
                      {doc.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-xs text-slate-500 mt-2.5 line-clamp-2">{doc.notes}</p>
                )}
              </div>

              {/* Card Footer: View/Download + Delete */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-indigo-100 bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100 rounded-xl gap-1.5 font-bold transition-all shadow-xs"
                >
                  <a href={`/api/documents/${doc._id}/download`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" /> View / Download
                  </a>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(doc._id, doc.title)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-slate-100 bg-white text-[#1E1B4B] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-[#4F46E5]" />
              <span>Add Document Record</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Document Title *
              </label>
              <Input
                required
                placeholder="e.g. Uttara Commercial Plot Deed or Partnership Agreement"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
              >
                <option value="agreement">Agreement / Contract</option>
                <option value="receipt">Financial Receipt</option>
                <option value="business">Business License / Trade Document</option>
                <option value="property">Property Registration / Deed</option>
                <option value="bank">Bank Statement / Cheque</option>
                <option value="loan">Financial Care Agreement</option>
                <option value="identity">Passport / NID</option>
                <option value="medical">Medical Record</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                File Storage URL or Secure Link *
              </label>
              <Input
                required
                placeholder="https:// or /uploads/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs font-mono focus:bg-white focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Related Person
                </label>
                <select
                  value={relatedPersonId}
                  onChange={(e) => setRelatedPersonId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
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
                <label className="text-xs font-bold text-slate-700">
                  Related Business
                </label>
                <select
                  value={relatedBusinessId}
                  onChange={(e) => setRelatedBusinessId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
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
              <label className="text-xs font-bold text-slate-700">
                Notes
              </label>
              <Input
                placeholder="Witness details or notary stamp numbers..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-4 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs transition-all active:scale-95"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Document
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
