"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  WorkspaceCategoryConfig,
  WorkspaceSubcategoryConfig,
} from "@/lib/life/workspaceCategories";

interface WorkspaceCategoryViewProps {
  category: WorkspaceCategoryConfig;
  onBack: () => void;
  onSelectSubcategory: (subcategory: WorkspaceSubcategoryConfig) => void;
}

export function WorkspaceCategoryView({
  category,
  onBack,
  onSelectSubcategory,
}: WorkspaceCategoryViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "records" | "reports">("records");
  const CategoryIcon = category.icon;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Categories"
            className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#1E1B4B] tracking-tight leading-snug truncate">
              {category.title}
            </h1>
            <p className="text-[12px] text-slate-500 font-normal truncate mt-0.5">
              {category.description}
            </p>
          </div>
        </div>

        {/* Category Icon Badge */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${category.color}`}
        >
          <CategoryIcon className="w-5 h-5" />
        </div>
      </div>

      {/* 3 Tabs: Overview | Records | Reports */}
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "overview"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("records")}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "records"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Records
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "reports"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Reports
        </button>
      </div>

      {/* Subcategories List */}
      <div className="space-y-2.5">
        {category.subcategories.map((subcat) => {
          const SubIcon = subcat.icon;
          return (
            <button
              key={subcat.id}
              onClick={() => onSelectSubcategory(subcat)}
              type="button"
              className="w-full bg-white rounded-2xl p-3.5 border border-slate-100/90 shadow-[0_2px_10px_rgba(30,27,75,0.03)] hover:shadow-sm hover:border-indigo-100 transition-all flex items-center gap-3 text-left group"
            >
              {/* Subcategory Icon in colored box */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${subcat.color}`}
              >
                <SubIcon className="w-5 h-5" />
              </div>

              {/* Title & Short Description */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold text-[#1E1B4B] leading-tight group-hover:text-indigo-600 transition-colors truncate">
                    {subcat.title}
                  </h3>
                  {subcat.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">
                      {subcat.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-normal">
                  {subcat.description}
                </p>
              </div>

              {/* Right Arrow */}
              <div className="shrink-0 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
                <ChevronRight className="w-4 h-4 stroke-[2.2]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
