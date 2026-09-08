import { getLegacyMessages } from "@/lib/actions/lifeLegacy.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { LegacyClient } from "@/components/life/legacy/LegacyClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export default async function LegacyPage() {
  await requireModuleAccess("/legacy");

  const [messages, people] = await Promise.all([
    getLegacyMessages(),
    getPeople({ status: "active" }),
  ]);

  return <LegacyClient initialMessages={messages} people={people} />;
}
