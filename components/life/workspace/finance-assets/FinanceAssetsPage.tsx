"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  HandCoins,
  ShieldCheck,
  Heart,
  Gift,
  Lock,
  Share2,
  Users,
  Info,
  DollarSign,
  FileText,
  PiggyBank,
  CircleDollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getFinanceAssetsRecords,
  FinanceAssetsResponse,
  UnifiedFinanceItem,
  SisCareRecordDTO,
} from "@/lib/actions/lifeWorkspace.actions";
import { SisCareDetailBottomSheet } from "./SisCareDetailBottomSheet";
import { FinanceRecordFormBottomSheet } from "./FinanceRecordFormBottomSheet";
import { MySisCareModal } from "./MySisCareModal";

interface FinanceAssetsPageProps {
  onBack: () => void;
  initialRecordType?: string;
}

const RECORD_TYPES = [
  { id: "all", label: "All Records", icon: CircleDollarSign },
  { id: "cash_bank", label: "Cash & Bank", icon: Building2 },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "expenses", label: "Expenses", icon: TrendingDown },
  { id: "loans_given", label: "Loans Given", icon: HandCoins },
  { id: "sis_care", label: "SiS Care", icon: Heart, badge: "Care" },
  { id: "liabilities", label: "Liabilities", icon: FileText },
  { id: "assets", label: "Assets & Property", icon: PiggyBank },
  { id: "investments", label: "Investments", icon: TrendingUp },
  { id: "other", label: "Other Financial Records", icon: Wallet },
];

export function FinanceAssetsPage({
  onBack,
  initialRecordType = "all",
}: FinanceAssetsPageProps) {
  const [selectedRecordType, setSelectedRecordType] = useState<string>(
    initialRecordType === "workspace" || !initialRecordType ? "all" : initialRecordType
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Visibility states for eye toggles (mockup screen 2)
  const [showFlexibleBalance, setShowFlexibleBalance] = useState(true);
  const [showGiftsSupport, setShowGiftsSupport] = useState(true);

  // Data State
  const [data, setData] = useState<FinanceAssetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Bottom Sheets & Modals
  const [selectedSisRecord, setSelectedSisRecord] = useState<SisCareRecordDTO | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSharedViewOpen, setIsSharedViewOpen] = useState(false);

  // Fetch records
  const loadData = async (recordType = selectedRecordType, status = statusFilter, search = searchQuery) => {
    try {
      setIsLoading(true);
      const res = await getFinanceAssetsRecords({
        recordType,
        status,
        search,
      });
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedRecordType, statusFilter, searchQuery);
  }, [selectedRecordType, statusFilter]);

  // Handle Search Input with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(selectedRecordType, statusFilter, searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const currentTypeConfig = useMemo(() => {
    return RECORD_TYPES.find((t) => t.id === selectedRecordType) || RECORD_TYPES[0];
  }, [selectedRecordType]);

  // Filter pills based on selected record type
  const filterPills = useMemo(() => {
    if (selectedRecordType === "sis_care") {
      return [
        { id: "all", label: "All" },
        { id: "active", label: "Active" },
        { id: "closed", label: "Closed" },
      ];
    }
    if (selectedRecordType === "cash_bank") {
      return [
        { id: "all", label: "All" },
        { id: "bank", label: "Bank" },
        { id: "cash", label: "Cash" },
        { id: "wallet", label: "Wallet" },
      ];
    }
    if (selectedRecordType === "income") {
      return [
        { id: "all", label: "All" },
        { id: "received", label: "Received" },
        { id: "pending", label: "Pending" },
      ];
    }
    if (selectedRecordType === "expenses") {
      return [
        { id: "all", label: "All" },
        { id: "paid", label: "Paid" },
        { id: "unpaid", label: "Unpaid" },
      ];
    }
    if (selectedRecordType === "loans_given") {
      return [
        { id: "all", label: "All" },
        { id: "active", label: "Active" },
        { id: "settled", label: "Settled" },
      ];
    }
    return [
      { id: "all", label: "All" },
      { id: "active", label: "Active" },
      { id: "closed", label: "Closed" },
    ];
  }, [selectedRecordType]);

  // SiS Care records specifically
  const sisRecords = useMemo(() => {
    if (!data?.records) return [];
    return data.records.filter((r) => r.recordType === "sis_care" && r.sisDetails);
  }, [data?.records]);

  const formatCurrency = (val: number) => {
    return `৳${Number(val || 0).toLocaleString("en-IN")}`;
  };

  const handleCardClick = (item: UnifiedFinanceItem) => {
    if (item.recordType === "sis_care" && item.sisDetails) {
      setSelectedSisRecord(item.sisDetails);
      setIsDetailOpen(true);
    } else {
      toast.success(`${item.title}: ${formatCurrency(item.amount)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6FC] dark:bg-slate-950 pb-28">
      {/* 1. Header (Mockup Screens 1 & 2) */}
      <header className="sticky top-0 z-30 bg-[#F7F6FC]/90 dark:bg-slate-950/90 backdrop-blur-md px-4 pt-3 pb-3 border-b border-slate-200/50 dark:border-slate-800">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Standard 32x32 Back Button */}
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back to workspace"
              className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Category Icon & Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[#1E1B4B] dark:text-white leading-tight">
                  Finance & Assets
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Money, support and assets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto px-4 pt-3 space-y-4">
        {/* 2. Record Type Dropdown Selector (Screen 1 & 2) */}
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
              <currentTypeConfig.icon
                className={`w-4 h-4 ${
                  currentTypeConfig.id === "sis_care"
                    ? "text-rose-500"
                    : "text-purple-600 dark:text-purple-400"
                }`}
              />
              <span className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                {currentTypeConfig.label}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu Modal/Popover matching Screen 1 */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-2 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="space-y-1">
                  {RECORD_TYPES.map((type) => {
                    const isSelected = selectedRecordType === type.id;
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecordType(type.id);
                          setIsDropdownOpen(false);
                          setStatusFilter("all");
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                          isSelected
                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent
                            className={`w-4 h-4 ${
                              type.id === "sis_care"
                                ? "text-rose-500"
                                : isSelected
                                ? "text-purple-600"
                                : "text-slate-400"
                            }`}
                          />
                          <span className="text-sm">{type.label}</span>
                        </div>
                        {type.id === "sis_care" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100">
                            Care
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. Screen 2: SiS Care Same Page Summary Cards */}
        {selectedRecordType === "sis_care" && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
            {/* Card 1: Flexible balance */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Flexible balance
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFlexibleBalance(!showFlexibleBalance)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  aria-label="Toggle flexible balance visibility"
                >
                  {showFlexibleBalance ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-xl font-extrabold text-[#1E1B4B] dark:text-white">
                {showFlexibleBalance
                  ? formatCurrency(data?.sisSummary.flexibleBalance || 35000)
                  : "••••••"}
              </div>
            </div>

            {/* Card 2: Gifts & support */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Gifts & support
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGiftsSupport(!showGiftsSupport)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  aria-label="Toggle gifts visibility"
                >
                  {showGiftsSupport ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-xl font-extrabold text-[#1E1B4B] dark:text-white">
                {showGiftsSupport
                  ? formatCurrency(data?.sisSummary.giftsSupport || 12000)
                  : "••••••"}
              </div>
            </div>
          </div>
        )}

        {/* 4. Search Bar matching Mockup Screens 1 & 2 */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={
              selectedRecordType === "sis_care"
                ? "Search person or support..."
                : "Search records, accounts, or people..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* 5. Filter Pills matching Mockup Screens 1 & 2 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {filterPills.map((pill) => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#7C3AED] text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* 6. Record List */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : data?.records && data.records.length > 0 ? (
          <div className="space-y-3">
            {data.records.map((item) => {
              // SIS CARE SPECIAL CARD LAYOUT (Screen 2)
              if (item.recordType === "sis_care" && item.sisDetails) {
                const sis = item.sisDetails;
                const isGift = sis.supportType === "gift";

                if (isGift) {
                  // Screen 2 Gift Card
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleCardClick(item)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] cursor-pointer hover:border-purple-200 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                            <Gift className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                              {sis.personName || "Family support"}
                            </h3>
                            <p className="text-[11px] text-slate-400">Gift</p>
                            <p className="text-sm font-extrabold text-[#1E1B4B] dark:text-white mt-0.5">
                              {formatCurrency(sis.totalGiven)}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100">
                          No repayment
                        </span>
                      </div>
                    </div>
                  );
                }

                // Screen 2 Flexible Support Card (Rahim / Ahmed)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] cursor-pointer hover:border-purple-200 transition-all active:scale-[0.99]"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                          {sis.personName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#1E1B4B] dark:text-white">
                            {sis.personName}
                          </h3>
                          <p className="text-[11px] text-slate-400">Flexible support</p>
                        </div>
                      </div>

                      {/* Shared or Private Badge */}
                      {sis.isShared ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                          <Users className="w-3 h-3" />
                          <span>Shared</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          <Lock className="w-3 h-3" />
                          <span>Private</span>
                        </div>
                      )}
                    </div>

                    {/* 3 Stats Row (Given, Returned, Remaining) matching Screen 2 */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Given</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {formatCurrency(sis.totalGiven)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Returned</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {formatCurrency(sis.totalReturned)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Remaining</p>
                        <p className="text-xs font-extrabold text-purple-700 dark:text-purple-400">
                          {formatCurrency(sis.remainingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // GENERAL UNIFIED RECORD CARD (Screen 1)
              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.03)] flex items-center justify-between cursor-pointer hover:border-slate-200 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {item.recordType === "cash_bank" ? (
                        <Building2 className="w-5 h-5 text-sky-600" />
                      ) : item.recordType === "loans_given" ? (
                        <HandCoins className="w-5 h-5 text-amber-600" />
                      ) : item.recordType === "sis_care" ? (
                        <Heart className="w-5 h-5 text-rose-500" />
                      ) : item.recordType === "income" ? (
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <CircleDollarSign className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Wallet className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">No records found for this selection.</p>
          </div>
        )}

        {/* 7. Screen 2 Supportive Notice Footer */}
        {selectedRecordType === "sis_care" && (
          <div className="mt-6 p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/40 flex items-center gap-2 text-purple-700 dark:text-purple-300 text-xs">
            <Info className="w-4 h-4 shrink-0 text-purple-500" />
            <span>Return whenever able. No fixed installments.</span>
          </div>
        )}
      </main>

      {/* 8. Floating Add Button (+) matching Mockup Screens 1 & 2 */}
      <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-44 z-40">
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="w-13 h-13 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xl shadow-purple-500/30 flex items-center justify-center transition-transform active:scale-90"
          aria-label="Add financial record"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 9. Details Bottom Sheet (Mockup Screen 3) */}
      {selectedSisRecord && (
        <SisCareDetailBottomSheet
          record={selectedSisRecord}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onRecordUpdated={() => {
            loadData();
          }}
          onOpenSharedView={() => {
            setIsDetailOpen(false);
            setIsSharedViewOpen(true);
          }}
        />
      )}

      {/* 10. Dynamic Add Form Bottom Sheet (Mockup Screen 4) */}
      <FinanceRecordFormBottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onRecordCreated={() => {
          loadData();
        }}
        defaultRecordType={selectedRecordType}
        peopleList={data?.peopleList || []}
        accountsList={data?.accountsList || []}
      />

      {/* 11. Shared User View Modal (Mockup Screen 5) */}
      {selectedSisRecord && (
        <MySisCareModal
          record={selectedSisRecord}
          isOpen={isSharedViewOpen}
          onClose={() => setIsSharedViewOpen(false)}
        />
      )}
    </div>
  );
}
