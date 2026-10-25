"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Settings2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getRecoveryGuardiansData,
  inviteRecoveryGuardian,
  updateRecoveryApprovalRule,
  removeRecoveryGuardian,
} from "@/lib/actions/lifeToolsSupport.actions";

interface RecoveryGuardiansSectionProps {
  onRefresh?: () => void;
}

export function RecoveryGuardiansSection({ onRefresh }: RecoveryGuardiansSectionProps) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Invite Form State
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [guardianType, setGuardianType] = useState<"primary" | "secondary" | "independent">("primary");
  const [inviteNotes, setInviteNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rule Form State
  const [approvalRule, setApprovalRule] = useState("any_two_of_three");
  const [waitingHours, setWaitingHours] = useState(72);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getRecoveryGuardiansData();
      if (res.success && res.data) {
        setData(res.data);
        setApprovalRule(res.data.approvalRule || "any_two_of_three");
        setWaitingHours(res.data.defaultWaitingHours || 72);
      }
    } catch (err) {
      console.error("Error loading recovery guardians:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) {
      toast.error("Please select a person from your directory");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inviteRecoveryGuardian({
        personId: selectedPersonId,
        guardianType,
        notes: inviteNotes,
      });

      if (res.success) {
        toast.success("Recovery Guardian appointed successfully");
        setShowInviteModal(false);
        setSelectedPersonId("");
        setInviteNotes("");
        fetchData();
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to appoint guardian");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateRecoveryApprovalRule({
        approvalRule,
        waitingPeriodHours: Number(waitingHours),
      });

      if (res.success) {
        toast.success("Recovery approval consensus rules updated");
        setShowRuleModal(false);
        fetchData();
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to update rule");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (personId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} as a Recovery Guardian?`)) return;
    try {
      const res = await removeRecoveryGuardian(personId);
      if (res.success) {
        toast.success(`${name} removed as Recovery Guardian`);
        fetchData();
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to remove guardian");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  const guardians = data?.guardians || [];
  const availablePeople = data?.availablePeople || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Scope Distinction Notice */}
      <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-indigo-950 font-normal leading-relaxed">
          <p className="font-bold text-indigo-900">Recovery Guardian vs. Continuity Guardian</p>
          <p className="text-slate-600">
            Recovery Guardians only help you regain access if you lose your phone or password. They do not have access to your Master Vault or future-locked records.
          </p>
        </div>
      </div>

      {/* Consensus Rule Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1E1B4B]">Approval Consensus Rule</h3>
              <p className="text-[11px] text-slate-500">Required guardian confirmations for recovery</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRuleModal(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Edit Rule</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Approvals</p>
            <p className="text-xs font-bold text-[#1E1B4B] mt-0.5">
              {approvalRule === "all_guardians_unanimous"
                ? "Unanimous Consensus"
                : approvalRule === "any_single_guardian"
                ? "1 of any Guardian"
                : "2 of 3 Accepted Guardians"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety Waiting Period</p>
            <p className="text-xs font-bold text-[#1E1B4B] mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              {waitingHours} Hours
            </p>
          </div>
        </div>
      </div>

      {/* Guardians List */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] border border-sky-100 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1E1B4B]">Active Recovery Guardians</h3>
              <p className="text-[11px] text-slate-500">
                {guardians.length} authorized guardian{guardians.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading guardians...</div>
        ) : guardians.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 space-y-2">
            <p>No recovery guardians appointed yet.</p>
            <p className="text-slate-500 max-w-xs mx-auto">
              Appoint at least 2 trusted individuals from your People directory to guarantee safe account recovery.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            {guardians.map((g: any) => {
              const person = g.personId || {};
              const personId = person._id || g.personId;
              return (
                <div
                  key={g._id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100/70 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {person.name?.[0]?.toUpperCase() || "G"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[#1E1B4B] truncate">{person.name || "Guardian"}</p>
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                          {g.guardianType || "primary"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{person.email || person.relationship || "Verified Contact"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Accepted
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(personId, person.name || "Guardian")}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center justify-center text-slate-400 shadow-xs"
                      title="Remove Guardian"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Invite Recovery Guardian */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-[#1E1B4B]">Invite Recovery Guardian</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Select Person</label>
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden bg-white"
                  required
                >
                  <option value="">-- Choose from Directory --</option>
                  {availablePeople.map((p: any) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relationship || "Contact"}) - {p.email || "No email"}
                    </option>
                  ))}
                </select>
                {availablePeople.length === 0 && (
                  <p className="text-[10px] text-amber-600 pt-0.5">
                    All people in your directory are already assigned or none available.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Guardian Role</label>
                <select
                  value={guardianType}
                  onChange={(e: any) => setGuardianType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden bg-white"
                >
                  <option value="primary">Primary (Immediate vote weight)</option>
                  <option value="secondary">Secondary (Backup reviewer)</option>
                  <option value="independent">Independent (Third-party/Advisor)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Verification Note</label>
                <textarea
                  rows={2}
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  placeholder="Optional note or verification guidelines..."
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPersonId}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  Appoint Guardian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Consensus Rule */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-[#1E1B4B]">Consensus Rule</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRuleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Approval Consensus</label>
                <select
                  value={approvalRule}
                  onChange={(e) => setApprovalRule(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden bg-white"
                >
                  <option value="any_two_of_three">2 of 3 Accepted Guardians Required</option>
                  <option value="all_guardians_unanimous">All Guardians Unanimous</option>
                  <option value="any_single_guardian">Any Single Guardian (Fast-track)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Waiting Period (Hours)</label>
                <input
                  type="number"
                  min={12}
                  max={168}
                  value={waitingHours}
                  onChange={(e) => setWaitingHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-[#1E1B4B] focus:border-indigo-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 pt-0.5">Recommended: 72 hours (3 days)</p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
