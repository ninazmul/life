"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { WorkspaceCategoryConfig } from "@/lib/life/workspaceCategories";

interface UnderDevelopmentCategoryProps {
  category: WorkspaceCategoryConfig;
  onSwitchToFinance: () => void;
}

export function UnderDevelopmentCategory({
  category,
  onSwitchToFinance,
}: UnderDevelopmentCategoryProps) {
  const Icon = category.icon;

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] text-center max-w-lg mx-auto my-6 space-y-5">
      {/* Icon Badge */}
      <div className="mx-auto w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shadow-xs">
        <Icon className="w-8 h-8" strokeWidth={2} />
      </div>

      {/* Header Info */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50">
          <Clock className="w-3.5 h-3.5" />
          <span>Under Development</span>
        </div>
        <h2 className="text-[18px] sm:text-[20px] font-extrabold text-[#1E1B4B] dark:text-white">
          {category.title}
        </h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {category.description}
        </p>
      </div>

      {/* Honest Status Note */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 text-left text-[12px] text-slate-600 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#1E1B4B] dark:text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Implementation Notice</span>
        </div>
        <p className="leading-relaxed">
          To maintain zero data corruption and optimal simplicity, the Unified Life Workspace is rolling out categories progressively. <strong>Finance & Loans</strong> is the first fully functional category in this phase.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={onSwitchToFinance}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-[12px] sm:text-[13px] font-bold shadow-xs hover:shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Open Finance & Loans</span>
        </button>

        {category.fallbackRoute && (
          <Link
            href={category.fallbackRoute}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[12px] sm:text-[13px] font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Open Existing Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
