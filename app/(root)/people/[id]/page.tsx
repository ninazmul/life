import { notFound } from "next/navigation";
import { getPersonById } from "@/lib/actions/lifePeople.actions";
import { PersonDetailClient } from "@/components/life/people/PersonDetailClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";
import { getLifeAuthContext } from "@/lib/life/auth";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModuleAccess("/people");
  const { id } = await params;
  const auth = await getLifeAuthContext();
  const personData = await getPersonById(id);
  if (!personData) notFound();

  return (
    <PersonDetailClient
      personData={personData}
      currentUser={{
        isOwner: auth?.isOwner ?? false,
        isAdmin: auth?.isAdmin ?? false,
        personId: auth?.personId,
      }}
    />
  );
}
