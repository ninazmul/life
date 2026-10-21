import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getLifeAuthContext } from "@/lib/life/auth";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getAssets } from "@/lib/actions/lifeAsset.actions";
import { getDocuments } from "@/lib/actions/lifeDocument.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { getResponsibilities } from "@/lib/actions/lifeResponsibility.actions";
import { getInstructions } from "@/lib/actions/lifeInstruction.actions";
import { getContacts } from "@/lib/actions/lifeContact.actions";
import { getLegacyMessages } from "@/lib/actions/lifeLegacy.actions";
import { getInformationList } from "@/lib/actions/lifeInformation.actions";
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
  const [
    authContext,
    sp,
    people,
    assets,
    documents,
    businesses,
    responsibilities,
    instructions,
    contacts,
    legacyMessages,
    informationList,
  ] = await Promise.all([
    getLifeAuthContext(),
    searchParams ? await searchParams : Promise.resolve({} as any),
    getPeople({ status: "active" }),
    getAssets(),
    getDocuments(),
    getBusinesses(),
    getResponsibilities(),
    getInstructions(),
    getContacts(),
    getLegacyMessages(),
    getInformationList(),
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
        assets={assets}
        documents={documents}
        businesses={businesses}
        responsibilities={responsibilities}
        instructions={instructions}
        contacts={contacts}
        legacyMessages={legacyMessages}
        informationList={informationList}
        isOwner={Boolean(authContext.isOwner)}
        isAdmin={Boolean(authContext.isAdmin)}
        currencySymbol="৳"
      />
    </Suspense>
  );
}
