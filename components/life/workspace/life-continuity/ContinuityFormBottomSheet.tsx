"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ClipboardCheck,
  ScrollText,
  Siren,
  Scale,
  ChevronDown,
  Check,
  Clock,
  Eye,
  Shield,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  saveContinuityRecord,
  UnifiedContinuityItem,
  ContinuityRecordType,
} from "@/lib/actions/lifeWorkspace.actions";

interface ContinuityFormBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordSaved: () => void;
  defaultRecordType?: string;
  editingRecord?: UnifiedContinuityItem | null;
  peopleList: Array<{ id: string; name: string; relation?: string }>;
}

const RECORD_TYPE_OPTIONS: Array<{
  id: ContinuityRecordType;
  label: string;
  icon: any;
  color: string;
}> = [
  { id: "responsibilities", label: "Responsibility", icon: ClipboardCheck, color: "text-emerald-600" },
  { id: "instructions", label: "Instruction", icon: ScrollText, color: "text-sky-600" },
  { id: "emergency", label: "Emergency Protocol", icon: Siren, color: "text-red-600" },
  { id: "legacy_legal", label: "Legacy & Legal", icon: Scale, color: "text-indigo-600" },
];

const ACCESS_OPTIONS = [
  { id: "immediate", label: "Immediate Access", desc: "Recipient can view now", icon: Eye },
  { id: "timed_request", label: "Timed Request", desc: "Wait period before access", icon: Clock },
  { id: "guardian_verified", label: "Guardian Verified", desc: "Requires guardian approval", icon: Shield },
];

const PRIORITY_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "critical", label: "Critical" },
];

export function ContinuityFormBottomSheet({
  isOpen,
  onClose,
  onRecordSaved,
  defaultRecordType = "responsibilities",
  editingRecord,
  peopleList,
}: ContinuityFormBottomSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Form state
  const [recordType, setRecordType] = useState<ContinuityRecordType>(
    (defaultRecordType as ContinuityRecordType) || "responsibilities"
  );
  const [ownerTitle, setOwnerTitle] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [recipientDescription, setRecipientDescription] = useState("");
  const [mainContent, setMainContent] = useState("");
  const [assignedPersonId, setAssignedPersonId] = useState("none");
  const [assignedRole, setAssignedRole] = useState("");
  const [priority, setPriority] = useState("medium");
  const [applicableSituation, setApplicableSituation] = useState("");
  const [ownerPrivateNotes, setOwnerPrivateNotes] = useState("");
  const [status, setStatus] = useState("active");
  const [accessMethod, setAccessMethod] = useState("timed_request");
  const [waitingPeriodDays, setWaitingPeriodDays] = useState(7);
  const [linkedItems, setLinkedItems] = useState<Array<{ title: string; type: string }>>([]);
  const [newLinkedTitle, setNewLinkedTitle] = useState("");
  const [newLinkedType, setNewLinkedType] = useState("document");

  // Populate from editing record
  useEffect(() => {
    if (editingRecord) {
      setRecordType(editingRecord.recordType);
      setOwnerTitle(editingRecord.ownerTitle);
      setRecipientTitle(editingRecord.recipientTitle);
      setRecipientDescription(editingRecord.recipientDescription || "");
      setMainContent(editingRecord.mainContent);
      setAssignedPersonId(editingRecord.assignedPersonId || "none");
      setAssignedRole(editingRecord.assignedRole || "");
      setPriority(editingRecord.priority || "medium");
      setApplicableSituation(editingRecord.applicableSituation || "");
      setOwnerPrivateNotes(editingRecord.ownerPrivateNotes || "");
      setStatus(editingRecord.status);
      setAccessMethod(editingRecord.accessPolicy.method);
      setWaitingPeriodDays(editingRecord.accessPolicy.waitingPeriodDays);
      setLinkedItems(editingRecord.linkedItems || []);
    } else {
      // Reset for new record
      const validTypes = ["responsibilities", "instructions", "emergency", "legacy_legal"];
      const rt = defaultRecordType || "responsibilities";
      setRecordType(validTypes.includes(rt) ? rt as ContinuityRecordType : "responsibilities");
      setOwnerTitle("");
      setRecipientTitle("");
      setRecipientDescription("");
      setMainContent("");
      setAssignedPersonId("none");
      setAssignedRole("");
      setPriority("medium");
      setApplicableSituation("");
      setOwnerPrivateNotes("");
      setStatus("active");
      setAccessMethod("timed_request");
      setWaitingPeriodDays(7);
      setLinkedItems([]);
    }
  }, [editingRecord, isOpen, defaultRecordType]);

  const handleAddLinkedItem = () => {
    if (!newLinkedTitle.trim()) return;
    setLinkedItems([...linkedItems, { title: newLinkedTitle.trim(), type: newLinkedType }]);
    setNewLinkedTitle("");
  };

  const handleRemoveLinkedItem = (idx: number) => {
    setLinkedItems(linkedItems.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!ownerTitle.trim()) {
      toast.error("Owner title is required");
      return;
    }
    if (!recipientTitle.trim()) {
      toast.error("Recipient title is required");
      return;
    }
    if (!mainContent.trim()) {
      toast.error("Main content / instructions are required");
      return;
    }

    setIsSaving(true);
    try {
      const selectedPerson = peopleList.find((p) => p.id === assignedPersonId);
      const res = await saveContinuityRecord({
        id: editingRecord?.id,
        recordType,
        ownerTitle: ownerTitle.trim(),
        recipientTitle: recipientTitle.trim(),
        recipientDescription: recipientDescription.trim(),
        mainContent: mainContent.trim(),
        assignedPersonId: assignedPersonId !== "none" ? assignedPersonId : undefined,
        assignedPersonName: selectedPerson?.name || "",
        assignedRole: assignedRole.trim(),
        priority,
        applicableSituation: applicableSituation.trim(),
        linkedItems,
        ownerPrivateNotes: ownerPrivateNotes.trim(),
        status,
        accessMethod,
        waitingPeriodDays,
      });

      if (res.success) {
        toast.success(editingRecord ? "Record updated successfully" : "Record created successfully");
        onRecordSaved();
        onClose();
      } else {
        toast.error(res.error || "Failed to save record");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentType = RECORD_TYPE_OPTIONS.find((t) => t.id === recordType) || RECORD_TYPE_OPTIONS[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[94vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl border-t border-x border-slate-200/50 dark:border-slate-800 shadow-2xl">
          {/* Handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
            <h2 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
              {editingRecord ? "Edit Record" : "New Record"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-500 shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="px-5 pb-8 space-y-4">
            {/* 1. Record Type Selector */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                Record Type
              </label>
              <button
                type="button"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <currentType.icon className={`w-4 h-4 ${currentType.color}`} />
                  <span className="text-xs font-bold text-[#1E1B4B] dark:text-white">{currentType.label}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${showTypeDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showTypeDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTypeDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5">
                    {RECORD_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setRecordType(opt.id);
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                          recordType === opt.id
                            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <opt.icon className={`w-4 h-4 ${opt.color}`} />
                          <span className="text-xs">{opt.label}</span>
                        </div>
                        {recordType === opt.id && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 2. Owner Title (Internal) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                Owner Title <span className="text-rose-400">(Private — not visible to recipient)</span>
              </label>
              <input
                type="text"
                value={ownerTitle}
                onChange={(e) => setOwnerTitle(e.target.value)}
                placeholder="Internal reference title..."
                className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 3. Recipient Title */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                Recipient Title <span className="text-emerald-500">(Visible to assigned person)</span>
              </label>
              <input
                type="text"
                value={recipientTitle}
                onChange={(e) => setRecipientTitle(e.target.value)}
                placeholder="Title the recipient will see..."
                className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Recipient Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                Recipient Description <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={recipientDescription}
                onChange={(e) => setRecipientDescription(e.target.value)}
                placeholder="Brief description for the recipient..."
                className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 4. Main Content */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                Main Content / Instructions
              </label>
              <textarea
                value={mainContent}
                onChange={(e) => setMainContent(e.target.value)}
                placeholder="Detailed instructions, steps, or content..."
                rows={5}
                className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* 5. Assigned Person */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                Assigned Person
              </label>
              <select
                value={assignedPersonId}
                onChange={(e) => setAssignedPersonId(e.target.value)}
                className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="none">— No specific person —</option>
                {peopleList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.relation ? `(${p.relation})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Role */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                Role / Capacity <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                placeholder="e.g. Guardian, Executor, Business Partner..."
                className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 6. Priority & Status Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* 7. Access Policy */}
            <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/40 space-y-3">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                Access & Release Policy
              </span>
              <div className="space-y-2">
                {ACCESS_OPTIONS.map((opt) => {
                  const isSelected = accessMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAccessMethod(opt.id)}
                      className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? "bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800"
                          : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <opt.icon
                          className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-slate-400"}`}
                        />
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isSelected ? "text-purple-800 dark:text-purple-200" : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-slate-400">{opt.desc}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Waiting Period (for timed_request) */}
              {accessMethod === "timed_request" && (
                <div>
                  <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">
                    Waiting Period (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={waitingPeriodDays}
                    onChange={(e) => setWaitingPeriodDays(Number(e.target.value) || 7)}
                    className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-800 rounded-xl text-xs font-bold text-purple-800 dark:text-purple-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            {/* 8. Applicable Situation */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
                Applicable Situation <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={applicableSituation}
                onChange={(e) => setApplicableSituation(e.target.value)}
                placeholder="e.g. In case of long-term hospitalization..."
                className="w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 9. Linked Items */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
                Linked Records <span className="text-slate-400">(Optional)</span>
              </label>
              {linkedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.title}</span>
                    <span className="text-[10px] text-slate-400 capitalize">({item.type})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLinkedItem(idx)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newLinkedTitle}
                  onChange={(e) => setNewLinkedTitle(e.target.value)}
                  placeholder="Link a record..."
                  className="flex-1 h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newLinkedType}
                  onChange={(e) => setNewLinkedType(e.target.value)}
                  className="h-10 px-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-[10px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none appearance-none"
                >
                  <option value="document">Document</option>
                  <option value="business">Business</option>
                  <option value="finance">Finance</option>
                  <option value="responsibility">Duty</option>
                  <option value="other">Other</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddLinkedItem}
                  className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 10. Owner Private Notes */}
            <div>
              <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1 px-0.5">
                Owner Private Notes <span className="text-rose-400">(Never shared)</span>
              </label>
              <textarea
                value={ownerPrivateNotes}
                onChange={(e) => setOwnerPrivateNotes(e.target.value)}
                placeholder="Private notes only you can see..."
                rows={3}
                className="w-full p-3.5 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200/80 dark:border-rose-800/40 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-rose-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="w-full h-12 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] mt-4"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : editingRecord ? (
                "Update Record"
              ) : (
                "Create Record"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
