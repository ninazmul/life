"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Lock,
  Download,
  Eye,
  Calendar,
  Building2,
  User,
  Shield,
  ChevronRight,
  Clock,
  AlertTriangle,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { UnifiedSecureVaultItem } from "@/lib/actions/lifeWorkspace.actions";

interface DocumentDetailBottomSheetProps {
  item: UnifiedSecureVaultItem;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onManageAccess?: () => void;
}

export function DocumentDetailBottomSheet({
  item,
  isOpen,
  onClose,
  onEdit,
  onManageAccess,
}: DocumentDetailBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "preview" | "linked" | "history">("overview");

  const doc = item.details?.document;
  if (!isOpen || !doc) return null;

  const handleDownload = () => {
    toast.success(`Downloading ${item.title}...`);
    // Safe download simulation
    const link = document.createElement("a");
    link.href = doc.fileUrl;
    link.download = `${item.title.replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Handle */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                item.category === "business"
                  ? "bg-rose-50 text-rose-500"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
                  {item.title}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    item.isShared
                      ? "bg-sky-50 text-sky-600 border-sky-100"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/60"
                  }`}
                >
                  <Lock className="w-2.5 h-2.5" />
                  {item.isShared ? "Shared" : "Private"}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="capitalize">{item.category}</span>
                {item.expiryInfo && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span
                      className={`font-medium ${
                        item.isExpiringSoon ? "text-amber-600 font-bold" : "text-slate-500"
                      }`}
                    >
                      {item.expiryInfo}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-5 gap-6">
          {(["overview", "preview", "linked", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-xs font-bold capitalize transition-colors relative ${
                activeTab === tab
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "overview" && (
            <>
              {/* Document Metadata Box */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                {doc.documentNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Document Number</span>
                    <span className="font-mono font-bold text-[#1E1B4B] dark:text-white">
                      {doc.documentNumber}
                    </span>
                  </div>
                )}

                {doc.issueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Issue Date</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {doc.issueDate}
                    </span>
                  </div>
                )}

                {doc.expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Expiry Date</span>
                    <span
                      className={`font-semibold ${
                        item.isExpiringSoon ? "text-amber-600 font-bold" : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {doc.expiryDate}
                    </span>
                  </div>
                )}

                {doc.issuingAuthority && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Issuing Authority</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {doc.issuingAuthority}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-medium">File Details</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    PDF • {(doc.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              </div>

              {/* Linked Records */}
              {(doc.relatedBusinessName || doc.relatedPersonName) && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {doc.relatedBusinessName ? (
                      <Building2 className="w-4 h-4 text-purple-600" />
                    ) : (
                      <User className="w-4 h-4 text-sky-600" />
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Linked entity
                      </span>
                      <span className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                        {doc.relatedBusinessName || doc.relatedPersonName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {doc.notes && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Notes
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{doc.notes}</p>
                </div>
              )}
            </>
          )}

          {activeTab === "preview" && (
            <div className="h-64 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <FileText className="w-12 h-12 text-purple-400 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-400">
                  Protected encrypted document preview
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Original</span>
              </button>
            </div>
          )}

          {activeTab === "linked" && (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">
                Connected to {doc.relatedBusinessName || doc.relatedPersonName || "Corporate Profile"}.
              </p>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Original Version</p>
                  <p className="text-[11px] text-slate-400">Uploaded by Owner</p>
                </div>
                <span className="text-[10px] text-slate-400">Current active</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            type="button"
            onClick={onManageAccess}
            className="flex-1 h-12 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            Manage Access
          </button>
        </div>
      </div>
    </div>
  );
}
