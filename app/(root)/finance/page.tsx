import {
  getFinancialSupports,
  getOwnerFinancialDashboard,
  getFinancialSummaryForUser,
} from "@/lib/actions/lifeFinancialSupport.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { FinancialSupportList } from "@/components/life/finance/FinancialSupportList";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Finance & Transactions | LIFE Vault",
  description: "Personal financial support, installment schedules, and repayment records.",
};

export default async function FinancePage() {
  const authContext = await requireModuleAccess("/finance");

  const [records, people, businesses] = await Promise.all([
    getFinancialSupports(),
    getPeople({ status: "active" }),
    getBusinesses(),
  ]);

  const isOwner = Boolean(authContext?.isOwner);
  const isAdmin = Boolean(authContext?.isAdmin);

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
    />
  );
}
