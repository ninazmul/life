/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Instructions & Responsibilities
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Current tasks, emergency directives & verified acknowledgements
          </p>
        </div>

        {(isOwner || isAdmin) && (
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Directive
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("responsibilities")}
          className={`pb-3 transition-colors relative ${
            activeTab === "responsibilities"
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Responsibilities ({responsibilities.length})
          {activeTab === "responsibilities" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("instructions")}
          className={`pb-3 transition-colors relative ${
            activeTab === "instructions"
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Directives & Instructions ({instructions.length})
          {activeTab === "instructions" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Main List */}
      {activeTab === "responsibilities" ? (
        <div className="space-y-4">
          {responsibilities.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
              <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No responsibilities assigned yet.</p>
            </div>
          ) : (
            responsibilities.map((r) => {
              const assignedName = (r.assignedPersonId as any)?.name || "Assigned Person";
              const backupName = (r.backupPersonId as any)?.name;
              const businessName = (r.relatedBusinessId as any)?.name;

              return (
                <div
                  key={r._id}
                  className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-blue-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            r.priority === "critical"
                              ? "bg-red-500/10 text-red-600 border border-red-500/20"
                              : r.priority === "high"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}
                        >
                          {r.priority} Priority
                        </span>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            r.completionStatus === "completed"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : r.completionStatus === "in_progress"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          Status: {r.completionStatus.replace("_", " ")}
                        </span>

                        {r.visibilityMode && r.visibilityMode !== "available_now" && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 font-medium">
                            {r.visibilityMode}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-foreground mt-1">
                        {r.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenResponse(r)}
                        className="rounded-xl border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                      >
                        {r.userResponse ? "Update Response" : "Acknowledge"}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/40 p-3 rounded-xl">
                    {r.detailedInstruction}
                  </p>

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      Assigned: {assignedName}
                    </span>

                    {backupName && (
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                        Backup: {backupName}
                      </span>
                    )}

                    {businessName && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {businessName}
                      </span>
                    )}

                    {r.deadline && (
                      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        Deadline: {new Date(r.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* User Response Acknowledgement status */}
                  {r.userResponse && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[11px] mr-1">
                          Acknowledged:
                        </span>
                        <span>"{r.userResponse}"</span>
                        {r.userResponseNote && (
                          <span className="text-muted-foreground ml-1">
                            — {r.userResponseNote}
                          </span>
                        )}
                        {r.responseDate && (
                          <span className="text-muted-foreground ml-2 text-[10px]">
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
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No instructions recorded yet.</p>
            </div>
          ) : (
            instructions.map((ins) => (
              <div
                key={ins._id}
                className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold uppercase">
                        {ins.instructionType}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-500/10 text-muted-foreground font-medium">
                        v{ins.versionHistory?.length || 1}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-1">{ins.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed bg-muted/40 p-3 rounded-xl whitespace-pre-wrap">
                  {ins.detailedInstruction}
                </p>

                {ins.versionHistory && ins.versionHistory.length > 1 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
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
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Acknowledge Responsibility
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
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
                      ? "bg-blue-500/10 border-blue-500/50 text-foreground font-semibold"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="respType"
                    value={opt.val}
                    checked={responseType === opt.val}
                    onChange={() => setResponseType(opt.val as any)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Optional Note / Clarification Details
              </label>
              <textarea
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                placeholder="Any questions or acceptance notes..."
                className="w-full h-20 p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setResponseModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendResponse}
                disabled={responding}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                {responding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Record Acknowledgement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Directive Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {activeTab === "responsibilities"
                ? "Assign New Responsibility"
                : "Create Instruction / Directive"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateNew} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Server emergency failover procedure"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Detailed Instructions *
              </label>
              <textarea
                required
                value={formData.detailedInstruction}
                onChange={(e) =>
                  setFormData({ ...formData, detailedInstruction: e.target.value })
                }
                placeholder="Step by step instructions to execute..."
                className="w-full h-28 p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Assigned Person {activeTab === "responsibilities" ? "*" : "(Optional)"}
                </label>
                <select
                  value={formData.assignedPersonId}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedPersonId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="text-xs font-semibold text-muted-foreground">
                  Backup Person (Optional)
                </label>
                <select
                  value={formData.backupPersonId}
                  onChange={(e) =>
                    setFormData({ ...formData, backupPersonId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Related Business (Optional)
                </label>
                <select
                  value={formData.relatedBusinessId}
                  onChange={(e) =>
                    setFormData({ ...formData, relatedBusinessId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Visibility / Release Mode
                </label>
                <select
                  value={formData.visibilityMode}
                  onChange={(e) =>
                    setFormData({ ...formData, visibilityMode: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="text-xs font-semibold text-muted-foreground">
                    Target Deadline
                  </label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Instruction Category
                  </label>
                  <select
                    value={formData.instructionType}
                    onChange={(e) =>
                      setFormData({ ...formData, instructionType: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Directive
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
