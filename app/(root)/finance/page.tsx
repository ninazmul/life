import {
  getFinancialSupports,
  getOwnerFinancialDashboard,
  getFinancialSummaryForUser,
} from "@/lib/actions/lifeFinancialSupport.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { FinancialSupportList } from "@/components/life/finance/FinancialSupportList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Finance & Transactions | LIFE Vault",
  description: "Personal financial support, installment schedules, and repayment records.",
};

export default async function FinancePage() {
  const [authContext, records, people, businesses] = await Promise.all([
    getLifeAuthContext(),
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
