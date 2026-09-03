import { getLifeSettings } from "@/lib/actions/lifeSettings.actions";
import { SettingsClient } from "@/components/life/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getLifeSettings();
  return <SettingsClient settings={settings} />;
}
