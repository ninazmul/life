/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ILifeEmergencyAccess,
  ILifePerson,
  LifeRole,
  LifePermission,
} from "@/types";
import {
  toggleEmergencyMode,
  updateEmergencyProtocol,
  updatePersonRoleAndPermissions,
} from "@/lib/actions/lifeAccess.actions";
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
}

export function AccessClient({
  emergencyState: initialEmergency,
  people: initialPeople,
  isOwner = false,
  isDesignated = false,
  canAccessEmergency = false,
  currentUserEmail = "",
}: AccessClientProps) {
  const [emergency, setEmergency] = useState(initialEmergency);
  const [people, setPeople] = useState(initialPeople);
  const [loading, setLoading] = useState(false);

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

  const canTrigger = isDesignated || canAccessEmergency;
  const canReset = isDesignated || canAccessEmergency || isOwner;

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

  const handleRoleChange = async (personId: string, newRole: LifeRole) => {
    const person = people.find((p) => p._id === personId);
    if (!person) return;

    const isSuper = newRole === "super_admin" || newRole === "owner";
    const newPerms: LifePermission = isSuper ? DEFAULT_OWNER_PERMS : person.permissions;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Access Control & Emergency Mode
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Emergency protocol delegation, resource authorization rules, and
          instant emergency trigger.
        </p>
      </div>

      {/* Emergency Mode Card */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          emergency.isEmergencyActive
            ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/60 shadow-lg shadow-red-950/10 dark:shadow-red-950/30"
            : "bg-secondary border border-border"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
                emergency.isEmergencyActive
                  ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/40 animate-pulse"
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
                    emergency.isEmergencyActive
                      ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/40"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {emergency.isEmergencyActive ? "ACTIVE PROTOCOL" : "STANDBY"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {emergency.isEmergencyActive
                  ? "Emergency mode is ACTIVE. Designated trusted people have access to authorized instructions."
                  : "Normal state. Sensitive emergency instructions and locked documents remain concealed."}
              </p>
            </div>
          </div>

          {emergency.isEmergencyActive ? (
            <Button
              onClick={handleToggleEmergency}
              disabled={loading || !canReset}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
              title="Reset Emergency Mode to Standby"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Reset Emergency Mode
                </>
              )}
            </Button>
          ) : isOwner ? (
            <Button
              disabled
              className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-muted/60 text-muted-foreground border border-border cursor-not-allowed opacity-80"
              title="Main User cannot trigger Emergency Mode. Only designated Emergency Contacts can activate this when you are no longer available."
            >
              <Lock className="w-4 h-4" /> Trigger Locked (Main User)
            </Button>
          ) : canTrigger ? (
            <Button
              onClick={handleToggleEmergency}
              disabled={loading}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40 active:scale-95 transition-all"
              title="Activate Emergency Mode"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" /> Trigger Emergency Mode
                </>
              )}
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
        {emergency.isEmergencyActive ? (
          <div className="mt-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-700 dark:text-red-300">
                Emergency Protocol is currently ACTIVE
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Continuity instructions, emergency contacts, and private directives have been unsealed for trustees.
                {canReset
                  ? " As an authorized emergency contact or administrator, you can click \"Reset Emergency Mode\" above to reseal all emergency records and return the system to normal Standby."
                  : ""}
              </p>
            </div>
          </div>
        ) : isOwner ? (
          <div className="mt-4 p-3.5 rounded-2xl bg-card/70 dark:bg-muted/30 border border-border text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">Main User Safety Lock:</span> As the primary owner (Main User) of this Life Vault, you cannot trigger Emergency Mode. In the event that you are no longer available, your designated Emergency Contacts below (Primary / Secondary Admin) can trigger this protocol to unseal continuity directives. Designated emergency contacts can also reset the protocol at any time.
            </div>
          </div>
        ) : isDesignated ? (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-muted-foreground leading-relaxed">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">Authorized Emergency Contact:</span> You are designated to act if the Main User is no longer available. You have full authority to activate Emergency Mode to unlock continuity instructions, and you can reset it whenever necessary.
            </div>
          </div>
        ) : null}
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
                  <option value="business">Business</option>
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
    </div>
  );
}
