import { redirect } from "next/navigation";
import { getLifeAuthContext } from "@/lib/life/auth";
import { getProfileData } from "@/lib/actions/lifeProfile.actions";
import { ProfileClient } from "@/components/life/profile/ProfileClient";
import { LifeVaultBottomNav } from "@/components/life/layout/LifeVaultBottomNav";
import LifePerson from "@/lib/database/models/lifePerson.model";
import { connectToDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await connectToDatabase();
  const authContext = await getLifeAuthContext();
  if (!authContext) redirect("/sign-in");

  const [profileRes, peopleCount] = await Promise.all([
    getProfileData(),
    LifePerson.countDocuments({ status: { $ne: "archived" } }).catch(() => 0),
  ]);

  if (!profileRes.success || !profileRes.data) {
    redirect("/");
  }

  return (
    <>
      <ProfileClient initialData={profileRes.data} />
      <LifeVaultBottomNav peopleCount={peopleCount} />
    </>
  );
}
