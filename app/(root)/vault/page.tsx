import { getVaultItems } from "@/lib/actions/lifeVault.actions";
import { VaultClient } from "@/components/life/vault/VaultClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  await requireModuleAccess("/vault");
  const items = await getVaultItems();
  return <VaultClient initialItems={items} />;
}
