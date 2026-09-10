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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setVaultPin,
  exportLifeBackup,
} from "@/lib/actions/lifeSettings.actions";
import { usePWA } from "@/components/life/PWAProvider";
import toast from "react-hot-toast";

interface SettingsClientProps {
  settings: Record<string, unknown> | null;
}

export function SettingsClient({ settings: _settings }: SettingsClientProps) {
  const { isInstalled, isInstallable, isIOS, installApp } = usePWA();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleInstallPWA = async () => {
    setInstalling(true);
    try {
      const outcome = await installApp();
      if (outcome === "accepted") {
        toast.success(
          "Installation accepted! Your phone is adding Life to your home screen or app drawer.",
          { duration: 6000 },
        );
        setShowGuide(true);
      } else if (outcome === "ios_instructions") {
        setShowGuide(true);
        toast("Follow the steps below to add Life to your Home Screen", {
          icon: "📱",
        });
      } else if (outcome === "unsupported") {
        setShowGuide(true);
        toast("See installation steps for your browser below", { icon: "ℹ️" });
      }
    } catch {
      setShowGuide(true);
    } finally {
      setInstalling(false);
    }
  };

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

      <section className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
              <Smartphone
                className="w-5 h-5 shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground truncate">
                  Progressive Web App (PWA)
                </h3>
                {isInstalled && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Install Life as a native app for fast one-tap home screen access
                and offline safety.
              </p>
            </div>
          </div>

          {/* Primary Install Button */}
          <div className="shrink-0 flex items-center gap-2">
            {isInstalled ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Installed on this device</span>
              </div>
            ) : (
              <Button
                onClick={handleInstallPWA}
                disabled={installing}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs gap-2 transition-all active:scale-95"
              >
                {installing ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Download className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                )}
                <span>Install Life App</span>
              </Button>
            )}
          </div>
        </div>

        {/* 3 Status indicator cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
            <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
              Install Status
            </span>
            <div
              className={`flex items-center gap-1.5 font-bold ${isInstalled ? "text-emerald-700 dark:text-emerald-300" : "text-emerald-600 dark:text-emerald-400"}`}
            >
              {isInstalled ? (
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0 text-emerald-500"
                  strokeWidth={2}
                />
              ) : isInstallable ? (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              ) : (
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0"
                  strokeWidth={2}
                />
              )}
              <span>
                {isInstalled
                  ? "Installed (Native App)"
                  : isInstallable
                    ? "Ready to Install"
                    : isIOS
                      ? "Installable (Safari)"
                      : "Browser Mode"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
            <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
              Service Worker
            </span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2
                className="w-3.5 h-3.5 shrink-0 text-emerald-500"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Zero-Cache Active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
            <span className="text-muted-foreground font-medium uppercase text-[10px] tracking-wider block">
              Offline Safe APIs
            </span>
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
              <AlertCircle
                className="w-3.5 h-3.5 shrink-0 text-amber-500"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Online Required</span>
            </div>
          </div>
        </div>

        {/* Expandable / Toggleable step-by-step installation instructions */}
        <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Step-by-step installation guide (iOS, Android & Desktop)
              </span>
            </div>
            {showGuide ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showGuide && (
            <div className="px-4 pb-4 pt-1 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                  <span>iOS (iPhone & iPad)</span>
                </div>
                <ol className="text-muted-foreground space-y-1 text-[11px] list-decimal list-inside leading-relaxed">
                  <li>
                    Open Life in <strong>Safari</strong>
                  </li>
                  <li>
                    Tap the <strong>Share</strong> button (square with arrow)
                  </li>
                  <li>
                    Scroll down and tap{" "}
                    <strong>&quot;Add to Home Screen&quot;</strong>
                  </li>
                  <li>
                    Tap <strong>Add</strong> in top right
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Android (Chrome / Edge)</span>
                </div>
                <ol className="text-muted-foreground space-y-1 text-[11px] list-decimal list-inside leading-relaxed">
                  <li>
                    Click <strong>&quot;Install Life App&quot;</strong> above
                  </li>
                  <li>Or tap menu (3 dots) in Chrome</li>
                  <li>
                    Tap <strong>&quot;Install app&quot;</strong> or &quot;Add to
                    Home screen&quot;
                  </li>
                  <li>Confirm installation</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Laptop className="w-3.5 h-3.5 text-purple-500" />
                  <span>Desktop (Mac / Windows)</span>
                </div>
                <ol className="text-muted-foreground space-y-1 text-[11px] list-decimal list-inside leading-relaxed">
                  <li>
                    In Chrome/Edge address bar, look for the{" "}
                    <strong>Install</strong> icon (⊕ or computer)
                  </li>
                  <li>
                    Click <strong>&quot;Install Life&quot;</strong>
                  </li>
                  <li>Launch directly from your Dock or Start Menu</li>
                </ol>
              </div>

              {/* Troubleshooting Card */}
              <div className="md:col-span-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Don&apos;t see the icon on your phone after installing?
                    Check these 4 places:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div className="p-2.5 rounded-lg bg-card/70 border border-border space-y-1">
                    <p className="font-semibold text-foreground">
                      1. Swipe Up to Open App Drawer
                    </p>
                    <p>
                      Most modern phones (Samsung, Xiaomi, Pixel) place new apps
                      into the <strong>All Apps drawer</strong> by default, not
                      on the desktop. Swipe up from your home screen and search
                      for &quot;Life&quot;.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card/70 border border-border space-y-1">
                    <p className="font-semibold text-foreground">
                      2. Check Notification Shade
                    </p>
                    <p>
                      Pull down your notification bar. Chrome often shows a
                      notification saying <em>&quot;Adding Life...&quot;</em>{" "}
                      that needs a few seconds to complete.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card/70 border border-border space-y-1">
                    <p className="font-semibold text-foreground">
                      3. Check Launcher Permission
                    </p>
                    <p>
                      On Xiaomi/MIUI, Vivo, or Oppo: Open phone{" "}
                      <strong>
                        Settings → Apps → Chrome → Other permissions
                      </strong>{" "}
                      and turn on{" "}
                      <strong>&quot;Home screen shortcuts&quot;</strong>.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card/70 border border-border space-y-1">
                    <p className="font-semibold text-foreground">
                      4. Manual Browser Menu (Always Works)
                    </p>
                    <p>
                      In Chrome or Edge, tap the{" "}
                      <strong>3 dots menu (⋮)</strong> in the top right, then
                      tap <strong>&quot;Install app&quot;</strong> or{" "}
                      <strong>&quot;Add to Home screen&quot;</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="p-3.5 rounded-2xl bg-accent border border-border text-xs text-muted-foreground leading-relaxed space-y-1">
          <p className="text-amber-700 dark:text-amber-300 font-medium flex items-start gap-1.5">
            <Shield
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>
              Zero-Cache Policy: Vault passwords, financial logs, and encrypted
              notes are never saved into browser cache, ensuring full privacy
              even if your device is inspected.
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
            ["Developer", "RIZMEC", "text-foreground"],
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
                  href="https://www.rizmec.com/"
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
