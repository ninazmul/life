import { getLifeDashboardStats } from "@/lib/actions/lifeDashboard.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { redirect } from "next/navigation";
import { LifeVaultDashboard } from "@/components/life/dashboard/LifeVaultDashboard";
import { LifeVaultBottomNav } from "@/components/life/layout/LifeVaultBottomNav";

export const dynamic = "force-dynamic";

export default async function LifeHomePage() {
  const [stats, authContext] = await Promise.all([
    getLifeDashboardStats(),
    getLifeAuthContext(),
  ]);

  if (!authContext) redirect("/sign-in");

  return (
    <>
      <LifeVaultDashboard
        stats={stats}
        userAccess={{
          isOwner: authContext.isOwner,
          isAdmin: authContext.isAdmin,
          permissions: authContext.permissions,
          name: authContext.name,
          email: authContext.email,
          avatarUrl: authContext.avatarUrl,
          personId: authContext.personId,
          role: authContext.role,
        }}
      />
      <LifeVaultBottomNav />
    </>
  );
}
