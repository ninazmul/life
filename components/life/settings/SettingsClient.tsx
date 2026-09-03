/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Settings,
  Download,
  KeyRound,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setVaultPin, exportLifeBackup } from "@/lib/actions/lifeSettings.actions";
import toast from "react-hot-toast";

interface SettingsClientProps {
  settings: Record<string, unknown> | null;
}

export function SettingsClient({ settings: _settings }: SettingsClientProps) {
  // Settings are currently read-only display — write features use server actions

  // PIN setup
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // Backup export
  const [exportLoading, setExportLoading] = useState(false);

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      toast.error("PIN must be at least 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match. Please re-enter.");
      return;
    }
    setPinLoading(true);
    try {
      await setVaultPin(newPin);
      toast.success("Vault Master PIN has been set and encrypted successfully.");
      setNewPin("");
      setConfirmPin("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set Vault PIN.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleExportBackup = async () => {
    setExportLoading(true);
    try {
      const backup = await exportLifeBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Encrypted backup exported successfully. Store this file securely.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Backup export failed.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Life Settings & Security
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure master vault PIN, PWA install status, and full data backup.
        </p>
      </div>

      {/* PWA Status Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Progressive Web App (PWA) Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Life is installable as a native mobile app from your browser.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">
              Install Status
            </span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PWA Ready</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">
              Service Worker
            </span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero-Cache Active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">
              Offline Safe APIs
            </span>
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Online Required</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">How to install:</strong> On mobile, tap the browser Share button → &quot;Add to Home Screen&quot;. On desktop Chrome, click the install icon (⊕) in the address bar.
          <br />
          <span className="text-amber-400 font-medium">
            ⚠ Vault, Money, and sensitive API routes are always served fresh (zero cache) to protect your data privacy.
          </span>
        </div>
      </div>

      {/* Master Vault PIN */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Master Vault PIN
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Required to reveal any encrypted vault secret. Stored hashed — never plaintext.
            </p>
          </div>
        </div>

        <form onSubmit={handleSetPin} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                New Vault PIN (min. 4 digits)
              </label>
              <Input
                required
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={12}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="h-11 border-slate-800 bg-slate-900/90 text-slate-100 text-sm text-center font-mono tracking-[0.5em] focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Confirm Vault PIN
              </label>
              <Input
                required
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={12}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="h-11 border-slate-800 bg-slate-900/90 text-slate-100 text-sm text-center font-mono tracking-[0.5em] focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pinLoading}
              className="h-9 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
            >
              {pinLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Set Vault PIN
            </Button>
          </div>
        </form>
      </div>

      {/* Data Backup */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Export Full Data Backup
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Download a complete JSON backup of all Life modules (People, Money, Business, Vault metadata, etc).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-800/30 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <p>
            <strong>Security Notice:</strong> The backup export includes vault item metadata but <strong>never</strong> decrypted secrets.
            Encrypted secret payloads are excluded for your security. Store the backup file in a secure encrypted location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            onClick={handleExportBackup}
            disabled={exportLoading}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl gap-2 shadow-md"
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download JSON Backup
          </Button>

          <p className="text-xs text-slate-500">
            Includes People, Information, Business, Money, Assets, Contacts, Documents, Legacy (no vault secrets).
          </p>
        </div>
      </div>

      {/* System Info */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" /> System Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between">
            <span className="text-slate-400">Security Model</span>
            <span className="font-bold text-emerald-400">AES-256-GCM</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between">
            <span className="text-slate-400">Auth Provider</span>
            <span className="font-bold text-slate-200">Clerk.dev</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between">
            <span className="text-slate-400">Database</span>
            <span className="font-bold text-slate-200">MongoDB Atlas</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between">
            <span className="text-slate-400">Framework</span>
            <span className="font-bold text-slate-200">Next.js App Router</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between">
            <span className="text-slate-400">Cache Policy</span>
            <span className="font-bold text-red-400">Zero Cache (Sensitive)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex justify-between">
            <span className="text-slate-400">Vault Reveals Audited</span>
            <span className="font-bold text-emerald-400">Yes ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}
