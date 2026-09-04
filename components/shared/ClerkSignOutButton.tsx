"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function ClerkSignOutButton() {
  return (
    <SignOutButton>
      <Button
        variant="outline"
        className="w-full gap-2"
        aria-label="Sign out of your account"
      >
        <LogOut
          className="h-4 w-4 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
        Sign Out
      </Button>
    </SignOutButton>
  );
}
