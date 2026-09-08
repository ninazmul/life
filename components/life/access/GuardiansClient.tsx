/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  History,
  Settings,
  Users,
  Building,
  KeyRound,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ILifeGuardian,
  ILifeEmergencyRequest,
  ILifePerson,
  ApprovalRule,
  GuardianType,
  EmergencyReason,
} from "@/types";
import {
  assignGuardian,
  removeGuardian,
  updateGuardianConfig,
} from "@/lib/actions/lifeGuardian.actions";
import {
  createEmergencyRequest,
  approveEmergencyRequest,
  rejectEmergencyRequest,
  cancelEmergencyRequest,
  activateEmergencyNow,
} from "@/lib/actions/lifeEmergencyRequest.actions";
import toast from "react-hot-toast";

interface GuardiansClientProps {
  guardians: ILifeGuardian[];
  emergencyConfig: any;
  emergencyHistory: ILifeEmergencyRequest[];
  people: ILifePerson[];
  isOwner?: boolean;
  isAdmin?: boolean;
  isGuardian?: boolean;
  currentPersonId?: string;
}

export function GuardiansClient({
  guardians: initialGuardians,
  emergencyConfig: initialConfig,
  emergencyHistory: initialHistory,
  people,
  isOwner = false,
  isAdmin = false,
  isGuardian = false,
  currentPersonId,
}: GuardiansClientProps) {
  const [guardians, setGuardians] = useState(initialGuardians);
  const [config, setConfig] = useState(initialConfig);
  const [history, setHistory] = useState(initialHistory);

  // Assign Guardian Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedGuardianType, setSelectedGuardianType] = useState<GuardianType>("primary");
  const [guardianNotes, setGuardianNotes] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Emergency Request Modal
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [reason, setReason] = useState<EmergencyReason>("owner_seriously_ill");
  const [reasonDetails, setReasonDetails] = useState("");
  const [requestingEmergency, setRequestingEmergency] = useState(false);

  // Config Modal
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [rule, setRule] = useState<ApprovalRule>(config?.guardianApprovalRule || "any_two_of_three");
  const [waitingHours, setWaitingHours] = useState(config?.defaultWaitingPeriodHours || 72);
  const [savingConfig, setSavingConfig] = useState(false);

  const activeRequest = history.find(
    (h) => h.status === "pending_approval" || h.status === "partially_approved" || h.status === "waiting_period"
  );

  const handleAssignGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;
    setAssigning(true);
    try {
      const res = await assignGuardian(selectedPersonId, selectedGuardianType, guardianNotes);
      if (res.success && res.guardian) {
        toast.success("Guardian assigned successfully!");
        setGuardians([res.guardian, ...guardians]);
        setAssignModalOpen(false);
      } else {
        toast.error(res.error || "Failed to assign guardian");
      }
    } catch {
      toast.error("Error assigning guardian");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveGuardian = async (personId: string) => {
    if (!confirm("Are you sure you want to revoke guardian designation for this person?")) return;
    try {
      const res = await removeGuardian(personId);
      if (res.success) {
        toast.success("Guardian removed");
        setGuardians(guardians.filter((g) => String((g.personId as any)?._id || g.personId) !== personId));
      } else {
        toast.error(res.error || "Failed to remove guardian");
      }
    } catch {
      toast.error("Error removing guardian");
    }
  };

  const handleCreateEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonDetails) {
      toast.error("Please explain the emergency circumstance in detail.");
      return;
    }
    setRequestingEmergency(true);
    try {
      const res = await createEmergencyRequest({ reason, reasonDetails });
      if (res.success && res.request) {
        toast.success("Emergency request submitted! Alerts sent to Owner channels.");
        setHistory([res.request, ...history]);
        setEmergencyModalOpen(false);
        setReasonDetails("");
      } else {
        toast.error(res.error || "Failed to submit request");
      }
    } catch {
      toast.error("Error creating emergency request");
    } finally {
      setRequestingEmergency(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const res = await approveEmergencyRequest(requestId);
      if (res.success && res.request) {
        toast.success("Approval recorded!");
        setHistory(history.map((h) => (h._id === requestId ? res.request : h)));
      } else {
        toast.error(res.error || "Failed to approve request");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const handleReject = async (requestId: string) => {
    const reasonText = prompt("Please enter the reason for rejection:");
    if (!reasonText) return;
    try {
      const res = await rejectEmergencyRequest(requestId, reasonText);
      if (res.success) {
        toast.success("Request rejected");
        setHistory(history.map((h) => (h._id === requestId ? { ...h, status: "rejected" as const } : h)));
      } else {
        toast.error(res.error || "Failed to reject request");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const handleCancelByOwner = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this Emergency Protocol? All normal restrictions will be restored.")) return;
    try {
      const res = await cancelEmergencyRequest(requestId);
      if (res.success) {
        toast.success("Emergency protocol cancelled. System normal.");
        setHistory(history.map((h) => (h._id === requestId ? { ...h, status: "cancelled" as const } : h)));
      } else {
        toast.error(res.error || "Failed to cancel");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await updateGuardianConfig({
        approvalRule: rule,
        defaultWaitingPeriodHours: Number(waitingHours),
        ownerAlertChannels: ["email"],
      });
      if (res.success) {
        toast.success("Guardian configuration updated!");
        setConfig(res.config);
        setConfigModalOpen(false);
      } else {
        toast.error(res.error || "Failed to update config");
      }
    } catch {
      toast.error("Error saving config");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Trusted Guardians & Emergency Access
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Guardian trust framework, multi-party authorization & emergency release protocols
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(isOwner || isAdmin) && (
            <>
              <Button
                variant="outline"
                onClick={() => setConfigModalOpen(true)}
                className="rounded-xl border-border text-xs"
              >
                <Settings className="w-4 h-4 mr-1.5" />
                Rules & Waiting Period
              </Button>

              <Button
                onClick={() => setAssignModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Designate Guardian
              </Button>
            </>
          )}

          {(isGuardian || isOwner || isAdmin) && (
            <Button
              onClick={() => setEmergencyModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm text-xs"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Request Emergency Release
            </Button>
          )}
        </div>
      </div>

      {/* Active Request Alert / Banner */}
      {activeRequest && (
        <div className="p-5 rounded-3xl border-2 border-red-500/40 bg-red-500/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  Active Emergency Request in Progress ({activeRequest.status.replace("_", " ")})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Initiated by {activeRequest.requestedByName} for reason:{" "}
                  <span className="font-bold text-foreground capitalize">
                    {activeRequest.reason.replace(/_/g, " ")}
                  </span>
                </p>
              </div>
            </div>

            {isOwner && (
              <Button
                onClick={() => handleCancelByOwner(activeRequest._id)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs"
              >
                Cancel Protocol (I Am Safe)
              </Button>
            )}
          </div>

          <p className="text-sm bg-background/80 p-3 rounded-2xl border border-red-500/20 text-foreground/90">
            {activeRequest.reasonDetails}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-red-500/20">
            <div className="flex items-center gap-2">
              <span className="font-bold">Approvals recorded:</span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-extrabold">
                {activeRequest.approvals.filter((a) => a.action === "approve").length}
              </span>
            </div>

            {activeRequest.waitingPeriodEnd && (
              <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                <Clock className="w-4 h-4" />
                Waiting Period ends: {new Date(activeRequest.waitingPeriodEnd).toLocaleString()}
              </div>
            )}

            {/* If caller is guardian and has not approved yet */}
            {isGuardian &&
              currentPersonId &&
              String(activeRequest.requestedByPersonId) !== String(currentPersonId) &&
              !activeRequest.approvals.some((a) => String(a.guardianPersonId) === String(currentPersonId)) && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(activeRequest._id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
                  >
                    Approve Release
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(activeRequest._id)}
                    className="rounded-xl text-xs text-red-600"
                  >
                    Reject
                  </Button>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Guardians List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground">
            Designated Guardians ({guardians.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Rule: {config?.guardianApprovalRule || "Any Two of Three Guardians"}
          </span>
        </div>

        {guardians.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
            <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No Guardians designated yet. Designate 2 or 3 trusted individuals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {guardians.map((g) => {
              const person = g.personId as any;
              return (
                <div
                  key={g._id}
                  className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold uppercase">
                        {g.guardianType} Guardian
                      </span>
                      <h3 className="text-base font-bold text-foreground mt-2">
                        {person?.name || "Guardian"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {person?.relation || "Trusted Contact"}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                    <p>{person?.phone || "No phone"}</p>
                    <p>{person?.email || "No email"}</p>
                  </div>

                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleRemoveGuardian(String(person?._id || g.personId))}
                      className="text-[11px] text-red-500 hover:text-red-700 transition-colors pt-1"
                    >
                      Revoke Guardian Access
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History Timeline */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-extrabold text-foreground">
          Emergency Activation Log
        </h2>

        {history.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-border bg-card text-xs text-muted-foreground">
            No emergency requests on record.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((req) => (
              <div
                key={req._id}
                className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground capitalize">
                      {req.reason.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full uppercase font-bold text-[10px] ${
                        req.status === "activated"
                          ? "bg-red-500/10 text-red-600"
                          : req.status === "cancelled"
                          ? "bg-slate-500/10 text-muted-foreground"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-muted-foreground">
                    Requested by {req.requestedByName} on{" "}
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-muted-foreground">
                  Approvals: {req.approvals.length}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Designate Guardian Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Designate Trusted Guardian</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAssignGuardian} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Select Person *</label>
              <select
                required
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Person</option>
                {people.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.relation})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Guardian Tier</label>
              <select
                value={selectedGuardianType}
                onChange={(e) => setSelectedGuardianType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="primary">Primary Guardian</option>
                <option value="secondary">Secondary Guardian</option>
                <option value="independent">Independent Guardian</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Notes / Instructions</label>
              <textarea
                value={guardianNotes}
                onChange={(e) => setGuardianNotes(e.target.value)}
                placeholder="Specific guidance for this guardian..."
                className="w-full h-20 p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assigning}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {assigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Designation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Emergency Request Modal */}
      <Dialog open={emergencyModalOpen} onOpenChange={setEmergencyModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600">
              Initiate Emergency Release Protocol
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateEmergency} className="space-y-4 mt-2">
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300">
              Initiating this protocol will notify all Owner channels and require approval from another Guardian before protected instructions are unlocked.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="owner_seriously_ill">Owner Seriously Ill</option>
                <option value="owner_hospitalized">Owner Hospitalized</option>
                <option value="owner_unreachable">Owner Unreachable</option>
                <option value="owner_missing">Owner Missing</option>
                <option value="owner_unable_to_decide">Owner Unable to Make Decisions</option>
                <option value="owner_deceased">Owner Deceased</option>
                <option value="other">Other Emergency</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Circumstance & Details *
              </label>
              <textarea
                required
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder="Explain the situation in full detail..."
                className="w-full h-24 p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmergencyModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={requestingEmergency}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {requestingEmergency ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Emergency Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rules Config Modal */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Guardian Approval Rules</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveConfig} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Approval Rule</label>
              <select
                value={rule}
                onChange={(e) => setRule(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="any_two_of_three">Any Two of Three Guardians (Recommended)</option>
                <option value="two_guardians">Two Guardians Approval</option>
                <option value="one_guardian">One Guardian Approval</option>
                <option value="owner_manual">Owner Manual Release Only</option>
                <option value="guardian_with_waiting">Guardian Approval with Waiting Period</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Default Waiting Period (Hours)
              </label>
              <Input
                type="number"
                min="1"
                value={waitingHours}
                onChange={(e) => setWaitingHours(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfigModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingConfig}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Configuration
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
