import { UserGuideClient } from "@/components/life/guide/UserGuideClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Guide | LIFE",
  description:
    "Learn how to use all LIFE modules — People, Money, Vault, Business Continuity, Legacy Messages, and more.",
};

export default function UserGuidePage() {
  return <UserGuideClient />;
}
