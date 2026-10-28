/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  Star,
  AlertCircle,
  Archive,
} from "lucide-react";
import { AddEditPersonModal } from "./AddEditPersonModal";
import type { ILifePerson } from "@/types";

interface PeopleClientProps {
  initialPeople: ILifePerson[];
}

// Avatar pastel color palette matching approved design
const PASTEL_COLORS = [
  { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" }, // Pink / Sharmin
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" }, // Mint / Sabbir
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" }, // Purple / Sanaullah
  { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" }, // Sky / Jahidul
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" }, // Amber / Hakim
  { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" }, // Teal / Rahim
  { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
];

function getAvatarStyle(name: string) {
  if (!name) return PASTEL_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
}

function getInitials(name: string): string {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 1).toUpperCase();
}

export function PeopleClient({ initialPeople }: PeopleClientProps) {
  const router = useRouter();
  const [people, setPeople] = useState<ILifePerson[]>(initialPeople);
  const [search, setSearch] = useState("");
  const [connectionFilter, setConnectionFilter] = useState<string>("All");
  const [accountFilter, setAccountFilter] = useState<string>("All");
  const [additionalFilter, setAdditionalFilter] = useState<
    "all" | "important" | "emergency" | "archived"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Available connection types per Section 9
  const connectionOptions = [
    { label: "Connection: All", value: "All" },
    { label: "Connection: Family", value: "Family" },
    { label: "Connection: Relatives", value: "Relatives" },
    { label: "Connection: Friends", value: "Friends" },
    { label: "Connection: Staff", value: "Staff" },
    { label: "Connection: Business Partners", value: "Business Partners" },
    { label: "Connection: Other Contacts", value: "Other Contacts" },
  ];

  // Available account types per Section 9
  const accountOptions = [
    { label: "Account: All", value: "All" },
    { label: "Account: Contact Only", value: "Contact Only" },
    { label: "Account: Invitation Pending", value: "Invitation Pending" },
    { label: "Account: Connected", value: "Connected" },
  ];

  // Filter logic
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      // 1. Connection filter
      if (connectionFilter !== "All") {
        const pConns =
          Array.isArray(p.connections) && p.connections.length > 0
            ? p.connections.map((c) => c.toLowerCase())
            : [((p as any).category || "").toLowerCase()];
        const pRel = (p.relation || "").toLowerCase();

        const target = connectionFilter.toLowerCase();
        let matchesConn = false;

        if (target === "family") {
          matchesConn =
            pConns.some((c) => c.includes("family")) ||
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
            ].some((r) => pRel.includes(r));
        } else if (target === "relatives") {
          matchesConn =
            pConns.some((c) => c.includes("relative")) ||
            [
              "relative",
              "cousin",
              "uncle",
              "aunt",
              "nephew",
              "niece",
            ].some((r) => pRel.includes(r));
        } else if (target === "friends") {
          matchesConn =
            pConns.some((c) => c.includes("friend")) || pRel.includes("friend");
        } else if (target === "staff") {
          matchesConn =
            pConns.some((c) => c.includes("staff")) ||
            ["staff", "employee", "assistant", "driver"].some((r) =>
              pRel.includes(r)
            );
        } else if (
          target.includes("business") ||
          target.includes("partner")
        ) {
          matchesConn =
            pConns.some(
              (c) => c.includes("partner") || c.includes("business")
            ) || ["partner", "colleague", "business"].some((r) => pRel.includes(r));
        } else if (target.includes("other")) {
          matchesConn =
            pConns.some(
              (c) => c.includes("other") || c.includes("contact")
            ) ||
            ["other", "advisor", "guardian", "caregiver"].some((r) =>
              pRel.includes(r)
            );
        } else {
          matchesConn = pConns.some((c) => c.includes(target));
        }

        if (!matchesConn) return false;
      }

      // 2. Account filter
      if (accountFilter !== "All") {
        const isConnected = Boolean(
          p.clerkUserId || p.registrationStatus === "active_user"
        );
        const isPending = p.registrationStatus === "invitation_sent";
        const isContactOnly = !isConnected && !isPending;

        if (accountFilter === "Connected" && !isConnected) return false;
        if (accountFilter === "Invitation Pending" && !isPending) return false;
        if (accountFilter === "Contact Only" && !isContactOnly) return false;
      }

      // 3. Additional filter
      if (additionalFilter === "important" && !p.isImportant) return false;
      if (additionalFilter === "emergency" && !p.isEmergencyContact) return false;
      if (additionalFilter === "archived" && p.status !== "archived") return false;
      if (additionalFilter !== "archived" && p.status === "archived") return false;

      // 4. Search text (name, phone, email, relation, connection)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const emailMatch = (p.email || "").toLowerCase().includes(q);
        const phoneMatch = (p.phone || "").toLowerCase().includes(q);
        const relMatch = (p.relation || "").toLowerCase().includes(q);
        const connMatch = (p.connections || []).some((c) =>
          c.toLowerCase().includes(q)
        );
        if (!nameMatch && !emailMatch && !phoneMatch && !relMatch && !connMatch)
          return false;
      }

      return true;
    });
  }, [people, search, connectionFilter, accountFilter, additionalFilter]);

  // Overall unique count (Each person is counted only once)
  const totalCount = people.filter((p) => p.status !== "archived").length;

  return (
    <div className="w-full max-w-lg mx-auto space-y-3.5 pb-24 pt-1 sm:pt-2">
      {/* ── Screen 1: Top Header ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1B4B] tracking-tight leading-tight">
            People
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
            People, relationships and connected records.
          </p>
        </div>

        {/* + Add Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone or email"
          className="w-full text-xs bg-white border border-slate-200/90 rounded-2xl pl-9 pr-8 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] font-medium shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Dropdown Filters Row ── */}
      <div className="grid grid-cols-2 gap-2">
        {/* Connection Filter Dropdown */}
        <div className="relative">
          <select
            value={connectionFilter}
            onChange={(e) => setConnectionFilter(e.target.value)}
            className="w-full text-xs appearance-none bg-white border border-slate-200/90 rounded-xl px-3 py-2 pr-7 text-[#1E1B4B] font-bold focus:outline-none focus:border-[#4F46E5] shadow-2xs truncate"
          >
            {connectionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Account Filter Dropdown */}
        <div className="relative">
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="w-full text-xs appearance-none bg-white border border-slate-200/90 rounded-xl px-3 py-2 pr-7 text-[#1E1B4B] font-bold focus:outline-none focus:border-[#4F46E5] shadow-2xs truncate"
          >
            {accountOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Additional Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        <button
          type="button"
          onClick={() => setAdditionalFilter("all")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors shrink-0 ${
            additionalFilter === "all"
              ? "bg-[#EEF2FF] text-[#4F46E5] border border-indigo-200"
              : "bg-white border border-slate-200/70 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All ({totalCount})
        </button>
        <button
          type="button"
          onClick={() =>
            setAdditionalFilter(
              additionalFilter === "important" ? "all" : "important"
            )
          }
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
            additionalFilter === "important"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-white border border-slate-200/70 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Star className="w-3 h-3" />
          Important
        </button>
        <button
          type="button"
          onClick={() =>
            setAdditionalFilter(
              additionalFilter === "emergency" ? "all" : "emergency"
            )
          }
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
            additionalFilter === "emergency"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-white border border-slate-200/70 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <AlertCircle className="w-3 h-3" />
          Emergency
        </button>
        <button
          type="button"
          onClick={() =>
            setAdditionalFilter(
              additionalFilter === "archived" ? "all" : "archived"
            )
          }
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
            additionalFilter === "archived"
              ? "bg-slate-100 text-slate-700 border border-slate-300"
              : "bg-white border border-slate-200/70 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Archive className="w-3 h-3" />
          Archived
        </button>
      </div>

      {/* ── Compact Person List (Screen 1) ── */}
      {filteredPeople.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100/90 p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#4F46E5]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E1B4B]">No people found</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-0.5">
              {search
                ? `No people matching "${search}".`
                : "No individuals match your selected filters."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setConnectionFilter("All");
              setAccountFilter("All");
              setAdditionalFilter("all");
            }}
            className="text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPeople.map((person) => {
            const isConnected = Boolean(
              person.clerkUserId || person.registrationStatus === "active_user"
            );
            const isInvitePending =
              person.registrationStatus === "invitation_sent";

            // Determine visible tags: relationship and primary connection
            const tags: string[] = [];
            if (person.relation && person.relation.toLowerCase() !== "other") {
              tags.push(person.relation);
            }
            const rawConns =
              Array.isArray(person.connections) && person.connections.length > 0
                ? person.connections
                : person.category
                ? [person.category === "Family Member" ? "Family" : person.category]
                : [];

            for (const c of rawConns) {
              if (!tags.includes(c) && tags.length < 2) {
                tags.push(c);
              }
            }

            const overflowCount = Math.max(
              0,
              rawConns.length + (person.relation ? 1 : 0) - tags.length
            );

            // Determine concise indicator (only relevant data, NO 0 counters!)
            const concise = (person as any).conciseIndicator || "";

            const avatarStyle = getAvatarStyle(person.name);
            const initials = getInitials(person.name);

            return (
              <div
                key={person._id}
                onClick={() => router.push(`/people/${person._id}`)}
                className="bg-white rounded-2xl border border-slate-100/90 p-3 sm:p-3.5 shadow-[0_2px_12px_rgba(30,27,75,0.02)] hover:border-indigo-100 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Avatar circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${avatarStyle.bg} ${avatarStyle.text} ${avatarStyle.border} overflow-hidden shadow-2xs`}
                  >
                    {person.profilePhoto || person.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.profilePhoto || person.avatarUrl}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Name and Tags */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-[#1E1B4B] truncate group-hover:text-[#4F46E5] transition-colors leading-tight">
                        {person.name}
                      </h3>
                      {person.isImportant && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>

                    {/* Tags row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}

                      {overflowCount > 0 && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded-md">
                          +{overflowCount}
                        </span>
                      )}

                      {/* Account connection badge */}
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Connected
                        </span>
                      ) : isInvitePending ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Invite pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                          Contact only
                        </span>
                      )}
                    </div>

                    {/* Concise Indicator (only when relevant data exists, NO 0 counters!) */}
                    {concise ? (
                      <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                        {concise}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Right: Chevron */}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5] transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Screen 5: Add Person Modal ── */}
      {showAddModal && (
        <AddEditPersonModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newPerson) => {
            setPeople((prev) => [newPerson, ...prev]);
          }}
        />
      )}
    </div>
  );
}
