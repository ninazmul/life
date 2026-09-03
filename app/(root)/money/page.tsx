import {
  getMoneyOverview,
  getMoneyRecords,
  getTransactions,
} from "@/lib/actions/lifeMoney.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { MoneyClient } from "@/components/life/money/MoneyClient";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  const [overview, records, transactions, people, businesses] =
    await Promise.all([
      getMoneyOverview(),
      getMoneyRecords(),
      getTransactions({ limit: 40 }),
      getPeople({ status: "active" }),
      getBusinesses(),
    ]);

  return (
    <MoneyClient
      overview={overview}
      records={records}
      transactions={transactions}
      people={people}
      businesses={businesses}
    />
  );
}
