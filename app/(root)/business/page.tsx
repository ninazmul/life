import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { BusinessClient } from "@/components/life/business/BusinessClient";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const [businesses, people] = await Promise.all([
    getBusinesses(),
    getPeople({ status: "active" }),
  ]);

  return <BusinessClient initialBusinesses={businesses} people={people} />;
}
