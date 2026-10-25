"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Search,
  Filter,
  Shield,
  KeyRound,
  FileText,
  User,
  Database,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { getActivityLogs } from "@/lib/actions/lifeActivity.actions";

export function ActivityHistorySection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getActivityLogs({
        resourceType: filterType === "all" ? undefined : filterType,
        search: search.trim() || undefined,
        limit: 50,
      });
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionIcon = (action: string, resourceType: string) => {
    if (action.includes("PIN") || action.includes("VAULT") || resourceType === "vault") {
      return <KeyRound className="w-3.5 h-3.5 text-indigo-600" />;
    }
    if (action.includes("SECURITY") || action.includes("GUARDIAN") || action.includes("RECOVERY")) {
      return <Shield className="w-3.5 h-3.5 text-sky-600" />;
    }
    if (action.includes("BACKUP")) {
      return <Database className="w-3.5 h-3.5 text-purple-600" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activity by actor, action or detail..."
          className="w-full rounded-2xl border border-slate-200/80 bg-white p-3 pl-9 text-xs text-[#1E1B4B] placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-[0_2px_12px_rgba(30,27,75,0.04)]"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "All Activity" },
          { id: "security", label: "Security & Sessions" },
          { id: "vault", label: "Vault Access" },
          { id: "guardian", label: "Guardians" },
          { id: "settings", label: "System & Backups" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterType === tab.id
                ? "bg-[#4F46E5] text-white shadow-xs"
                : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading activity trail...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100/90 text-center space-y-2 shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-[#1E1B4B]">No activity entries</h4>
          <p className="text-xs text-slate-400">No events matched the chosen filter or query.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log: any) => (
            <div
              key={log._id}
              className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {getActionIcon(log.action || "", log.resourceType || "")}
                  </div>
                  <h4 className="text-xs font-bold text-[#1E1B4B]">
                    {log.action?.replace(/_/g, " ")}
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  {new Date(log.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-[12px] text-slate-600 font-normal leading-relaxed pl-9">
                {log.details || log.resourceName}
              </p>

              <div className="pl-9 pt-1 flex items-center gap-3 text-[10px] text-slate-400">
                <span>By: {log.actorName || log.actorEmail || "System"}</span>
                {log.resourceType && (
                  <span className="capitalize px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                    {log.resourceType}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
