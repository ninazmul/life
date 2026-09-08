import { getResponsibilities } from "@/lib/actions/lifeResponsibility.actions";
import { getInstructions } from "@/lib/actions/lifeInstruction.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { InstructionsClient } from "@/components/life/instructions/InstructionsClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instructions & Responsibilities | LIFE Vault",
  description: "Manage personal directives, assigned tasks, and continuity responsibilities.",
};

export default async function InstructionsPage() {
  const authContext = await requireModuleAccess("/instructions");

  const [responsibilities, instructions, people, businesses] =
    await Promise.all([
      getResponsibilities(),
      getInstructions(),
      getPeople({ status: "active" }),
      getBusinesses(),
    ]);

  return (
    <InstructionsClient
      responsibilities={responsibilities}
      instructions={instructions}
      people={people}
      businesses={businesses}
      isOwner={Boolean(authContext?.isOwner)}
      isAdmin={Boolean(authContext?.isAdmin)}
    />
  );
}
