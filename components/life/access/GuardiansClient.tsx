/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronLeft,
  Phone,
  Mail,
  Star,
  Vote,
  Scale,
} from "lucide-react";
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

const guardianTypeStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  primary: { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", border: "border-indigo-100/60", label: "Primary" },
  secondary: { bg: "bg-[#E0F2FE]", text: "text-[#0284C7]", border: "border-sky-100/60", label: "Secondary" },
  independent: { bg: "bg-[#F5F3FF]", text: "text-[#7C3AED]", border: "border-violet-100/60", label: "Independent" },
};

const statusStyles: Record<string, string> = {
  activated: "bg-[#FEE2E2] text-[#DC2626] border border-red-100/60",
  cancelled: "bg-slate-50 text-slate-500 border border-slate-100/60",
  rejected: "bg-[#FEE2E2] text-[#DC2626] border border-red-100/60",
  pending_approval: "bg-[#FEF3C7] text-[#D97706] border border-amber-100/60",
  partially_approved: "bg-[#FEF3C7] text-[#D97706] border border-amber-100/60",
  waiting_period: "bg-[#E0F2FE] text-[#0284C7] border border-sky-100/60",
};

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
  const router = useRouter();
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
    <div className="space-y-5 max-w-5xl mx-auto pb-16">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] tracking-tight">
                Trusted Guardians
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/60">
                {guardians.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Multi-party trust framework & emergency release protocols
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isOwner || isAdmin) && (
            <>
              <button
                onClick={() => setConfigModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] text-[#1E1B4B] text-xs font-medium hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Rules</span>
              </button>

              <button
                onClick={() => setAssignModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Designate</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Consensus Rule Summary Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#4F46E5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1E1B4B]">Consensus Rule</p>
              <p className="text-[11px] text-slate-500 capitalize">
                {(config?.guardianApprovalRule || "any_two_of_three").replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-[#4F46E5]">{guardians.length}</p>
              <p className="text-[10px] text-slate-400 font-medium">Guardians</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-lg font-bold text-[#1E1B4B]">{config?.defaultWaitingPeriodHours || 72}h</p>
              <p className="text-[10px] text-slate-400 font-medium">Wait Period</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-lg font-bold text-[#DC2626]">{history.filter(h => h.status === "activated").length}</p>
              <p className="text-[10px] text-slate-400 font-medium">Activated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Request Button (for guardians) */}
      {(isGuardian || isOwner || isAdmin) && (
        <button
          onClick={() => setEmergencyModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60 text-[#DC2626] text-xs font-bold hover:from-red-100 hover:to-rose-100 active:scale-[0.99] transition-all cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" />
          Request Emergency Release Protocol
        </button>
      )}

      {/* Active Request Alert / Banner */}
      {activeRequest && (
        <div className="p-5 rounded-2xl md:rounded-3xl border border-red-200/80 bg-gradient-to-br from-red-50/80 to-rose-50/50 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4.5 h-4.5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E1B4B]">
                  Active Emergency Request
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusStyles[activeRequest.status] || "bg-slate-50 text-slate-500"}`}>
                    {activeRequest.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    by {activeRequest.requestedByName}
                  </span>
                </div>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => handleCancelByOwner(activeRequest._id)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white border border-red-200/80 text-[#DC2626] text-[11px] font-bold hover:bg-red-50 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel (I Am Safe)
              </button>
            )}
          </div>

          <div className="text-xs bg-white/80 p-3 rounded-xl border border-red-100/40 text-slate-700 leading-relaxed">
            <span className="font-bold text-[#1E1B4B] capitalize">{activeRequest.reason.replace(/_/g, " ")}:</span>{" "}
            {activeRequest.reasonDetails}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-red-100/60">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Approvals:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-bold text-[11px] border border-indigo-100/60">
                {activeRequest.approvals.filter((a) => a.action === "approve").length}
              </span>
            </div>

            {activeRequest.waitingPeriodEnd && (
              <div className="flex items-center gap-1.5 text-[#D97706] font-medium">
                <Clock className="w-3.5 h-3.5" />
                Ends: {new Date(activeRequest.waitingPeriodEnd).toLocaleString()}
              </div>
            )}

            {/* If caller is guardian and has not approved yet */}
            {isGuardian &&
              currentPersonId &&
              String(activeRequest.requestedByPersonId) !== String(currentPersonId) &&
              !activeRequest.approvals.some((a) => String(a.guardianPersonId) === String(currentPersonId)) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(activeRequest._id)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(activeRequest._id)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white border border-red-200/80 text-[#DC2626] text-[11px] font-bold hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Guardians List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#4F46E5]" />
            Designated Guardians
          </h2>
        </div>

        {guardians.length === 0 ? (
          <div className="p-10 text-center rounded-2xl md:rounded-3xl border border-dashed border-slate-200 bg-white">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7 text-[#4F46E5]" />
            </div>
            <h3 className="text-sm font-bold text-[#1E1B4B] mb-1">No Guardians Designated</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Designate 2–3 trusted individuals to form your emergency consensus framework.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {guardians.map((g) => {
              const person = g.personId as any;
              const typeStyle = guardianTypeStyles[g.guardianType] || guardianTypeStyles.primary;
              const initials = (person?.name || "G")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={g._id}
                  className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-200/70 hover:shadow-md transition-all duration-200 group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border}`}>
                      {typeStyle.label} Guardian
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-600 font-medium">Verified</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center text-[#4F46E5] text-sm font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1E1B4B] truncate">
                        {person?.name || "Guardian"}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">
                        {person?.relation || "Trusted Contact"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-500">
                    {person?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{person.phone}</span>
                      </div>
                    )}
                    {person?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{person.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Voting weight badge */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <Vote className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span className="text-[11px] font-medium text-slate-600">
                        Voting Weight: <span className="font-bold text-[#4F46E5]">{g.guardianType === "primary" ? "High" : g.guardianType === "secondary" ? "Medium" : "Standard"}</span>
                      </span>
                    </div>
                  </div>

                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleRemoveGuardian(String(person?._id || g.personId))}
                      className="mt-3 w-full h-8 rounded-xl bg-red-50/80 border border-red-100/60 text-[11px] font-bold text-[#DC2626] hover:bg-red-100 active:scale-[0.98] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
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

      {/* Emergency Activation History */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
          <History className="w-4 h-4 text-[#D97706]" />
          Emergency Activation Log
        </h2>

        {history.length === 0 ? (
          <div className="p-8 text-center rounded-2xl md:rounded-3xl border border-dashed border-slate-200 bg-white">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
              <History className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs text-slate-500">
              No emergency requests on record.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_1px_6px_rgba(30,27,75,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-200/70 transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    req.status === "activated" ? "bg-[#FEE2E2]" : req.status === "cancelled" ? "bg-slate-50" : "bg-[#FEF3C7]"
                  }`}>
                    {req.status === "activated" ? (
                      <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
                    ) : req.status === "cancelled" ? (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#D97706]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#1E1B4B] capitalize">
                        {req.reason.replace(/_/g, " ")}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusStyles[req.status] || "bg-slate-50 text-slate-500"}`}>
                        {req.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      by {req.requestedByName} · {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full border border-indigo-100/60">
                    {req.approvals.length} Approval{req.approvals.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Designate Guardian Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 border-0 overflow-hidden">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <DialogTitle className="text-base font-bold text-[#1E1B4B]">
                  Designate Trusted Guardian
                </DialogTitle>
              </div>
            </DialogHeader>

            <form onSubmit={handleAssignGuardian} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1B4B]">Select Person *</label>
                <select
                  required
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5] transition-all"
                >
                  <option value="">Select Person</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1B4B]">Guardian Tier</label>
                <select
                  value={selectedGuardianType}
                  onChange={(e) => setSelectedGuardianType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5] transition-all"
                >
                  <option value="primary">Primary Guardian</option>
                  <option value="secondary">Secondary Guardian</option>
                  <option value="independent">Independent Guardian</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1B4B]">Notes / Instructions</label>
                <textarea
                  value={guardianNotes}
                  onChange={(e) => setGuardianNotes(e.target.value)}
                  placeholder="Specific guidance for this guardian..."
                  className="w-full h-20 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5] transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="h-9 px-4 rounded-xl bg-white border border-slate-200/80 text-xs font-medium text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {assigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Designation
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Request Modal */}
      <Dialog open={emergencyModalOpen} onOpenChange={setEmergencyModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 border-0 overflow-hidden">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                </div>
                <DialogTitle className="text-base font-bold text-[#DC2626]">
                  Initiate Emergency Protocol
                </DialogTitle>
              </div>
            </DialogHeader>

            <form onSubmit={handleCreateEmergency} className="space-y-4">
              <div className="p-3 rounded-xl bg-red-50/80 border border-red-100/60 text-[11px] text-[#DC2626] leading-relaxed">
                This protocol will notify all Owner channels and require approval from another Guardian before protected instructions are unlocked.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1B4B]">Reason *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1B4B]">
                  Circumstance & Details *
                </label>
                <textarea
                  required
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  placeholder="Explain the situation in full detail..."
                  className="w-full h-24 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-[#1E1B4B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEmergencyModalOpen(false)}
                  className="h-9 px-4 rounded-xl bg-white border border-slate-200/80 text-xs font-medium text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingEmergency}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {requestingEmergency && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Emergency Request
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rules Config Modal */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 border-0 overflow-hidden">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <DialogTitle className="text-base font-bold text-[#1E1B4B]">
                  Guardian Approval Rules
                </DialogTitle>
              </div>
            </DialogHeader>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1B4B]">Approval Rule</label>
                <select
                  value={rule}
                  onChange={(e) => setRule(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5] transition-all"
                >
                  <option value="any_two_of_three">Any Two of Three Guardians (Recommended)</option>
                  <option value="two_guardians">Two Guardians Approval</option>
                  <option value="one_guardian">One Guardian Approval</option>
                  <option value="owner_manual">Owner Manual Release Only</option>
                  <option value="guardian_with_waiting">Guardian Approval with Waiting Period</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1E1B4B]">
                  Default Waiting Period (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={waitingHours}
                  onChange={(e) => setWaitingHours(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5] transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="h-9 px-4 rounded-xl bg-white border border-slate-200/80 text-xs font-medium text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
