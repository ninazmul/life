/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  ShieldCheck,
  Search,
  KeyRound,
  DollarSign,
  Briefcase,
  FolderLock,
  User,
  ShieldAlert,
  ChevronLeft,
  Activity,
  Globe,
  Monitor,
} from "lucide-react";
import { ILifeActivityLog } from "@/types";

interface ActivityClientProps {
  initialLogs: ILifeActivityLog[];
}

const typeIconConfig: Record<string, { icon: React.ReactNode; bg: string }> = {
  vault: {
    icon: <KeyRound className="w-4 h-4 text-[#D97706]" />,
    bg: "bg-[#FEF3C7]",
  },
  money: {
    icon: <DollarSign className="w-4 h-4 text-[#16A34A]" />,
    bg: "bg-[#DCFCE7]",
  },
  business: {
    icon: <Briefcase className="w-4 h-4 text-[#0284C7]" />,
    bg: "bg-[#E0F2FE]",
  },
  document: {
    icon: <FolderLock className="w-4 h-4 text-[#4338CA]" />,
    bg: "bg-[#E0E7FF]",
  },
  emergency: {
    icon: <ShieldAlert className="w-4 h-4 text-[#DC2626]" />,
    bg: "bg-[#FEE2E2]",
  },
  people: {
    icon: <User className="w-4 h-4 text-[#4F46E5]" />,
    bg: "bg-[#EEF2FF]",
  },
};

const typeFilterLabels: Record<string, string> = {
  all: "All Events",
  vault: "Vault",
  money: "Money",
  business: "Business",
  document: "Documents",
  emergency: "Emergency",
  people: "People",
};

export function ActivityClient({ initialLogs }: ActivityClientProps) {
  const router = useRouter();
  const [logs] = useState<ILifeActivityLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.resourceName && log.resourceName.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === "all" || log.resourceType === typeFilter;

    return matchesSearch && matchesType;
  });

  const getTypeConfig = (type: string) =>
    typeIconConfig[type] || { icon: <ShieldCheck className="w-4 h-4 text-slate-400" />, bg: "bg-slate-50" };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl bg-white border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#1E1B4B] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] tracking-tight">
                Activity & Audit Log
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/60">
                {logs.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tamper-evident audit trail for vault, financial & emergency events
            </p>
          </div>
        </div>
      </div>

      {/* Search & Type Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action or detail..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200/80 bg-white text-xs text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {Object.entries(typeFilterLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === type
                  ? "bg-[#4F46E5] text-white font-bold shadow-xs"
                  : "bg-white border border-slate-100 text-slate-600 hover:border-indigo-200 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      {filteredLogs.length === 0 ? (
        <div className="p-10 text-center rounded-2xl md:rounded-3xl border border-dashed border-slate-200 bg-white">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-3">
            <History className="w-7 h-7 text-[#4F46E5]" />
          </div>
          <h3 className="text-sm font-bold text-[#1E1B4B] mb-1">No Activity Logged</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Sensitive actions like revealing vault secrets or recording settlements will be automatically audited here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const config = getTypeConfig(log.resourceType);
            return (
              <div
                key={log._id}
                className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_1px_6px_rgba(30,27,75,0.02)] hover:border-indigo-200/70 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      {config.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#1E1B4B] capitalize">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100/60">
                          {log.resourceType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium mt-1 leading-relaxed">
                        {log.details}
                      </p>

                      {/* Meta row: actor, time, device */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.actorEmail}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <History className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        {(log as any).ipAddress && (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {(log as any).ipAddress}
                          </span>
                        )}
                        {(log as any).deviceInfo && (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {(log as any).deviceInfo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
