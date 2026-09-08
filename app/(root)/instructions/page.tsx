import { getResponsibilities } from "@/lib/actions/lifeResponsibility.actions";
import { getInstructions } from "@/lib/actions/lifeInstruction.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { getLifeAuthContext } from "@/lib/life/auth";
import { InstructionsClient } from "@/components/life/instructions/InstructionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instructions & Responsibilities | LIFE Vault",
  description: "Manage personal directives, assigned tasks, and continuity responsibilities.",
};

export default async function InstructionsPage() {
  const [responsibilities, instructions, people, businesses, authContext] =
    await Promise.all([
      getResponsibilities(),
      getInstructions(),
      getPeople({ status: "active" }),
      getBusinesses(),
      getLifeAuthContext(),
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
