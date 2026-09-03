import { getEmergencyAccessState } from "@/lib/actions/lifeAccess.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { AccessClient } from "@/components/life/access/AccessClient";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const [emergencyState, people] = await Promise.all([
    getEmergencyAccessState(),
    getPeople({ status: "active" }),
  ]);

  return <AccessClient emergencyState={emergencyState} people={people} />;
}
