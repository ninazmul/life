import { Metadata } from "next";
import { getLifeAuthContext } from "@/lib/life/auth";
import { redirect } from "next/navigation";
import { getMyRequests } from "@/lib/actions/lifeRequest.actions";
import { getFutureNotesForUser } from "@/lib/actions/lifeNote.actions";
import { RequestCenterClient } from "@/components/life/requests/RequestCenterClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request Center | Life",
  description: "Submit and manage requests, messages, and access inquiries.",
};

export default async function RequestsPage() {
  const auth = await getLifeAuthContext();
  if (!auth) redirect("/sign-in");

  const [requests, futureNotes] = await Promise.all([
    getMyRequests(),
    getFutureNotesForUser(),
  ]);

  return (
    <RequestCenterClient
      initialRequests={requests}
      initialFutureNotes={futureNotes}
      isAdmin={auth.isAdmin || auth.isOwner}
      currentUserId={auth.userId}
      currentUserEmail={auth.email}
      currentUserName={auth.name}
      currentUserRole={auth.role}
      currentPersonId={auth.personId}
    />
  );
}
