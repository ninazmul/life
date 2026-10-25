"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Flag,
  User,
  Users,
  Search,
  X,
  ChevronDown,
  Check,
  ChevronRight,
  Calendar,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  WorkBusinessRecordDTO,
  WorkBusinessResponse,
  getWorkBusinessRecords,
} from "@/lib/actions/lifeWorkspace.actions";
import { WorkBusinessRecordDetailBottomSheet } from "./WorkBusinessRecordDetailBottomSheet";
import { WorkBusinessRecordFormBottomSheet } from "./WorkBusinessRecordFormBottomSheet";

interface WorkBusinessPageProps {
  onBack: () => void;
  initialRecordType?: "all" | "staff_office" | "business" | "projects";
}

type RecordType = "all" | "staff_office" | "business" | "projects";
type StatusFilter = "all" | "active" | "pending" | "completed";

export function WorkBusinessPage({
  onBack,
  initialRecordType = "all",
}: WorkBusinessPageProps) {
  const [recordType, setRecordType] = useState<RecordType>(initialRecordType);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);

  // Data state
  const [data, setData] = useState<WorkBusinessResponse>({
    records: [],
    counts: { all: 0, active: 0, pending: 0, completed: 0 },
    peopleList: [],
    businessList: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Bottom sheets
  const [selectedRecord, setSelectedRecord] = useState<WorkBusinessRecordDTO | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRecordType, setFormRecordType] = useState<"staff_office" | "business" | "projects">("business");
  const [editingRecord, setEditingRecord] = useState<WorkBusinessRecordDTO | null>(null);

  // Fetch records
  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const res = await getWorkBusinessRecords({
        recordType,
        status: statusFilter,
        search: searchQuery,
      });
      setData(res);
    } catch (err) {
      console.error("Error loading Work & Business records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [recordType, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dropdown options
  const recordTypeOptions: Array<{
    id: RecordType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = [
    { id: "all", label: "All Records", icon: Layers, color: "text-indigo-600 bg-indigo-50" },
    { id: "staff_office", label: "Staff & Office", icon: User, color: "text-sky-600 bg-sky-50" },
    { id: "business", label: "Business", icon: Building2, color: "text-emerald-600 bg-emerald-50" },
    { id: "projects", label: "Projects", icon: Flag, color: "text-amber-600 bg-amber-50" },
  ];

  const currentOption = recordTypeOptions.find((o) => o.id === recordType) || recordTypeOptions[0];

  const handleCardClick = (rec: WorkBusinessRecordDTO) => {
    setSelectedRecord(rec);
    setIsDetailOpen(true);
  };

  const handleEditRecord = (rec: WorkBusinessRecordDTO) => {
    setIsDetailOpen(false);
    setFormRecordType(rec.recordType);
    setEditingRecord(rec);
    setIsFormOpen(true);
  };

  const handleOpenAddForm = () => {
    if (recordType === "all") {
      setIsTypeSelectorOpen(true);
    } else {
      setFormRecordType(recordType);
      setEditingRecord(null);
      setIsFormOpen(true);
    }
  };

  const handlePickTypeForAdd = (type: "staff_office" | "business" | "projects") => {
    setIsTypeSelectorOpen(false);
    setFormRecordType(type);
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            In Progress
          </span>
        );
      case "planning":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-600 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Planning
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Completed
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const renderCardAvatar = (rec: WorkBusinessRecordDTO) => {
    if (rec.recordType === "business") {
      const isGreen = rec.title.toLowerCase().includes("gesn");
      return (
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shadow-xs shrink-0 border ${
            isGreen
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-sky-50 text-sky-700 border-sky-200"
          }`}
        >
          {rec.title.slice(0, 4).toUpperCase()}
        </div>
      );
    }

    if (rec.recordType === "staff_office") {
      if (rec.subType === "office") {
        return (
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        );
      }
      return (
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
          <User className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
        <Flag className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. Page Header (Mockup Screen 2 & 5)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Workspace"
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1E1B4B] dark:text-white leading-tight">
              Work & Business
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage staff, businesses and projects.
            </p>
          </div>
        </div>

        {/* Right Sky Icon Badge */}
        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-xs">
          <Briefcase className="w-5 h-5" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Record Type Dropdown (Mockup Screen 2 & 5)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
          Record Type
        </label>

        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between text-left hover:border-indigo-200 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${currentOption.color}`}
            >
              <currentOption.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">
              {currentOption.label}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 space-y-1 z-30 animate-in fade-in zoom-in-95 duration-150">
            {recordTypeOptions.map((opt) => {
              const isSelected = recordType === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setRecordType(opt.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${opt.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. Search Bar
      ───────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={
            recordType === "projects"
              ? "Search projects, milestones, managers..."
              : recordType === "staff_office"
              ? "Search staff, employees, offices..."
              : recordType === "business"
              ? "Search businesses, partners, locations..."
              : "Search records..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. Status Filter Pills (Mockup Screen 2 & 5)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {(
          [
            { id: "all", label: `All (${data.counts.all})` },
            { id: "active", label: `Active (${data.counts.active})` },
            { id: "pending", label: `Pending (${data.counts.pending})` },
            { id: "completed", label: `Completed (${data.counts.completed})` },
          ] as const
        ).map((pill) => {
          const isActive = statusFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#4F46E5] text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. Record Cards List (Mockup Screen 2 & 5)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-400 font-medium">
              Loading records...
            </span>
          </div>
        ) : data.records.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                No records found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? "Try searching for a different keyword."
                  : "Tap the + button below to create your first record."}
              </p>
            </div>
          </div>
        ) : (
          data.records.map((rec) => (
            <div
              key={rec.id}
              onClick={() => handleCardClick(rec)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-100 hover:shadow-md transition-all active:scale-[0.99]"
            >
              {/* Left: Avatar / Badge */}
              {renderCardAvatar(rec)}

              {/* Middle: Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white truncate">
                  {rec.title}
                </h3>

                {/* Subtitle */}
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {rec.subtitle ? (
                    rec.subtitle
                  ) : rec.recordType === "business" ? (
                    `Business • ${rec.subType || "Company"}`
                  ) : rec.recordType === "staff_office" ? (
                    rec.subType === "office"
                      ? "Staff & Office • Office & Facility"
                      : `Staff & Office • ${rec.designation || "Employee"}`
                  ) : (
                    `Projects • ${rec.subType || "Initiative"}`
                  )}
                  {rec.responsiblePersonName && (
                    <span className="block text-[10px] text-indigo-600 font-medium truncate">
                      {rec.responsiblePersonName}
                    </span>
                  )}
                </p>

                {/* Status Badge + Date Row */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {renderStatusBadge(rec.status)}

                  {rec.importantDate && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(rec.importantDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Chevron */}
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. Floating Action Button (+) (Mockup Screen 2 & 5)
      ───────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleOpenAddForm}
        aria-label="Add Record"
        className="fixed bottom-24 right-5 z-30 w-13 h-13 rounded-full bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-all active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Type Selector Modal when "All Records" is active and user taps + */}
      {isTypeSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="absolute inset-0" onClick={() => setIsTypeSelectorOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 space-y-3 z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                Choose Record Type
              </h3>
              <button
                type="button"
                onClick={() => setIsTypeSelectorOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handlePickTypeForAdd("business")}
                className="w-full p-3 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Business Record
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Company profile, ownership equity, partners & trade licenses
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePickTypeForAdd("staff_office")}
                className="w-full p-3 rounded-2xl bg-sky-50/60 hover:bg-sky-50 border border-sky-100 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Staff & Office
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Employee employment records, offices & physical facilities
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePickTypeForAdd("projects")}
                className="w-full p-3 rounded-2xl bg-amber-50/60 hover:bg-amber-50 border border-amber-100 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Projects
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Infrastructure, product milestones, progress & deadlines
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. Reusable Record Detail Bottom Sheet (Mockup Screen 3)
      ───────────────────────────────────────────────────────────── */}
      {selectedRecord && (
        <WorkBusinessRecordDetailBottomSheet
          record={selectedRecord}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onEdit={handleEditRecord}
          onRecordUpdated={loadRecords}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. Dynamic Add / Edit Record Bottom Sheet (Mockup Screen 4)
      ───────────────────────────────────────────────────────────── */}
      <WorkBusinessRecordFormBottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        recordType={formRecordType}
        editingRecord={editingRecord}
        peopleList={data.peopleList}
        businessList={data.businessList}
        onSaved={loadRecords}
      />
    </div>
  );
}
