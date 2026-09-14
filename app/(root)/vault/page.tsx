import { getVaultItems } from "@/lib/actions/lifeVault.actions";
import { getEmergencyAccessState } from "@/lib/actions/lifeAccess.actions";
import { VaultClient } from "@/components/life/vault/VaultClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const [, items, emergencyState] = await Promise.all([
    requireModuleAccess("/vault"),
    getVaultItems(),
    getEmergencyAccessState(),
  ]);

  return (
    <VaultClient
      initialItems={items}
      isVaultLocked={Boolean(emergencyState?.isVaultLocked)}
    />
  );
}
