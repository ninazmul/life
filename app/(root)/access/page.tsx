import { getEmergencyAccessState } from "@/lib/actions/lifeAccess.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { AccessClient } from "@/components/life/access/AccessClient";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const [emergencyState, people, authContext] = await Promise.all([
    getEmergencyAccessState(),
    getPeople({ status: "active" }),
    getLifeAuthContext(),
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
