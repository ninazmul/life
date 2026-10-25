"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Server,
  Shield,
  Upload,
  Calendar,
  Building2,
  User,
  Lock,
  Share2,
  ChevronDown,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  saveVaultDocument,
  saveVaultDigitalAccount,
  saveVaultPermission,
} from "@/lib/actions/lifeWorkspace.actions";

interface VaultRecordFormBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
  defaultRecordType?: string;
  peopleList: Array<{ id: string; name: string; relation?: string }>;
  businessesList: Array<{ id: string; name: string }>;
}

export function VaultRecordFormBottomSheet({
  isOpen,
  onClose,
  onRecordCreated,
  defaultRecordType = "documents",
  peopleList = [],
  businessesList = [],
}: VaultRecordFormBottomSheetProps) {
  const [recordType, setRecordType] = useState<string>(
    defaultRecordType === "all" ? "documents" : defaultRecordType
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document Fields (Mockup Screen 4)
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("business");
  const [docNumber, setDocNumber] = useState("");
  const [docIssueDate, setDocIssueDate] = useState("");
  const [docExpiryDate, setDocExpiryDate] = useState("");
  const [docRelatedBusinessId, setDocRelatedBusinessId] = useState(
    businessesList[0]?.id || "none"
  );
  const [docNotes, setDocNotes] = useState("");
  const [docIsShared, setDocIsShared] = useState(false);
  const [showDocNotes, setShowDocNotes] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Digital Vault Fields
  const [vaultTitle, setVaultTitle] = useState("");
  const [vaultCategory, setVaultCategory] = useState("hosting");
  const [vaultSystem, setVaultSystem] = useState("Domain & Hosting");
  const [vaultUrl, setVaultUrl] = useState("");
  const [vaultUsername, setVaultUsername] = useState("");
  const [vaultSecret, setVaultSecret] = useState("");
  const [vaultRecoveryInfo, setVaultRecoveryInfo] = useState("");
  const [vaultNotes, setVaultNotes] = useState("");
  const [showVaultNotes, setShowVaultNotes] = useState(false);

  // Access Control Fields
  const [permPersonId, setPermPersonId] = useState(peopleList[0]?.id || "");
  const [permRecordTitle, setPermRecordTitle] = useState("Family documents");
  const [permCanView, setPermCanView] = useState(true);
  const [permCanDownload, setPermCanDownload] = useState(false);
  const [permCanEdit, setPermCanEdit] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (recordType === "documents") {
        if (!docTitle.trim()) {
          toast.error("Please enter a document title");
          return;
        }

        const res = await saveVaultDocument({
          title: docTitle.trim(),
          category: docCategory,
          documentNumber: docNumber.trim() || undefined,
          issueDate: docIssueDate || undefined,
          expiryDate: docExpiryDate || undefined,
          relatedBusinessId: docRelatedBusinessId !== "none" ? docRelatedBusinessId : undefined,
          notes: docNotes.trim() || undefined,
          isShared: docIsShared,
          fileUrl: uploadedFileName ? `/documents/${uploadedFileName}` : "/documents/gesn_trade_license.pdf",
        });

        if (res.success) {
          toast.success("Document added to Secure Vault");
          onRecordCreated();
          onClose();
        } else {
          toast.error(res.error || "Failed to save document");
        }
      } else if (recordType === "digital_vault") {
        if (!vaultTitle.trim()) {
          toast.error("Please enter service or account name");
          return;
        }

        const res = await saveVaultDigitalAccount({
          title: vaultTitle.trim(),
          category: vaultCategory,
          systemOrWebsite: vaultSystem.trim() || undefined,
          url: vaultUrl.trim() || undefined,
          username: vaultUsername.trim() || undefined,
          secret: vaultSecret.trim() || undefined,
          recoveryInfo: vaultRecoveryInfo.trim() || undefined,
          notes: vaultNotes.trim() || undefined,
        });

        if (res.success) {
          toast.success("Digital account credentials secured");
          onRecordCreated();
          onClose();
        } else {
          toast.error(res.error || "Failed to save credentials");
        }
      } else {
        // Access Control
        if (!permPersonId) {
          toast.error("Please select a person");
          return;
        }

        const res = await saveVaultPermission({
          personId: permPersonId,
          targetRecordTitle: permRecordTitle.trim() || "Shared record scope",
          targetRecordType: "document",
          canView: permCanView,
          canDownload: permCanDownload,
          canEdit: permCanEdit,
        });

        if (res.success) {
          toast.success("Access permission granted");
          onRecordCreated();
          onClose();
        } else {
          toast.error(res.error || "Failed to grant access");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content matching Mockup Screen 4 */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Handle */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E1B4B] dark:text-white">
            Add Vault Record
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Record Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Record Type
            </label>
            <div className="relative">
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="documents">📄 Documents</option>
                <option value="digital_vault">🗄️ Digital Vault</option>
                <option value="access_control">👥 Access Control</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* DYNAMIC FIELDS FOR DOCUMENTS (Screen 4 exact match) */}
          {recordType === "documents" && (
            <>
              {/* Document Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GESN Trade License"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  >
                    <option value="business">Business</option>
                    <option value="identity">Personal / Identity</option>
                    <option value="property">Property</option>
                    <option value="family">Family</option>
                    <option value="agreement">Legal & Contracts</option>
                    <option value="medical">Health & Medical</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Upload Dropzone matching Mockup Screen 4 */}
              <div
                onClick={() => {
                  setUploadedFileName("gesn_trade_license.pdf");
                  toast.success("File selected: gesn_trade_license.pdf");
                }}
                className="border-2 border-dashed border-purple-200 dark:border-purple-900/60 rounded-2xl p-4 text-center cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 mx-auto flex items-center justify-center mb-1.5">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  {uploadedFileName ? uploadedFileName : "Upload file or photo"}
                </p>
                <p className="text-[11px] text-slate-400">PDF, JPG, PNG (Max 10 MB)</p>
              </div>

              {/* Document Number (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Document Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TL-XXXX-XXXX"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Dates Row: Issue Date & Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={docIssueDate}
                    onChange={(e) => setDocIssueDate(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={docExpiryDate}
                    onChange={(e) => setDocExpiryDate(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Related Record */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Related Record
                </label>
                <div className="relative">
                  <select
                    value={docRelatedBusinessId}
                    onChange={(e) => setDocRelatedBusinessId(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  >
                    <option value="none">None / Personal</option>
                    {businessesList.map((b) => (
                      <option key={b.id} value={b.id}>
                        🏢 {b.name} • Business
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Private Notes (Collapsible) */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowDocNotes(!showDocNotes)}
                  className="w-full p-3.5 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Private notes</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showDocNotes ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {showDocNotes && (
                  <div className="p-3.5 border-t border-slate-100 dark:border-slate-800">
                    <textarea
                      rows={2}
                      placeholder="Add private reference or filing instructions..."
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Access Section matching Mockup Screen 4 */}
              <div className="space-y-2 pt-1">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        docIsShared ? "bg-purple-100 text-purple-600" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {docIsShared ? <Share2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {docIsShared ? "Share selected information" : "Private by default"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {docIsShared
                          ? "Allow others to view non-sensitive details."
                          : "Only you can view this record."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDocIsShared(!docIsShared)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                      docIsShared ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        docIsShared ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* DYNAMIC FIELDS FOR DIGITAL VAULT */}
          {recordType === "digital_vault" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Service / Account Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hostinger, AWS, Google Cloud"
                  value={vaultTitle}
                  onChange={(e) => setVaultTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={vaultCategory}
                    onChange={(e) => setVaultCategory(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  >
                    <option value="hosting">Hosting & Server</option>
                    <option value="email">Email</option>
                    <option value="website">Website</option>
                    <option value="domain">Domain</option>
                    <option value="banking">Banking</option>
                    <option value="recovery">Recovery Keys</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Service Description
                  </label>
                  <input
                    type="text"
                    placeholder="Domain & Hosting"
                    value={vaultSystem}
                    onChange={(e) => setVaultSystem(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Login Identifier / Username / Email
                </label>
                <input
                  type="text"
                  placeholder="saurav@gesn.net"
                  value={vaultUsername}
                  onChange={(e) => setVaultUsername(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Website / Login URL
                </label>
                <input
                  type="text"
                  placeholder="hostinger.com"
                  value={vaultUrl}
                  onChange={(e) => setVaultUrl(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Protected Password / Secret * (AES-256-GCM Encrypted)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={vaultSecret}
                  onChange={(e) => setVaultSecret(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Recovery Instructions & 2FA Info (Owner only)
                </label>
                <textarea
                  rows={2}
                  placeholder="Backup codes, physical safe reference, or master key notes..."
                  value={vaultRecoveryInfo}
                  onChange={(e) => setVaultRecoveryInfo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </>
          )}

          {/* DYNAMIC FIELDS FOR ACCESS CONTROL */}
          {recordType === "access_control" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Person
                </label>
                <select
                  value={permPersonId}
                  onChange={(e) => setPermPersonId(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {peopleList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.relation ? `(${p.relation})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Record / Scope
                </label>
                <input
                  type="text"
                  placeholder="e.g. Family documents, GESN Trade License"
                  value={permRecordTitle}
                  onChange={(e) => setPermRecordTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Permissions
                </label>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permCanView}
                      onChange={(e) => setPermCanView(e.target.checked)}
                      className="rounded text-purple-600 w-4 h-4"
                    />
                    <span>View</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permCanDownload}
                      onChange={(e) => setPermCanDownload(e.target.checked)}
                      className="rounded text-purple-600 w-4 h-4"
                    />
                    <span>Download</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permCanEdit}
                      onChange={(e) => setPermCanEdit(e.target.checked)}
                      className="rounded text-purple-600 w-4 h-4"
                    />
                    <span>Edit</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons matching Mockup Screen 4 */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm shadow-md shadow-purple-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
