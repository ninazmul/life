import { requireModuleAccess } from "@/lib/life/module-access.server";
import { getLifeAuthContext } from "@/lib/life/auth";
import { getTrashItems } from "@/lib/actions/lifeTrash.actions";
import { TrashClient } from "@/components/life/settings/TrashClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  await requireModuleAccess("/settings");
  const auth = await getLifeAuthContext();
  if (!auth || (!auth.isOwner && !auth.isAdmin)) {
    redirect("/settings");
  }

  const items = await getTrashItems();
  return <TrashClient initialItems={items} isOwner={auth.isOwner} />;
}
