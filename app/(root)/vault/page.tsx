import { getVaultItems } from "@/lib/actions/lifeVault.actions";
import { VaultClient } from "@/components/life/vault/VaultClient";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const items = await getVaultItems();
  return <VaultClient initialItems={items} />;
}
