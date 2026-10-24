"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { WORKSPACE_CATEGORIES, WorkspaceCategoryConfig } from "@/lib/life/workspaceCategories";

interface WorkspaceMainViewProps {
  onSelectCategory: (category: WorkspaceCategoryConfig) => void;
}

export function WorkspaceMainView({ onSelectCategory }: WorkspaceMainViewProps) {
  return (
    <div className="w-full max-w-lg mx-auto space-y-5 pb-24 animate-in fade-in duration-200">
      {/* Title & Subtitle */}
      <div className="px-1 pt-1">
        <h1 className="text-2xl font-extrabold text-[#1E1B4B] tracking-tight">
          Workspace
        </h1>
        <p className="text-[13px] text-slate-500 font-normal mt-0.5">
          Manage your life, all in one place.
        </p>
      </div>

      {/* 6 Category Cards Stack */}
      <div className="space-y-3">
        {WORKSPACE_CATEGORIES.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              type="button"
              className="w-full bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:shadow-md hover:border-indigo-100/80 transition-all duration-200 flex items-center gap-3.5 text-left group"
            >
              {/* Category Icon Badge */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${category.color}`}
              >
                <IconComponent className="w-6 h-6" />
              </div>

              {/* Title & Short Description */}
              <div className="flex-1 min-w-0 pr-1">
                <h3 className="text-[15px] font-bold text-[#1E1B4B] leading-snug group-hover:text-indigo-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-[12px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed font-normal">
                  {category.description}
                </p>
              </div>

              {/* Right Arrow */}
              <div className="shrink-0 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
                <ChevronRight className="w-5 h-5 stroke-[2.2]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
