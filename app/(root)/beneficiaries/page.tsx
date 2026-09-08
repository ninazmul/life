import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getLegacyMessages } from "@/lib/actions/lifeLegacy.actions";
import { getAssets } from "@/lib/actions/lifeAsset.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { BeneficiariesClient } from "@/components/life/beneficiaries/BeneficiariesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Beneficiaries | LIFE Vault",
  description: "Designated legacy recipients, heirs, and assigned family members.",
};

export default async function BeneficiariesPage() {
  const [people, messages, assets, authContext] = await Promise.all([
    getPeople({ status: "active" }),
    getLegacyMessages(),
    getAssets(),
    getLifeAuthContext(),
  ]);

  const beneficiaries = people.filter(
    (p: any) =>
      p.role === "beneficiary" ||
      ["Wife", "Son", "Daughter", "Mother", "Father", "Brother", "Sister"].some((rel) =>
        p.relation?.toLowerCase().includes(rel.toLowerCase())
      )
  );

  return (
    <BeneficiariesClient
      beneficiaries={beneficiaries.length > 0 ? beneficiaries : people}
      messages={messages}
      assets={assets}
      isOwner={Boolean(authContext?.isOwner)}
    />
  );
}
