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
  Shield,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setVaultPin,
  exportLifeBackup,
} from "@/lib/actions/lifeSettings.actions";
import toast from "react-hot-toast";

interface SettingsClientProps {
  settings: Record<string, unknown> | null;
}

export function SettingsClient({ settings: _settings }: SettingsClientProps) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
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
      toast.success(
        "Vault Master PIN has been set and encrypted successfully.",
      );
      setNewPin("");
      setConfirmPin("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to set Vault PIN.",
      );
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
      toast.success(
        "Encrypted backup exported successfully. Store this file securely.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Backup export failed.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Life Settings & Security
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Configure master vault PIN, PWA install status, and full data backup.
        </p>
      </div>

      <section className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
            <Smartphone
              className="w-5 h-5 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              Progressive Web App (PWA) Status
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Life is installable as a native mobile app from your browser.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted border border-border space-y-1">
            <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
              Install Status
            </span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2
                className="w-3.5 h-3.5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>PWA Ready</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted border border-border space-y-1">
            <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
              Service Worker
            </span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2
                className="w-3.5 h-3.5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Zero-Cache Active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted border border-border space-y-1">
            <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
              Offline Safe APIs
            </span>
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
              <AlertCircle
                className="w-3.5 h-3.5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Online Required</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-accent border border-border text-xs text-muted-foreground leading-relaxed space-y-1">
          <p>
            <strong className="text-foreground">How to install:</strong> On
            mobile, tap the browser Share button → &quot;Add to Home
            Screen&quot;. On desktop Chrome, click the install icon (⊕) in the
            address bar.
          </p>
          <p className="text-amber-700 dark:text-amber-300 font-medium flex items-start gap-1.5 mt-1">
            <Shield
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>
              Vault, Money, and sensitive API routes are always served fresh
              (zero cache) to protect your data privacy.
            </span>
          </p>
        </div>
      </section>

      <section className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
            <KeyRound
              className="w-5 h-5 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              Master Vault PIN
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Required to reveal any encrypted vault secret. Stored hashed —
              never plaintext.
            </p>
          </div>
        </div>

        <form onSubmit={handleSetPin} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">
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
                className="h-11 border-border bg-card text-foreground text-sm text-center font-mono tracking-[0.5em] focus:border-amber-500"
                aria-label="New vault PIN input"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">
                Confirm Vault PIN
              </label>
              <Input
                required
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={12}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                className="h-11 border-border bg-card text-foreground text-sm text-center font-mono tracking-[0.5em] focus:border-amber-500"
                aria-label="Confirm vault PIN input"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pinLoading}
              className="h-9 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
              aria-busy={pinLoading}
            >
              {pinLoading ? (
                <Loader2
                  className="w-3.5 h-3.5 animate-spin shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              ) : (
                <Save
                  className="w-3.5 h-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
              Set Vault PIN
            </Button>
          </div>
        </form>
      </section>

      <section className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
            <Download
              className="w-5 h-5 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              Export Full Data Backup
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Download a complete JSON backup of all Life modules (People,
              Money, Business, Vault metadata, etc).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle
            className="w-4 h-4 shrink-0 mt-0.5 text-red-700 dark:text-red-300"
            strokeWidth={2}
            aria-hidden="true"
          />
          <p className="leading-relaxed">
            <strong className="text-red-800 dark:text-red-200">
              Security Notice:
            </strong>{" "}
            The backup export includes vault item metadata but{" "}
            <strong>never</strong> decrypted secrets. Encrypted secret payloads
            are excluded for your security. Store the backup file in a secure
            encrypted location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            onClick={handleExportBackup}
            disabled={exportLoading}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl gap-2 shadow-md shrink-0 self-start sm:self-auto"
            aria-busy={exportLoading}
          >
            {exportLoading ? (
              <Loader2
                className="w-4 h-4 animate-spin shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            ) : (
              <Download
                className="w-4 h-4 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
            Download JSON Backup
          </Button>

          <p className="text-xs text-muted-foreground leading-snug">
            Includes People, Information, Business, Money, Assets, Contacts,
            Documents, Legacy (no vault secrets).
          </p>
        </div>
      </section>

      <section className="p-5 rounded-3xl bg-card border border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Settings
            className="w-3.5 h-3.5 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />{" "}
          System Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            [
              "Security Model",
              "AES-256-GCM",
              "text-emerald-700 dark:text-emerald-300",
            ],
            ["Auth Provider", "Clerk.dev", "text-foreground"],
            ["Database", "MongoDB Atlas", "text-foreground"],
            ["Framework", "Next.js App Router", "text-foreground"],
            ["Developer", "ArtistyCode Studio", "text-foreground"],
            [
              "Cache Policy",
              "Zero Cache (Sensitive)",
              "text-red-700 dark:text-red-300",
            ],
            [
              "Vault Reveals Audited",
              "Yes ✓",
              "text-emerald-700 dark:text-emerald-300",
            ],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center gap-2"
            >
              <span className="text-muted-foreground shrink-0">{label}</span>
              {label === "Developer" ? (
                <a
                  href="https://www.artistycode.studio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-w-0 items-center gap-1.5 font-bold truncate hover:text-primary ${color}`}
                >
                  <span className="truncate">{value}</span>
                  <ExternalLink
                    className="h-3.5 w-3.5 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </a>
              ) : (
                <span className={`font-bold truncate ${color}`}>{value}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
