"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Lock,
  Mail,
  User,
  XCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  submitAccountRecoveryRequest,
  getAccountRecoveryStatus,
  voteOnRecoveryRequest,
  cancelAccountRecovery,
} from "@/lib/actions/lifeToolsSupport.actions";

interface AccountRecoveryViewProps {
  isLoggedOutMode?: boolean;
  initialCode?: string;
  onBack?: () => void;
}

export function AccountRecoveryView({
  isLoggedOutMode = false,
  initialCode = "",
  onBack,
}: AccountRecoveryViewProps) {
  const [activeTab, setActiveTab] = useState<"submit" | "track">("submit");
  const [trackingCode, setTrackingCode] = useState(initialCode);
  const [recoveryStatus, setRecoveryStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New Request Form State
  const [accountEmail, setAccountEmail] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimantContactEmail, setClaimantContactEmail] = useState("");
  const [claimantPhone, setClaimantPhone] = useState("");
  const [reason, setReason] = useState<
    "forgot_credentials" | "lost_phone" | "lost_authenticator" | "compromised_account" | "other"
  >("forgot_credentials");
  const [reasonDetails, setReasonDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guardian Vote State
  const [voteNote, setVoteNote] = useState("");

  const handleTrackSubmit = async (codeToSearch?: string) => {
    const code = codeToSearch || trackingCode;
    if (!code || !code.trim()) {
      toast.error("Please enter a recovery reference code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await getAccountRecoveryStatus(code.trim());
      if (res.success && res.data) {
        setRecoveryStatus(res.data);
        setActiveTab("track");
      } else {
        toast.error(res.error || "Recovery request not found");
        setRecoveryStatus(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleTrackSubmit(initialCode);
    }
  }, [initialCode]);

  const handleSubmitNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountEmail || !claimantName || !claimantContactEmail || !reasonDetails) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAccountRecoveryRequest({
        accountEmail,
        claimantName,
        claimantContactEmail,
        claimantPhone,
        reason,
        reasonDetails,
      });

      if (res.success && res.data) {
        toast.success(`Recovery request submitted! Reference: ${res.data.recoveryCode}`);
        setTrackingCode(res.data.recoveryCode);
        await handleTrackSubmit(res.data.recoveryCode);
        setActiveTab("track");
      } else {
        toast.error(res.error || "Submission failed");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (action: "approve" | "reject" | "request_info") => {
    if (!recoveryStatus?.recoveryCode) return;
    try {
      const res = await voteOnRecoveryRequest({
        recoveryCode: recoveryStatus.recoveryCode,
        action,
        note: voteNote,
      });

      if (res.success) {
        toast.success(`Guardian decision recorded: ${action}`);
        setVoteNote("");
        handleTrackSubmit(recoveryStatus.recoveryCode);
      } else {
        toast.error(res.error || "Failed to record vote");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleCancel = async () => {
    if (!recoveryStatus?.recoveryCode) return;
    const reasonText = prompt("Please provide a reason for cancelling this recovery request:");
    if (!reasonText) return;

    try {
      const res = await cancelAccountRecovery(recoveryStatus.recoveryCode, reasonText);
      if (res.success) {
        toast.success("Account recovery request cancelled");
        handleTrackSubmit(recoveryStatus.recoveryCode);
      } else {
        toast.error(res.error || "Cancellation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const currentStep = recoveryStatus?.currentStep || 1;

  const STEPS = [
    { step: 1, label: "Request Submitted" },
    { step: 2, label: "Guardian Verification" },
    { step: 3, label: "Waiting Period" },
    { step: 4, label: "Final Checks" },
    { step: 5, label: "Restore Sign-in" },
  ];

  return (
    <div className={`space-y-4 animate-in fade-in duration-200 ${isLoggedOutMode ? "max-w-md mx-auto py-6 px-4" : ""}`}>
      {/* Scope Disclaimer Banner */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-amber-950 font-normal leading-relaxed">
          <p className="font-bold text-amber-900">Login Recovery vs. Vault Key Recovery</p>
          <p className="text-slate-600">
            Regaining login access restores your account identity. Decrypting Master Vault records requires your Master PIN or configured recovery materials.
          </p>
        </div>
      </div>

      {/* Tabs: Submit New vs Track Existing */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("submit")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "submit"
              ? "bg-white text-[#1E1B4B] shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Submit Recovery
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("track")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "track"
              ? "bg-white text-[#1E1B4B] shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Track Status
        </button>
      </div>

      {/* TAB 1: SUBMIT NEW RECOVERY REQUEST */}
      {activeTab === "submit" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-4">
          <div className="space-y-1">
            <h3 className="text-[15px] font-bold text-[#1E1B4B]">Initiate Account Recovery</h3>
            <p className="text-xs text-slate-500">
              Recover access if you have lost your phone, sign-in methods, or suspect compromise.
            </p>
          </div>

          <form onSubmit={handleSubmitNewRequest} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Account Email / Username</label>
              <div className="relative">
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="owner@domain.com"
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 pl-9 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Claimant Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    placeholder="Your legal name"
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 pl-9 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">New Contact Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={claimantContactEmail}
                    onChange={(e) => setClaimantContactEmail(e.target.value)}
                    placeholder="Safe email for updates"
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 pl-9 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Recovery Reason</label>
              <select
                value={reason}
                onChange={(e: any) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden bg-white"
              >
                <option value="forgot_credentials">Forgot Username / Password</option>
                <option value="lost_phone">Lost Phone / Mobile Device</option>
                <option value="lost_authenticator">Lost 2FA / Authentication Method</option>
                <option value="compromised_account">Suspected Account Compromise</option>
                <option value="other">Other Access Problem</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Details & Explanation</label>
              <textarea
                rows={3}
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder="Explain circumstances so your Recovery Guardians can verify your identity..."
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>{isSubmitting ? "Submitting..." : "Submit Recovery Request"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: TRACK STATUS & GUARDIAN VOTING */}
      {activeTab === "track" && (
        <div className="space-y-4">
          {/* Tracking Search Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-2">
            <label className="text-[11px] font-bold text-slate-700">Recovery Reference Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="REC-XXXX-LV"
                className="flex-1 rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden uppercase"
              />
              <button
                type="button"
                onClick={() => handleTrackSubmit()}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                Track
              </button>
            </div>
          </div>

          {/* Status Details */}
          {recoveryStatus && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-4">
              {/* Stepper Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Recovery Progress
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                    {recoveryStatus.status?.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Stepper Track */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {STEPS.map((s) => {
                    const isDone = currentStep > s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.step} className="space-y-1 text-center">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isDone
                              ? "bg-emerald-500"
                              : isCurrent
                              ? "bg-indigo-600"
                              : "bg-slate-200"
                          }`}
                        />
                        <span
                          className={`text-[9px] block leading-tight font-medium ${
                            isCurrent
                              ? "text-indigo-600 font-bold"
                              : isDone
                              ? "text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recovery Status Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Reference Code:</span>
                  <span className="font-mono font-bold text-[#1E1B4B]">{recoveryStatus.recoveryCode}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Target Account:</span>
                  <span className="font-semibold text-slate-800">{recoveryStatus.accountEmail}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Guardian Approvals:</span>
                  <span className="font-bold text-indigo-600">
                    {recoveryStatus.approvedCount} of {recoveryStatus.requiredApprovals} Verified
                  </span>
                </div>
                {recoveryStatus.waitingPeriodStart && (
                  <div className="flex items-center justify-between text-indigo-900 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Waiting Period:
                    </span>
                    <span>72h Active Countdown</span>
                  </div>
                )}
              </div>

              {/* Guardian Decision Action (if guardian reviewing) */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <p className="text-xs font-bold text-indigo-900">Guardian Identity Decision</p>
                <textarea
                  rows={2}
                  value={voteNote}
                  onChange={(e) => setVoteNote(e.target.value)}
                  placeholder="Verification note (e.g. Identity verified via phone call)..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleVote("reject")}
                    className="flex-1 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote("approve")}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Verify & Approve
                  </button>
                </div>
              </div>

              {/* Cancellation */}
              {recoveryStatus.status !== "cancelled" && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Cancel this recovery request
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
