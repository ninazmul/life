import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="space-y-4">
      <SignUp fallbackRedirectUrl="/" forceRedirectUrl="/" />
    </div>
  );
}
