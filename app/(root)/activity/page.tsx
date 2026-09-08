import { getActivityLogs } from "@/lib/actions/lifeActivity.actions";
import { ActivityClient } from "@/components/life/activity/ActivityClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireModuleAccess("/activity");
  const logs = await getActivityLogs();
  return <ActivityClient initialLogs={logs} />;
}
