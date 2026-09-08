import { getGuardians, getGuardianConfig } from "@/lib/actions/lifeGuardian.actions";
import { getEmergencyHistory } from "@/lib/actions/lifeEmergencyRequest.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { GuardiansClient } from "@/components/life/access/GuardiansClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trusted Guardians & Emergency Access | LIFE Vault",
  description: "Configure trusted guardians and emergency access release protocols.",
};

export default async function GuardiansPage() {
  const [guardians, emergencyConfig, emergencyHistory, people, authContext] =
    await Promise.all([
      getGuardians(),
      getGuardianConfig(),
      getEmergencyHistory(),
      getPeople({ status: "active" }),
      getLifeAuthContext(),
    ]);

  return (
    <GuardiansClient
      guardians={guardians}
      emergencyConfig={emergencyConfig}
      emergencyHistory={emergencyHistory}
      people={people}
      isOwner={Boolean(authContext?.isOwner)}
      isAdmin={Boolean(authContext?.isAdmin)}
      isGuardian={Boolean(authContext?.isGuardian)}
      currentPersonId={authContext?.personId}
    />
  );
}
