/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Briefcase,
  Plus,
  Server,
  Users,
  Phone,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ILifeBusiness, ILifeContinuityStep, ILifePerson } from "@/types";
import {
  createBusiness,
  addContinuityStep,
  toggleContinuityStep,
} from "@/lib/actions/lifeBusiness.actions";
import toast from "react-hot-toast";

interface BusinessClientProps {
  initialBusinesses: ILifeBusiness[];
  people: ILifePerson[];
}

export function BusinessClient({
  initialBusinesses,
  people,
}: BusinessClientProps) {
  const [businesses, setBusinesses] =
    useState<ILifeBusiness[]>(initialBusinesses);
  const [expandedBizId, setExpandedBizId] = useState<string | null>(
    businesses[0]?._id || null,
  );

  // Add Business Modal State
  const [addBizModalOpen, setAddBizModalOpen] = useState(false);
  const [bizLoading, setBizLoading] = useState(false);
  const [bizName, setBizName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [ownershipPercentage, setOwnershipPercentage] = useState("100");
  const [serverHosting, setServerHosting] = useState("");
  const [serverDomain, setServerDomain] = useState("");
  const [serverIp, setServerIp] = useState("");
  const [engineerName, setEngineerName] = useState("");
  const [engineerPhone, setEngineerPhone] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");

  // Add Continuity Step Modal State
  const [addStepModalOpen, setAddStepModalOpen] = useState(false);
  const [selectedBizForStep, setSelectedBizForStep] = useState<string | null>(
    null,
  );
  const [stepLoading, setStepLoading] = useState(false);
  const [stepTitle, setStepTitle] = useState("");
  const [stepInstructions, setStepInstructions] = useState("");
  const [stepPersonId, setStepPersonId] = useState("none");
  const [stepContactPhone, setStepContactPhone] = useState("");

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim()) {
      toast.error("Business name is required.");
      return;
    }

    setBizLoading(true);
    try {
      const created = await createBusiness({
        name: bizName,
        legalName,
        ownershipPercentage: Number(ownershipPercentage) || 100,
        serverInfo: {
          hosting: serverHosting,
          domain: serverDomain,
          ip: serverIp,
        },
        engineerContact: {
          name: engineerName,
          phone: engineerPhone,
        },
        monthlyExpenses: Number(monthlyExpenses) || 0,
      });

      setBusinesses([created, ...businesses]);
      setExpandedBizId(created._id);
      toast.success(`Business "${created.name}" created!`);
      setAddBizModalOpen(false);
      // Reset
      setBizName("");
      setLegalName("");
      setServerHosting("");
      setServerDomain("");
      setServerIp("");
      setEngineerName("");
      setEngineerPhone("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create business.");
    } finally {
      setBizLoading(false);
    }
  };

  const handleOpenAddStep = (bizId: string) => {
    setSelectedBizForStep(bizId);
    setAddStepModalOpen(true);
  };

  const handleCreateStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizForStep || !stepTitle.trim()) {
      toast.error("Step title is required.");
      return;
    }

    setStepLoading(true);
    try {
      let chosenPersonName = "";
      if (stepPersonId !== "none") {
        const found = people.find((p) => p._id === stepPersonId);
        if (found) chosenPersonName = found.name;
      }

      await addContinuityStep(selectedBizForStep, {
        title: stepTitle,
        instructions: stepInstructions,
        responsiblePersonId: stepPersonId !== "none" ? stepPersonId : undefined,
        responsiblePersonName: chosenPersonName,
        contactPhone: stepContactPhone,
      });

      // Update local state
      setBusinesses(
        businesses.map((b) => {
          if (b._id === selectedBizForStep) {
            return {
              ...b,
              continuitySteps: [
                ...(b.continuitySteps || []),
                {
                  id: `step-${Date.now()}`,
                  order: (b.continuitySteps?.length || 0) + 1,
                  title: stepTitle,
                  instructions: stepInstructions,
                  responsiblePersonName: chosenPersonName,
                  contactPhone: stepContactPhone,
                  isCompleted: false,
                },
              ],
            };
          }
          return b;
        }),
      );

      toast.success("Continuity instruction added!");
      setAddStepModalOpen(false);
      setStepTitle("");
      setStepInstructions("");
      setStepContactPhone("");
      setStepPersonId("none");
    } catch (err: any) {
      toast.error(err.message || "Failed to add continuity step.");
    } finally {
      setStepLoading(false);
    }
  };

  const handleToggleStep = async (
    bizId: string,
    stepId: string,
    current: boolean,
  ) => {
    const next = !current;
    try {
      await toggleContinuityStep(bizId, stepId, next);
      setBusinesses(
        businesses.map((b) => {
          if (b._id === bizId) {
            return {
              ...b,
              continuitySteps: (b.continuitySteps || []).map((s) =>
                s.id === stepId ? { ...s, isCompleted: next } : s,
              ),
            };
          }
          return b;
        }),
      );
      toast.success(`Instruction marked as ${next ? "COMPLETED" : "PENDING"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update instruction status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Business Continuity & Operations
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {businesses.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Structured business operations and dedicated &quot;If I Am Not
            Available&quot; contingency protocols.
          </p>
        </div>

        <Button
          onClick={() => setAddBizModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Business Entity
        </Button>
      </div>

      {/* Continuity Highlight Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-start gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 shrink-0 border border-cyan-500/40">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100">
            &quot;If I Am Not Available&quot; Continuity Protocol
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
            Actionable step-by-step instructions for trusted partners or staff
            in case you are unreachable (server trouble, supplier contacts,
            salary payroll, or accounts).
          </p>
        </div>
      </div>

      {/* Businesses List */}
      {businesses.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-border text-center space-y-3">
          <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">
            No Business Entities Added
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your ventures, partnerships, server infrastructure, and
            contingency instructions.
          </p>
          <Button
            size="sm"
            onClick={() => setAddBizModalOpen(true)}
            className="h-8.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            + Add Business
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((biz) => {
            const isExpanded = expandedBizId === biz._id;
            const steps = biz.continuitySteps || [];
            const completedCount = steps.filter((s) => s.isCompleted).length;

            return (
              <div
                key={biz._id}
                className="rounded-3xl bg-card border border-border overflow-hidden shadow-xs"
              >
                {/* Accordion Card Header */}
                <div
                  onClick={() => setExpandedBizId(isExpanded ? null : biz._id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold shrink-0">
                      {biz.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-foreground">
                          {biz.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {biz.ownershipPercentage}% Ownership
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {biz.serverInfo?.domain ||
                          biz.legalName ||
                          "Active Business Entity"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        {completedCount}/{steps.length}
                      </span>
                      <p className="text-[10px] text-slate-500">Steps Ready</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-border space-y-5">
                    {/* Operational Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
                      {/* Server & Hosting */}
                      <div className="p-3.5 rounded-2xl bg-muted border border-border space-y-1">
                        <span className="font-bold text-slate-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                          <Server className="w-3.5 h-3.5 text-cyan-400" />{" "}
                          Server & Domain
                        </span>
                        <p className="text-slate-200 font-medium">
                          {biz.serverInfo?.hosting || "Standard Hosting"}
                        </p>
                        {biz.serverInfo?.ip && (
                          <p className="text-slate-400 font-mono text-[11px]">
                            IP: {biz.serverInfo.ip}
                          </p>
                        )}
                        {biz.serverInfo?.domain && (
                          <p className="text-cyan-400 font-mono text-[11px] truncate">
                            {biz.serverInfo.domain}
                          </p>
                        )}
                      </div>

                      {/* Key Engineer */}
                      <div className="p-3.5 rounded-2xl bg-muted border border-border space-y-1">
                        <span className="font-bold text-slate-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />{" "}
                          Technical Contact
                        </span>
                        <p className="text-slate-200 font-medium">
                          {biz.engineerContact?.name || "No Engineer Assigned"}
                        </p>
                        {biz.engineerContact?.phone && (
                          <a
                            href={`tel:${biz.engineerContact.phone}`}
                            className="text-emerald-400 font-mono text-[11px] flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />{" "}
                            {biz.engineerContact.phone}
                          </a>
                        )}
                      </div>

                      {/* Financials */}
                      <div className="p-3.5 rounded-2xl bg-muted border border-border space-y-1">
                        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                          Monthly Expenses
                        </span>
                        <p className="text-lg font-bold text-slate-200 font-mono">
                          ৳{(biz.monthlyExpenses || 0).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Fixed operational overhead
                        </p>
                      </div>
                    </div>

                    {/* "If I Am Not Available" Checklist */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-cyan-400" />
                          <span>
                            Actionable &quot;If I Am Not Available&quot; Steps
                          </span>
                        </h4>
                        <Button
                          size="sm"
                          onClick={() => handleOpenAddStep(biz._id)}
                          className="h-7 text-xs bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 rounded-xl gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Step
                        </Button>
                      </div>

                      {steps.length === 0 ? (
                        <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                          No emergency steps added yet. Add step-by-step
                          instructions for when you are away.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {steps.map((step, idx) => (
                            <div
                              key={step.id || idx}
                              onClick={() =>
                                handleToggleStep(
                                  biz._id,
                                  step.id,
                                  step.isCompleted,
                                )
                              }
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                step.isCompleted
                                  ? "bg-slate-950/30 border-slate-800/60 opacity-60"
                                  : "bg-slate-900/80 border-slate-800 hover:border-cyan-500/40"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button className="mt-0.5 text-cyan-400">
                                  {step.isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-500" />
                                  )}
                                </button>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-slate-400">
                                      #{idx + 1}
                                    </span>
                                    <h5
                                      className={`text-xs font-bold ${
                                        step.isCompleted
                                          ? "line-through text-slate-400"
                                          : "text-slate-100"
                                      }`}
                                    >
                                      {step.title}
                                    </h5>
                                  </div>
                                  {step.instructions && (
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                      {step.instructions}
                                    </p>
                                  )}
                                  {step.responsiblePersonName && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 mt-1.5 font-medium">
                                      Contact: {step.responsiblePersonName}
                                      {step.contactPhone &&
                                        ` (${step.contactPhone})`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Business Modal */}
      <Dialog open={addBizModalOpen} onOpenChange={setAddBizModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              <span>Add Business Entity</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateBusiness} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Business Name *
                </label>
                <Input
                  required
                  placeholder="e.g. CloudNet ISP or Tech Ventures"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Legal / Trade Name
                </label>
                <Input
                  placeholder="e.g. CloudNet Services Ltd."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Ownership Percentage (%)
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={ownershipPercentage}
                  onChange={(e) => setOwnershipPercentage(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Monthly Expenses (৳)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Server Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Hosting Provider"
                  value={serverHosting}
                  onChange={(e) => setServerHosting(e.target.value)}
                  className="h-9 border-slate-800 bg-slate-900 text-slate-100 text-xs"
                />
                <Input
                  placeholder="Domain Name"
                  value={serverDomain}
                  onChange={(e) => setServerDomain(e.target.value)}
                  className="h-9 border-slate-800 bg-slate-900 text-slate-100 text-xs"
                />
                <Input
                  placeholder="Server IP"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  className="h-9 border-slate-800 bg-slate-900 text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Key Engineer / Technical
                Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Engineer Name"
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  className="h-9 border-slate-800 bg-slate-900 text-slate-100 text-xs"
                />
                <Input
                  placeholder="Engineer Phone"
                  value={engineerPhone}
                  onChange={(e) => setEngineerPhone(e.target.value)}
                  className="h-9 border-slate-800 bg-slate-900 text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddBizModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={bizLoading}
                className="h-9 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
              >
                {bizLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Business
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Continuity Step Modal */}
      <Dialog open={addStepModalOpen} onOpenChange={setAddStepModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-cyan-400" />
              <span>Add &quot;If I Am Not Available&quot; Instruction</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateStep} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Action Title *
              </label>
              <Input
                required
                placeholder="e.g. 1. If server problem, contact Engineer X"
                value={stepTitle}
                onChange={(e) => setStepTitle(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Responsible Person
                </label>
                <select
                  value={stepPersonId}
                  onChange={(e) => setStepPersonId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="none">-- Select Person --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Direct Phone Shortcut
                </label>
                <Input
                  placeholder="e.g. +880 1700..."
                  value={stepContactPhone}
                  onChange={(e) => setStepContactPhone(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Detailed Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Describe exact credentials to check, supplier terms, or steps to take..."
                value={stepInstructions}
                onChange={(e) => setStepInstructions(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddStepModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={stepLoading}
                className="h-9 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
              >
                {stepLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Add Instruction
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
