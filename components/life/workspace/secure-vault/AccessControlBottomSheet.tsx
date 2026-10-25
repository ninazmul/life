"use client";

import React, { useState } from "react";
import {
  X,
  Eye,
  Download,
  Edit3,
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  UnifiedSecureVaultItem,
  updateVaultPermission,
} from "@/lib/actions/lifeWorkspace.actions";

interface AccessControlBottomSheetProps {
  item: UnifiedSecureVaultItem;
  isOpen: boolean;
  onClose: () => void;
  onPermissionUpdated: () => void;
}

export function AccessControlBottomSheet({
  item,
  isOpen,
  onClose,
  onPermissionUpdated,
}: AccessControlBottomSheetProps) {
  const details = item.details?.accessControl;

  const [canView, setCanView] = useState<boolean>(details?.canView ?? true);
  const [canDownload, setCanDownload] = useState<boolean>(details?.canDownload ?? false);
  const [canEdit, setCanEdit] = useState<boolean>(details?.canEdit ?? false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  if (!isOpen || !details) return null;

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      const res = await updateVaultPermission(item.id, {
        canView,
        canDownload,
        canEdit,
      });

      if (res.success) {
        toast.success("Permission updated successfully");
        onPermissionUpdated();
        onClose();
      } else {
        toast.error(res.error || "Failed to update permission");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm(`Are you sure you want to revoke access for ${details.personName}?`)) {
      return;
    }

    try {
      setIsRevoking(true);
      const res = await updateVaultPermission(item.id, {
        isRevoked: true,
      });

      if (res.success) {
        toast.success(`Access revoked for ${details.personName}`);
        onPermissionUpdated();
        onClose();
      } else {
        toast.error(res.error || "Failed to revoke access");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content matching Mockup Screen 5 */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Handle */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
              {details.personName} — {details.targetRecordTitle}
            </h3>
            <p className="text-xs text-slate-500">Manage individual record permissions</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Permission Switches matching Mockup Screen 5 */}
        <div className="p-5 space-y-3.5">
          {/* View Toggle */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">View</p>
                <p className="text-[11px] text-slate-400">Can open and inspect record</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCanView(!canView)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                canView ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  canView ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Download Toggle */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Download</p>
                <p className="text-[11px] text-slate-400">Can download original file attachments</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCanDownload(!canDownload)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                canDownload ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  canDownload ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Edit Toggle */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Edit</p>
                <p className="text-[11px] text-slate-400">Can update details and file versions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCanEdit(!canEdit)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                canEdit ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  canEdit ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons matching Mockup Screen 5 */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
            className="flex-1 h-12 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            {isUpdating ? "Saving..." : "Edit Permission"}
          </button>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isRevoking}
            className="flex-1 h-12 rounded-2xl border border-rose-200 bg-white dark:bg-slate-800 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {isRevoking ? "Revoking..." : "Revoke"}
          </button>
        </div>
      </div>
    </div>
  );
}
