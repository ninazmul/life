import { Metadata } from "next";
import { getLifeAuthContext } from "@/lib/life/auth";
import { redirect } from "next/navigation";
import { getMyRequests } from "@/lib/actions/lifeRequest.actions";
import { getFutureNotesForUser } from "@/lib/actions/lifeNote.actions";
import {
  getUserConversation,
  getAdminConversations,
  getMessagingBadgeCount,
} from "@/lib/actions/lifeConversation.actions";
import { RequestCenterClient } from "@/components/life/requests/RequestCenterClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request Center & Messages | Life",
  description: "Submit and manage requests, messages, and access inquiries.",
};

export default async function RequestsPage(props: {
  searchParams?: Promise<{ tab?: string; user?: string }>;
}) {
  const auth = await getLifeAuthContext();
  if (!auth) redirect("/sign-in");

  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const isSuper = auth.isAdmin || auth.isOwner || auth.role === "super_admin";

  const [requests, futureNotes, adminConversations, userConversation, unreadCount] =
    await Promise.all([
      getMyRequests(),
      getFutureNotesForUser(),
      isSuper ? getAdminConversations() : Promise.resolve([]),
      !isSuper ? getUserConversation() : Promise.resolve(null),
      getMessagingBadgeCount(),
    ]);

  return (
    <RequestCenterClient
      initialRequests={requests}
      initialFutureNotes={futureNotes}
      isAdmin={isSuper}
      currentUserId={auth.userId}
      currentUserEmail={auth.email}
      currentUserName={auth.name}
      currentUserRole={auth.role}
      currentPersonId={auth.personId}
      initialTab={(searchParams?.tab as any) || (searchParams?.user ? "messages" : undefined)}
      initialSelectedUserEmail={searchParams?.user}
      initialAdminConversations={adminConversations}
      initialUserConversation={userConversation}
      unreadMessagesCount={unreadCount}
    />
  );
}
