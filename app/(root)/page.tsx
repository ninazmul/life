import { getLifeDashboardStats } from "@/lib/actions/lifeDashboard.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { redirect } from "next/navigation";
import { LifeDashboardClient } from "@/components/life/dashboard/LifeDashboardClient";

export const dynamic = "force-dynamic";

export default async function LifeHomePage() {
  const [stats, authContext] = await Promise.all([
    getLifeDashboardStats(),
    getLifeAuthContext(),
  ]);

  if (!authContext) redirect("/sign-in");

  return (
    <LifeDashboardClient
      stats={stats}
      userAccess={{
        isOwner: authContext.isOwner,
        isAdmin: authContext.isAdmin,
        permissions: authContext.permissions,
      }}
    />
  );
}
