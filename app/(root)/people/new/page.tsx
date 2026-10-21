import { requireModuleAccess } from "@/lib/life/module-access.server";
import { AddPersonClient } from "@/components/life/people/AddPersonClient";

export const dynamic = "force-dynamic";

export default async function NewPersonPage() {
  await requireModuleAccess("/people");
  return <AddPersonClient />;
}
