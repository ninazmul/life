import { getAssets } from "@/lib/actions/lifeAsset.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { AssetsClient } from "@/components/life/assets/AssetsClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  await requireModuleAccess("/assets");

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
