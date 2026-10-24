import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLifeAuthContext } from "@/lib/life/auth";
import {
  getWorkspaceModuleRecords,
  getWorkspaceRecordDetail,
} from "@/lib/actions/lifeWorkspace.actions";
import { LifeWorkspaceClient } from "@/components/life/workspace/LifeWorkspaceClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Life Workspace | LIFE Command Center",
  description: "Unified life management workspace for records, finances, and continuity.",
};

interface WorkspacePageProps {
  searchParams?: Promise<{
    category?: string;
    module?: string;
    id?: string;
    action?: string;
    filter?: string;
  }>;
}

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const authContext = await getLifeAuthContext();
  if (!authContext) {
    redirect("/sign-in");
  }

  const sp = searchParams ? await searchParams : ({} as any);
  const category = sp?.category;
  const moduleName = sp?.module;
  const recordId = sp?.id;
  const action = sp?.action;
  const filter = sp?.filter || "all";

  let initialModuleData = null;
  let initialRecordDetail = null;

  if (category && moduleName) {
    try {
      initialModuleData = await getWorkspaceModuleRecords({
        categoryId: category,
        subcategoryId: moduleName,
        filter,
      });

      if (recordId) {
        initialRecordDetail = await getWorkspaceRecordDetail({
          categoryId: category,
          subcategoryId: moduleName,
          recordId,
        });
      }
    } catch (err) {
      console.error("Error pre-fetching workspace data on server:", err);
    }
  }

  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[50vh] flex items-center justify-center text-slate-400 text-xs">
          Loading Life Workspace...
        </div>
      }
    >
      <LifeWorkspaceClient
        initialCategoryId={category}
        initialModuleId={moduleName}
        initialRecordId={recordId}
        initialAction={action}
        initialFilter={filter}
        initialModuleData={initialModuleData}
        initialRecordDetail={initialRecordDetail}
        isOwner={Boolean(authContext.isOwner)}
        isAdmin={Boolean(authContext.isAdmin)}
        currencySymbol="৳"
      />
    </Suspense>
  );
}
