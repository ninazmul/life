import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export default function Page() {
  return (
    <div className="space-y-4">
      <SignIn />
      <div className="text-center pt-2">
        <Link
          href="/recovery"
          className="inline-flex items-center gap-1.5 text-xs text-white/75 hover:text-white transition-colors"
        >
          <LifeBuoy className="w-3.5 h-3.5 text-indigo-400" />
          <span>Lost access? Recover or secure my account</span>
        </Link>
      </div>
    </div>
  );
}
