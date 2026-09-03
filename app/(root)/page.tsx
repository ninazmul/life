import { getLifeDashboardStats } from "@/lib/actions/lifeDashboard.actions";
import { LifeDashboardClient } from "@/components/life/dashboard/LifeDashboardClient";

export const dynamic = "force-dynamic";

export default async function LifeHomePage() {
  const stats = await getLifeDashboardStats();
  return <LifeDashboardClient stats={stats} />;
}
