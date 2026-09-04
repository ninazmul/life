/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm ring-1 ring-emerald-500/10 dark:bg-slate-950/70 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
              <Sparkles
                className="w-3.5 h-3.5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Personal Legacy & Continuity Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Life Command Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mt-1 leading-relaxed">
              Your private wealth, business continuity, emergency instructions,
              and legacy messages organized securely in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              asChild
              size="sm"
              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-md shadow-emerald-950/40"
            >
              <Link href="/money" aria-label="Add new money record">
                <Plus
                  className="w-3.5 h-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Add Money Record
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl border-border bg-background hover:bg-accent text-foreground text-xs font-medium gap-1.5 shadow-sm"
            >
              <Link href="/people" aria-label="Add a new person">
                <Users
                  className="w-3.5 h-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Add Person
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {stats.urgentItems.length > 0 && (
        <section className="space-y-2.5" aria-label="Items requiring attention">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle
                className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Requires Attention</span>
            </h2>
            <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
              {stats.urgentItems.length} Urgent
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.urgentItems.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className={`p-3.5 rounded-2xl border transition-all hover:scale-[1.01] flex items-center justify-between group min-w-0 ${
                  item.severity === "high"
                    ? "bg-red-500/10 border-red-500/25 hover:border-red-500/50"
                    : "bg-amber-500/10 border-amber-500/25 hover:border-amber-500/50"
                }`}
                aria-label={`Urgent: ${item.title} (${item.severity} priority)`}
              >
                <div className="min-w-0 pr-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 inline-block ${
                      item.severity === "high"
                        ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                    }`}
                  >
                    {item.category}
                  </span>
                  <h3 className="text-xs font-semibold text-foreground mt-1 truncate group-hover:text-foreground">
                    {item.title}
                  </h3>
                  {item.dueText && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock
                        className="w-3 h-3 text-muted-foreground shrink-0"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      {item.dueText}
                    </p>
                  )}
                </div>
                <ArrowRight
                  className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3" aria-label="Money and wealth overview">
        <div className="flex items-center justify-between px-1 gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
            <Wallet
              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="truncate">Money & Wealth Overview</span>
          </h2>
          <Link
            href="/money"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200 flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            Detailed Financials{" "}
            <ArrowRight
              className="w-3 h-3 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[104px]">
            <span className="text-[11px] font-medium text-muted-foreground">
              Money Given
            </span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono">
                ৳{stats.moneyGivenTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
              Remaining: ৳{stats.moneyGivenRemaining.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[104px]">
            <span className="text-[11px] font-medium text-muted-foreground">
              Money Taken
            </span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                ৳{stats.moneyTakenTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              Owed: ৳{stats.moneyTakenRemaining.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[104px]">
            <span className="text-[11px] font-medium text-muted-foreground">
              Invested Made
            </span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-cyan-700 dark:text-cyan-300 font-mono">
                ৳{stats.investedTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              Active ventures
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between min-h-[104px]">
            <span className="text-[11px] font-medium text-muted-foreground">
              Invest Received
            </span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                ৳{stats.investmentReceivedTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              External equity
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 shadow-sm flex flex-col justify-between min-h-[104px]">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <ArrowDownLeft
                className="w-3 h-3 text-emerald-600 dark:text-emerald-300 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              To Receive
            </span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-emerald-800 dark:text-emerald-200 font-mono break-all">
                ৳{stats.receivablesTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-medium truncate">
              Due to me
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 shadow-sm flex flex-col justify-between min-h-[104px]">
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1">
              <ArrowUpRight
                className="w-3 h-3 text-rose-600 dark:text-rose-300 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              To Pay
            </span>
            <div className="my-1">
              <span className="text-lg sm:text-xl font-extrabold text-rose-800 dark:text-rose-200 font-mono break-all">
                ৳{stats.payablesTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-rose-700/80 dark:text-rose-300/80 font-medium truncate">
              I need to return
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-3" aria-label="Life core directory modules">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Life Core Directory
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link
            href="/people"
            className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-emerald-500/50 hover:bg-accent transition-all group min-h-[120px] flex flex-col"
            aria-label={`People & Roles — ${stats.peopleCount} entries`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                <Users
                  className="w-5 h-5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <span className="text-xs font-bold text-emerald-500 font-mono shrink-0">
                {stats.peopleCount}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              People & Roles
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Wife, Brother, Sabbir, Sana & trusted contacts
            </p>
          </Link>

          <Link
            href="/vault"
            className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-amber-500/50 hover:bg-accent transition-all group min-h-[120px] flex flex-col"
            aria-label="Secure Vault — AES-256 encrypted secrets"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                <KeyRound
                  className="w-5 h-5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                AES-256
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
              Secure Vault
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Web credentials, server keys & master PINs
            </p>
          </Link>

          <Link
            href="/business"
            className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-cyan-500/50 hover:bg-accent transition-all group min-h-[120px] flex flex-col"
            aria-label={`Business Continuity — ${stats.businessCount} plans`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 shrink-0">
                <Briefcase
                  className="w-5 h-5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 font-mono shrink-0">
                {stats.businessCount}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
              Business Continuity
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              &quot;If I Am Not Available&quot; checklist
            </p>
          </Link>

          <Link
            href="/assets"
            className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:border-indigo-500/50 hover:bg-accent transition-all group min-h-[120px] flex flex-col"
            aria-label={`Assets & Holdings — total value ৳${stats.assetsTotalValue.toLocaleString()}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                <Layers
                  className="w-5 h-5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono shrink-0 truncate max-w-[60%]">
                ৳{stats.assetsTotalValue.toLocaleString()}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              Assets & Holdings
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Bank balances, properties & valuable equipment
            </p>
          </Link>
        </div>
      </section>

      {stats.recentActivities.length > 0 && (
        <section
          className="space-y-3"
          aria-label="Recent activity and audit log"
        >
          <div className="flex items-center justify-between px-1 gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
              <Clock
                className="w-3.5 h-3.5 text-muted-foreground shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="truncate">Recent Activity & Audit</span>
            </h2>
            <Link
              href="/activity"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Full Log{" "}
              <ArrowRight
                className="w-3 h-3 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            {stats.recentActivities.map((act) => (
              <div
                key={act._id}
                className="p-3 sm:p-4 flex items-center justify-between text-xs gap-2"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-emerald-700 dark:text-emerald-300 shrink-0">
                    <ShieldCheck
                      className="w-4 h-4 shrink-0"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium truncate">
                      {act.details}
                    </p>
                    <span className="text-[11px] text-muted-foreground truncate block">
                      By {act.actorEmail} •{" "}
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 px-2 py-0.5 rounded bg-secondary border border-border">
                  {act.action.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
