"use client";

import React, { useState } from "react";
import {
  Settings,
  Globe,
  SunMoon,
  Coins,
  Timer,
  Bell,
  Save,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { updateAppPreferences } from "@/lib/actions/lifeToolsSupport.actions";

interface AppSettingsSectionProps {
  initialSettings?: any;
  onRefresh?: () => void;
}

export function AppSettingsSection({ initialSettings, onRefresh }: AppSettingsSectionProps) {
  const [currencySymbol, setCurrencySymbol] = useState(
    initialSettings?.currencySymbol || "৳"
  );
  const [autoConcealSeconds, setAutoConcealSeconds] = useState(
    initialSettings?.autoConcealVaultSeconds || 30
  );
  const [language, setLanguage] = useState("bn");
  const [theme, setTheme] = useState("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateAppPreferences({
        currencySymbol,
        autoConcealVaultSeconds: Number(autoConcealSeconds),
      });

      if (res.success) {
        toast.success("Preferences updated successfully");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to update preferences");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Regional & Language */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#1E1B4B]">Language & Region</h3>
            <p className="text-[11px] text-slate-500">Interface language and number formatting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Display Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden bg-white"
            >
              <option value="bn">বাংলা (Bengali)</option>
              <option value="en">English (US)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Currency Symbol</label>
            <select
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden bg-white font-mono"
            >
              <option value="৳">৳ (BDT - Bangladeshi Taka)</option>
              <option value="$">$ (USD - US Dollar)</option>
              <option value="€">€ (EUR - Euro)</option>
              <option value="£">£ (GBP - British Pound)</option>
              <option value="AED">AED (Emirati Dirham)</option>
              <option value="SAR">SAR (Saudi Riyal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Appearance & Display */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] border border-amber-100 flex items-center justify-center">
            <SunMoon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#1E1B4B]">Appearance</h3>
            <p className="text-[11px] text-slate-500">Color mode and visual theme</p>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-bold text-slate-700">Theme Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
              { id: "system", label: "System" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  theme === t.id
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Security Timeouts */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#1E1B4B]">Auto-Conceal Vault</h3>
            <p className="text-[11px] text-slate-500">Automatic secret redaction countdown</p>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-bold text-slate-700">Timeout Duration</label>
          <select
            value={autoConcealSeconds}
            onChange={(e) => setAutoConcealSeconds(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden bg-white"
          >
            <option value={15}>15 Seconds (Strict Security)</option>
            <option value={30}>30 Seconds (Recommended)</option>
            <option value={60}>60 Seconds (1 Minute)</option>
            <option value={120}>120 Seconds (2 Minutes)</option>
          </select>
        </div>
      </div>

      {/* 4. Notification Preferences */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1E1B4B]">General Notifications</h3>
              <p className="text-[11px] text-slate-500">In-app reminder and activity alerts</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500"
          />
        </div>
        <p className="text-[11px] text-slate-400 font-normal">
          Note: Critical security alerts and emergency release notifications cannot be disabled.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
      </button>
    </form>
  );
}
