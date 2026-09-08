import { getGuardians, getGuardianConfig } from "@/lib/actions/lifeGuardian.actions";
import { getEmergencyHistory } from "@/lib/actions/lifeEmergencyRequest.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { GuardiansClient } from "@/components/life/access/GuardiansClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trusted Guardians & Emergency Access | LIFE Vault",
  description: "Configure trusted guardians and emergency access release protocols.",
};

export default async function GuardiansPage() {
  const [authContext, guardians, emergencyConfig, emergencyHistory, people] =
    await Promise.all([
      requireModuleAccess("/guardians"),
      getGuardians(),
      getGuardianConfig(),
      getEmergencyHistory(),
      getPeople({ status: "active" }),
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
