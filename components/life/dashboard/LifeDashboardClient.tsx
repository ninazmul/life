/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  KeyRound,
  FileText,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LifeDashboardStats } from "@/types";

interface LifeDashboardClientProps {
  stats: LifeDashboardStats;
}

export function LifeDashboardClient({ stats }: LifeDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner / Overview Header */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-[#0a1120] to-[#07131e] border border-emerald-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Legacy & Continuity Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Life Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
              Your private wealth, business continuity, emergency instructions, and legacy messages organized securely in one place.
            </p>
          </div>

          {/* Quick Action Buttons on Desktop */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              asChild
              size="sm"
              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-md shadow-emerald-950/40"
            >
              <Link href="/money">
                <Plus className="w-3.5 h-3.5" />
                Add Money Record
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium gap-1.5"
            >
              <Link href="/people">
                <Users className="w-3.5 h-3.5" />
                Add Person
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Urgent Attention / Action Items */}
      {stats.urgentItems.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Requires Attention</span>
            </h2>
            <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {stats.urgentItems.length} Urgent
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.urgentItems.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className={`p-3.5 rounded-2xl border transition-all hover:scale-[1.01] flex items-center justify-between group ${
                  item.severity === "high"
                    ? "bg-red-950/20 border-red-800/40 hover:border-red-600/60"
                    : "bg-amber-950/20 border-amber-800/40 hover:border-amber-600/60"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      item.severity === "high"
                        ? "bg-red-900/40 text-red-400 border-red-700/50"
                        : "bg-amber-900/40 text-amber-400 border-amber-700/50"
                    }`}
                  >
                    {item.category}
                  </span>
                  <h3 className="text-xs font-semibold text-slate-200 mt-1 truncate group-hover:text-white">
                    {item.title}
                  </h3>
                  {item.dueText && (
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.dueText}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Money Snapshot Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Money & Wealth Overview</span>
          </h2>
          <Link
            href="/money"
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
          >
            Detailed Financials <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Money Given */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Money Given</span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                ৳{stats.moneyGivenTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-emerald-500 font-medium">
              Remaining: ৳{stats.moneyGivenRemaining.toLocaleString()}
            </span>
          </div>

          {/* Money Taken */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Money Taken</span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-amber-500 font-mono">
                ৳{stats.moneyTakenTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Owed: ৳{stats.moneyTakenRemaining.toLocaleString()}
            </span>
          </div>

          {/* Invested Made */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Invested Made</span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-cyan-500 font-mono">
                ৳{stats.investedTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Active ventures</span>
          </div>

          {/* Invest Received */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Invest Received</span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-indigo-400 font-mono">
                ৳{stats.investmentReceivedTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">External equity</span>
          </div>

          {/* To Receive (Receivables) */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
              To Receive
            </span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                ৳{stats.receivablesTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-emerald-500/80 font-medium">Due to me</span>
          </div>

          {/* To Pay (Payables) */}
          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-rose-400" />
              To Pay
            </span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-rose-400 font-mono">
                ৳{stats.payablesTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-rose-400/80 font-medium">I need to return</span>
          </div>
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Life Core Directory
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* People Card */}
          <Link
            href="/people"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-500 font-mono">
                {stats.peopleCount}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-400 transition-colors">
              People & Roles
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Wife, Brother, Sabbir, Sana & trusted contacts
            </p>
          </Link>

          {/* Secure Vault Card */}
          <Link
            href="/vault"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                AES-256
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-400 transition-colors">
              Secure Vault
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Web credentials, server keys & master PINs
            </p>
          </Link>

          {/* Business & Continuity Card */}
          <Link
            href="/business"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {stats.businessCount}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-400 transition-colors">
              Business Continuity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              &quot;If I Am Not Available&quot; checklist
            </p>
          </Link>

          {/* Assets Portfolio Card */}
          <Link
            href="/assets"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-indigo-400 font-mono">
                ৳{stats.assetsTotalValue.toLocaleString()}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-400 transition-colors">
              Assets & Holdings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bank balances, properties & valuable equipment
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Activity Log */}
      {stats.recentActivities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Recent Activity & Audit</span>
            </h2>
            <Link
              href="/activity"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
            >
              Full Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
            {stats.recentActivities.map((act) => (
              <div key={act._id} className="p-3 sm:p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 font-medium truncate">{act.details}</p>
                    <span className="text-[11px] text-slate-500">
                      By {act.actorEmail} • {new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/40">
                  {act.action.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
