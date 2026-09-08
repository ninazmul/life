import { notFound } from "next/navigation";
import { getPersonById } from "@/lib/actions/lifePeople.actions";
import { PersonDetailClient } from "@/components/life/people/PersonDetailClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModuleAccess("/people");
  const { id } = await params;
  const personData = await getPersonById(id);
  if (!personData) notFound();

  return <PersonDetailClient personData={personData} />;
}
