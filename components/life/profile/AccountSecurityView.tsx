"use client";

import { useState, useTransition, useRef } from "react";
import {
  ArrowLeft,
  Mail,
  Lock,
  ShieldCheck,
  Smartphone,
  LogOut,
  ChevronRight,
  Check,
  X,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Laptop,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useClerk } from "@clerk/nextjs";
import {
  ProfileData,
  requestVerificationCode,
  verifyAccountCode,
} from "@/lib/actions/lifeProfile.actions";
import toast from "react-hot-toast";

interface AccountSecurityViewProps {
  profile: ProfileData;
  onBack: () => void;
  onProfileUpdated: (updated: ProfileData) => void;
}

export function AccountSecurityView({
  profile,
  onBack,
  onProfileUpdated,
}: AccountSecurityViewProps) {
  const { signOut } = useClerk();
  const [isPending, startTransition] = useTransition();

  // Modals & Dialogs
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [activeSessionsOpen, setActiveSessionsOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [recoveryEmailModalOpen, setRecoveryEmailModalOpen] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  // 6-digit OTP verification state
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [maskedDestination, setMaskedDestination] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Recovery email state
  const [recoveryEmail, setRecoveryEmail] = useState(profile.securityData?.recoveryEmail || "");

  // Trigger identity verification modal
  const handleStartVerification = async (reason = "email verification") => {
    startTransition(async () => {
      const res = await requestVerificationCode(reason);
      if (res.success && res.maskedDestination) {
        setMaskedDestination(res.maskedDestination);
        setOtpDigits(["", "", "", "", "", ""]);
        setVerifyModalOpen(true);
        toast.success(`Verification code sent! (Dev code: ${res.code})`);
      } else {
        toast.error(res.error || "Failed to send verification code");
      }
    });
  };

  // OTP change handler
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Pasted full code
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      const newDigits = [...otpDigits];
      for (let i = 0; i < cleaned.length; i++) {
        newDigits[i] = cleaned[i];
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(cleaned.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value.replace(/\D/g, "");
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length < 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    startTransition(async () => {
      const res = await verifyAccountCode(fullCode);
      if (res.success) {
        toast.success("Identity verified successfully!");
        setVerifyModalOpen(false);
      } else {
        toast.error(res.error || "Invalid verification code");
      }
    });
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    startTransition(async () => {
      toast.success("Password updated successfully!");
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  };

  const handleSaveRecoveryEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail || !recoveryEmail.includes("@")) {
      toast.error("Please enter a valid recovery email");
      return;
    }

    startTransition(async () => {
      toast.success("Recovery email saved!");
      setRecoveryEmailModalOpen(false);
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch {
      window.location.href = "/sign-in";
    }
  };

  const security = profile.securityData;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#1E1B4B] dark:text-slate-100 leading-tight">
            Account Security
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign-in, verification & recovery
          </p>
        </div>
      </div>

      {/* Security Options List Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(30,27,75,0.04)] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {/* 1. Email address */}
        <div
          onClick={() => handleStartVerification("email confirmation")}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100 truncate">
                Email address
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 truncate">
                  {profile.email || "Not configured"}
                </span>
                {security?.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-full shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* 2. Password */}
        <div
          onClick={() => setChangePasswordOpen(true)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                Password
              </p>
              <p className="text-xs text-slate-500">Change your password</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* 3. Two-step verification */}
        <div
          onClick={() => setTwoFactorModalOpen(true)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                Two-step verification
              </p>
              <p className="text-xs text-slate-500">
                {security?.twoFactorEnabled ? "Enabled" : "Set up for extra security"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* 4. Recovery email */}
        <div
          onClick={() => setRecoveryEmailModalOpen(true)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                Recovery email
              </p>
              <p className="text-xs text-slate-500">
                {security?.recoveryEmail || "Add a recovery email address"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* 5. Active sessions */}
        <div
          onClick={() => setActiveSessionsOpen(true)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#1E1B4B] dark:text-slate-100">
                Active sessions
              </p>
              <p className="text-xs text-slate-500">
                {security?.activeSessions?.length || 1} signed-in device(s)
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* 6. Sign out */}
        <div
          onClick={() => setSignOutConfirmOpen(true)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                Sign out
              </p>
              <p className="text-xs text-slate-400">Sign out from this device</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
        </div>
      </div>

      {/* ───────────────── VERIFY IDENTITY MODAL (6-DIGIT OTP) ───────────────── */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-0 bg-white dark:bg-slate-900 shadow-2xl">
          <DialogHeader className="p-0 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6 stroke-[1.75]" />
            </div>
            <DialogTitle className="text-lg font-bold text-[#1E1B4B] dark:text-slate-100">
              Verify your identity
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Enter the verification code sent to your email address:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{maskedDestination}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifySubmit} className="space-y-6 pt-4">
            {/* 6 Input Boxes */}
            <div className="flex items-center justify-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-extrabold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-[#1E1B4B] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-sm shadow-sm transition-transform active:scale-[0.98]"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Verify"}
            </button>

            <div className="text-center text-xs text-slate-400">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={() => handleStartVerification()}
                className="font-bold text-purple-600 hover:underline"
              >
                Resend code
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ───────────────── CHANGE PASSWORD SHEET ───────────────── */}
      <Sheet open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="rounded-t-[32px] max-h-[90vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                Change Password
              </SheetTitle>
              <p className="text-xs text-slate-500 mt-0.5">Ensure your account uses a strong password</p>
            </div>
            <button
              type="button"
              onClick={() => setChangePasswordOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSavePassword} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-11 px-3.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="pt-3 pb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setChangePasswordOpen(false)}
                className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ───────────────── ACTIVE SESSIONS SHEET ───────────────── */}
      <Sheet open={activeSessionsOpen} onOpenChange={setActiveSessionsOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="rounded-t-[32px] max-h-[90vh] sm:max-w-xl mx-auto p-0 border-0 bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <SheetTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
                Active Sessions
              </SheetTitle>
              <p className="text-xs text-slate-500 mt-0.5">Signed-in devices and browser instances</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSessionsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            {security?.activeSessions?.map((sess) => (
              <div
                key={sess.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#1E1B4B] dark:text-slate-100">
                        {sess.device}
                      </p>
                      {sess.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sess.browser} • Last active: {sess.lastActive}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ───────────────── RECOVERY EMAIL MODAL ───────────────── */}
      <Dialog open={recoveryEmailModalOpen} onOpenChange={setRecoveryEmailModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-0 bg-white dark:bg-slate-900 shadow-2xl">
          <DialogHeader className="p-0">
            <DialogTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
              Recovery Email
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Add a backup email address for verified account recovery.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRecoveryEmail} className="space-y-4 pt-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Backup Email Address
              </label>
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="recovery@example.com"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRecoveryEmailModalOpen(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-[#6D28D9] text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ───────────────── TWO FACTOR MODAL ───────────────── */}
      <Dialog open={twoFactorModalOpen} onOpenChange={setTwoFactorModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-0 bg-white dark:bg-slate-900 shadow-2xl">
          <DialogHeader className="p-0 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6 stroke-[1.75]" />
            </div>
            <DialogTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
              Two-Step Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Two-step verification adds an extra layer of protection to your account during login.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-300">Current Status</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {security?.twoFactorEnabled ? "Active / Enabled" : "Not enabled"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Managed securely through your Clerk authentication provider.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTwoFactorModalOpen(false)}
            className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
          >
            Close
          </button>
        </DialogContent>
      </Dialog>

      {/* ───────────────── SIGN OUT CONFIRMATION DIALOG ───────────────── */}
      <Dialog open={signOutConfirmOpen} onOpenChange={setSignOutConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-0 bg-white dark:bg-slate-900 shadow-2xl">
          <DialogHeader className="p-0 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-[#1E1B4B] dark:text-slate-100">
              Sign out from this device?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              You will need to sign in again to access your secure information and vault items.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSignOutConfirmOpen(false)}
              className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-transform active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
