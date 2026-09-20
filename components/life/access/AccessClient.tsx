/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  AlertTriangle,
  Lock,
  Unlock,
  Save,
  CheckCircle2,
  Loader2,
  Clock,
  History,
  FastForward,
  XCircle,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ILifeEmergencyAccess,
  ILifePerson,
  LifeRole,
  LifePermission,
  ILifeEmergencyRecoveryEvent,
} from "@/types";
import {
  toggleEmergencyMode,
  updateEmergencyProtocol,
  updatePersonRoleAndPermissions,
} from "@/lib/actions/lifeAccess.actions";
import {
  triggerEmergencyRecoveryButton,
  cancelEmergencyRecovery,
  fastForwardRecoverySimulation,
  getActiveRecoveryEvent,
  getRecoveryEventsHistory,
} from "@/lib/actions/lifeEmergencyRecovery.actions";
import toast from "react-hot-toast";

const DEFAULT_OWNER_PERMS: LifePermission = {
  canViewPersonal: true,
  canViewBusiness: true,
  canViewFinancial: true,
  canViewSensitive: true,
  canRevealVault: true,
  canManageAccess: true,
  canAccessEmergency: true,
};

interface AccessClientProps {
  emergencyState: ILifeEmergencyAccess;
  people: ILifePerson[];
  isOwner?: boolean;
  isDesignated?: boolean;
  canAccessEmergency?: boolean;
  currentUserEmail?: string;
  initialActiveRecovery?: ILifeEmergencyRecoveryEvent | null;
  initialSecondsRemaining?: number;
  recoveryHistory?: ILifeEmergencyRecoveryEvent[];
}

export function AccessClient({
  emergencyState: initialEmergency,
  people: initialPeople,
  isOwner = false,
  isDesignated = false,
  canAccessEmergency = false,
  currentUserEmail = "",
  initialActiveRecovery = null,
  initialSecondsRemaining = 0,
  recoveryHistory: initialHistory = [],
}: AccessClientProps) {
  const [emergency, setEmergency] = useState(initialEmergency);
  const [people, setPeople] = useState(initialPeople);
  const [loading, setLoading] = useState(false);

  // Recovery 48h state
  const [activeRecovery, setActiveRecovery] = useState<ILifeEmergencyRecoveryEvent | null>(
    initialActiveRecovery,
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    initialSecondsRemaining,
  );
  const [history, setHistory] = useState<ILifeEmergencyRecoveryEvent[]>(initialHistory);

  // Modals state
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [triggerReason, setTriggerReason] = useState("");
  const [confirmUnavailable, setConfirmUnavailable] = useState(false);
  const [isSubmittingTrigger, setIsSubmittingTrigger] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelPin, setCancelPin] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  // Emergency settings
  const [primaryAdminEmail, setPrimaryAdminEmail] = useState(
    emergency.primaryAdminEmail || "",
  );
  const [secondaryAdminEmail, setSecondaryAdminEmail] = useState(
    emergency.secondaryAdminEmail || "",
  );
  const [instructions, setInstructions] = useState(
    emergency.instructions || "",
  );
  const [reason, setReason] = useState("");

  function formatCountdown(totalSeconds: number): string {
    if (totalSeconds <= 0) return "00h : 00m : 00s";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}h : ${minutes.toString().padStart(2, "0")}m : ${seconds.toString().padStart(2, "0")}s`;
  }

  // Active countdown timer
  useEffect(() => {
    if (
      !activeRecovery ||
      (activeRecovery.status !== "EMERGENCY_PENDING" &&
        activeRecovery.status !== "VAULT_LOCKED_PENDING")
    )
      return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshRecoveryData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRecovery]);

  const refreshRecoveryData = async () => {
    try {
      const [res, hist] = await Promise.all([
        getActiveRecoveryEvent(),
        getRecoveryEventsHistory(),
      ]);
      setActiveRecovery(res.activeEvent);
      setSecondsRemaining(res.secondsRemaining);
      setHistory(hist);
    } catch (err) {
      console.error("Failed to refresh recovery data:", err);
    }
  };

  const handleTriggerRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmUnavailable) {
      toast.error("Please confirm that the owner is unavailable.");
      return;
    }

    setIsSubmittingTrigger(true);
    try {
      const res = await triggerEmergencyRecoveryButton({
        reason: triggerReason || "Emergency assistance requested / Owner unavailable",
      });
      if (!res.success) {
        throw new Error(res.error || "Failed to trigger emergency recovery.");
      }
      setTriggerModalOpen(false);
      setTriggerReason("");
      setConfirmUnavailable(false);
      await refreshRecoveryData();
      toast.success(
        "Emergency Recovery Activated! 48-Hour countdown started. Notification sent to Super Admins.",
        { duration: 6000 }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger emergency recovery.");
    } finally {
      setIsSubmittingTrigger(false);
    }
  };

  const handleCancelRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelPin.trim()) {
      toast.error("Master Security PIN is required.");
      return;
    }

    if (!activeRecovery?._id) {
      toast.error("No active recovery event found.");
      return;
    }

    setIsCancelling(true);
    try {
      const res = await cancelEmergencyRecovery({
        eventId: activeRecovery._id,
        verificationPin: cancelPin,
        reason: "Owner cancelled recovery via Access Control",
      });
      if (!res.success) {
        throw new Error(res.error || "Failed to cancel emergency recovery.");
      }
      setActiveRecovery(null);
      setSecondsRemaining(0);
      setEmergency((prev) => ({
        ...prev,
        isEmergencyActive: false,
        recoveryState: "NORMAL",
        vaultRecoveryState: "VAULT_NORMAL",
        isVaultLocked: false,
        consecutiveVaultFailures: 0,
        activeRecoveryEventId: undefined,
      }));
      setCancelModalOpen(false);
      setCancelPin("");
      await refreshRecoveryData();
      toast.success("Emergency Recovery CANCELLED. System resealed and returned to Standby.");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel emergency recovery.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleFastForward = async (hours: number = 48) => {
    if (!activeRecovery?._id) {
      toast.error("No active recovery event to fast forward.");
      return;
    }
    if (
      !confirm(
        `[Test Simulation] Fast-forward server simulation clock by +${hours} hours? This simulates the 48-hour cancellation period expiring.`
      )
    ) {
      return;
    }

    setIsFastForwarding(true);
    try {
      const res = await fastForwardRecoverySimulation({
        eventId: activeRecovery._id,
        hours,
      });
      if (!res.success) {
        throw new Error(res.error || "Fast-forward simulation failed.");
      }
      await refreshRecoveryData();
      toast.success(`Fast-forwarded simulation clock by +${hours} hours.`);
    } catch (err: any) {
      toast.error(err.message || "Fast-forward simulation failed.");
    } finally {
      setIsFastForwarding(false);
    }
  };

  const handleToggleEmergency = async () => {
    const nextState = !emergency.isEmergencyActive;

    // Safety guard: Main user cannot trigger emergency mode
    if (nextState && isOwner) {
      toast.error(
        "Main User cannot trigger Emergency Mode. It can only be activated by your designated Emergency Contacts.",
      );
      return;
    }

    if (
      nextState &&
      !confirm(
        "Are you sure you want to ACTIVATE Emergency Mode? This will unlock designated continuity records and emergency instructions for trustees.",
      )
    ) {
      return;
    }

    if (
      !nextState &&
      !confirm(
        "Are you sure you want to RESET Emergency Mode? All emergency-gated records will be resealed.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await toggleEmergencyMode(nextState, reason);
      setEmergency({ ...emergency, isEmergencyActive: res.isEmergencyActive });
      toast.success(
        res.isEmergencyActive
          ? "Emergency Mode has been ACTIVATED."
          : "Emergency Mode has been RESET to Standby.",
      );
      setReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle emergency mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateEmergencyProtocol({
        primaryAdminEmail,
        secondaryAdminEmail,
        instructions,
      });
      setEmergency(updated);
      toast.success("Emergency delegation protocol saved.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save emergency protocol.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (
    personId: string,
    field: keyof LifePermission,
    currentVal: boolean,
  ) => {
    const person = people.find((p) => p._id === personId);
    if (!person) return;

    const newPerms = {
      ...(person.permissions || {
        canViewPersonal: false,
        canViewBusiness: false,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
      }),
      [field]: !currentVal,
    };

    try {
      await updatePersonRoleAndPermissions(personId, person.role, newPerms);
      setPeople(
        people.map((p) =>
          p._id === personId ? { ...p, permissions: newPerms } : p,
        ),
      );
      toast.success(`Updated permissions for ${person.name}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update permissions.");
    }
  };

const getRoleDefaultPermissions = (role: LifeRole): LifePermission => {
  switch (role) {
    case "owner":
    case "super_admin":
      return {
        canViewPersonal: true,
        canViewBusiness: true,
        canViewFinancial: true,
        canViewSensitive: true,
        canRevealVault: true,
        canManageAccess: true,
        canAccessEmergency: true,
      };
    case "admin":
      return {
        canViewPersonal: true,
        canViewBusiness: true,
        canViewFinancial: true,
        canViewSensitive: true,
        canRevealVault: false,
        canManageAccess: true,
        canAccessEmergency: false,
      };
    case "guardian":
      return {
        canViewPersonal: true,
        canViewBusiness: false,
        canViewFinancial: false,
        canViewSensitive: true,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: true,
      };
    case "business_partner":
      return {
        canViewPersonal: false,
        canViewBusiness: true,
        canViewFinancial: true,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
      };
    case "business_staff":
      return {
        canViewPersonal: false,
        canViewBusiness: true,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
      };
    case "read_only":
      return {
        canViewPersonal: true,
        canViewBusiness: true,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
      };
    case "individual":
    default:
      return {
        canViewPersonal: true,
        canViewBusiness: false,
        canViewFinancial: false,
        canViewSensitive: false,
        canRevealVault: false,
        canManageAccess: false,
        canAccessEmergency: false,
      };
  }
};

  const handleRoleChange = async (personId: string, newRole: LifeRole) => {
    const person = people.find((p) => p._id === personId);
    if (!person) return;

    const newPerms = getRoleDefaultPermissions(newRole);

    try {
      await updatePersonRoleAndPermissions(
        personId,
        newRole,
        newPerms,
      );
      setPeople(
        people.map((p) =>
          p._id === personId ? { ...p, role: newRole, permissions: newPerms } : p
        ),
      );
      toast.success(
        `Role updated to ${newRole.toUpperCase()} for ${person.name}`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update role.");
    }
  };

  const canTrigger = isDesignated || canAccessEmergency;
  const canReset = isDesignated || canAccessEmergency || isOwner;

  const isPendingRecovery =
    activeRecovery?.status === "EMERGENCY_PENDING" ||
    activeRecovery?.status === "VAULT_LOCKED_PENDING";
  const isContinuityActivated =
    emergency.isEmergencyActive ||
    activeRecovery?.status === "EMERGENCY_ACTIVATED" ||
    activeRecovery?.status === "VAULT_RECOVERY_ACTIVATED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Access Control & Emergency Mode
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Emergency protocol delegation, 48-hour continuity recovery, and master security controls.
        </p>
      </div>

      {/* 48-HOUR ACTIVE EMERGENCY / VAULT RECOVERY BANNER */}
      {isPendingRecovery && activeRecovery && (
        <div className="p-5 sm:p-6 rounded-3xl border-2 border-red-500/80 bg-linear-to-br from-red-500/10 via-amber-500/10 to-red-500/15 shadow-xl shadow-red-950/20 backdrop-blur-xs space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-600 text-white shadow-xs">
                    {activeRecovery.eventType === "vault_failed_attempts"
                      ? "Vault Lockout Countdown"
                      : "48-Hour Countdown Active"}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-red-700 dark:text-red-300 mt-0.5">
                  {activeRecovery.eventType === "vault_failed_attempts"
                    ? "Vault Lockout Recovery — 48 Hours Remaining"
                    : "Emergency Recovery Activated — 48 Hours Remaining"}
                </h2>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-2 bg-red-950/80 dark:bg-black/70 border border-red-500/40 px-4 py-2.5 rounded-2xl shrink-0 shadow-inner">
              <Clock className="w-4 h-4 text-red-400 animate-spin" style={{ animationDuration: "3s" }} />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-bold text-red-400">
                  Time Until Access Policy Activates
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-red-100 tracking-wider">
                  {formatCountdown(secondsRemaining)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-foreground/90 leading-relaxed">
            All configured Super Admin and Owner accounts have been notified via email.
            During this 48-hour cancellation period, an authorized Super Admin can cancel the event using their Master Security PIN to reseal the system.
            If not cancelled, the predefined Emergency Continuity Access Policy will activate automatically.
          </p>

          {/* Trigger Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-card/60 dark:bg-slate-900/60 border border-border">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Triggered By</span>
              <p className="font-bold text-foreground mt-0.5">
                {activeRecovery.triggeredBy?.name || "Emergency Contact"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeRecovery.triggeredBy?.email || "Unknown"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-card/60 dark:bg-slate-900/60 border border-border">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Date & Time</span>
              <p className="font-bold text-foreground mt-0.5">
                {new Date(activeRecovery.triggeredAt).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(activeRecovery.triggeredAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-card/60 dark:bg-slate-900/60 border border-border">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Device & Network</span>
              <p className="font-bold text-foreground mt-0.5 truncate" title={activeRecovery.deviceInfo?.userAgent}>
                {activeRecovery.deviceInfo?.userAgent?.split(" ")[0] || "Web Client"}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                IP: {activeRecovery.deviceInfo?.ip || "127.0.0.1"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-card/60 dark:bg-slate-900/60 border border-border">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Reason Stated</span>
              <p className="font-medium text-foreground mt-0.5 line-clamp-2" title={activeRecovery.reason}>
                {activeRecovery.reason || "Standard emergency button activation."}
              </p>
            </div>
          </div>

          {/* Banner Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCancelModalOpen(true)}
                className="h-9 px-4 rounded-xl text-xs font-bold gap-2 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/30"
              >
                <KeyRound className="w-3.5 h-3.5" /> Cancel Recovery Event (Master PIN)
              </Button>
            </div>

            {/* Test Simulation Controls */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                Testing Controls:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFastForward(48)}
                disabled={isFastForwarding}
                className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                title="Simulate 48 hours passing to test policy activation"
              >
                {isFastForwarding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FastForward className="w-3.5 h-3.5" />
                )}
                Advance +48h (Test Simulation)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONTINUITY ACTIVATED BANNER */}
      {isContinuityActivated && !isPendingRecovery && (
        <div className="p-5 sm:p-6 rounded-3xl border-2 border-emerald-500/80 bg-emerald-500/10 shadow-lg shadow-emerald-950/10 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                  Emergency Continuity Access Policy is ACTIVE
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Predefined emergency directives and records are unsealed for designated trustees. Owner-only private records remain protected.
                  {activeRecovery?.emergencyAccessPolicy?.accessExpiresAt && (
                    <span className="font-semibold text-foreground ml-1">
                      (Access window expires: {new Date(activeRecovery.emergencyAccessPolicy.accessExpiresAt).toLocaleString()})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setCancelModalOpen(true)}
              className="h-8.5 px-3.5 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5" /> Reset Protocol (Master PIN)
            </Button>
          </div>
        </div>
      )}

      {/* Emergency Mode Card */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          isContinuityActivated
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/50 shadow-md"
            : isPendingRecovery
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/40"
            : "bg-secondary border border-border"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
                isContinuityActivated
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40"
                  : isPendingRecovery
                  ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40 animate-pulse"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Emergency Mode State
                </h3>
                <span
                  className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                    isContinuityActivated
                      ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40"
                      : isPendingRecovery
                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {isContinuityActivated
                    ? "CONTINUITY ACTIVATED"
                    : isPendingRecovery
                    ? "RECOVERY PENDING (48H)"
                    : "STANDBY"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isContinuityActivated
                  ? "Continuity directives are unsealed. Designated emergency contacts have scoped access."
                  : isPendingRecovery
                  ? "Emergency recovery has been initiated. 48-hour cancellation countdown is running."
                  : "Normal standby state. Sensitive instructions and locked documents remain concealed."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isPendingRecovery ? (
            <Button
              onClick={() => setCancelModalOpen(true)}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-red-600 hover:bg-red-500 text-white shadow-md active:scale-95 transition-all"
            >
              <XCircle className="w-4 h-4" /> Cancel Recovery (Master PIN)
            </Button>
          ) : isContinuityActivated ? (
            <Button
              onClick={() => setCancelModalOpen(true)}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
            >
              <ShieldCheck className="w-4 h-4" /> Reseal & Reset Standby
            </Button>
          ) : isOwner ? (
            <Button
              disabled
              className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-muted/60 text-muted-foreground border border-border cursor-not-allowed opacity-80"
              title="Main User cannot trigger Emergency Mode on themselves. Only designated Emergency Contacts can activate this when you are no longer available."
            >
              <Lock className="w-4 h-4" /> Trigger Locked (Main User)
            </Button>
          ) : canTrigger ? (
            <Button
              onClick={() => setTriggerModalOpen(true)}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40 active:scale-95 transition-all"
              title="Activate Emergency Recovery Protocol (48-Hour Cancellation Window)"
            >
              <ShieldAlert className="w-4 h-4" /> Activate Emergency (48h Protocol)
            </Button>
          ) : (
            <Button
              disabled
              className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-muted/60 text-muted-foreground border border-border cursor-not-allowed opacity-80"
              title="Only designated Emergency Contacts can trigger Emergency Mode."
            >
              <Lock className="w-4 h-4" /> Restricted to Emergency Contact
            </Button>
          )}
        </div>

        {/* Informative Contextual Security Banners */}
        {isOwner && !isPendingRecovery && !isContinuityActivated && (
          <div className="mt-4 p-3.5 rounded-2xl bg-card/70 dark:bg-muted/30 border border-border text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">Main User Safety Lock:</span> As the primary owner of this Life Vault, you cannot trigger Emergency Mode on yourself. In the event that you are no longer available, your designated Emergency Contacts below can initiate the 48-Hour Emergency Recovery sequence. Super Admins can cancel the countdown at any point with their Master PIN.
            </div>
          </div>
        )}

        {isDesignated && !isPendingRecovery && !isContinuityActivated && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-muted-foreground leading-relaxed">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">Authorized Emergency Contact:</span> You are designated to act if the Main User is unavailable. Activating the Emergency Button initiates a 48-hour recovery countdown, sends email alerts to Super Admins, and unlocks designated continuity records when the period concludes.
            </div>
          </div>
        )}
      </div>

      {/* Delegation Protocol Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-secondary border border-border space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
          <span>Delegated Emergency Admins</span>
        </h3>

        <form onSubmit={handleSaveProtocol} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Primary Emergency Admin Email
              </label>
              <Input
                required
                type="email"
                placeholder="e.g. wife@gmail.com"
                value={primaryAdminEmail}
                onChange={(e) => setPrimaryAdminEmail(e.target.value)}
                className="h-10 border-border bg-card text-foreground text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Secondary Emergency Admin Email
              </label>
              <Input
                type="email"
                placeholder="e.g. brother@gmail.com"
                value={secondaryAdminEmail}
                onChange={(e) => setSecondaryAdminEmail(e.target.value)}
                className="h-10 border-border bg-card text-foreground text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              General Emergency Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="h-8.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> Save Delegation
            </Button>
          </div>
        </form>
      </div>

      {/* Permissions Matrix for People */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Individual User Access Matrix
        </h3>

        <div className="rounded-3xl bg-secondary border border-border divide-y divide-border overflow-hidden">
          {people.map((p) => (
            <div
              key={p._id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground">
                    {p.name}
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    ({p.relation})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {p.email || "No Clerk email linked"}
                </p>
              </div>

              {/* Role Select & Permission Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={p.role}
                  onChange={(e) =>
                    handleRoleChange(p._id, e.target.value as LifeRole)
                  }
                  className="h-8 px-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none"
                >
                  <option value="individual">Individual</option>
                  <option value="guardian">Guardian</option>
                  <option value="business_staff">Business Staff</option>
                  <option value="business_partner">Business Partner</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="read_only">Read Only</option>
                </select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handlePermissionChange(
                      p._id,
                      "canViewFinancial",
                      p.permissions?.canViewFinancial || false,
                    )
                  }
                  className={`h-7 px-2.5 text-[10px] rounded-lg border ${
                    p.permissions?.canViewFinancial
                      ? "border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Financial {p.permissions?.canViewFinancial ? "✓" : "✕"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handlePermissionChange(
                      p._id,
                      "canViewBusiness",
                      p.permissions?.canViewBusiness || false,
                    )
                  }
                  className={`h-7 px-2.5 text-[10px] rounded-lg border ${
                    p.permissions?.canViewBusiness
                      ? "border-cyan-200 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Business {p.permissions?.canViewBusiness ? "✓" : "✕"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handlePermissionChange(
                      p._id,
                      "canRevealVault",
                      p.permissions?.canRevealVault || false,
                    )
                  }
                  className={`h-7 px-2.5 text-[10px] rounded-lg border ${
                    p.permissions?.canRevealVault
                      ? "border-amber-200 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Vault Reveal {p.permissions?.canRevealVault ? "✓" : "✕"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EMERGENCY RECOVERY AUDIT HISTORY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Emergency Recovery Audit Trail</span>
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {history.length} event{history.length === 1 ? "" : "s"} logged
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-6 rounded-3xl bg-secondary/50 border border-border text-center text-xs text-muted-foreground">
            No emergency recovery events recorded in system history.
          </div>
        ) : (
          <div className="rounded-3xl bg-secondary border border-border overflow-hidden divide-y divide-border">
            {history.map((ev) => (
              <div key={ev._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        ev.status === "EMERGENCY_PENDING" || ev.status === "VAULT_LOCKED_PENDING"
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse"
                          : ev.status === "EMERGENCY_ACTIVATED" || ev.status === "VAULT_RECOVERY_ACTIVATED"
                          ? "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
                          : ev.status === "CANCELLED"
                          ? "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30"
                          : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {ev.status}
                    </span>
                    <span className="font-bold text-foreground">
                      {ev.eventType === "vault_failed_attempts"
                        ? "Master Vault 15 Failed PINs Lockout"
                        : "Emergency Button Activated"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Triggered by <span className="font-semibold text-foreground">{ev.triggeredBy?.name || "Contact"}</span> ({ev.triggeredBy?.email || "N/A"}) on {new Date(ev.triggeredAt).toLocaleString()}
                  </p>
                  {ev.reason && (
                    <p className="text-[11px] text-muted-foreground italic">
                      &ldquo;{ev.reason}&rdquo;
                    </p>
                  )}
                  {ev.cancelledBy && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Cancelled by {ev.cancelledBy.name || "Super Admin"} on {ev.cancelledBy.cancelledAt ? new Date(ev.cancelledBy.cancelledAt).toLocaleString() : "N/A"}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    IP: {ev.deviceInfo?.ip || "Unknown"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRIGGER RECOVERY MODAL */}
      <Dialog open={triggerModalOpen} onOpenChange={setTriggerModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-border bg-card text-foreground shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Activate Emergency Recovery Protocol
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Initiates a server-side 48-hour cancellation countdown.
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleTriggerRecovery} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-muted-foreground space-y-1.5">
              <p className="font-bold text-amber-800 dark:text-amber-300">
                Notice on 48-Hour Recovery Sequence:
              </p>
              <p>
                1. Immediate email alerts will be dispatched to all configured Super Admin/Owner accounts.
              </p>
              <p>
                2. A 48-hour cancellation period begins immediately.
              </p>
              <p>
                3. Predefined continuity access policy activates only after 48 hours if uncancelled.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Reason / Situation Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Owner is hospitalized and unreachable. Continuity directives required for medical care."
                value={triggerReason}
                onChange={(e) => setTriggerReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={confirmUnavailable}
                onChange={(e) => setConfirmUnavailable(e.target.checked)}
                className="mt-0.5 rounded border-border text-red-600 focus:ring-red-500"
              />
              <span>
                I confirm that the Owner is unavailable and activating Emergency Continuity is required.
              </span>
            </label>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTriggerModalOpen(false)}
                disabled={isSubmittingTrigger}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingTrigger || !confirmUnavailable}
                className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white gap-2"
              >
                {isSubmittingTrigger ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                Activate 48h Recovery
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CANCEL RECOVERY MODAL (SUPER ADMIN MASTER PIN) */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-border bg-card text-foreground shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Super Admin Cancellation Re-verification
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Cancel emergency event, reseal records, and restore standby state.
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCancelRecovery} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-muted border border-border text-xs text-muted-foreground">
              Cancelling will immediately return the system to Standby, reset vault lockouts, reseal continuity records, and send email confirmations to all configured administrators.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Master Security PIN
              </label>
              <Input
                type="password"
                required
                autoFocus
                placeholder="Enter Master Security PIN"
                value={cancelPin}
                onChange={(e) => setCancelPin(e.target.value)}
                className="h-10 text-sm tracking-widest font-mono"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
                className="rounded-xl text-xs"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isCancelling || !cancelPin.trim()}
                className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Verify PIN & Cancel Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
