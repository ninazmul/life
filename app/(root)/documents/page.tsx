import { getDocuments } from "@/lib/actions/lifeDocument.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { DocumentsClient } from "@/components/life/documents/DocumentsClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await requireModuleAccess("/documents");

  const [documents, people, businesses] = await Promise.all([
    getDocuments(),
    getPeople({ status: "active" }),
    getBusinesses(),
  ]);

  return (
    <DocumentsClient
      initialDocuments={documents}
      people={people}
      businesses={businesses}
    />
  );
}
