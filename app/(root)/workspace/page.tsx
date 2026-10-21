import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLifeAuthContext } from "@/lib/life/auth";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { LifeWorkspaceClient } from "@/components/life/workspace/LifeWorkspaceClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Life Workspace | LIFE Command Center",
  description: "Unified life management workspace for records, finances, and continuity.",
};

interface WorkspacePageProps {
  searchParams?: Promise<{
    section?: string;
    category?: string;
    filter?: string;
    subFilter?: string;
  }>;
}

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const [authContext, sp, people] = await Promise.all([
    getLifeAuthContext(),
    searchParams ? await searchParams : Promise.resolve({} as any),
    getPeople({ status: "active" }),
  ]);

  if (!authContext) {
    redirect("/sign-in");
  }

  const section = sp?.section || "core_vault";
  const category = sp?.category || "finance_loans";
  const filter = sp?.filter || "all";
  const subFilter = sp?.subFilter;

  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[50vh] flex items-center justify-center text-slate-400 text-[13px]">
          Loading Life Workspace...
        </div>
      }
    >
      <LifeWorkspaceClient
        initialSectionId={section}
        initialCategoryId={category}
        initialFilter={filter}
        initialSubFilter={subFilter}
        peopleList={people}
        currencySymbol="৳"
      />
    </Suspense>
  );
}
