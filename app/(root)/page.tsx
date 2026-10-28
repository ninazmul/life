import { getLifeDashboardStats } from "@/lib/actions/lifeDashboard.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { redirect } from "next/navigation";
import { LifeVaultDashboard } from "@/components/life/dashboard/LifeVaultDashboard";
import { UserDashboard } from "@/components/life/user-dashboard/UserDashboard";
import { getUserDashboardData } from "@/lib/actions/lifeUserDashboard.actions";

export const dynamic = "force-dynamic";

export default async function LifeHomePage() {
  const authContext = await getLifeAuthContext();
  if (!authContext) redirect("/sign-in");

  const isOwnerOrAdmin = Boolean(authContext.isOwner || authContext.isAdmin);

  if (isOwnerOrAdmin) {
    const stats = await getLifeDashboardStats();
    return (
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
    );
  }

  // Non-owner / Invited user dashboard
  const userDashRes = await getUserDashboardData();
  const userData = userDashRes.data || {
    updates: [],
    overview: {
      loanTotal: 0,
      loanLabel: "No active loans",
      hasLoan: false,
      supportTotal: 0,
      supportLabel: "No support allocated",
      hasSupport: false,
      documentsCount: 0,
      hasDocuments: false,
      responsibilitiesPending: 0,
      responsibilitiesOngoing: 0,
      hasResponsibilities: false,
    },
    badges: {
      notesNew: 0,
      secureNew: 0,
      requestsNew: 0,
    },
    notificationCount: 0,
  };

  return (
    <UserDashboard
      data={userData}
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
      ownerName="Life VAULT Owner"
    />
  );
}
