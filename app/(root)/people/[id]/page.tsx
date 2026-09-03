import { notFound } from "next/navigation";
import { getPersonById } from "@/lib/actions/lifePeople.actions";
import { PersonDetailClient } from "@/components/life/people/PersonDetailClient";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const personData = await getPersonById(id);
  if (!personData) notFound();

  return <PersonDetailClient personData={personData} />;
}
