import { getPeople } from "@/lib/actions/lifePeople.actions";
import { PeopleClient } from "@/components/life/people/PeopleClient";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await getPeople();
  return <PeopleClient initialPeople={people} />;
}
