import { notFound } from "next/navigation";
import { getFinancialSupportById } from "@/lib/actions/lifeFinancialSupport.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { FinancialSupportDetail } from "@/components/life/finance/FinancialSupportDetail";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Financial Support Detail | LIFE Vault",
};

export default async function FinancialSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, authContext] = await Promise.all([
    getFinancialSupportById(id),
    getLifeAuthContext(),
  ]);

  if (!data) notFound();

  return (
    <FinancialSupportDetail
      initialData={data}
      isOwner={Boolean(authContext?.isOwner)}
      isAdmin={Boolean(authContext?.isAdmin)}
    />
  );
}
