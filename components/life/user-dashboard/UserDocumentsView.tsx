/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Lock,
  Search,
  Filter,
  Loader2,
  Calendar,
  HelpCircle,
  ExternalLink,
  X,
  FileSpreadsheet,
  FileImage,
  FileCode,
  ShieldAlert,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUserDocuments } from "@/lib/actions/lifeUserDashboard.actions";
import { createRequest } from "@/lib/actions/lifeRequest.actions";

interface Props {
  onBack: () => void;
  ownerName?: string;
}

function getFileIcon(fileType: string) {
  if (fileType?.includes("image")) return FileImage;
  if (fileType?.includes("sheet") || fileType?.includes("excel") || fileType?.includes("csv"))
    return FileSpreadsheet;
  if (fileType?.includes("code") || fileType?.includes("json")) return FileCode;
  return FileText;
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UserDocumentsView({ onBack, ownerName = "Owner" }: Props) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Inquiry modal state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [inquiryText, setInquiryText] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    const res = await getUserDocuments();
    if (res.success && res.data) {
      setDocuments(res.data);
    }
    setLoading(false);
  }

  // Categories
  const categories = Array.from(new Set(documents.map((d) => d.category).filter(Boolean)));

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.category && doc.category.toLowerCase().includes(search.toLowerCase())) ||
      (doc.notes && doc.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  async function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    setSubmittingInquiry(true);
    const res = await createRequest({
      category: "document_access",
      title: `Question regarding document: ${selectedDoc?.title}`,
      description: inquiryText.trim(),
      relatedRecordId: selectedDoc?._id,
      relatedRecordType: "document",
      relatedRecordName: selectedDoc?.title,
    });

    if (res.success) {
      toast.success("Question submitted to owner");
      setShowInquiryModal(false);
      setInquiryText("");
      setSelectedDoc(null);
    } else {
      toast.error(res.error || "Failed to submit inquiry");
    }
    setSubmittingInquiry(false);
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] leading-tight">
            Shared Documents
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Official records, agreements & reference files
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents by name or keyword..."
          className="w-full text-xs bg-white border border-slate-200/80 rounded-2xl pl-9 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] font-medium shadow-xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium shrink-0 ${
              selectedCategory === "all"
                ? "bg-[#4F46E5] text-white font-bold shadow-xs"
                : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All ({documents.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium capitalize shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#4F46E5] text-white font-bold shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.replace(/_/g, " ")} (
              {documents.filter((d) => d.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
          <p className="text-xs font-medium">Loading documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100/90 p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#4F46E5]">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#1E1B4B]">
            {search ? "No matching documents" : "No documents shared"}
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            {search
              ? "Try adjusting your search terms or filters."
              : "When the owner shares deeds, agreements or records with you, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDocs.map((doc) => {
            const Icon = getFileIcon(doc.fileType);

            return (
              <div
                key={doc._id}
                className="bg-white rounded-2xl border border-slate-100/90 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(30,27,75,0.03)] hover:border-indigo-100 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {doc.category && (
                          <span className="text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full capitalize">
                            {doc.category.replace(/_/g, " ")}
                          </span>
                        )}
                        {doc.fileSize > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatFileSize(doc.fileSize)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#1E1B4B] mt-1">
                        {doc.title}
                      </h3>
                      {doc.notes && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                          {doc.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(doc.sharedDate).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* View Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100 transition-colors flex items-center gap-1.5 text-xs shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>

                    {/* Download Button */}
                    {doc.canDownload ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="px-3 py-1.5 rounded-xl font-bold bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    ) : (
                      <div
                        title="Download restricted by owner"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-200/60 flex items-center gap-1 text-[11px] font-semibold cursor-not-allowed"
                      >
                        <Lock className="w-3 h-3" />
                        View Only
                      </div>
                    )}

                    {/* Inquire */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setShowInquiryModal(true);
                      }}
                      className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                      title="Ask a question about this document"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E1B4B] line-clamp-1">
                    {previewDoc.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {previewDoc.category || "General Document"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center min-h-[300px] bg-slate-50">
              {previewDoc.fileType?.includes("image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm"
                />
              ) : previewDoc.fileUrl?.endsWith(".pdf") || previewDoc.fileType?.includes("pdf") ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[60vh] rounded-xl border border-slate-200"
                />
              ) : (
                <div className="text-center space-y-3 p-6 bg-white rounded-2xl border border-slate-100 shadow-xs max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E1B4B]">{previewDoc.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      This file format cannot be previewed directly inside the dashboard.
                    </p>
                  </div>
                  {previewDoc.fileUrl && (
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F46E5] text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in New Tab
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {previewDoc.canDownload ? "Download enabled" : "Protected document (view only)"}
              </span>
              {previewDoc.canDownload && (
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Copy
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B4B]">
                  Document Inquiry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInquiryModal(false);
                  setSelectedDoc(null);
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Have a question about {selectedDoc?.title}? Send a question or access clarification to the owner.
            </p>

            <form onSubmit={handleSendInquiry} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Message</label>
                <textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="Type your question or request here..."
                  rows={4}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:border-[#4F46E5] resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInquiryModal(false);
                    setSelectedDoc(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry || !inquiryText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {submittingInquiry ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
