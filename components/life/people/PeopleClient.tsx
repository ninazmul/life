/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronRight,
  FileText,
  ClipboardList,
  Wallet,
  X,
  UserPlus,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddPersonClient } from "./AddPersonClient";
import type { ILifePerson } from "@/types";

interface PeopleClientProps {
  initialPeople: ILifePerson[];
}

export function PeopleClient({ initialPeople }: PeopleClientProps) {
  const router = useRouter();
  const [people, setPeople] = useState<ILifePerson[]>(initialPeople);
  const [search, setSearch] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<
    "All" | "Family" | "Staff" | "Business" | "Others"
  >("All");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Helper to map category/relation into one of the 4 primary tabs: Family, Staff, Business, Others
  const getMappedTab = (p: ILifePerson): "Family" | "Staff" | "Business" | "Others" => {
    const cat = (p.category || "").toLowerCase();
    const rel = (p.relation || "").toLowerCase();

    if (
      cat.includes("family") ||
      [
        "wife",
        "husband",
        "son",
        "daughter",
        "brother",
        "sister",
        "father",
        "mother",
        "parents",
        "cousin",
        "relative",
      ].some((r) => rel.includes(r))
    ) {
      return "Family";
    }

    if (
      cat.includes("staff") ||
      ["staff", "assistant", "employee", "driver"].some((r) => rel.includes(r))
    ) {
      return "Staff";
    }

    if (
      cat.includes("business") ||
      ["partner", "business", "colleague"].some((r) => rel.includes(r))
    ) {
      return "Business";
    }

    return "Others";
  };

  // Compute counts for each category tab
  const categoryCounts = useMemo(() => {
    const counts = {
      All: people.length,
      Family: 0,
      Staff: 0,
      Business: 0,
      Others: 0,
    };

    for (const p of people) {
      const tab = getMappedTab(p);
      counts[tab]++;
    }

    return counts;
  }, [people]);

  // Filtered people
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      // 1. Category Tab Filter
      if (selectedCategoryTab !== "All") {
        if (getMappedTab(p) !== selectedCategoryTab) return false;
      }

      // 2. Status Dropdown Filter
      if (statusFilter !== "all") {
        if (p.registrationStatus !== statusFilter) return false;
      }

      // 3. Search query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = (p.name || "").toLowerCase().includes(query);
        const matchesRelation = (p.relation || "").toLowerCase().includes(query);
        const matchesCategory = (p.category || "").toLowerCase().includes(query);
        const matchesEmail = (p.email || "").toLowerCase().includes(query);
        const matchesPhone = (p.phone || "").includes(query);

        if (
          !matchesName &&
          !matchesRelation &&
          !matchesCategory &&
          !matchesEmail &&
          !matchesPhone
        ) {
          return false;
        }
      }

      return true;
    });
  }, [people, selectedCategoryTab, statusFilter, search]);

  const handlePersonAdded = (newPerson: ILifePerson) => {
    setPeople((prev) => [newPerson, ...prev]);
    setAddModalOpen(false);
    router.refresh();
  };

  // Render Status Badge
  const renderStatusBadge = (p: ILifePerson) => {
    const status = p.registrationStatus || "not_invited";

    switch (status) {
      case "active_user":
        return (
          <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] border border-emerald-200/80 shrink-0">
            Active User
          </span>
        );
      case "invitation_sent":
        return (
          <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] border border-sky-200/80 shrink-0">
            Invitation Sent
          </span>
        );
      case "invite_expired":
        return (
          <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-amber-200/80 shrink-0">
            Invite Expired
          </span>
        );
      case "disabled":
        return (
          <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-rose-200/80 shrink-0">
            Disabled
          </span>
        );
      case "not_invited":
      default:
        return (
          <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0">
            Not Invited
          </span>
        );
    }
  };

  // Render Status Dot for Avatar
  const renderStatusDot = (p: ILifePerson) => {
    const status = p.registrationStatus || "not_invited";
    let dotClass = "bg-slate-300";

    if (status === "active_user") {
      dotClass = "bg-emerald-500";
    } else if (status === "invitation_sent") {
      dotClass = "bg-amber-400";
    } else if (status === "invite_expired") {
      dotClass = "bg-orange-500";
    } else if (status === "disabled") {
      dotClass = "bg-rose-500";
    }

    return (
      <span
        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${dotClass}`}
      />
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-24 pt-1 sm:pt-3">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100/90 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] tracking-tight leading-tight">
              People
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage your people, invitations and access
            </p>
          </div>
        </div>

        {/* + Add Person Button */}
        <Link
          href="/people/new"
          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          <span>Add Person</span>
        </Link>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {(["All", "Family", "Staff", "Business", "Others"] as const).map(
          (tab) => {
            const count = categoryCounts[tab];
            const isSelected = selectedCategoryTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategoryTab(tab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#6D28D9] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-purple-800/80 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* ── Search Bar with Filter Trigger ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, relation or email..."
            className="w-full h-11 pl-10 pr-9 rounded-2xl border border-slate-200/90 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 transition-all font-medium shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
              statusFilter !== "all" || showFilterDropdown
                ? "bg-indigo-50 border-indigo-200 text-[#4F46E5]"
                : "bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50"
            }`}
            aria-label="Filter options"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Status Filter Popover */}
          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-100 shadow-xl p-2 z-30 space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Filter by Status
              </p>
              {[
                { label: "All Statuses", val: "all" },
                { label: "Active User", val: "active_user" },
                { label: "Invitation Sent", val: "invitation_sent" },
                { label: "Not Invited", val: "not_invited" },
                { label: "Invite Expired", val: "invite_expired" },
                { label: "Disabled", val: "disabled" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setStatusFilter(item.val);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                    statusFilter === item.val
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.label}</span>
                  {statusFilter === item.val && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── People List ── */}
      <div className="space-y-2.5">
        {filteredPeople.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto shadow-2xs">
              <UserPlus className="w-6 h-6" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1B4B]">
                {search.trim() || statusFilter !== "all"
                  ? "No matching people found."
                  : "No people added yet."}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                {search.trim() || statusFilter !== "all"
                  ? "Try clearing filters or search query to find your contacts."
                  : "Add family members, trusted staff, guardians, or business partners."}
              </p>
            </div>
            {search.trim() || statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSelectedCategoryTab("All");
                }}
                className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/people/new"
                className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-[#6366F1] hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                <span>Add Person</span>
              </Link>
            )}
          </div>
        ) : (
          filteredPeople.map((person) => {
            const notesCount = person.notesCount ?? 0;
            const dutiesCount = person.dutiesCount ?? 0;
            const loansCount = person.loansCount ?? 0;
            const categoryDisplay = person.category || "Family Member";

            return (
              <Link
                key={person._id}
                href={`/people/${person._id}`}
                className="block p-4 rounded-3xl bg-white border border-slate-100 hover:border-indigo-100 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md transition-all duration-200 group"
              >
                {/* Top Row: Avatar + Name/Relation + Status Badge + Chevron */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with Status Dot */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#EEF2FF] border border-indigo-100 flex items-center justify-center overflow-hidden shadow-2xs">
                        {person.profilePhoto || person.avatarUrl ? (
                          <img
                            src={person.profilePhoto || person.avatarUrl}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[#4F46E5] font-extrabold text-base">
                            {person.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {renderStatusDot(person)}
                    </div>

                    {/* Name & Relation • Category */}
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-[#1E1B4B] group-hover:text-[#4F46E5] transition-colors truncate">
                        {person.name}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {person.relation} • {categoryDisplay}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge + Chevron Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    {renderStatusBadge(person)}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Bottom Row: Metadata Counts */}
                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-slate-100/80 text-[11px] font-semibold text-slate-500">
                  <div className="inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      {notesCount} {notesCount === 1 ? "Note" : "Notes"}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>
                      {dutiesCount} {dutiesCount === 1 ? "Duty" : "Duties"}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {loansCount} {loansCount === 1 ? "Loan" : "Loans"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ── Add Person Dialog Modal ── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-5 rounded-3xl bg-white border border-slate-100 shadow-xl">
          <AddPersonClient
            isModal
            onSuccess={handlePersonAdded}
            onCancel={() => setAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
