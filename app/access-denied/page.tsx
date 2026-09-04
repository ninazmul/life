import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import ClerkSignOutButton from "@/components/shared/ClerkSignOutButton";
import { Lock, Home, LogIn } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccessDeniedPage() {
  const user = await currentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-100/70 via-sky-50/50 to-gray-100 dark:from-gray-950 dark:via-[#111827] dark:to-gray-950 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/30">
          <Lock
            className="h-10 w-10 text-red-500 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white tracking-tight">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          {user
            ? "You don't have permission to access this application. Please contact an administrator to get access."
            : "Please sign in to continue."}
        </p>
        {user ? (
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="w-full bg-[#3e0078] hover:bg-[#3e0078]/90 gap-2"
            >
              <Link href="/" aria-label="Go to home page">
                <Home
                  className="w-4 h-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Go Home
              </Link>
            </Button>
            <ClerkSignOutButton />
          </div>
        ) : (
          <Button
            asChild
            className="w-full bg-[#3e0078] hover:bg-[#3e0078]/90 gap-2"
          >
            <Link href="/sign-in" aria-label="Sign in to Life">
              <LogIn
                className="w-4 h-4 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              Sign In
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
