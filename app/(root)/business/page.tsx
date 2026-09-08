import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { BusinessClient } from "@/components/life/business/BusinessClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  await requireModuleAccess("/business");

  const [businesses, people] = await Promise.all([
    getBusinesses(),
    getPeople({ status: "active" }),
  ]);

  return <BusinessClient initialBusinesses={businesses} people={people} />;
}
