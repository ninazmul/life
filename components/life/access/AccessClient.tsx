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

interface AccessClientProps {
  emergencyState: ILifeEmergencyAccess;
  people: ILifePerson[];
}

export function AccessClient({ emergencyState: initialEmergency, people: initialPeople }: AccessClientProps) {
  const [emergency, setEmergency] = useState(initialEmergency);
  const [people, setPeople] = useState(initialPeople);
  const [loading, setLoading] = useState(false);

  // Emergency settings
  const [primaryAdminEmail, setPrimaryAdminEmail] = useState(
    emergency.primaryAdminEmail || ""
  );
  const [secondaryAdminEmail, setSecondaryAdminEmail] = useState(
    emergency.secondaryAdminEmail || ""
  );
  const [instructions, setInstructions] = useState(
    emergency.instructions || ""
  );
  const [reason, setReason] = useState("");

  const handleToggleEmergency = async () => {
    const nextState = !emergency.isEmergencyActive;
    if (nextState && !confirm("Are you sure you want to ACTIVATE Emergency Mode? This will unlock designated continuity records.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await toggleEmergencyMode(nextState, reason);
      setEmergency({ ...emergency, isEmergencyActive: res.isEmergencyActive });
      toast.success(
        res.isEmergencyActive
          ? "Emergency Mode has been ACTIVATED."
          : "Emergency Mode has been DEACTIVATED."
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
    currentVal: boolean
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
        people.map((p) => (p._id === personId ? { ...p, permissions: newPerms } : p))
      );
      toast.success(`Updated permissions for ${person.name}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update permissions.");
    }
  };

  const handleRoleChange = async (personId: string, newRole: LifeRole) => {
    const person = people.find((p) => p._id === personId);
    if (!person) return;

    try {
      await updatePersonRoleAndPermissions(personId, newRole, person.permissions);
      setPeople(
        people.map((p) => (p._id === personId ? { ...p, role: newRole } : p))
      );
      toast.success(`Role updated to ${newRole.toUpperCase()} for ${person.name}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update role.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Access Control & Emergency Mode
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Emergency protocol delegation, resource authorization rules, and instant emergency trigger.
        </p>
      </div>

      {/* Emergency Mode Card */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          emergency.isEmergencyActive
            ? "bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/30"
            : "bg-white dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
                emergency.isEmergencyActive
                  ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Emergency Mode State
                </h3>
                <span
                  className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                    emergency.isEmergencyActive
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {emergency.isEmergencyActive ? "ACTIVE PROTOCOL" : "STANDBY"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {emergency.isEmergencyActive
                  ? "Emergency mode is ACTIVE. Designated trusted people have access to authorized instructions."
                  : "Normal state. Sensitive emergency instructions and locked documents remain concealed."}
              </p>
            </div>
          </div>

          <Button
            onClick={handleToggleEmergency}
            disabled={loading}
            className={`h-10 px-4 rounded-xl text-xs font-bold gap-2 ${
              emergency.isEmergencyActive
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : emergency.isEmergencyActive ? (
              <>
                <ShieldCheck className="w-4 h-4" /> Deactivate Emergency
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" /> Trigger Emergency Mode
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Delegation Protocol Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Delegated Emergency Admins</span>
        </h3>

        <form onSubmit={handleSaveProtocol} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Primary Emergency Admin Email
              </label>
              <Input
                required
                type="email"
                placeholder="e.g. wife@gmail.com"
                value={primaryAdminEmail}
                onChange={(e) => setPrimaryAdminEmail(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Secondary Emergency Admin Email
              </label>
              <Input
                type="email"
                placeholder="e.g. brother@gmail.com"
                value={secondaryAdminEmail}
                onChange={(e) => setSecondaryAdminEmail(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              General Emergency Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:outline-none"
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Individual User Access Matrix
        </h3>

        <div className="rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {people.map((p) => (
            <div key={p._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {p.name}
                  </h4>
                  <span className="text-[11px] text-slate-400">({p.relation})</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.email || "No Clerk email linked"}</p>
              </div>

              {/* Role Select & Permission Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={p.role}
                  onChange={(e) => handleRoleChange(p._id, e.target.value as LifeRole)}
                  className="h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 text-xs font-medium focus:outline-none"
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
                      p.permissions?.canViewFinancial || false
                    )
                  }
                  className={`h-7 px-2.5 text-[10px] rounded-lg border ${
                    p.permissions?.canViewFinancial
                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
                      : "border-slate-800 text-slate-500"
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
                      p.permissions?.canViewBusiness || false
                    )
                  }
                  className={`h-7 px-2.5 text-[10px] rounded-lg border ${
                    p.permissions?.canViewBusiness
                      ? "border-cyan-500/40 bg-cyan-950/40 text-cyan-400"
                      : "border-slate-800 text-slate-500"
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
                      p.permissions?.canRevealVault || false
                    )
                  }
                  className={`h-7 px-2.5 text-[10px] rounded-lg border ${
                    p.permissions?.canRevealVault
                      ? "border-amber-500/40 bg-amber-950/40 text-amber-400"
                      : "border-slate-800 text-slate-500"
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
