"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Server,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  ChevronRight,
  Shield,
  Building2,
  Check,
  Eye,
  EyeOff,
  Clock,
  KeyRound,
  FileText,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  UnifiedSecureVaultItem,
  revealDigitalVaultSecret,
} from "@/lib/actions/lifeWorkspace.actions";

interface DigitalAccountDetailBottomSheetProps {
  item: UnifiedSecureVaultItem;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onManageAccess?: () => void;
}

export function DigitalAccountDetailBottomSheet({
  item,
  isOpen,
  onClose,
  onEdit,
  onManageAccess,
}: DigitalAccountDetailBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "linked" | "history">("overview");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [showOwnerOnly, setShowOwnerOnly] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const details = item.details?.digitalVault;

  // Auto-conceal timer (default 30 seconds)
  useEffect(() => {
    if (!revealedSecret || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRevealedSecret(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [revealedSecret, countdown]);

  if (!isOpen || !details) return null;

  const handleReveal = async () => {
    try {
      setIsRevealing(true);
      const res = await revealDigitalVaultSecret(item.id);
      if (res.success && res.secret) {
        setRevealedSecret(res.secret);
        setCountdown(30);
        toast.success("Secret revealed. Auto-conceal in 30s.");
      } else {
        toast.error(res.error || "Failed to reveal secret");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reveal");
    } finally {
      setIsRevealing(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet matching Mockup Screen 3 */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Handle */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header matching Mockup Screen 3 */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
                  {item.title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 border border-slate-200/60 dark:border-slate-700">
                  <Lock className="w-2.5 h-2.5" />
                  Private
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>Digital Vault</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-emerald-600 font-medium">Protected</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Overview, Linked, History */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-5 gap-6">
          {(["overview", "linked", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-xs font-bold capitalize transition-colors relative ${
                activeTab === tab
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "overview" && (
            <>
              {/* Account Overview Box */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3.5">
                {/* Service */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Service</span>
                  <span className="font-bold text-[#1E1B4B] dark:text-white">
                    {details.serviceOrWebsite}
                  </span>
                </div>

                {/* Login Identifier */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Login</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                    <span>{details.maskedUsername || details.username || "—"}</span>
                    {details.username && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(details.username!, "Login ID")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-purple-600 transition-colors"
                        title="Copy login identifier"
                      >
                        {copiedField === "Login ID" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Website */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Website</span>
                  <a
                    href={
                      details.url?.startsWith("http")
                        ? details.url
                        : `https://${details.url || "hostinger.com"}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <span>{details.url || "hostinger.com"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Password / Protected Secret matching Mockup Screen 3 */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 font-medium">Password</span>
                  <div className="flex items-center gap-2">
                    {revealedSecret ? (
                      <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-xl border border-purple-200">
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                          {revealedSecret}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(revealedSecret, "Password")}
                          className="p-0.5 text-purple-600 hover:text-purple-800"
                        >
                          {copiedField === "Password" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="text-[10px] text-purple-500 font-semibold ml-1">
                          ({countdown}s)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="tracking-widest font-mono text-slate-400 text-sm">
                          ••••••••
                        </span>
                        <button
                          type="button"
                          onClick={handleReveal}
                          disabled={isRevealing}
                          className="h-7 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1.5 border border-purple-200/70 transition-all active:scale-95"
                        >
                          <Lock className="w-3 h-3" />
                          <span>{isRevealing ? "Verifying..." : "Secure Reveal"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!revealedSecret && (
                  <p className="text-[11px] text-slate-400 text-right">
                    Verify your identity to reveal.
                  </p>
                )}
              </div>

              {/* Owner Only Card matching Mockup Screen 3 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowOwnerOnly(!showOwnerOnly)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1E1B4B] dark:text-white flex items-center gap-1.5">
                        <span>Owner only</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Private notes & recovery instructions
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showOwnerOnly ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {showOwnerOnly && (
                  <div className="p-4 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-xs">
                    {details.recoveryInfo && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Recovery Instructions
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 font-mono text-[11px]">
                          {details.recoveryInfo}
                        </p>
                      </div>
                    )}

                    {details.notes && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Private Notes
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                          {details.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Linked Business matching Mockup Screen 3 */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Linked business
                    </span>
                    <span className="text-xs font-bold text-[#1E1B4B] dark:text-white">
                      {details.relatedBusinessName || "GESN"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>

              {/* Permission Summary Box matching Mockup Screen 3 */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Permission summary
                </span>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account details</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {details.permissionSummary?.accountDetails || "View only"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <KeyRound className="w-3.5 h-3.5 text-purple-500" />
                    <span>Protected secret</span>
                  </div>
                  <span className="font-semibold text-purple-700 dark:text-purple-400">
                    {details.permissionSummary?.protectedSecret || "Restricted"}
                  </span>
                </div>
              </div>
            </>
          )}

          {activeTab === "linked" && (
            <div className="p-4 text-center text-slate-400 space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">
                Linked to {details.relatedBusinessName || "GESN corporate entity"}.
              </p>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Credentials Stored</p>
                  <p className="text-[11px] text-slate-400">AES-256-GCM vault encryption</p>
                </div>
                <span className="text-[10px] text-slate-400">Oct 2026</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions matching Mockup Screen 3 */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onManageAccess}
            className="flex-1 h-12 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            Manage Access
          </button>
        </div>
      </div>
    </div>
  );
}
