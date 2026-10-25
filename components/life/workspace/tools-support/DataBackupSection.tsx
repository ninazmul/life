"use client";

import React, { useState } from "react";
import {
  Database,
  Download,
  Upload,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCode,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportLifeBackup, restoreLifeBackup } from "@/lib/actions/lifeSettings.actions";

interface DataBackupSectionProps {
  lastBackupDate?: string | null;
  onRefresh?: () => void;
}

export function DataBackupSection({ lastBackupDate, onRefresh }: DataBackupSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restorePayload, setRestorePayload] = useState<string>("");
  const [parsedData, setParsedData] = useState<any | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonString = await exportLifeBackup();
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `life_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Encrypted backup downloaded successfully");
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.data) {
          toast.error("Invalid backup structure: Missing 'data' object.");
          return;
        }
        setRestorePayload(text);
        setParsedData(parsed);
      } catch {
        toast.error("Selected file is not valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restorePayload) return;
    setIsRestoring(true);
    try {
      const res = await restoreLifeBackup(restorePayload);
      if (res.success) {
        toast.success("Database restored successfully from backup");
        setShowRestoreModal(false);
        setRestorePayload("");
        setParsedData(null);
        onRefresh?.();
      }
    } catch (err: any) {
      toast.error(err.message || "Restore failed");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Distinction Alert Card */}
      <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-start gap-3">
        <Database className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-purple-950 font-normal leading-relaxed">
          <p className="font-bold text-purple-900">Account Recovery vs. System Backup</p>
          <p className="text-slate-600">
            Exporting a backup allows you to safeguard your records offline. It does not replace Account Recovery or continuous Guardian consensus.
          </p>
        </div>
      </div>

      {/* Backup Status Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1E1B4B]">Backup Status</h3>
              <p className="text-[11px] text-slate-500">Encrypted offline database archive</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[#1E1B4B]">Last Successful Export</p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {lastBackupDate
                ? new Date(lastBackupDate).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "No manual export generated yet"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Generating Export..." : "Export Full Backup (JSON)"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRestoreModal(true)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Restore From File</span>
          </button>
        </div>
      </div>

      {/* RESTORE MODAL */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-[#1E1B4B]">Restore Database Backup</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestorePayload("");
                  setParsedData(null);
                }}
                className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Caution: Overwrite Protection
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed font-normal">
                Restoring a previous backup updates records from the archive. Revoked access, used single-use recovery codes, and pending release timers will be reconciled.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Choose JSON Backup File</label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {parsedData && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                <p className="font-bold text-[#1E1B4B]">Archive Summary:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                  <span>Exported: {parsedData.exportedAt?.slice(0, 10) || "Unknown"}</span>
                  <span>People: {parsedData.data?.people?.length || 0}</span>
                  <span>Assets: {parsedData.data?.assets?.length || 0}</span>
                  <span>Vault Items: {parsedData.data?.vaultItems?.length || 0}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestorePayload("");
                  setParsedData(null);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!restorePayload || isRestoring}
                onClick={handleConfirmRestore}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {isRestoring ? "Restoring..." : "Confirm & Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
