import { UserGuideClient } from "@/components/life/guide/UserGuideClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "User Guide & Manual | LIFE Vault",
  description:
    "Comprehensive guide on using LIFE Vault — Businesses, Financial Support, Money Ledger, Assets, AES-256 Vault, Personal Info, People Directory, Important Contacts, Documents, Responsibilities & Instructions, Beneficiaries, Legacy Messages, Trusted Guardians & Access Permissions.",
};

export default function UserGuidePage() {
  return <UserGuideClient />;
}
