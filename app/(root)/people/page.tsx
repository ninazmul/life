import { getPeople } from "@/lib/actions/lifePeople.actions";
import { PeopleClient } from "@/components/life/people/PeopleClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  await requireModuleAccess("/people");
  const people = await getPeople();
  return <PeopleClient initialPeople={people} />;
}
