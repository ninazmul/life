import { getActivityLogs } from "@/lib/actions/lifeActivity.actions";
import { ActivityClient } from "@/components/life/activity/ActivityClient";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const logs = await getActivityLogs();
  return <ActivityClient initialLogs={logs} />;
}
