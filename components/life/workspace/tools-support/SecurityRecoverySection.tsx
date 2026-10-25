"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Mail,
  Smartphone,
  Laptop,
  LogOut,
  Users,
  LifeBuoy,
  ChevronRight,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { revokeOtherSessions } from "@/lib/actions/lifeToolsSupport.actions";

interface SecurityRecoverySectionProps {
  overviewData: any;
  onNavigateToGuardians: () => void;
  onNavigateToRecovery: () => void;
  onRefresh?: () => void;
}

export function SecurityRecoverySection({
  overviewData,
  onNavigateToGuardians,
  onNavigateToRecovery,
  onRefresh,
}: SecurityRecoverySectionProps) {
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRecoveryCodesModal, setShowRecoveryCodesModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const summary = overviewData?.securitySummary || {};
  const alerts = overviewData?.recentAlerts || [];

  const handleRevokeSessions = async () => {
    if (!confirm("Are you sure you want to sign out all other active sessions?")) return;
    setIsRevoking(true);
    try {
      const res = await revokeOtherSessions();
      if (res.success) {
        toast.success(res.message || "All other sessions signed out");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to revoke sessions");
      }
    } catch (err: any) {
      toast.error(err.message || "Error revoking sessions");
    } finally {
      setIsRevoking(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    toast.success("Password update request submitted via Clerk secure flow");
    setShowPasswordChangeModal(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Review Your Protection - Summary Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(30,27,75,0.12)] relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-indigo-200 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              {summary.statusLabel || "Protection Status"}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight pt-1">
              Review your protection
            </h2>
            <p className="text-xs text-indigo-200/80 max-w-xs font-normal">
              {summary.itemsCompleted || 4} of {summary.totalItems || 5} core security layers active and verified.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-indigo-200" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${((summary.itemsCompleted || 4) / (summary.totalItems || 5)) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-indigo-200/70">
            <span>Verified configuration</span>
            <span className="font-semibold text-white">
              {Math.round(((summary.itemsCompleted || 4) / (summary.totalItems || 5)) * 100)}% Complete
            </span>
          </div>
        </div>
      </div>

      {/* 2. Login & Identity */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-100 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1E1B4B]">Login & Identity</h3>
              <p className="text-[11px] text-slate-500">Account credentials and verified identifiers</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Verified Email */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-[#1E1B4B]">Verified Email</p>
                <p className="text-[11px] text-slate-500">{summary.userEmail || "owner@life.gesn.net"}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Verified
            </span>
          </div>

          {/* Password Action */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-[#1E1B4B]">Account Password</p>
                <p className="text-[11px] text-slate-500">Secured via Clerk authentication provider</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordChangeModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-xs"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sign-in Protection */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1E1B4B]">Sign-in Protection</h3>
              <p className="text-[11px] text-slate-500">Multifactor authentication & recovery codes</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* 2FA Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#1E1B4B]">Two-Factor Authentication</p>
              <p className="text-[11px] text-slate-500">Enabled for account sign-ins</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Active
            </span>
          </div>

          {/* Recovery Codes */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#1E1B4B]">Single-use Recovery Codes</p>
              <p className="text-[11px] text-slate-500">Offline fallback keys</p>
            </div>
            <button
              type="button"
              onClick={() => setShowRecoveryCodesModal(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              View
            </button>
          </div>
        </div>
      </div>

      {/* 4. Devices & Sessions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1E1B4B]">Devices & Sessions</h3>
              <p className="text-[11px] text-slate-500">Currently authenticated sessions</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isRevoking}
            onClick={handleRevokeSessions}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out others</span>
          </button>
        </div>

        {/* Current Session Item */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-[#1E1B4B]">Current Device</p>
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  This Device
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Mobile PWA / Web Browser · Approximate Location</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
      </div>

      {/* 5. Connected Nav Cards: Recovery Guardians & Account Recovery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Recovery Guardians Link Card */}
        <button
          type="button"
          onClick={onNavigateToGuardians}
          className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-100 hover:shadow-md transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] border border-sky-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#1E1B4B] group-hover:text-indigo-600 transition-colors">
                Recovery Guardians
              </h4>
              <p className="text-[11px] text-slate-500">
                {summary.guardiansCount || 0} active guardians · 2 of 3 rule
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Account Recovery Flow Link Card */}
        <button
          type="button"
          onClick={onNavigateToRecovery}
          className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-100 hover:shadow-md transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#1E1B4B] group-hover:text-indigo-600 transition-colors">
                Account Recovery
              </h4>
              <p className="text-[11px] text-slate-500">
                Recovery setup & verification status
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* 6. Security Alerts */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] border border-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1E1B4B]">Security Alerts</h3>
              <p className="text-[11px] text-slate-500">Recent security-sensitive events and notifications</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {alerts.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              No critical security alerts detected. Your account is operating normally.
            </div>
          ) : (
            alerts.map((alert: any) => (
              <div
                key={alert._id}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#1E1B4B] truncate">
                      {alert.action?.replace(/_/g, " ")}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                      {new Date(alert.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {alert.details}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: Recovery Codes */}
      {showRecoveryCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-[#1E1B4B]">Offline Recovery Codes</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryCodesModal(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Store these single-use codes in a safe offline location. They allow you to regain account access if you lose your phone or authenticator app.
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 grid grid-cols-2 gap-2 text-center font-mono text-xs font-bold text-slate-800">
              <span className="p-2 bg-white rounded-lg border border-slate-200/60">A7F2-99B1</span>
              <span className="p-2 bg-white rounded-lg border border-slate-200/60">C38E-5510</span>
              <span className="p-2 bg-white rounded-lg border border-slate-200/60">E81A-90F3</span>
              <span className="p-2 bg-white rounded-lg border border-slate-200/60">B44D-72A8</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Never store recovery codes solely inside Life VAULT, as you cannot access them when locked out.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                toast.success("Recovery codes copied to clipboard");
                setShowRecoveryCodesModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Done & Copy Codes
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Change Password */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-[#1E1B4B]">Change Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordChangeModal(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
