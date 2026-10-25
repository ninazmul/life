"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  Server,
  Users,
  Lock,
  Share2,
  Clock,
  AlertTriangle,
  Check,
  CheckCircle2,
  Hourglass,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getSecureVaultRecords,
  SecureVaultResponse,
  UnifiedSecureVaultItem,
} from "@/lib/actions/lifeWorkspace.actions";
import { DigitalAccountDetailBottomSheet } from "./DigitalAccountDetailBottomSheet";
import { DocumentDetailBottomSheet } from "./DocumentDetailBottomSheet";
import { AccessControlBottomSheet } from "./AccessControlBottomSheet";
import { VaultRecordFormBottomSheet } from "./VaultRecordFormBottomSheet";

interface SecureVaultPageProps {
  onBack: () => void;
  initialRecordType?: string;
}

const RECORD_TYPES = [
  { id: "all", label: "All Records", icon: Shield },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "digital_vault", label: "Digital Vault", icon: Server },
  { id: "access_control", label: "Access Control", icon: Users },
];

export function SecureVaultPage({
  onBack,
  initialRecordType = "all",
}: SecureVaultPageProps) {
  const [selectedRecordType, setSelectedRecordType] = useState<string>(
    initialRecordType === "workspace" || !initialRecordType ? "all" : initialRecordType
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Data State
  const [data, setData] = useState<SecureVaultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bottom Sheets State
  const [selectedItem, setSelectedItem] = useState<UnifiedSecureVaultItem | null>(null);
  const [isDocDetailOpen, setIsDocDetailOpen] = useState(false);
  const [isVaultDetailOpen, setIsVaultDetailOpen] = useState(false);
  const [isAccessDetailOpen, setIsAccessDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch records
  const loadData = async (recordType = selectedRecordType, filter = activeFilter, search = searchQuery) => {
    try {
      setIsLoading(true);
      const res = await getSecureVaultRecords({
        recordType,
        filter,
        search,
      });
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Secure Vault records");
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

  // Dynamic filter pills matching mockups
  const filterPills = useMemo(() => {
    if (selectedRecordType === "documents") {
      return [
        { id: "all", label: "All" },
        { id: "personal", label: "Personal" },
        { id: "business", label: "Business" },
        { id: "expiring", label: "Expiring" },
      ];
    }
    if (selectedRecordType === "access_control") {
      return [
        { id: "active", label: "Active" },
        { id: "pending", label: "Pending" },
        { id: "revoked", label: "Revoked" },
      ];
    }
    return [
      { id: "all", label: "All" },
      { id: "private", label: "Private" },
      { id: "shared", label: "Shared" },
    ];
  }, [selectedRecordType]);

  const handleCardClick = (item: UnifiedSecureVaultItem) => {
    setSelectedItem(item);
    if (item.recordType === "documents") {
      setIsDocDetailOpen(true);
    } else if (item.recordType === "digital_vault") {
      setIsVaultDetailOpen(true);
    } else if (item.recordType === "access_control") {
      setIsAccessDetailOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6FC] dark:bg-slate-950 pb-28">
      {/* 1. Category Header (Screens 1, 2, 5) */}
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

            {/* Blue Shield Category Icon & Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5 fill-blue-600/10" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[#1E1B4B] dark:text-white leading-tight">
                  Secure Vault
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Documents, accounts and controlled access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto px-4 pt-3 space-y-4">
        {/* 2. Record Type Dropdown Selector matching Screen 1 */}
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
              <currentTypeConfig.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
                          setActiveFilter(type.id === "access_control" ? "active" : "all");
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
                              isSelected ? "text-purple-600" : "text-slate-400"
                            }`}
                          />
                          <span className="text-sm">{type.label}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. Search Bar matching Mockups */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={
              selectedRecordType === "documents"
                ? "Search documents..."
                : selectedRecordType === "access_control"
                ? "Search people or records..."
                : "Search records..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* 4. Filter Pills matching Mockup Screens 1, 2, 5 */}
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
                    ? "bg-[#7C3AED] text-white shadow-xs"
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
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : data?.records && data.records.length > 0 ? (
          <div className="space-y-3">
            {data.records.map((item) => {
              // ACCESS CONTROL SPECIAL CARDS (Screen 5)
              if (item.recordType === "access_control" && item.details?.accessControl) {
                const acc = item.details.accessControl;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.03)] flex items-center justify-between cursor-pointer hover:border-purple-200 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                        {acc.personName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                          {acc.personName}
                        </h3>
                        <p className="text-[11px] text-slate-400">{acc.targetRecordTitle}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {[
                            acc.canView ? "View" : "",
                            acc.canDownload ? "Download" : "",
                            acc.canEdit ? "Edit" : "",
                          ]
                            .filter(Boolean)
                            .join(" • ") || "View only"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          acc.status === "active"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {acc.status === "active" ? "Active" : "Revoked"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                );
              }

              // DOCUMENTS & DIGITAL VAULT CARDS (Screens 1 & 2)
              const isDoc = item.recordType === "documents";
              const isVault = item.recordType === "digital_vault";

              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.03)] flex items-center justify-between cursor-pointer hover:border-slate-200 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isVault
                          ? "bg-purple-50 text-purple-600"
                          : item.category === "business"
                          ? "bg-rose-50 text-rose-500"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {isVault ? (
                        <Server className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                          {item.title}
                        </h3>
                        {item.isExpiringSoon && (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                            • Expiring soon
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {isDoc && (
                          <>
                            <span className="capitalize">{item.category}</span>
                            <span> • </span>
                            <span>{item.isShared ? "Shared" : "Private"}</span>
                            {item.expiryInfo && !item.isExpiringSoon && (
                              <span className="ml-1 text-slate-400">
                                ({item.expiryInfo})
                              </span>
                            )}
                          </>
                        )}
                        {isVault && (
                          <>
                            <span>Digital Vault</span>
                            <span> • </span>
                            <span className="text-emerald-600 font-semibold">Protected</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })}

            {/* Screen 5: Future Access Notice Card */}
            {selectedRecordType === "access_control" && (
              <div className="p-4 rounded-3xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/40 space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                    <Hourglass className="w-4 h-4 text-purple-600" />
                    <span>Future access</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    Locked • Verification required
                  </span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Assigned recipient ≠ current access. Sensitive credentials and condition-sealed documents remain locked until verified Life Continuity triggers.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Shield className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">No records found in this vault section.</p>
          </div>
        )}
      </main>

      {/* 6. Floating Add Button (+) matching Mockups */}
      <div className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-44 z-40">
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="w-13 h-13 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xl shadow-purple-500/30 flex items-center justify-center transition-transform active:scale-90"
          aria-label="Add vault record"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 7. Document Detail Bottom Sheet (Screen 2) */}
      {selectedItem && (
        <DocumentDetailBottomSheet
          item={selectedItem}
          isOpen={isDocDetailOpen}
          onClose={() => setIsDocDetailOpen(false)}
          onEdit={() => {
            setIsDocDetailOpen(false);
            setIsFormOpen(true);
          }}
          onManageAccess={() => {
            setIsDocDetailOpen(false);
            setSelectedRecordType("access_control");
          }}
        />
      )}

      {/* 8. Digital Account Detail Bottom Sheet (Mockup Screen 3) */}
      {selectedItem && (
        <DigitalAccountDetailBottomSheet
          item={selectedItem}
          isOpen={isVaultDetailOpen}
          onClose={() => setIsVaultDetailOpen(false)}
          onEdit={() => {
            setIsVaultDetailOpen(false);
            setIsFormOpen(true);
          }}
          onManageAccess={() => {
            setIsVaultDetailOpen(false);
            setSelectedRecordType("access_control");
          }}
        />
      )}

      {/* 9. Access Control Management Bottom Sheet (Mockup Screen 5) */}
      {selectedItem && (
        <AccessControlBottomSheet
          item={selectedItem}
          isOpen={isAccessDetailOpen}
          onClose={() => setIsAccessDetailOpen(false)}
          onPermissionUpdated={() => loadData()}
        />
      )}

      {/* 10. Dynamic Add Form Bottom Sheet (Mockup Screen 4) */}
      <VaultRecordFormBottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onRecordCreated={() => loadData()}
        defaultRecordType={selectedRecordType}
        peopleList={data?.peopleList || []}
        businessesList={data?.businessesList || []}
      />
    </div>
  );
}
