/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  FileText,
  User,
  Shield,
  Loader2,
  Calendar,
  Building2,
  ChevronDown,
  History,
  ArrowLeft,
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
  ILifeResponsibility,
  ILifeInstruction,
  ILifePerson,
  ILifeBusiness,
  UserResponsibilityResponse,
  ResponsibilityStatus,
} from "@/types";
import {
  createResponsibility,
  updateResponsibilityStatus,
  submitResponsibilityResponse,
} from "@/lib/actions/lifeResponsibility.actions";
import { createInstruction } from "@/lib/actions/lifeInstruction.actions";
import toast from "react-hot-toast";

interface InstructionsClientProps {
  responsibilities: ILifeResponsibility[];
  instructions: ILifeInstruction[];
  people: ILifePerson[];
  businesses: ILifeBusiness[];
  isOwner?: boolean;
  isAdmin?: boolean;
}

export function InstructionsClient({
  responsibilities: initialResponsibilities,
  instructions: initialInstructions,
  people,
  businesses,
  isOwner = false,
  isAdmin = false,
}: InstructionsClientProps) {
  const [responsibilities, setResponsibilities] = useState(initialResponsibilities);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [activeTab, setActiveTab] = useState<"responsibilities" | "instructions">("responsibilities");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Response Modal State
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedResp, setSelectedResp] = useState<ILifeResponsibility | null>(null);
  const [responseType, setResponseType] = useState<UserResponsibilityResponse>("accept");
  const [responseNote, setResponseNote] = useState("");
  const [responding, setResponding] = useState(false);

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    detailedInstruction: "",
    assignedPersonId: "",
    backupPersonId: "",
    relatedBusinessId: "",
    priority: "medium",
    deadline: "",
    ownerNote: "",
    visibilityMode: "available_now",
    instructionType: "personal",
  });

  const handleOpenResponse = (resp: ILifeResponsibility) => {
    setSelectedResp(resp);
    setResponseType(resp.userResponse || "accept");
    setResponseNote(resp.userResponseNote || "");
    setResponseModalOpen(true);
  };

  const handleSendResponse = async () => {
    if (!selectedResp) return;
    setResponding(true);
    try {
      const res = await submitResponsibilityResponse(
        selectedResp._id,
        responseType,
        responseNote
      );
      if (res.success) {
        toast.success("Response recorded successfully!");
        setResponsibilities((prev) =>
          prev.map((r) =>
            r._id === selectedResp._id
              ? {
                  ...r,
                  userResponse: responseType,
                  userResponseNote: responseNote,
                  responseDate: new Date(),
                }
              : r
          )
        );
        setResponseModalOpen(false);
      } else {
        toast.error(res.error || "Failed to submit response");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResponding(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: ResponsibilityStatus) => {
    try {
      const res = await updateResponsibilityStatus(id, status);
      if (res.success) {
        toast.success("Status updated!");
        setResponsibilities((prev) =>
          prev.map((r) => (r._id === id ? { ...r, completionStatus: status } : r))
        );
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.detailedInstruction) {
      toast.error("Please enter a title and instructions.");
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === "responsibilities") {
        if (!formData.assignedPersonId) {
          toast.error("Please assign a person.");
          setSubmitting(false);
          return;
        }
        const res = await createResponsibility({
          title: formData.title,
          detailedInstruction: formData.detailedInstruction,
          assignedPersonId: formData.assignedPersonId,
          backupPersonId: formData.backupPersonId || undefined,
          relatedBusinessId: formData.relatedBusinessId || undefined,
          priority: formData.priority as any,
          deadline: formData.deadline ? new Date(formData.deadline) : undefined,
          ownerNote: formData.ownerNote,
          visibilityMode: formData.visibilityMode as any,
        });

        if (res.success && res.item) {
          toast.success("Responsibility assigned!");
          setResponsibilities([res.item, ...responsibilities]);
          setAddModalOpen(false);
        } else {
          toast.error(res.error || "Failed to create responsibility");
        }
      } else {
        const res = await createInstruction({
          title: formData.title,
          detailedInstruction: formData.detailedInstruction,
          instructionType: formData.instructionType as any,
          assignedPersonId: formData.assignedPersonId || undefined,
          backupPersonId: formData.backupPersonId || undefined,
          relatedBusinessId: formData.relatedBusinessId || undefined,
          priority: formData.priority as any,
          visibilityMode: formData.visibilityMode as any,
        });

        if (res.success && res.item) {
          toast.success("Instruction created!");
          setInstructions([res.item, ...instructions]);
          setAddModalOpen(false);
        } else {
          toast.error(res.error || "Failed to create instruction");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-600 hover:text-[#4F46E5] hover:border-indigo-100 shadow-xs transition-all active:scale-95 shrink-0"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1E1B4B]">
                Instructions & Responsibilities
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/80">
                {responsibilities.length + instructions.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Current tasks, emergency directives & verified acknowledgements
            </p>
          </div>
        </div>

        {(isOwner || isAdmin) && (
          <Button
            onClick={() => setAddModalOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Directive
          </Button>
        )}
      </div>

      {/* Navigation Pill Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 w-fit">
        <button
          onClick={() => setActiveTab("responsibilities")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "responsibilities"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Active Responsibilities ({responsibilities.length})
        </button>

        <button
          onClick={() => setActiveTab("instructions")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "instructions"
              ? "bg-[#4F46E5] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Directives & Instructions ({instructions.length})
        </button>
      </div>

      {/* Main List */}
      {activeTab === "responsibilities" ? (
        <div className="space-y-4">
          {responsibilities.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-2 shadow-xs">
              <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-black text-[#1E1B4B]">No responsibilities assigned yet</h3>
              <p className="text-xs text-slate-500">Assign key delegated continuity responsibilities to designated persons.</p>
            </div>
          ) : (
            responsibilities.map((r) => {
              const assignedName = (r.assignedPersonId as any)?.name || "Assigned Person";
              const backupName = (r.backupPersonId as any)?.name;
              const businessName = (r.relatedBusinessId as any)?.name;

              return (
                <div
                  key={r._id}
                  className="p-5 rounded-2xl md:rounded-3xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-200/70 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                            r.priority === "critical"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : r.priority === "high"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }`}
                        >
                          {r.priority} Priority
                        </span>

                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            r.completionStatus === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : r.completionStatus === "in_progress"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          Status: {r.completionStatus.replace("_", " ")}
                        </span>

                        {r.visibilityMode && r.visibilityMode !== "available_now" && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-bold">
                            {r.visibilityMode}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-[#1E1B4B] mt-1">
                        {r.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenResponse(r)}
                        className="h-8 rounded-xl border-indigo-100 bg-[#EEF2FF] text-[#4F46E5] hover:bg-indigo-100 text-xs font-bold transition-all shadow-xs"
                      >
                        {r.userResponse ? "Update Response" : "Acknowledge"}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100/90 p-3.5 rounded-xl">
                    {r.detailedInstruction}
                  </p>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 font-bold text-[#1E1B4B]">
                      <User className="w-3.5 h-3.5 text-[#4F46E5]" />
                      Assigned: {assignedName}
                    </span>

                    {backupName && (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                        Backup: {backupName}
                      </span>
                    )}

                    {businessName && (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {businessName}
                      </span>
                    )}

                    {r.deadline && (
                      <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        Deadline: {new Date(r.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* User Response Acknowledgement status */}
                  {r.userResponse && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[11px] mr-1">
                          Acknowledged:
                        </span>
                        <span>"{r.userResponse}"</span>
                        {r.userResponseNote && (
                          <span className="text-slate-500 ml-1">
                            — {r.userResponseNote}
                          </span>
                        )}
                        {r.responseDate && (
                          <span className="text-slate-400 ml-2 text-[10px]">
                            ({new Date(r.responseDate).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Instructions Tab */
        <div className="space-y-4">
          {instructions.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-2 shadow-xs">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-black text-[#1E1B4B]">No instructions recorded yet</h3>
              <p className="text-xs text-slate-500">Create operational directives, handover guidelines, and standard operating procedures.</p>
            </div>
          ) : (
            instructions.map((ins) => (
              <div
                key={ins._id}
                className="p-5 rounded-2xl md:rounded-3xl border border-slate-100/90 bg-white shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase">
                        {ins.instructionType}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                        v{ins.versionHistory?.length || 1}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#1E1B4B] mt-1">{ins.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100/90 p-3.5 rounded-xl whitespace-pre-wrap">
                  {ins.detailedInstruction}
                </p>

                {ins.versionHistory && ins.versionHistory.length > 1 && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Last revised by {ins.versionHistory[ins.versionHistory.length - 1].updatedBy} on{" "}
                    {new Date(
                      ins.versionHistory[ins.versionHistory.length - 1].updatedAt
                    ).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Response / Acknowledgment Modal (§6) */}
      <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-slate-100 bg-white text-[#1E1B4B] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#1E1B4B]">
              Acknowledge Responsibility
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <p className="text-xs text-slate-500">
              Please select your formal status regarding "{selectedResp?.title}":
            </p>

            <div className="space-y-2">
              {[
                { val: "read", label: "I Have Read This Instruction" },
                { val: "understand", label: "I Understand Requirements" },
                { val: "accept", label: "I Accept Full Responsibility" },
                { val: "need_clarification", label: "I Need Clarification / Have Questions" },
                { val: "cannot_perform", label: "I Cannot Perform This Task" },
              ].map((opt) => (
                <label
                  key={opt.val}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    responseType === opt.val
                      ? "bg-[#EEF2FF] border-indigo-200 text-[#1E1B4B] font-bold"
                      : "border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium"
                  }`}
                >
                  <input
                    type="radio"
                    name="respType"
                    value={opt.val}
                    checked={responseType === opt.val}
                    onChange={() => setResponseType(opt.val as any)}
                    className="text-[#4F46E5] accent-[#4F46E5]"
                  />
                  <span className="text-xs">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Optional Note / Clarification Details
              </label>
              <textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder="Any questions or acceptance notes..."
                className="w-full h-20 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setResponseModalOpen(false)}
                className="rounded-xl border-slate-200/80 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendResponse}
                disabled={responding}
                className="bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                {responding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                Record Acknowledgement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Directive Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-lg rounded-3xl border border-slate-100 bg-white text-[#1E1B4B] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#1E1B4B]">
              {activeTab === "responsibilities"
                ? "Assign New Responsibility"
                : "Create Instruction / Directive"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNew} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Server emergency failover procedure"
                className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Detailed Instructions *
              </label>
              <textarea
                required
                value={formData.detailedInstruction}
                onChange={(e) =>
                  setFormData({ ...formData, detailedInstruction: e.target.value })
                }
                placeholder="Step by step instructions to execute..."
                className="w-full h-28 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Assigned Person {activeTab === "responsibilities" ? "*" : "(Optional)"}
                </label>
                <select
                  value={formData.assignedPersonId}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedPersonId: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
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
                <label className="text-xs font-bold text-slate-700">
                  Backup Person (Optional)
                </label>
                <select
                  value={formData.backupPersonId}
                  onChange={(e) =>
                    setFormData({ ...formData, backupPersonId: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Backup</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Related Business (Optional)
                </label>
                <select
                  value={formData.relatedBusinessId}
                  onChange={(e) =>
                    setFormData({ ...formData, relatedBusinessId: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
                >
                  <option value="">None</option>
                  {businesses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Visibility / Release Mode
                </label>
                <select
                  value={formData.visibilityMode}
                  onChange={(e) =>
                    setFormData({ ...formData, visibilityMode: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
                >
                  <option value="available_now">Available Now (Current)</option>
                  <option value="emergency_only">Emergency Only (Protected)</option>
                  <option value="after_death_only">After Death Only</option>
                  <option value="emergency_or_after_death">Emergency or After Death</option>
                  <option value="manual_release">Manual Release</option>
                </select>
              </div>

              {activeTab === "responsibilities" ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Target Deadline
                  </label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 rounded-xl"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Instruction Category
                  </label>
                  <select
                    value={formData.instructionType}
                    onChange={(e) =>
                      setFormData({ ...formData, instructionType: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
                  >
                    <option value="personal">Personal</option>
                    <option value="family">Family</option>
                    <option value="business">Business</option>
                    <option value="financial">Financial</option>
                    <option value="emergency">Emergency</option>
                    <option value="medical">Medical</option>
                    <option value="property">Property</option>
                    <option value="digital_accounts">Digital Accounts</option>
                    <option value="employee_salary">Employee / Salary</option>
                    <option value="religious_funeral">Religious / Funeral</option>
                    <option value="final_wishes">Final Wishes</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl border-slate-200/80 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 px-4 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                Save Directive
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
