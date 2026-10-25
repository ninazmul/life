"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, Building2, Flag, Briefcase, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  WorkBusinessRecordDTO,
  saveWorkBusinessRecord,
} from "@/lib/actions/lifeWorkspace.actions";

interface WorkBusinessRecordFormBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: "staff_office" | "business" | "projects";
  editingRecord?: WorkBusinessRecordDTO | null;
  peopleList: Array<{ id: string; name: string; relation?: string; avatarUrl?: string }>;
  businessList: Array<{ id: string; name: string }>;
  onSaved: () => void;
}

export function WorkBusinessRecordFormBottomSheet({
  isOpen,
  onClose,
  recordType,
  editingRecord,
  peopleList,
  businessList,
  onSaved,
}: WorkBusinessRecordFormBottomSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Form States
  const [selectedRecordType, setSelectedRecordType] = useState<"staff_office" | "business" | "projects">(recordType);
  const [subType, setSubType] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<any>("active");
  const [priority, setPriority] = useState<any>("medium");
  const [notes, setNotes] = useState("");
  const [accessPermission, setAccessPermission] = useState<any>("private");

  // Related Entities
  const [relatedBusinessId, setRelatedBusinessId] = useState("");
  const [relatedBusinessName, setRelatedBusinessName] = useState("");
  const [relatedPersonId, setRelatedPersonId] = useState("");
  const [relatedPersonName, setRelatedPersonName] = useState("");
  const [responsiblePersonId, setResponsiblePersonId] = useState("");
  const [responsiblePersonName, setResponsiblePersonName] = useState("");

  // Staff Specific
  const [staffSubCategory, setStaffSubCategory] = useState<"staff" | "office">("staff");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [salaryReference, setSalaryReference] = useState("");

  // Business & Office Specific
  const [country, setCountry] = useState("Bangladesh");
  const [city, setCity] = useState("Dhaka");
  const [address, setAddress] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [ownershipType, setOwnershipType] = useState("Private Limited");
  const [owners, setOwners] = useState<Array<{ name: string; percentage: number; role?: string }>>([
    { name: "Shahidul", percentage: 70, role: "Founder & CEO" },
  ]);

  // Dates
  const [importantDate, setImportantDate] = useState("");

  // Projects Specific
  const [budgetReference, setBudgetReference] = useState("");
  const [milestones, setMilestones] = useState<Array<{ title: string; status: "planned" | "in_progress" | "completed" }>>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  // Reset or Populate
  useEffect(() => {
    setSelectedRecordType(recordType);
    if (editingRecord) {
      setSelectedRecordType(editingRecord.recordType);
      setTitle(editingRecord.title || "");
      setSubtitle(editingRecord.subtitle || "");
      setSubType(editingRecord.subType || "");
      setDescription(editingRecord.description || "");
      setStatus(editingRecord.status || "active");
      setPriority(editingRecord.priority || "medium");
      setNotes(editingRecord.notes || "");
      setAccessPermission(editingRecord.accessPermission || "private");

      setRelatedBusinessId(editingRecord.relatedBusinessId || "");
      setRelatedBusinessName(editingRecord.relatedBusinessName || "");
      setRelatedPersonId(editingRecord.relatedPersonId || "");
      setRelatedPersonName(editingRecord.relatedPersonName || "");
      setResponsiblePersonId(editingRecord.responsiblePersonId || "");
      setResponsiblePersonName(editingRecord.responsiblePersonName || "");

      setStaffSubCategory(editingRecord.subType === "office" ? "office" : "staff");
      setDesignation(editingRecord.designation || "");
      setDepartment(editingRecord.department || "");
      setSalaryReference(editingRecord.salaryReference || "");

      setCountry(editingRecord.country || "Bangladesh");
      setCity(editingRecord.city || "Dhaka");
      setAddress(editingRecord.address || "");
      setRegistrationNumber(editingRecord.registrationNumber || "");
      setOwnershipType(editingRecord.ownershipType || "Private Limited");
      if (editingRecord.owners && editingRecord.owners.length > 0) {
        setOwners(editingRecord.owners.map((o) => ({ name: o.name, percentage: o.percentage, role: o.role })));
      }

      setImportantDate(editingRecord.importantDate ? editingRecord.importantDate.split("T")[0] : "");
      setBudgetReference(editingRecord.budgetReference || "");
      setMilestones(
        editingRecord.milestones
          ? editingRecord.milestones.map((m) => ({ title: m.title, status: m.status }))
          : []
      );
    } else {
      // Default initial states
      setTitle("");
      setSubtitle("");
      setDescription("");
      setStatus("active");
      setPriority("medium");
      setNotes("");
      setAccessPermission("private");

      setRelatedBusinessId(businessList[0]?.id || "");
      setRelatedBusinessName(businessList[0]?.name || "");
      setRelatedPersonId(peopleList[0]?.id || "");
      setRelatedPersonName(peopleList[0]?.name || "");
      setResponsiblePersonId(peopleList[0]?.id || "");
      setResponsiblePersonName(peopleList[0]?.name || "");

      if (recordType === "business") {
        setSubType("Technology Company");
        setOwnershipType("Private Limited");
        setCountry("Bangladesh");
        setCity("Dhaka");
        setOwners([{ name: "Shahidul", percentage: 70, role: "Founder & CEO" }]);
        setImportantDate(new Date().toISOString().split("T")[0]);
      } else if (recordType === "staff_office") {
        setStaffSubCategory("staff");
        setSubType("staff");
        setDesignation("Operations Lead");
        setDepartment("Operations");
        setImportantDate(new Date().toISOString().split("T")[0]);
      } else if (recordType === "projects") {
        setSubType("Infrastructure");
        setResponsiblePersonName("Shahidul (Project Manager)");
        setImportantDate(new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0]);
        setMilestones([
          { title: "Planning & Architecture", status: "completed" },
          { title: "Implementation phase", status: "in_progress" },
        ]);
      }
    }
  }, [editingRecord, isOpen, recordType]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones([...milestones, { title: newMilestoneTitle.trim(), status: "planned" }]);
    setNewMilestoneTitle("");
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, idx) => idx !== index));
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
      const res = await saveWorkBusinessRecord({
        id: editingRecord?.id,
        recordType: selectedRecordType,
        subType: selectedRecordType === "staff_office" ? staffSubCategory : subType,
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        status,
        priority,

        relatedBusinessId: relatedBusinessId || undefined,
        relatedBusinessName: relatedBusinessName.trim(),
        relatedPersonId: relatedPersonId || undefined,
        relatedPersonName: relatedPersonName.trim(),
        responsiblePersonId: responsiblePersonId || undefined,
        responsiblePersonName: responsiblePersonName.trim(),

        designation: designation.trim(),
        department: department.trim(),
        salaryReference: salaryReference.trim(),

        country: country.trim(),
        city: city.trim(),
        address: address.trim(),
        registrationNumber: registrationNumber.trim(),
        ownershipType,
        owners,

        importantDate: importantDate ? new Date(importantDate).toISOString() : undefined,
        budgetReference: budgetReference.trim(),
        milestones,
        notes: notes.trim(),
        accessPermission,
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
    switch (selectedRecordType) {
      case "business":
        return `${action} Business Record`;
      case "staff_office":
        return staffSubCategory === "office" ? `${action} Office Record` : `${action} Staff Record`;
      case "projects":
        return `${action} Project Record`;
      default:
        return `${action} Work Record`;
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
            <p className="text-xs text-slate-500 mt-0.5">
              Enter comprehensive workplace, business or project details
            </p>
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
          {/* Record Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Record Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                selectedRecordType === "business"
                  ? "Enter business name (e.g. GESN, Tech Ventures)"
                  : selectedRecordType === "projects"
                  ? "Enter project name (e.g. Server Expansion)"
                  : "Enter title (e.g. Sabbir Employment Record / Uttara Office)"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Record Type Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Record Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedRecordType}
              onChange={(e) => setSelectedRecordType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="business">Business</option>
              <option value="staff_office">Staff & Office</option>
              <option value="projects">Projects</option>
            </select>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              DYNAMIC FIELDS: BUSINESS
          ───────────────────────────────────────────────────────────── */}
          {selectedRecordType === "business" && (
            <>
              {/* Business Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Technology Company">Technology Company</option>
                  <option value="Technology Solutions">Technology Solutions</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                  <option value="Consultancy & Services">Consultancy & Services</option>
                  <option value="Real Estate & Facilities">Real Estate & Facilities</option>
                  <option value="Manufacturing & Trading">Manufacturing & Trading</option>
                  <option value="Healthcare & Care">Healthcare & Care</option>
                  <option value="Other Commercial Entity">Other Commercial Entity</option>
                </select>
              </div>

              {/* Ownership / Partnership Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ownership / Partnership Structure
                </label>
                <select
                  value={ownershipType}
                  onChange={(e) => setOwnershipType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Private Limited">Private Limited</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Public Limited">Public Limited</option>
                </select>
              </div>

              {/* Country & City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    City (Optional)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Incorporation Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Incorporation / Registration Date
                </label>
                <input
                  type="date"
                  value={importantDate}
                  onChange={(e) => setImportantDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              DYNAMIC FIELDS: STAFF & OFFICE
          ───────────────────────────────────────────────────────────── */}
          {selectedRecordType === "staff_office" && (
            <>
              {/* Subcategory toggle: Staff vs Office */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStaffSubCategory("staff")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    staffSubCategory === "staff"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Staff Member
                </button>
                <button
                  type="button"
                  onClick={() => setStaffSubCategory("office")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    staffSubCategory === "office"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Office Location
                </button>
              </div>

              {staffSubCategory === "staff" ? (
                <>
                  {/* Select Employee from People Directory */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Staff / Employee (from People Directory) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={relatedPersonId}
                      onChange={(e) => {
                        setRelatedPersonId(e.target.value);
                        const p = peopleList.find((x) => x.id === e.target.value);
                        if (p) setRelatedPersonName(p.name);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Select Person Profile --</option>
                      {peopleList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.relation ? `(${p.relation})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Designation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Job Title / Designation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Operations Lead"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={importantDate}
                      onChange={(e) => setImportantDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Office Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Office Address & Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 3, Uttara, Dhaka"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Lease / Target Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Lease Expiry or Setup Date
                    </label>
                    <input
                      type="date"
                      value={importantDate}
                      onChange={(e) => setImportantDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* Related Business */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Related Business Entity
                </label>
                <select
                  value={relatedBusinessId}
                  onChange={(e) => {
                    setRelatedBusinessId(e.target.value);
                    const b = businessList.find((x) => x.id === e.target.value);
                    if (b) setRelatedBusinessName(b.name);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Business --</option>
                  {businessList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────
              DYNAMIC FIELDS: PROJECTS
          ───────────────────────────────────────────────────────────── */}
          {selectedRecordType === "projects" && (
            <>
              {/* Project Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Domain / Type
                </label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Product Development">Product Development</option>
                  <option value="Office & Facility">Office & Facility</option>
                  <option value="Legal & Partnership">Legal & Partnership</option>
                  <option value="Marketing & Growth">Marketing & Growth</option>
                </select>
              </div>

              {/* Project Manager */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Manager / Responsible Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shahidul (Project Manager)"
                  value={responsiblePersonName}
                  onChange={(e) => setResponsiblePersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Target Completion Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={importantDate}
                  onChange={(e) => setImportantDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Milestones manager */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Milestones
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add milestone title..."
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {milestones.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs border border-slate-100"
                      >
                        <span className="truncate max-w-[240px] text-slate-800 dark:text-slate-200">
                          {m.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="planning">Planning</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter comprehensive operational description, objectives or guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Access Permission */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Access Permission
            </label>
            <select
              value={accessPermission}
              onChange={(e) => setAccessPermission(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="private">Private (Only You / Super Admin)</option>
              <option value="owner_only">Owner Only</option>
              <option value="team_shared">Team Shared</option>
              <option value="guardian_accessible">Emergency Guardian Accessible</option>
            </select>
          </div>

          {/* Notes (Optional with 0/500 counter) */}
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
              placeholder="Add additional guidance, bank contacts or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sticky Buttons */}
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
