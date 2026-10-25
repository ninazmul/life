"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, HeartPulse, Baby, Globe2, Shield, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  FamilyCommunityRecordDTO,
  saveFamilyCommunityRecord,
} from "@/lib/actions/lifeWorkspace.actions";

interface RecordFormBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: "family_care" | "kids" | "community";
  editingRecord?: FamilyCommunityRecordDTO | null;
  peopleList: Array<{ id: string; name: string; relation?: string; avatarUrl?: string }>;
  onSaved: () => void;
}

export function RecordFormBottomSheet({
  isOpen,
  onClose,
  recordType,
  editingRecord,
  peopleList,
  onSaved,
}: RecordFormBottomSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [customPersonName, setCustomPersonName] = useState("");
  const [subType, setSubType] = useState("");
  const [description, setDescription] = useState("");
  const [institution, setInstitution] = useState("");
  const [assignedPersonId, setAssignedPersonId] = useState("");
  const [assignedPersonName, setAssignedPersonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [status, setStatus] = useState<"active" | "pending" | "action_required" | "completed">("active");
  const [accessPermission, setAccessPermission] = useState<"private" | "owner_only" | "family_shared" | "guardian_accessible">("private");
  const [notes, setNotes] = useState("");

  // Subtype presets per record type
  const careTypeOptions = [
    "Health Care",
    "Daily Care",
    "Financial Support",
    "Living Arrangement",
    "Legal Guidance",
    "Emergency Care",
  ];

  const kidsTypeOptions = [
    "Education",
    "Important Records",
    "Guardianship",
    "Future Guidance",
    "Early Care",
    "Health & Vaccinations",
  ];

  const communityTypeOptions = [
    "Relatives",
    "Friends & Connections",
    "Groups & Community",
    "Support & Commitments",
    "Financial Assistance",
  ];

  const currentTypeOptions =
    recordType === "kids"
      ? kidsTypeOptions
      : recordType === "community"
      ? communityTypeOptions
      : careTypeOptions;

  // Populate values when editing or opening
  useEffect(() => {
    if (editingRecord) {
      setTitle(editingRecord.title || "");
      setSelectedPersonId(editingRecord.relatedPersonId || "");
      setCustomPersonName(editingRecord.relatedPersonName || "");
      setSubType(editingRecord.subType || currentTypeOptions[0]);
      setDescription(editingRecord.description || "");
      setInstitution(editingRecord.institution || "");
      setAssignedPersonId(editingRecord.assignedPersonId || "");
      setAssignedPersonName(editingRecord.assignedPersonName || "");
      setStartDate(editingRecord.startDate ? editingRecord.startDate.split("T")[0] : "");
      setDueDate(editingRecord.dueDate ? editingRecord.dueDate.split("T")[0] : "");
      setPriority(editingRecord.priority || "medium");
      setStatus(editingRecord.status || "active");
      setAccessPermission(editingRecord.accessPermission as any || "private");
      setNotes(editingRecord.notes || "");
    } else {
      // Reset defaults
      setTitle("");
      setSelectedPersonId(peopleList[0]?.id || "");
      setCustomPersonName(peopleList[0]?.name || "");
      setSubType(currentTypeOptions[0] || "");
      setDescription("");
      setInstitution("");
      setAssignedPersonId("");
      setAssignedPersonName("Shahidul (Owner)");
      setStartDate("");
      setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
      setPriority("medium");
      setStatus("active");
      setAccessPermission("private");
      setNotes("");
    }
  }, [editingRecord, isOpen, recordType]);

  if (!isOpen) return null;

  const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPersonId(val);
    if (val === "custom") {
      setCustomPersonName("");
    } else {
      const p = peopleList.find((x) => x.id === val);
      if (p) setCustomPersonName(p.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a record title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a short description");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await saveFamilyCommunityRecord({
        id: editingRecord?.id,
        recordType,
        title: title.trim(),
        relatedPersonId: selectedPersonId && selectedPersonId !== "custom" ? selectedPersonId : undefined,
        relatedPersonName: customPersonName.trim(),
        subType,
        description: description.trim(),
        institution: recordType === "kids" ? institution.trim() : undefined,
        assignedPersonId: assignedPersonId || undefined,
        assignedPersonName: assignedPersonName.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
        status,
        accessPermission,
        notes: notes.trim(),
      });

      if (res.success) {
        toast.success(editingRecord ? "Record updated successfully" : "Record created successfully");
        onSaved();
        onClose();
      } else {
        toast.error(res.error || "Failed to save record");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormTitle = () => {
    const action = editingRecord ? "Edit" : "Add";
    switch (recordType) {
      case "family_care":
        return `${action} Family Care Record`;
      case "kids":
        return `${action} Kids Record`;
      case "community":
        return `${action} Community Record`;
      default:
        return `${action} Record`;
    }
  };

  const getFormSubtitle = () => {
    switch (recordType) {
      case "family_care":
        return "Create a new family care record";
      case "kids":
        return "Manage child education, records, or guidance";
      case "community":
        return "Add social support, relatives, or connections";
      default:
        return "Enter record information";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Drag Handle (Mobile) */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
              {getFormTitle()}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{getFormSubtitle()}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Care Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                recordType === "kids"
                  ? "e.g. Rahaf Education Plan"
                  : recordType === "community"
                  ? "e.g. Community Support"
                  : "e.g. Mother's Medical Care"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Related Person Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {recordType === "kids" ? "Related Child" : "Related Person"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <select
                value={selectedPersonId}
                onChange={handlePersonChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select from People Directory --</option>
                {peopleList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.relation ? `(${p.relation})` : ""}
                  </option>
                ))}
                <option value="custom">Other / Custom Name</option>
              </select>

              {(!selectedPersonId || selectedPersonId === "custom") && (
                <input
                  type="text"
                  placeholder="Enter person name (e.g. Mother, Both Kids, Relative)"
                  value={customPersonName}
                  onChange={(e) => setCustomPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Links directly to central People directory without duplicating profiles.
            </p>
          </div>

          {/* Subtype Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {recordType === "kids"
                ? "Record Type"
                : recordType === "community"
                ? "Community Record Type"
                : "Care Type"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {currentTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Institution (for Kids) */}
          {recordType === "kids" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Institution / School Program
              </label>
              <input
                type="text"
                placeholder="e.g. Scholastica International, Class 2"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter comprehensive description, checkup schedules, or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Assigned Responsible Person */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned Responsible Person
            </label>
            <input
              type="text"
              placeholder="e.g. Shahidul (Owner), Legal Guardian"
              value={assignedPersonName}
              onChange={(e) => setAssignedPersonName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Dates: Start Date & Due/Review Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Due / Review Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="action_required">Action Required</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Access Permission */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Access Permission
            </label>
            <select
              value={accessPermission}
              onChange={(e) => setAccessPermission(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="private">Private (Only You / Super Admin)</option>
              <option value="owner_only">Owner Only</option>
              <option value="family_shared">Family Shared</option>
              <option value="guardian_accessible">Emergency Guardian Accessible</option>
            </select>
          </div>

          {/* Notes with counter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes (Optional)
              </label>
              <span className="text-[11px] text-slate-400">
                {notes.length}/500
              </span>
            </div>
            <textarea
              maxLength={500}
              rows={2}
              placeholder="Add additional guidance, doctor phone numbers or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Bottom Sticky Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
