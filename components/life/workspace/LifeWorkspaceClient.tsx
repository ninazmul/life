"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  WORKSPACE_SECTIONS,
  getSectionById,
  getCategoryById,
  WorkspaceSectionConfig,
  WorkspaceCategoryConfig,
} from "@/lib/life/workspaceCategories";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { UnderDevelopmentCategory } from "./UnderDevelopmentCategory";
import { FinanceWorkspace } from "./finance/FinanceWorkspace";
import { ILifePerson } from "@/types";

interface LifeWorkspaceClientProps {
  initialSectionId?: string;
  initialCategoryId?: string;
  initialFilter?: string;
  initialSubFilter?: string;
  peopleList: ILifePerson[];
  currencySymbol?: string;
}

export function LifeWorkspaceClient({
  initialSectionId = "core_vault",
  initialCategoryId = "finance_loans",
  initialFilter = "all",
  initialSubFilter,
  peopleList,
  currencySymbol = "৳",
}: LifeWorkspaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve section & category from URL query if present, otherwise initial props
  const querySection = searchParams.get("section") || initialSectionId;
  const queryCategory = searchParams.get("category") || initialCategoryId;
  const queryFilter = searchParams.get("filter") || initialFilter;

  const [activeSection, setActiveSection] = useState<WorkspaceSectionConfig>(() => {
    return getSectionById(querySection) || WORKSPACE_SECTIONS[1]; // default Core Vault
  });

  const [activeCategory, setActiveCategory] = useState<WorkspaceCategoryConfig>(() => {
    return (
      getCategoryById(querySection, queryCategory) ||
      activeSection.categories.find((c) => c.id === "finance_loans") ||
      activeSection.categories[0]
    );
  });

  // Keep state in sync with URL queries
  useEffect(() => {
    const sId = searchParams.get("section");
    const cId = searchParams.get("category");
    if (sId) {
      const sec = getSectionById(sId);
      if (sec && sec.id !== activeSection.id) {
        setActiveSection(sec);
      }
    }
    if (sId && cId) {
      const cat = getCategoryById(sId, cId);
      if (cat && cat.id !== activeCategory.id) {
        setActiveCategory(cat);
      }
    }
  }, [searchParams, activeSection.id, activeCategory.id]);

  const handleSelectSection = (newSectionId: string) => {
    const section = getSectionById(newSectionId);
    if (!section) return;
    setActiveSection(section);

    // Pick first category in section or maintain finance_loans if in core_vault
    let nextCategory = section.categories[0];
    if (section.id === "core_vault") {
      const foundFinance = section.categories.find((c) => c.id === "finance_loans");
      if (foundFinance) nextCategory = foundFinance;
    }
    setActiveCategory(nextCategory);

    // Update URL query params without full page refresh
    const params = new URLSearchParams(window.location.search);
    params.set("section", section.id);
    params.set("category", nextCategory.id);
    router.replace(`/workspace?${params.toString()}`, { scroll: false });
  };

  const handleSelectCategory = (newCategoryId: string) => {
    const category = activeSection.categories.find((c) => c.id === newCategoryId);
    if (!category) return;
    setActiveCategory(category);

    const params = new URLSearchParams(window.location.search);
    params.set("section", activeSection.id);
    params.set("category", category.id);
    router.replace(`/workspace?${params.toString()}`, { scroll: false });
  };

  const handleSwitchToFinance = () => {
    handleSelectSection("core_vault");
    handleSelectCategory("finance_loans");
  };

  return (
    <div className="lv-workspace w-full min-h-[calc(100vh-4rem)] max-w-5xl mx-auto space-y-3.5 pb-24 sm:pb-12 text-slate-800 dark:text-slate-100 transition-colors">
      {/* 1. Reusable Workspace Header with Section and Category Selectors */}
      <WorkspaceHeader
        currentSection={activeSection}
        currentCategory={activeCategory}
        onSelectSection={handleSelectSection}
        onSelectCategory={handleSelectCategory}
      />

      {/* 2. Dynamic Content: Category Engine vs Honest Under Development State */}
      {activeCategory.id === "finance_loans" ? (
        <FinanceWorkspace
          initialFilter={queryFilter}
          initialSubFilter={initialSubFilter}
          peopleList={peopleList}
          currencySymbol={currencySymbol}
        />
      ) : (
        <UnderDevelopmentCategory
          category={activeCategory}
          onSwitchToFinance={handleSwitchToFinance}
        />
      )}
    </div>
  );
}
