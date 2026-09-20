import { Metadata } from "next";
import { getAllNotes } from "@/lib/actions/lifeNote.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { LifeNoteClient } from "@/components/life/notes/LifeNoteClient";
import { requireModuleAccess } from "@/lib/life/module-access.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LifeNote | Personal Directives & Continuity Notes",
  description: "Private personal notes, directives, and secret emergency unlock files.",
};

export default async function LifeNotePage() {
  const authContext = await requireModuleAccess("/lifenote");

  const [notes, people] = await Promise.all([
    getAllNotes(),
    getPeople({ status: "active" }),
  ]);

  return (
    <LifeNoteClient
      initialNotes={notes}
      people={people}
      isOwner={Boolean(authContext?.isOwner)}
      isAdmin={Boolean(authContext?.isAdmin)}
      currentPersonId={authContext?.personId}
    />
  );
}
