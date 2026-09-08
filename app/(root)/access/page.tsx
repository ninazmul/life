import { getEmergencyAccessState } from "@/lib/actions/lifeAccess.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { AccessClient } from "@/components/life/access/AccessClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const [authContext, emergencyState, people] = await Promise.all([
    requireModuleAccess("/access"),
    getEmergencyAccessState(),
    getPeople({ status: "active" }),
  ]);

  const userEmail = authContext?.email?.toLowerCase().trim() || "";
  const primaryEmail = (emergencyState.primaryAdminEmail || "").toLowerCase().trim();
  const secondaryEmail = (emergencyState.secondaryAdminEmail || "").toLowerCase().trim();

  const isOwner = Boolean(authContext?.isOwner);
  const isDesignated = Boolean(
    (primaryEmail && userEmail === primaryEmail) ||
    (secondaryEmail && userEmail === secondaryEmail)
  );
  const canAccessEmergency = Boolean(authContext?.permissions?.canAccessEmergency);

  return (
    <AccessClient
      emergencyState={emergencyState}
      people={people}
      isOwner={isOwner}
      isDesignated={isDesignated}
      canAccessEmergency={canAccessEmergency}
      currentUserEmail={userEmail}
    />
  );
}
