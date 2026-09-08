import { getLifeSettings } from "@/lib/actions/lifeSettings.actions";
import { SettingsClient } from "@/components/life/settings/SettingsClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireModuleAccess("/settings");
  const settings = await getLifeSettings();
  return <SettingsClient settings={settings} />;
}
