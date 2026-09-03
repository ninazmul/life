import { getInformationList } from "@/lib/actions/lifeInformation.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { InformationClient } from "@/components/life/information/InformationClient";

export const dynamic = "force-dynamic";

export default async function InformationPage() {
  const [items, people, businesses] = await Promise.all([
    getInformationList(),
    getPeople({ status: "active" }),
    getBusinesses(),
  ]);

  return (
    <InformationClient
      initialItems={items}
      people={people}
      businesses={businesses}
    />
  );
}
