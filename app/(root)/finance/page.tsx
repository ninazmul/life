import {
  getFinancialSupports,
  getOwnerFinancialDashboard,
  getFinancialSummaryForUser,
} from "@/lib/actions/lifeFinancialSupport.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { getGesnReports } from "@/lib/actions/gesnReports.actions";
import { FinancialSupportList } from "@/components/life/finance/FinancialSupportList";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Finance & Transactions | LIFE Vault",
  description: "Personal financial support, installment schedules, and repayment records.",
};

export default async function FinancePage() {
  const authContext = await requireModuleAccess("/finance");

  const isOwner = Boolean(authContext?.isOwner);
  const isAdmin = Boolean(authContext?.isAdmin);
  const isSuperAdmin = authContext?.role === "super_admin" || isOwner;
  const canAccessLiveAccounting = Boolean(
    isOwner ||
    isAdmin ||
    isSuperAdmin ||
    authContext?.role === "admin" ||
    authContext?.role === "administrator"
  );

  const [records, people, businesses, gesnReportsRes] = await Promise.all([
    getFinancialSupports(),
    getPeople({ status: "active" }),
    getBusinesses(),
    canAccessLiveAccounting
      ? getGesnReports({ period: "thisMonth" })
      : Promise.resolve(null),
  ]);

  const [ownerDashboard, userSummary] = await Promise.all([
    isOwner ? getOwnerFinancialDashboard() : null,
    !isOwner ? getFinancialSummaryForUser() : null,
  ]);

  return (
    <FinancialSupportList
      records={records}
      people={people}
      businesses={businesses}
      ownerDashboard={ownerDashboard}
      userSummary={userSummary}
      isOwner={isOwner}
      isAdmin={isAdmin}
      canAccessLiveAccounting={canAccessLiveAccounting}
      initialGesnReports={gesnReportsRes?.data || null}
      initialGesnError={gesnReportsRes?.error || null}
    />
  );
}

