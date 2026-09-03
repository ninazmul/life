import { getAssets } from "@/lib/actions/lifeAsset.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { AssetsClient } from "@/components/life/assets/AssetsClient";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const [assets, people, businesses] = await Promise.all([
    getAssets(),
    getPeople({ status: "active" }),
    getBusinesses(),
  ]);

  return (
    <AssetsClient
      initialAssets={assets}
      people={people}
      businesses={businesses}
    />
  );
}
