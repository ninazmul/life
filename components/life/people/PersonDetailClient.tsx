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
  Loader2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updatePerson } from "@/lib/actions/lifePeople.actions";
import toast from "react-hot-toast";
import type { ILifeMoneyRecord, ILifeDocument, ILifeContact, ILifePerson } from "@/types";

interface PersonData {
  person: ILifePerson & { personalMessage?: string; responsibilities?: string[]; businessInstructions?: string[] };
  moneyRecords: ILifeMoneyRecord[];
  documents: ILifeDocument[];
  contacts: ILifeContact[];
  notes: unknown[];
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
      const updated = await updatePerson(person._id, { status: newStatus });
      setPerson(updated);
      toast.success(
        newStatus === "locked"
          ? `${person.name} has been locked from accessing Life.`
          : `${person.name} has been unlocked.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Back Link & Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to People
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLock}
            disabled={loading}
            className={`h-8 rounded-xl text-xs font-medium gap-1.5 ${
              person.status === "locked"
                ? "border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                : "border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
            }`}
          >
            {person.status === "locked" ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                Unlock Access
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Lock Access
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Person Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-extrabold text-2xl shrink-0 shadow-md">
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {person.name}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-slate-200 dark:border-slate-700">
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
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>Role: <strong className="text-foreground capitalize">{person.role.replace("_", " ")}</strong></span>
                {person.email && <span>• {person.email}</span>}
              </p>
            </div>
          </div>

          {/* Quick Communication Buttons */}
          <div className="flex items-center gap-2">
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
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
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
                  <Mail className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300" />
                  Email
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Layout (13 Sections per §5) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 flex overflow-x-auto scrollbar-none max-w-full justify-start h-auto gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            1. Overview
          </TabsTrigger>
          <TabsTrigger
            value="responsibilities"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            2. Current Responsibilities
          </TabsTrigger>
          <TabsTrigger
            value="business"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            3. Business Access
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            4. Financial Support ({personData.moneyRecords.length})
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            5. Payment Schedule & History
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            6. Current Messages
          </TabsTrigger>
          <TabsTrigger
            value="emergency_resp"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-red-600 data-[state=active]:text-white whitespace-nowrap"
          >
            7. Emergency Responsibilities 🔒
          </TabsTrigger>
          <TabsTrigger
            value="legacy_instructions"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white whitespace-nowrap"
          >
            8. Legacy & Instructions 🔒
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            9. Contacts ({personData.contacts.length})
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            10. Documents ({personData.documents.length})
          </TabsTrigger>
          <TabsTrigger
            value="vault"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-amber-600 data-[state=active]:text-white whitespace-nowrap"
          >
            11. Vault Access 🔒
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            12. Permissions
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-xl px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            13. Activity
          </TabsTrigger>
        </TabsList>

        {/* 1. Overview */}
        <TabsContent value="overview" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                <span>Profile Details</span>
              </h3>
              <div className="space-y-2 text-xs">
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-bold">{person.name}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Relation:</span>
                  <span className="font-semibold">{person.relation}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">User Role:</span>
                  <span className="font-bold capitalize">{person.role}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Account Status:</span>
                  <span className="font-bold text-emerald-600">{person.accountStatus || person.status}</span>
                </p>
                {person.guardianStatus && (
                  <p className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Guardian Status:</span>
                    <span className="font-bold text-blue-600">{person.guardianType || "Primary"} Guardian</span>
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Quick Summary</span>
              </h3>
              <div className="space-y-2 text-xs">
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Assigned Documents:</span>
                  <span className="font-bold">{personData.documents.length}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Financial Records:</span>
                  <span className="font-bold">{personData.moneyRecords.length}</span>
                </p>
                <p className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">Emergency Contacts:</span>
                  <span className="font-bold">{personData.contacts.length}</span>
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Current Responsibilities */}
        <TabsContent value="responsibilities" className="space-y-4 outline-none">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">Current Active Responsibilities</h3>
            {person.responsibilities && person.responsibilities.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {person.responsibilities.map((r, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">No current responsibilities assigned.</p>
            )}
          </div>
        </TabsContent>

        {/* 3. Business Access */}
        <TabsContent value="business" className="space-y-4 outline-none">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">Assigned Business Entities</h3>
            {person.businessInstructions && person.businessInstructions.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {person.businessInstructions.map((b, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">No specific business instructions recorded.</p>
            )}
          </div>
        </TabsContent>

        {/* 4. Financial Support */}
        <TabsContent value="financial" className="outline-none space-y-3">
          {personData.moneyRecords.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
              No financial records associated with {person.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personData.moneyRecords.map((rec: any) => (
                <div
                  key={rec._id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex justify-between items-center"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {rec.type.replace("_", " ")}
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-1">
                      ৳{rec.amount.toLocaleString()}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Remaining: <strong className="text-emerald-700 dark:text-emerald-300">৳{rec.remainingAmount.toLocaleString()}</strong>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      rec.status === "active"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {rec.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 5. Payment Schedule & History */}
        <TabsContent value="payments" className="space-y-4 outline-none">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-border space-y-2">
            <h3 className="text-sm font-bold text-foreground">Repayment Schedules & Settlement Timeline</h3>
            <p className="text-xs text-muted-foreground">
              Detailed breakdown of scheduled installments, verified payments, and waivers for {person.name}.
            </p>
            <Link
              href="/finance"
              className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:underline pt-2"
            >
              View in Finance & Transactions →
            </Link>
          </div>
        </TabsContent>

        {/* 6. Current Messages */}
        <TabsContent value="messages" className="outline-none">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              <span>Current Personal Message for {person.name}</span>
            </h3>
            {person.personalMessage ? (
              <div className="p-4 rounded-2xl bg-muted border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap font-serif">
                {person.personalMessage}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No active personal message has been written yet for this profile.
              </p>
            )}
          </div>
        </TabsContent>

        {/* 7. Emergency Responsibilities (Protected) (§1, §3) */}
        <TabsContent value="emergency_resp" className="outline-none">
          <div className="p-8 rounded-3xl border-2 border-red-500/20 bg-red-500/5 text-center space-y-3">
            <Shield className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Protected Emergency Responsibilities</h3>
            <p className="text-xs sm:text-sm text-foreground/80 max-w-lg mx-auto leading-relaxed">
              «আপনার জন্য কিছু সুরক্ষিত তথ্য ও নির্দেশনা সংরক্ষিত রয়েছে। নির্ধারিত Emergency অথবা Legacy Verification সম্পন্ন হওয়ার পরে এগুলো দেখা যাবে।»
            </p>
            <div className="text-[11px] text-muted-foreground pt-1">
              Requires Guardian Emergency Verification & Re-authentication (§3).
            </div>
          </div>
        </TabsContent>

        {/* 8. Legacy & Personal Instructions (Protected) (§1, §3) */}
        <TabsContent value="legacy_instructions" className="outline-none">
          <div className="p-8 rounded-3xl border-2 border-purple-500/20 bg-purple-500/5 text-center space-y-3">
            <FolderLock className="w-10 h-10 text-purple-500 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Protected Legacy & Personal Instructions</h3>
            <p className="text-xs sm:text-sm text-foreground/80 max-w-lg mx-auto leading-relaxed">
              «আপনার জন্য কিছু সুরক্ষিত তথ্য ও নির্দেশনা সংরক্ষিত রয়েছে। নির্ধারিত Emergency অথবা Legacy Verification সম্পন্ন হওয়ার পরে এগুলো দেখা যাবে।»
            </p>
            <div className="text-[11px] text-muted-foreground pt-1">
              Protected by Owner Security Protocol. Accessible after designated release event.
            </div>
          </div>
        </TabsContent>

        {/* 9. Contacts */}
        <TabsContent value="contacts" className="outline-none space-y-3">
          {personData.contacts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
              No emergency contacts associated with {person.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personData.contacts.map((c: any) => (
                <div
                  key={c._id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{c.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 10. Documents */}
        <TabsContent value="documents" className="outline-none space-y-3">
          {personData.documents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
              No private documents assigned or related to {person.name}.
            </div>
          ) : (
            <div className="space-y-2">
              {personData.documents.map((doc: any) => (
                <div
                  key={doc._id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FolderLock className="w-5 h-5 text-indigo-700 dark:text-indigo-300 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{doc.title}</h4>
                      <span className="text-[11px] text-muted-foreground">{doc.category}</span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="text-xs text-indigo-700 dark:text-indigo-300">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 11. Vault Access */}
        <TabsContent value="vault" className="outline-none">
          <div className="p-8 rounded-3xl border-2 border-amber-500/20 bg-amber-500/5 text-center space-y-3">
            <Lock className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Encrypted Vault Credentials</h3>
            <p className="text-xs sm:text-sm text-foreground/80 max-w-lg mx-auto leading-relaxed">
              Assigned recovery keys and passwords require interactive MFA Re-authentication and Guardian authorization.
            </p>
          </div>
        </TabsContent>

        {/* 12. Permissions */}
        <TabsContent value="permissions" className="outline-none">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              <span>Permission & Authorization Matrix</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-foreground">
              <div className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center">
                <span>View Personal Notes</span>
                <span className={person.permissions?.canViewPersonal ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-slate-500"}>
                  {person.permissions?.canViewPersonal ? "Allowed ✓" : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center">
                <span>View Business Info</span>
                <span className={person.permissions?.canViewBusiness ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-slate-500"}>
                  {person.permissions?.canViewBusiness ? "Allowed ✓" : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center">
                <span>View Financial Data</span>
                <span className={person.permissions?.canViewFinancial ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-slate-500"}>
                  {person.permissions?.canViewFinancial ? "Allowed ✓" : "Restricted ✕"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center">
                <span>Reveal Vault Secrets</span>
                <span className={person.permissions?.canRevealVault ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-slate-500"}>
                  {person.permissions?.canRevealVault ? "Allowed ✓" : "Restricted ✕"}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Access permissions are enforced strictly server-side by the Life RBAC engine.
            </p>
          </div>
        </TabsContent>

        {/* 13. Activity */}
        <TabsContent value="activity" className="outline-none">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-border text-xs space-y-2">
            <h3 className="font-bold text-foreground">Session & Activity Log</h3>
            <p className="text-muted-foreground">
              Last Login: {person.lastLogin ? new Date(person.lastLogin).toLocaleString() : "Never"}
            </p>
            <p className="text-muted-foreground">
              Last Activity: {person.lastActivity ? new Date(person.lastActivity).toLocaleString() : "None"}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
