"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Sprout,
  ClipboardCheck,
  ScrollText,
  Siren,
  Scale,
  User,
  Shield,
  Clock,
  Eye,
  AlertTriangle,
  Flag,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getLifeContinuityRecords,
  deleteContinuityRecord,
  ContinuityResponse,
  UnifiedContinuityItem,
} from "@/lib/actions/lifeWorkspace.actions";
import { ContinuityDetailBottomSheet } from "./ContinuityDetailBottomSheet";
import { ContinuityFormBottomSheet } from "./ContinuityFormBottomSheet";

interface LifeContinuityPageProps {
  onBack: () => void;
  initialRecordType?: string;
}

const RECORD_TYPES = [
  { id: "all", label: "All Records", icon: Sprout },
  { id: "responsibilities", label: "Responsibilities", icon: ClipboardCheck },
  { id: "instructions", label: "Instructions", icon: ScrollText },
  { id: "emergency", label: "Emergency", icon: Siren },
  { id: "legacy_legal", label: "Legacy & Legal", icon: Scale },
];

const RECORD_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  responsibilities: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
  },
  instructions: {
    bg: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-100",
    dot: "bg-sky-500",
  },
  emergency: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
    dot: "bg-red-500",
  },
  legacy_legal: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
    dot: "bg-indigo-500",
  },
};

const PRIORITY_BADGE: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "bg-red-50 text-red-600 border-red-100", dot: "bg-red-500" },
  high: { label: "High", color: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-500" },
  medium: { label: "Medium", color: "bg-sky-50 text-sky-600 border-sky-100", dot: "bg-sky-500" },
  low: { label: "Low", color: "bg-slate-50 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

const ACCESS_ICONS: Record<string, any> = {
  immediate: Eye,
  timed_request: Clock,
  guardian_verified: Shield,
};

export function LifeContinuityPage({
  onBack,
  initialRecordType = "all",
}: LifeContinuityPageProps) {
  const [selectedRecordType, setSelectedRecordType] = useState<string>(
    initialRecordType === "workspace" || !initialRecordType ? "all" : initialRecordType
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Data State
  const [data, setData] = useState<ContinuityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bottom Sheet States
  const [selectedItem, setSelectedItem] = useState<UnifiedContinuityItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UnifiedContinuityItem | null>(null);

  // Fetch records
  const loadData = async (
    recordType = selectedRecordType,
    filter = activeFilter,
    search = searchQuery
  ) => {
    try {
      setIsLoading(true);
      const res = await getLifeContinuityRecords({
        recordType,
        filter,
        search,
      });
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Life Continuity records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedRecordType, activeFilter, searchQuery);
  }, [selectedRecordType, activeFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(selectedRecordType, activeFilter, searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const currentTypeConfig = useMemo(() => {
    return RECORD_TYPES.find((t) => t.id === selectedRecordType) || RECORD_TYPES[0];
  }, [selectedRecordType]);

  // Dynamic filter pills based on selected type
  const filterPills = useMemo(() => {
    if (selectedRecordType === "responsibilities") {
      return [
        { id: "all", label: "All Duties" },
        { id: "assigned", label: "Assigned" },
        { id: "in_progress", label: "In Progress" },
        { id: "completed", label: "Completed" },
      ];
    }
    if (selectedRecordType === "instructions") {
      return [
        { id: "all", label: "All" },
        { id: "immediate", label: "Immediate" },
        { id: "timed", label: "Timed" },
        { id: "guardian", label: "Guardian" },
      ];
    }
    if (selectedRecordType === "emergency") {
      return [
        { id: "all", label: "All Protocols" },
        { id: "critical", label: "Critical" },
        { id: "high", label: "High Priority" },
        { id: "active", label: "Active" },
      ];
    }
    if (selectedRecordType === "legacy_legal") {
      return [
        { id: "all", label: "All" },
        { id: "active", label: "Active" },
        { id: "draft", label: "Draft" },
        { id: "guardian", label: "Guardian Release" },
      ];
    }
    return [
      { id: "all", label: "All" },
      { id: "active", label: "Active" },
      { id: "draft", label: "Draft" },
      { id: "critical", label: "Critical" },
    ];
  }, [selectedRecordType]);

  const handleCardClick = (item: UnifiedContinuityItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleEdit = (item: UnifiedContinuityItem) => {
    setEditingRecord(item);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (item: UnifiedContinuityItem) => {
    if (!confirm(`Delete "${item.ownerTitle}"? This action cannot be undone.`)) return;
    try {
      const res = await deleteContinuityRecord(item.id);
      if (res.success) {
        toast.success("Record deleted");
        setIsDetailOpen(false);
        setSelectedItem(null);
        loadData();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleNewRecord = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  // Type badge icon helper
  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      responsibilities: ClipboardCheck,
      instructions: ScrollText,
      emergency: Siren,
      legacy_legal: Scale,
    };
    return icons[type] || ClipboardCheck;
  };

  return (
    <div className="min-h-screen bg-[#F7F6FC] dark:bg-slate-950 pb-28">
      {/* 1. Category Header */}
      <header className="sticky top-0 z-30 bg-[#F7F6FC]/90 dark:bg-slate-950/90 backdrop-blur-md px-4 pt-3 pb-3 border-b border-slate-200/50 dark:border-slate-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back to workspace"
              className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Rose Sprout Category Icon & Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center shadow-xs">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[#1E1B4B] dark:text-white leading-tight">
                  Life Continuity
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Responsibilities, instructions & legacy planning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto px-4 pt-3 space-y-4">
        {/* 2. Record Type Dropdown Selector */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-0.5">
            Record Type
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-12 px-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-[0_2px_12px_rgba(30,27,75,0.04)] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <currentTypeConfig.icon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                {currentTypeConfig.label}
              </span>
              {data?.counts && selectedRecordType !== "all" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  {data.counts[selectedRecordType as keyof typeof data.counts] ?? 0}
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-2 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="space-y-1">
                  {RECORD_TYPES.map((type) => {
                    const isSelected = selectedRecordType === type.id;
                    const IconComponent = type.icon;
                    const count =
                      data?.counts && type.id !== "all"
                        ? data.counts[type.id as keyof typeof data.counts]
                        : data?.counts?.all;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecordType(type.id);
                          setIsDropdownOpen(false);
                          setActiveFilter("all");
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                          isSelected
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent
                            className={`w-4 h-4 ${
                              isSelected ? "text-rose-600" : "text-slate-400"
                            }`}
                          />
                          <span className="text-sm">{type.label}</span>
                          {count !== undefined && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                              {count}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={
              selectedRecordType === "responsibilities"
                ? "Search responsibilities..."
                : selectedRecordType === "emergency"
                ? "Search emergency protocols..."
                : selectedRecordType === "legacy_legal"
                ? "Search legacy & legal..."
                : "Search records..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* 4. Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {filterPills.map((pill) => {
            const isActive = activeFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveFilter(pill.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#E11D48] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* 5. Record List */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : data?.records && data.records.length > 0 ? (
          <div className="space-y-3">
            {data.records.map((item) => {
              const typeColors = RECORD_TYPE_COLORS[item.recordType] || RECORD_TYPE_COLORS.responsibilities;
              const TypeIcon = getTypeIcon(item.recordType);
              const priorityBadge = PRIORITY_BADGE[item.priority || "medium"];
              const AccessIcon = ACCESS_ICONS[item.accessPolicy.method] || Clock;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.03)] cursor-pointer hover:border-slate-200 transition-all active:scale-[0.99]"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${typeColors.bg} ${typeColors.text} border ${typeColors.border} flex items-center justify-center`}
                      >
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-white truncate">
                          {item.ownerTitle}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.recipientTitle}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                  </div>

                  {/* Card Footer Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pl-[52px]">
                    {/* Priority Badge */}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${priorityBadge.color}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${priorityBadge.dot}`} />
                      {priorityBadge.label}
                    </span>

                    {/* Access Method Badge */}
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1">
                      <AccessIcon className="w-2.5 h-2.5" />
                      {item.accessPolicy.method === "immediate"
                        ? "Immediate"
                        : item.accessPolicy.method === "timed_request"
                        ? `${item.accessPolicy.waitingPeriodLabel}`
                        : "Guardian"}
                    </span>

                    {/* Assigned Person */}
                    {item.assignedPersonName && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {item.assignedPersonName}
                      </span>
                    )}

                    {/* Status */}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        item.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : item.status === "draft"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {item.status === "active" ? "Active" : item.status === "draft" ? "Draft" : "Archived"}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Access & Release Info Card */}
            <div className="p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100/80 dark:border-rose-900/40 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900 dark:text-rose-200">
                  <Shield className="w-4 h-4 text-rose-600" />
                  <span>Access & Release</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  Owner controlled
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                All continuity records follow your defined access policy. Recipients can only view
                records after meeting the release conditions you have set — immediate, timed request,
                or guardian-verified release.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Sprout className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">No continuity records found.</p>
            <p className="text-[11px] text-slate-400">
              Create responsibilities, instructions, emergency protocols, or legacy plans.
            </p>
          </div>
        )}
      </main>

      {/* 6. Floating Add Button */}
      <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-44 z-40">
        <button
          type="button"
          onClick={handleNewRecord}
          className="w-13 h-13 rounded-full bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-xl shadow-rose-500/30 flex items-center justify-center transition-transform active:scale-90"
          aria-label="Add continuity record"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 7. Detail Bottom Sheet */}
      {selectedItem && (
        <ContinuityDetailBottomSheet
          item={selectedItem}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onEdit={() => handleEdit(selectedItem)}
          onDelete={() => handleDelete(selectedItem)}
        />
      )}

      {/* 8. Form Bottom Sheet */}
      <ContinuityFormBottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
        }}
        onRecordSaved={() => loadData()}
        defaultRecordType={selectedRecordType}
        editingRecord={editingRecord}
        peopleList={data?.peopleList || []}
      />
    </div>
  );
}
