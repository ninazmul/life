/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Trash2,
  ChevronRight,
  ChevronLeft,
  Lock,
  Database,
  Code2,
  Eye,
  Zap,
} from "lucide-react";
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
  const router = useRouter();
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

  const systemConfig = [
    { label: "Security Model", value: "AES-256-GCM", color: "text-[#16A34A]", icon: <Lock className="w-3.5 h-3.5 text-[#16A34A]" /> },
    { label: "Auth Provider", value: "Clerk.dev", color: "text-[#1E1B4B]", icon: <Shield className="w-3.5 h-3.5 text-[#4F46E5]" /> },
    { label: "Database", value: "MongoDB Atlas", color: "text-[#1E1B4B]", icon: <Database className="w-3.5 h-3.5 text-[#0284C7]" /> },
    { label: "Framework", value: "Next.js App Router", color: "text-[#1E1B4B]", icon: <Code2 className="w-3.5 h-3.5 text-[#7C3AED]" /> },
    { label: "Developer", value: "RIZMEC", color: "text-[#1E1B4B]", isLink: true, icon: <Zap className="w-3.5 h-3.5 text-[#D97706]" /> },
    { label: "Cache Policy", value: "Zero Cache (Sensitive)", color: "text-[#DC2626]", icon: <Shield className="w-3.5 h-3.5 text-[#DC2626]" /> },
    { label: "Vault Reveals Audited", value: "Yes ✓", color: "text-[#16A34A]", icon: <Eye className="w-3.5 h-3.5 text-[#16A34A]" /> },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl bg-white border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#1E1B4B] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] tracking-tight">
              Settings & Security
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Master PIN, PWA install, and full data backup
            </p>
          </div>
        </div>
      </div>

      {/* PWA Section */}
      <section className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#16A34A]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1E1B4B] truncate">
                  Progressive Web App (PWA)
                </h3>
                {isInstalled && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] border border-emerald-100/60">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Install Life as a native app for fast one-tap home screen access.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isInstalled ? (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#DCFCE7] border border-emerald-100/60 text-[#16A34A] text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Installed</span>
              </div>
            ) : (
              <button
                onClick={handleInstallPWA}
                disabled={installing}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {installing ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Download className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                )}
                <span>Install Life App</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Status indicator cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 space-y-1">
            <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider block">
              Install Status
            </span>
            <div className={`flex items-center gap-1.5 font-bold ${isInstalled ? "text-[#16A34A]" : "text-[#4F46E5]"}`}>
              {isInstalled ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              ) : isInstallable ? (
                <span className="flex h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
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

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 space-y-1">
            <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider block">
              Service Worker
            </span>
            <div className="flex items-center gap-1.5 font-bold text-[#16A34A]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span>Zero-Cache Active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 space-y-1">
            <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider block">
              Offline Safe APIs
            </span>
            <div className="flex items-center gap-1.5 font-bold text-[#D97706]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span>Online Required</span>
            </div>
          </div>
        </div>

        {/* Expandable installation guide */}
        <div className="rounded-xl border border-slate-100/80 bg-slate-50/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-[#1E1B4B] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#4F46E5] shrink-0" />
              <span>Step-by-step installation guide (iOS, Android & Desktop)</span>
            </div>
            {showGuide ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showGuide && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-100/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1E1B4B]">
                  <Smartphone className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>iOS (iPhone & iPad)</span>
                </div>
                <ol className="text-slate-500 space-y-1 text-[11px] list-decimal list-inside leading-relaxed">
                  <li>Open Life in <strong>Safari</strong></li>
                  <li>Tap the <strong>Share</strong> button (square with arrow)</li>
                  <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                  <li>Tap <strong>Add</strong> in top right</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-100/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1E1B4B]">
                  <Smartphone className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Android (Chrome / Edge)</span>
                </div>
                <ol className="text-slate-500 space-y-1 text-[11px] list-decimal list-inside leading-relaxed">
                  <li>Click <strong>&quot;Install Life App&quot;</strong> above</li>
                  <li>Or tap menu (3 dots) in Chrome</li>
                  <li>Tap <strong>&quot;Install app&quot;</strong> or &quot;Add to Home screen&quot;</li>
                  <li>Confirm installation</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-100/80 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1E1B4B]">
                  <Laptop className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Desktop (Mac / Windows)</span>
                </div>
                <ol className="text-slate-500 space-y-1 text-[11px] list-decimal list-inside leading-relaxed">
                  <li>In Chrome/Edge address bar, look for the <strong>Install</strong> icon (⊕ or computer)</li>
                  <li>Click <strong>&quot;Install Life&quot;</strong></li>
                  <li>Launch directly from your Dock or Start Menu</li>
                </ol>
              </div>

              {/* Troubleshooting Card */}
              <div className="md:col-span-3 p-3.5 rounded-xl bg-[#FEF3C7]/60 border border-amber-200/60 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#D97706]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Don&apos;t see the icon on your phone after installing? Check these 4 places:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-100/60 space-y-1">
                    <p className="font-bold text-[#1E1B4B]">1. Swipe Up to Open App Drawer</p>
                    <p>Most modern phones (Samsung, Xiaomi, Pixel) place new apps into the <strong>All Apps drawer</strong> by default. Swipe up and search for &quot;Life&quot;.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-100/60 space-y-1">
                    <p className="font-bold text-[#1E1B4B]">2. Check Notification Shade</p>
                    <p>Pull down your notification bar. Chrome often shows a notification saying <em>&quot;Adding Life...&quot;</em> that needs a few seconds.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-100/60 space-y-1">
                    <p className="font-bold text-[#1E1B4B]">3. Check Launcher Permission</p>
                    <p>On Xiaomi/MIUI, Vivo, or Oppo: Open phone <strong>Settings → Apps → Chrome → Other permissions</strong> and turn on <strong>&quot;Home screen shortcuts&quot;</strong>.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-100/60 space-y-1">
                    <p className="font-bold text-[#1E1B4B]">4. Manual Browser Menu (Always Works)</p>
                    <p>In Chrome or Edge, tap the <strong>3 dots menu (⋮)</strong> then tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="p-3.5 rounded-xl bg-[#FEF3C7]/40 border border-amber-100/60 text-xs text-[#D97706] leading-relaxed flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} />
          <span>
            Zero-Cache Policy: Vault passwords, financial logs, and encrypted notes are never saved into browser cache, ensuring full privacy even if your device is inspected.
          </span>
        </div>
      </section>

      {/* Master Vault PIN */}
      <section className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#D97706]" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#1E1B4B] truncate">
              Master Vault PIN
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Required to reveal any encrypted vault secret. Stored hashed — never plaintext.
            </p>
          </div>
        </div>

        <form onSubmit={handleSetPin} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1E1B4B] block">
                New Vault PIN (min. 4 digits)
              </label>
              <input
                required
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={12}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-center font-mono tracking-[0.5em] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] transition-all"
                aria-label="New vault PIN input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1E1B4B] block">
                Confirm Vault PIN
              </label>
              <input
                required
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={12}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-center font-mono tracking-[0.5em] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] transition-all"
                aria-label="Confirm vault PIN input"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pinLoading}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#D97706] hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              aria-busy={pinLoading}
            >
              {pinLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Save className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              )}
              Set Vault PIN
            </button>
          </div>
        </form>
      </section>

      {/* Export Backup */}
      <section className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-[#4F46E5]" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#1E1B4B] truncate">
              Export Full Data Backup
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Download a complete JSON backup of all Life modules (People, Money, Business, Vault metadata, etc).
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FEE2E2]/60 border border-red-100/60 text-xs text-[#DC2626] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <p className="leading-relaxed">
            <strong>Security Notice:</strong>{" "}
            The backup includes vault item metadata but <strong>never</strong> decrypted secrets. Store the backup file in a secure encrypted location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={handleExportBackup}
            disabled={exportLoading}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
            aria-busy={exportLoading}
          >
            {exportLoading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            )}
            Download JSON Backup
          </button>

          <p className="text-xs text-slate-500 leading-snug">
            Includes People, Information, Business, Money, Assets, Contacts, Documents, Legacy (no vault secrets).
          </p>
        </div>
      </section>

      {/* Trash & Recovery System */}
      <section className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-6 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE4E6] flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-[#E11D48]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E1B4B]">Trash & Recovery System</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Recover accidentally deleted documents, vault records, profiles, or legacy messages.
              </p>
            </div>
          </div>
          <Link
            href="/settings/trash"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-xs font-bold text-[#1E1B4B] hover:bg-slate-50 active:scale-95 transition-all shrink-0 self-start sm:self-auto"
          >
            Open Trash <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* System Configuration */}
      <section className="bg-white rounded-2xl md:rounded-3xl p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          System Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {systemConfig.map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex justify-between items-center gap-2"
            >
              <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                {item.icon}
                {item.label}
              </span>
              {item.isLink ? (
                <a
                  href="https://www.rizmec.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-w-0 items-center gap-1.5 font-bold truncate hover:text-[#4F46E5] ${item.color}`}
                >
                  <span className="truncate">{item.value}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                </a>
              ) : (
                <span className={`font-bold truncate ${item.color}`}>{item.value}</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
