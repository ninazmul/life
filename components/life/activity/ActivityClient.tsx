/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ILifeActivityLog } from "@/types";

interface ActivityClientProps {
  initialLogs: ILifeActivityLog[];
}

export function ActivityClient({ initialLogs }: ActivityClientProps) {
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

  const getIcon = (type: string) => {
    switch (type) {
      case "vault":
        return <KeyRound className="w-4 h-4 text-amber-700 dark:text-amber-300" />;
      case "money":
        return <DollarSign className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />;
      case "business":
        return <Briefcase className="w-4 h-4 text-cyan-700 dark:text-cyan-300" />;
      case "document":
        return <FolderLock className="w-4 h-4 text-indigo-700 dark:text-indigo-300" />;
      case "emergency":
        return <ShieldAlert className="w-4 h-4 text-red-700 dark:text-red-300" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Activity & Security Audit Log
          </h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {logs.length} Events
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Tamper-evident audit trail recording vault reveals, repayments, emergency switches, and record creations.
        </p>
      </div>

      {/* Search & Type Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action or detail..."
            className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {["all", "vault", "money", "business", "document", "emergency", "people"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap capitalize transition-all ${
                typeFilter === type
                  ? "bg-slate-800 text-white font-semibold border border-slate-600 shadow-xs"
                  : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {type === "all" ? "All Events" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      {filteredLogs.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
          <History className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Activity Logged</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Sensitive actions like revealing vault secrets or recording settlements will be automatically audited here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {filteredLogs.map((log) => (
            <div key={log._id} className="p-4 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 mt-0.5">
                  {getIcon(log.resourceType)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {log.action.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      • {log.actorEmail}
                    </span>
                  </div>
                  <p className="text-foreground font-medium mt-1 leading-relaxed">
                    {log.details}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">
                {log.resourceType}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
