"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, FolderKanban } from "lucide-react";
import {
  WORKSPACE_SECTIONS,
  WorkspaceSectionConfig,
  WorkspaceCategoryConfig,
} from "@/lib/life/workspaceCategories";

interface WorkspaceHeaderProps {
  currentSection: WorkspaceSectionConfig;
  currentCategory: WorkspaceCategoryConfig;
  onSelectSection: (sectionId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  hasUnsavedChanges?: boolean;
}

export function WorkspaceHeader({
  currentSection,
  currentCategory,
  onSelectSection,
  onSelectCategory,
  hasUnsavedChanges = false,
}: WorkspaceHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to go back?"
      );
      if (!confirmLeave) return;
    }
    router.push("/");
  };

  const handleSectionChange = (newSectionId: string) => {
    if (newSectionId === currentSection.id) return;
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to switch sections?"
      );
      if (!confirmLeave) return;
    }
    onSelectSection(newSectionId);
  };

  const handleCategoryChange = (newCategoryId: string) => {
    if (newCategoryId === currentCategory.id) return;
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to switch categories?"
      );
      if (!confirmLeave) return;
    }
    onSelectCategory(newCategoryId);
  };

  const CategoryIcon = currentCategory.icon;

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
      {/* Top Bar: Back Button & Workspace Title */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back to Dashboard"
            className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0 shadow-2xs">
              <FolderKanban className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-[15px] sm:text-[16px] font-bold text-[#1E1B4B] dark:text-white leading-tight">
                Life Workspace
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Unified Management
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Category Pill */}
        <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <CategoryIcon className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span>{currentCategory.title}</span>
        </div>
      </div>

      {/* Dual Selectors: Section & Category (Mobile-First Compact Row) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        {/* Section Selector */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            Section
          </label>
          <div className="relative">
            <select
              value={currentSection.id}
              onChange={(e) => handleSectionChange(e.target.value)}
              aria-label="Select section"
              className="w-full appearance-none rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 py-2 pl-3 pr-8 text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all shadow-2xs"
            >
              {WORKSPACE_SECTIONS.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Category Selector */}
        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            Category
          </label>
          <div className="relative">
            <select
              value={currentCategory.id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Select category"
              className="w-full appearance-none rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 py-2 pl-3 pr-8 text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all shadow-2xs"
            >
              {currentSection.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title} {!cat.isImplemented ? "(Roadmap)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
