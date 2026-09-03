import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { getLifeAuthContext } from "@/lib/life/auth";
import { getEmergencyAccessState } from "@/lib/actions/lifeAccess.actions";
import { LifeLayoutClient } from "@/components/life/layout/LifeLayoutClient";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const authContext = await getLifeAuthContext();
  const emergencyState = await getEmergencyAccessState();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-xs font-medium rounded-xl shadow-lg",
          duration: 3500,
        }}
      />
      <LifeLayoutClient
        userName={authContext?.name || "Owner"}
        isEmergencyActive={emergencyState?.isEmergencyActive || false}
      >
        {children}
      </LifeLayoutClient>
    </>
  );
}
