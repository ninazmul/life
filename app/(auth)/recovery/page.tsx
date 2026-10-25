import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AccountRecoveryView } from "@/components/life/workspace/tools-support/AccountRecoveryView";

export const metadata = {
  title: "Account Recovery | LIFE Command Center",
  description: "Verified recovery and protection for locked or compromised accounts.",
};

export default function AccountRecoveryPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <AccountRecoveryView isLoggedOutMode={true} />
    </div>
  );
}
