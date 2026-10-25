"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  ArrowLeft,
  HeartPulse,
  Users,
  Baby,
  Globe2,
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
  FamilyCommunityRecordDTO,
  FamilyCommunityResponse,
  getFamilyCommunityRecords,
} from "@/lib/actions/lifeWorkspace.actions";
import { RecordDetailBottomSheet } from "./RecordDetailBottomSheet";
import { RecordFormBottomSheet } from "./RecordFormBottomSheet";

interface FamilyCommunityPageProps {
  onBack: () => void;
  initialRecordType?: "all" | "family_care" | "kids" | "community";
}

type RecordType = "all" | "family_care" | "kids" | "community";
type StatusFilter = "all" | "active" | "pending" | "completed";

export function FamilyCommunityPage({
  onBack,
  initialRecordType = "all",
}: FamilyCommunityPageProps) {
  const [recordType, setRecordType] = useState<RecordType>(initialRecordType);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);

  // Data state
  const [data, setData] = useState<FamilyCommunityResponse>({
    records: [],
    counts: { all: 0, active: 0, pending: 0, completed: 0 },
    peopleList: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Bottom sheets
  const [selectedRecord, setSelectedRecord] = useState<FamilyCommunityRecordDTO | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRecordType, setFormRecordType] = useState<"family_care" | "kids" | "community">("family_care");
  const [editingRecord, setEditingRecord] = useState<FamilyCommunityRecordDTO | null>(null);

  // Fetch records dynamically on filter or type change
  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const res = await getFamilyCommunityRecords({
        recordType,
        status: statusFilter,
        search: searchQuery,
      });
      setData(res);
    } catch (err) {
      console.error("Error loading Family & Community records:", err);
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
    { id: "family_care", label: "Family Care", icon: HeartPulse, color: "text-rose-600 bg-rose-50" },
    { id: "kids", label: "Kids", icon: Baby, color: "text-sky-600 bg-sky-50" },
    { id: "community", label: "Community", icon: Globe2, color: "text-purple-600 bg-purple-50" },
  ];

  const currentOption = recordTypeOptions.find((o) => o.id === recordType) || recordTypeOptions[0];

  const handleCardClick = (rec: FamilyCommunityRecordDTO) => {
    setSelectedRecord(rec);
    setIsDetailOpen(true);
  };

  const handleEditRecord = (rec: FamilyCommunityRecordDTO) => {
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

  const handlePickTypeForAdd = (type: "family_care" | "kids" | "community") => {
    setIsTypeSelectorOpen(false);
    setFormRecordType(type);
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "action_required":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Action Required
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active
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
      default:
        return null;
    }
  };

  const renderCardAvatar = (rec: FamilyCommunityRecordDTO) => {
    if (rec.relatedPersonAvatar) {
      return (
        <img
          src={rec.relatedPersonAvatar}
          alt={rec.relatedPersonName || rec.title}
          className="w-11 h-11 rounded-2xl object-cover border border-slate-200/80 shadow-xs"
        />
      );
    }

    if (rec.recordType === "family_care") {
      return (
        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
          <HeartPulse className="w-5 h-5" />
        </div>
      );
    }

    if (rec.recordType === "kids") {
      return (
        <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
          <Baby className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
        <Globe2 className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. Page Header (Mockup Screen 2)
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
              Family & Community
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Care, children and connections.
            </p>
          </div>
        </div>

        {/* Right Rose Icon Badge */}
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-xs">
          <HeartPulse className="w-5 h-5" />
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
            recordType === "kids"
              ? "Search child, school, guardian..."
              : recordType === "community"
              ? "Search relatives, connections, support..."
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
          4. Status Filter Pills (Mockup Screen 2)
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
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
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
                  {rec.relatedPersonName && (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {rec.relatedPersonName}
                    </span>
                  )}
                  {rec.relatedPersonName && rec.subType && " • "}
                  {rec.subType && <span>{rec.subType}</span>}
                  {rec.institution && (
                    <span className="block text-[10px] text-indigo-600 font-medium truncate">
                      {rec.institution}
                    </span>
                  )}
                </p>

                {/* Status Badge + Date Row */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {renderStatusBadge(rec.status)}

                  {rec.dueDate && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(rec.dueDate).toLocaleDateString("en-US", {
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
                onClick={() => handlePickTypeForAdd("family_care")}
                className="w-full p-3 rounded-2xl bg-rose-50/60 hover:bg-rose-50 border border-rose-100 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Family Care
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Medical checkups, health, daily care & assistance
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePickTypeForAdd("kids")}
                className="w-full p-3 rounded-2xl bg-sky-50/60 hover:bg-sky-50 border border-sky-100 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Kids Record
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Education programs, guardianship & future plans
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePickTypeForAdd("community")}
                className="w-full p-3 rounded-2xl bg-purple-50/60 hover:bg-purple-50 border border-purple-100 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Community Record
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Relatives, friends, commitments & financial support
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
        <RecordDetailBottomSheet
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
      <RecordFormBottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        recordType={formRecordType}
        editingRecord={editingRecord}
        peopleList={data.peopleList}
        onSaved={loadRecords}
      />
    </div>
  );
}
