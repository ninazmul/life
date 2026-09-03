import { getContacts } from "@/lib/actions/lifeContact.actions";
import { getPeople } from "@/lib/actions/lifePeople.actions";
import { getBusinesses } from "@/lib/actions/lifeBusiness.actions";
import { ContactsClient } from "@/components/life/contacts/ContactsClient";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const [contacts, people, businesses] = await Promise.all([
    getContacts(),
    getPeople({ status: "active" }),
    getBusinesses(),
  ]);

  return (
    <ContactsClient
      initialContacts={contacts}
      people={people}
      businesses={businesses}
    />
  );
}
