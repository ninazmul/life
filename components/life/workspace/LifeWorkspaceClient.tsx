"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  WORKSPACE_CATEGORIES,
  WorkspaceCategoryConfig,
  WorkspaceSubcategoryConfig,
} from "@/lib/life/workspaceCategories";
import {
  WorkspaceRecordItem,
  WorkspaceModuleResponse,
  getWorkspaceModuleRecords,
  getWorkspaceRecordDetail,
  saveWorkspaceRecord,
} from "@/lib/actions/lifeWorkspace.actions";
import { WorkspaceMainView } from "./screens/WorkspaceMainView";
import { WorkspaceCategoryView } from "./screens/WorkspaceCategoryView";
import { WorkspaceRecordListView } from "./screens/WorkspaceRecordListView";
import { WorkspaceRecordDetailView } from "./screens/WorkspaceRecordDetailView";
import { WorkspaceRecordFormView } from "./screens/WorkspaceRecordFormView";
import { FamilyCommunityPage } from "./family-community/FamilyCommunityPage";
import { WorkBusinessPage } from "./work-business/WorkBusinessPage";
import { FinanceAssetsPage } from "./finance-assets/FinanceAssetsPage";
import { SecureVaultPage } from "./secure-vault/SecureVaultPage";
import { LifeContinuityPage } from "./life-continuity/LifeContinuityPage";

interface LifeWorkspaceClientProps {
  initialCategoryId?: string;
  initialModuleId?: string;
  initialRecordId?: string;
  initialAction?: string;
  initialFilter?: string;
  initialModuleData?: WorkspaceModuleResponse | null;
  initialRecordDetail?: WorkspaceRecordItem | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  currencySymbol?: string;
}

export function LifeWorkspaceClient({
  initialCategoryId,
  initialModuleId,
  initialRecordId,
  initialAction,
  initialFilter = "all",
  initialModuleData,
  initialRecordDetail,
  isOwner = false,
  isAdmin = false,
  currencySymbol = "৳",
}: LifeWorkspaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Read params from searchParams or initial props
  const queryCategory = searchParams.get("category") || initialCategoryId || "";
  const queryModule = searchParams.get("module") || initialModuleId || "";
  const queryId = searchParams.get("id") || initialRecordId || "";
  const queryAction = searchParams.get("action") || initialAction || "";
  const queryFilter = searchParams.get("filter") || initialFilter || "all";

  // Category & Subcategory resolution
  const activeCategory =
    WORKSPACE_CATEGORIES.find((c) => c.id === queryCategory) || null;

  const activeSubcategory =
    activeCategory?.subcategories.find((s) => s.id === queryModule) || null;

  // Screen Data State
  const [moduleData, setModuleData] = useState<WorkspaceModuleResponse>(
    initialModuleData || {
      records: [],
      filterTabs: [{ id: "all", label: "All" }],
      currencySymbol: "৳",
    }
  );

  const [activeRecord, setActiveRecord] = useState<WorkspaceRecordItem | null>(
    initialRecordDetail || null
  );

  const [isLoading, setIsLoading] = useState(false);

  // Sync module records when category, module, or filter changes
  useEffect(() => {
    if (activeCategory && activeSubcategory) {
      let isMounted = true;
      setIsLoading(true);

      getWorkspaceModuleRecords({
        categoryId: activeCategory.id,
        subcategoryId: activeSubcategory.id,
        filter: queryFilter,
      })
        .then((res) => {
          if (isMounted) {
            setModuleData(res);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error("Error loading module records:", err);
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [activeCategory?.id, activeSubcategory?.id, queryFilter]);

  // Sync record detail when id changes
  useEffect(() => {
    if (activeCategory && activeSubcategory && queryId) {
      let isMounted = true;
      getWorkspaceRecordDetail({
        categoryId: activeCategory.id,
        subcategoryId: activeSubcategory.id,
        recordId: queryId,
      })
        .then((rec) => {
          if (isMounted && rec) {
            setActiveRecord(rec);
          }
        })
        .catch((err) => console.error("Error loading record detail:", err));

      return () => {
        isMounted = false;
      };
    } else if (!queryId) {
      setActiveRecord(null);
    }
  }, [activeCategory?.id, activeSubcategory?.id, queryId]);

  // Navigation handlers
  const handleSelectCategory = (cat: WorkspaceCategoryConfig) => {
    router.push(`/workspace?category=${cat.id}`);
  };

  const handleSelectSubcategory = (subcat: WorkspaceSubcategoryConfig) => {
    if (!activeCategory) return;
    router.push(`/workspace?category=${activeCategory.id}&module=${subcat.id}`);
  };

  const handleSelectRecord = (rec: WorkspaceRecordItem) => {
    if (!activeCategory || !activeSubcategory) return;
    setActiveRecord(rec);
    router.push(
      `/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}&id=${rec.id}`
    );
  };

  const handleAddRecord = () => {
    if (!activeCategory || !activeSubcategory) return;
    router.push(
      `/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}&action=add`
    );
  };

  const handleEditRecord = () => {
    if (!activeCategory || !activeSubcategory || !activeRecord) return;
    router.push(
      `/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}&id=${activeRecord.id}&action=edit`
    );
  };

  const handleFilterChange = (filterId: string) => {
    if (!activeCategory || !activeSubcategory) return;
    router.push(
      `/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}&filter=${filterId}`
    );
  };

  // Back Navigation Handlers
  const handleBackFromCategory = () => {
    router.push("/workspace");
  };

  const handleBackFromModuleList = () => {
    if (activeCategory) {
      router.push(`/workspace?category=${activeCategory.id}`);
    } else {
      router.push("/workspace");
    }
  };

  const handleBackFromDetail = () => {
    if (activeCategory && activeSubcategory) {
      router.push(`/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}`);
    } else {
      router.push("/workspace");
    }
  };

  const handleBackFromForm = () => {
    if (queryAction === "edit" && activeRecord && activeCategory && activeSubcategory) {
      router.push(
        `/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}&id=${activeRecord.id}`
      );
    } else if (activeCategory && activeSubcategory) {
      router.push(
        `/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}`
      );
    } else {
      router.push("/workspace");
    }
  };

  // Save handler for Screen 5
  const handleSaveRecord = async (data: Record<string, any>) => {
    if (!activeCategory || !activeSubcategory) return;

    try {
      await saveWorkspaceRecord({
        categoryId: activeCategory.id,
        subcategoryId: activeSubcategory.id,
        recordId: queryAction === "edit" ? activeRecord?.id : undefined,
        data,
      });

      toast.success(
        queryAction === "edit" ? "Record updated successfully" : "Record created successfully"
      );

      // Refresh records
      const fresh = await getWorkspaceModuleRecords({
        categoryId: activeCategory.id,
        subcategoryId: activeSubcategory.id,
        filter: queryFilter,
      });
      setModuleData(fresh);

      // Navigate back to list or updated detail
      if (queryAction === "edit" && activeRecord) {
        const updated = fresh.records.find((r) => r.id === activeRecord.id) || null;
        setActiveRecord(updated);
        router.push(
          `/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}&id=${activeRecord.id}`
        );
      } else {
        router.push(
          `/workspace?category=${activeCategory.id}&module=${activeSubcategory.id}`
        );
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save record");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Screen Router (1 to 5)
  // ─────────────────────────────────────────────────────────────

  // Special Case: Family & Community (Single Unified Management Page)
  if (activeCategory?.id === "people_family") {
    const validTypes = ["family_care", "kids", "community"];
    const initialType = validTypes.includes(queryModule)
      ? (queryModule as "family_care" | "kids" | "community")
      : "all";

    return (
      <FamilyCommunityPage
        onBack={handleBackFromCategory}
        initialRecordType={initialType}
      />
    );
  }

  // Special Case: Work & Business (Single Unified Management Page)
  if (activeCategory?.id === "work_business") {
    const validTypes = ["staff_office", "business", "projects"];
    const initialType = validTypes.includes(queryModule)
      ? (queryModule as "staff_office" | "business" | "projects")
      : "all";

    return (
      <WorkBusinessPage
        onBack={handleBackFromCategory}
        initialRecordType={initialType}
      />
    );
  }

  // Special Case: Finance & Assets (Single Unified Management Page)
  if (activeCategory?.id === "finance_assets") {
    return (
      <FinanceAssetsPage
        onBack={handleBackFromCategory}
        initialRecordType={queryModule || "all"}
      />
    );
  }

  // Special Case: Secure Vault (Single Unified Management Page)
  if (activeCategory?.id === "secure_vault") {
    return (
      <SecureVaultPage
        onBack={handleBackFromCategory}
        initialRecordType={queryModule || "all"}
      />
    );
  }

  // Special Case: Life Continuity (Single Unified Management Page)
  if (activeCategory?.id === "life_continuity") {
    return (
      <LifeContinuityPage
        onBack={handleBackFromCategory}
        initialRecordType={queryModule || "all"}
      />
    );
  }

  // Screen 5: Add / Edit Record Page
  if (
    activeCategory &&
    activeSubcategory &&
    (queryAction === "add" || queryAction === "edit")
  ) {
    return (
      <WorkspaceRecordFormView
        category={activeCategory}
        subcategory={activeSubcategory}
        initialRecord={queryAction === "edit" ? activeRecord : null}
        onBack={handleBackFromForm}
        onSave={handleSaveRecord}
      />
    );
  }

  // Screen 4: Record Detail Page
  if (activeCategory && activeSubcategory && (queryId || activeRecord)) {
    const recordToDisplay =
      activeRecord ||
      moduleData.records.find((r) => r.id === queryId) || {
        id: queryId,
        categoryId: activeCategory.id,
        subcategoryId: activeSubcategory.id,
        title: activeSubcategory.title,
        status: "active",
      };

    return (
      <WorkspaceRecordDetailView
        category={activeCategory}
        subcategory={activeSubcategory}
        record={recordToDisplay}
        onBack={handleBackFromDetail}
        onEdit={handleEditRecord}
      />
    );
  }

  // Screen 3: Record List Page
  if (activeCategory && activeSubcategory) {
    return (
      <WorkspaceRecordListView
        category={activeCategory}
        subcategory={activeSubcategory}
        data={moduleData}
        activeFilter={queryFilter}
        onFilterChange={handleFilterChange}
        onBack={handleBackFromModuleList}
        onSelectRecord={handleSelectRecord}
        onAddRecord={handleAddRecord}
      />
    );
  }

  // Screen 2: Category Page
  if (activeCategory) {
    return (
      <WorkspaceCategoryView
        category={activeCategory}
        onBack={handleBackFromCategory}
        onSelectSubcategory={handleSelectSubcategory}
      />
    );
  }

  // Screen 1: Workspace Main Page (All 6 Categories)
  return <WorkspaceMainView onSelectCategory={handleSelectCategory} />;
}
