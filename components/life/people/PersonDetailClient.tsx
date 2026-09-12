/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  FolderLock,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  Clock,
  Wallet,
  Coins,
  HeartHandshake,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updatePerson, setPersonAccountStatus } from "@/lib/actions/lifePeople.actions";
import toast from "react-hot-toast";
import type { ILifeDocument, ILifeContact, ILifePerson, AccountStatus } from "@/types";

interface PersonData {
  person: ILifePerson & {
    personalMessage?: string;
    responsibilities?: string[];
    businessInstructions?: string[];
    isLoginEnabled?: boolean;
    accountStatus?: string;
  };
  financialCare: any[];
  moneyRecords: any[];
  documents: ILifeDocument[];
  contacts: ILifeContact[];
  notes: any[];
  instructions: any[];
  responsibilities: any[];
  messages: any[];
}

interface PersonDetailClientProps {
  personData: PersonData;
}

export function PersonDetailClient({ personData }: PersonDetailClientProps) {
  const [person, setPerson] = useState(personData.person);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleToggleLock = async () => {
    const newStatus = person.status === "locked" ? "active" : "locked";
    setLoading(true);
    try {
      const updated = await updatePerson(person._id, {
        status: newStatus as any,
        accountStatus: newStatus as any,
      });
      setPerson(updated);
      toast.success(
        newStatus === "locked"
          ? `${person.name} access has been locked.`
          : `${person.name} access has been unlocked.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLogin = async () => {
    const newLoginState = person.isLoginEnabled === false;
    setLoading(true);
    try {
      const updated = await updatePerson(person._id, {
        isLoginEnabled: newLoginState,
      });
      setPerson(updated);
      toast.success(
        newLoginState
          ? `Login enabled for ${person.name}.`
          : `Login disabled for ${person.name}.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update login status.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountStatusChange = async (newStatus: AccountStatus) => {
    setLoading(true);
    try {
      await setPersonAccountStatus(person._id, newStatus);
      setPerson((prev) => ({
        ...prev,
        accountStatus: newStatus,
        status: newStatus === "archived" ? "archived" : newStatus === "locked" ? "locked" : "active",
        isLoginEnabled: newStatus === "active",
      }));
      toast.success(`Account status set to ${newStatus.replace("_", " ")}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (p?: number) => {
    if (p === 1) return "Priority 1 (Primary)";
    if (p === 2) return "Priority 2 (Secondary)";
    if (p === 3) return "Priority 3 (Tertiary)";
    return "Not Assigned";
  };

  return (
    <div className="space-y-5">
      {/* Back Link & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to People & Access
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Account Status Selector */}
          <div className="flex items-center gap-1.5 bg-secondary border border-border px-2.5 py-1 rounded-xl">
            <span className="text-[11px] font-semibold text-muted-foreground">Status:</span>
            <select
              value={person.accountStatus || person.status || "active"}
              onChange={(e) => handleAccountStatusChange(e.target.value as AccountStatus)}
              disabled={loading}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="active" className="bg-card text-foreground">Active</option>
              <option value="locked" className="bg-card text-foreground">Locked</option>
              <option value="disabled" className="bg-card text-foreground">Disabled</option>
              <option value="archived" className="bg-card text-foreground">Archived</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLogin}
            disabled={loading}
            className="h-8 rounded-xl text-xs font-medium gap-1.5 border-border"
          >
            {person.isLoginEnabled === false ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                Enable Login
              </>
            ) : (
              <>
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                Disable Login
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLock}
            disabled={loading}
            className={`h-8 rounded-xl text-xs font-medium gap-1.5 ${
              person.status === "locked"
                ? "border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50"
                : "border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-50"
            }`}
          >
            {person.status === "locked" ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Lock
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Person Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-extrabold text-2xl shrink-0 shadow-md">
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {person.name}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                  {person.relation}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    person.status === "active"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                      : "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20"
                  }`}
                >
                  {person.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                <span>Role: <strong className="text-foreground capitalize">{(person.role || "individual").replace("_", " ")}</strong></span>
                {person.email && <span>• Login Email: <strong>{person.email}</strong></span>}
                <span>• Emergency: <strong>{getPriorityLabel(person.emergencyPriority)}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Communication Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {person.phone && (
              <Button
                asChild
                size="sm"
                className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5 shadow-sm"
              >
                <a href={`tel:${person.phone}`}>
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              </Button>
            )}
            {(person.whatsapp || person.phone) && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold gap-1.5"
              >
                <a
                  href={`https://wa.me/${(person.whatsapp || person.phone || "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp
                </a>
              </Button>
            )}
            {person.email && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold gap-1.5"
              >
                <a href={`mailto:${person.email}`}>
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  Email
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Standardized 8 Profile Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary p-1 rounded-2xl border border-border flex overflow-x-auto scrollbar-none max-w-full justify-start h-auto gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            1. Overview
          </TabsTrigger>
          <TabsTrigger
            value="message"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            2. Personal Message
          </TabsTrigger>
          <TabsTrigger
            value="instructions"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            3. Instructions & Responsibilities ({personData.instructions?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="financial_care"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            4. Financial Care ({personData.financialCare?.length || personData.moneyRecords?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            5. Important Contacts ({personData.contacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            6. Documents ({personData.documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="access_info"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            7. Access Information
          </TabsTrigger>
          <TabsTrigger
            value="release_rules"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            8. Visibility & Release Rules
          </TabsTrigger>
        </TabsList>

        {/* 1. Overview */}
        <TabsContent value="overview" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profile Details</span>
              </h3>
              <div className="space-y-2 text-xs">
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-bold">{person.name}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Relation / Connection:</span>
                  <span className="font-semibold">{person.relation}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Phone Number:</span>
                  <span className="font-semibold">{person.phone || "Not set"}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Login Email:</span>
                  <span className="font-semibold">{person.email || "Not set"}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Access Role:</span>
                  <span className="font-bold capitalize">{person.role}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Account Status:</span>
                  <span className="font-bold capitalize text-emerald-600">{person.accountStatus || person.status}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Login Enabled:</span>
                  <span className={`font-bold ${person.isLoginEnabled === false ? "text-red-600" : "text-emerald-600"}`}>
                    {person.isLoginEnabled === false ? "Disabled" : "Active"}
                  </span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Emergency Priority:</span>
                  <span className="font-bold text-amber-600">{getPriorityLabel(person.emergencyPriority)}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick Record Counts</span>
              </h3>
              <div className="space-y-2 text-xs">
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Financial Care Records:</span>
                  <span className="font-bold">{(personData.financialCare?.length || 0) + (personData.moneyRecords?.length || 0)}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Assigned Documents:</span>
                  <span className="font-bold">{personData.documents?.length || 0}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Assigned Instructions:</span>
                  <span className="font-bold">{personData.instructions?.length || 0}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Important Contacts:</span>
                  <span className="font-bold">{personData.contacts?.length || 0}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Last Login:</span>
                  <span className="font-medium text-muted-foreground">
                    {person.lastLogin ? new Date(person.lastLogin).toLocaleDateString() : "Never"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Personal Message */}
        <TabsContent value="message" className="outline-none">
          <div className="p-6 rounded-3xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Private Personal Message for {person.name}</span>
            </h3>
            {person.personalMessage ? (
              <div className="p-4 rounded-2xl bg-secondary border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap font-serif">
                {person.personalMessage}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No active personal message has been set yet for this profile.
              </p>
            )}
          </div>
        </TabsContent>

        {/* 3. Instructions & Responsibilities */}
        <TabsContent value="instructions" className="space-y-4 outline-none">
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Assigned Instructions & Duties</span>
            </h3>
            {(personData.instructions?.length > 0 || person.responsibilities?.length) ? (
              <div className="space-y-2.5">
                {personData.instructions?.map((inst: any) => (
                  <div key={inst._id} className="p-3.5 rounded-xl bg-secondary border border-border flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{inst.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{inst.details || inst.summary}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-600">
                      {inst.priority || "Normal"}
                    </span>
                  </div>
                ))}
                {person.responsibilities?.map((r: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-secondary border border-border flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No instructions or responsibilities assigned.</p>
            )}
          </div>
        </TabsContent>

        {/* 4. Financial Care */}
        <TabsContent value="financial_care" className="outline-none space-y-3">
          {(!personData.financialCare || personData.financialCare.length === 0) &&
          (!personData.moneyRecords || personData.moneyRecords.length === 0) ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
              No financial care records associated with {person.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personData.financialCare?.map((rec: any) => (
                <div
                  key={rec._id}
                  className="p-4 rounded-2xl bg-card border border-border flex justify-between items-center"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {(rec.supportType || "Financial Care").replace("_", " ")}
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-1">
                      {rec.currency || "BDT"} {(rec.totalAmount || 0).toLocaleString()}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Remaining: <strong className="text-emerald-600">{rec.currency || "BDT"} {(rec.remainingBalance || 0).toLocaleString()}</strong>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      rec.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {(rec.status || "active").replace("_", " ")}
                  </span>
                </div>
              ))}
              {personData.moneyRecords?.map((rec: any) => (
                <div
                  key={rec._id}
                  className="p-4 rounded-2xl bg-card border border-border flex justify-between items-center"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                      {rec.type === "given" ? "Care Provided" : rec.type === "taken" ? "Care Received" : rec.type}
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-1">
                      {rec.currency || "BDT"} {(rec.amount || 0).toLocaleString()}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Outstanding: <strong className="text-cyan-600">{rec.currency || "BDT"} {(rec.remainingAmount || 0).toLocaleString()}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary border border-border">
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 5. Important Contacts */}
        <TabsContent value="contacts" className="outline-none space-y-3">
          {(!personData.contacts || personData.contacts.length === 0) ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
              No contacts associated with {person.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personData.contacts.map((c: any) => (
                <div
                  key={c._id}
                  className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{c.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{c.relationship || c.phone}</p>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-emerald-600"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 6. Documents */}
        <TabsContent value="documents" className="outline-none space-y-3">
          {(!personData.documents || personData.documents.length === 0) ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
              No private documents assigned to {person.name}.
            </div>
          ) : (
            <div className="space-y-2">
              {personData.documents.map((doc: any) => (
                <div
                  key={doc._id}
                  className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FolderLock className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{doc.title}</h4>
                      <span className="text-[11px] text-muted-foreground">{doc.category}</span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="text-xs text-indigo-600">
                    <a href={`/api/documents/${doc._id}/download`}>
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 7. Access Information */}
        <TabsContent value="access_info" className="outline-none">
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4 text-xs">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Module & Feature Permissions</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-foreground">
              <div className="p-3 rounded-xl bg-secondary border border-border flex justify-between items-center">
                <span>Personal Message & Notes</span>
                <span className={person.permissions?.canViewPersonal ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                  {person.permissions?.canViewPersonal ? "Allowed ✓" : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border flex justify-between items-center">
                <span>Business Continuity Access</span>
                <span className={person.permissions?.canViewBusiness ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                  {person.permissions?.canViewBusiness ? "Allowed ✓" : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border flex justify-between items-center">
                <span>Financial Care Access</span>
                <span className={person.permissions?.canViewFinancial ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                  {person.permissions?.canViewFinancial ? "Allowed ✓" : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border flex justify-between items-center">
                <span>Vault Secrets Reveal</span>
                <span className={person.permissions?.canRevealVault ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                  {person.permissions?.canRevealVault ? "Allowed ✓" : "Restricted ✕"}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Authorization is enforced server-side. Non-owner accounts cannot bypass restrictions.
            </p>
          </div>
        </TabsContent>

        {/* 8. Visibility & Release Rules */}
        <TabsContent value="release_rules" className="outline-none">
          <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Continuity & Legacy Release Protocols</span>
            </h3>
            <div className="p-4 rounded-2xl bg-secondary border border-border space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Emergency Priority:</span>
                <span className="font-bold text-foreground">{getPriorityLabel(person.emergencyPriority)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Guardian Status:</span>
                <span className="font-bold text-foreground">{person.guardianStatus ? `${person.guardianType || "Active"} Guardian` : "Not a Guardian"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Release Condition:</span>
                <span className="font-bold text-foreground">Guardian Consensus / Owner Direct Trigger</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Protected legacy messages and documents are only revealed when the specified emergency or scheduled release conditions are met.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
