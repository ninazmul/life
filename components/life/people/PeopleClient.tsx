/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageCircle,
  Mail,
  Shield,
  ArrowRight,
  UserCheck,
  UserX,
  Lock,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ILifePerson, LifeRole } from "@/types";
import { createPerson } from "@/lib/actions/lifePeople.actions";
import toast from "react-hot-toast";

interface PeopleClientProps {
  initialPeople: ILifePerson[];
}

export function PeopleClient({ initialPeople }: PeopleClientProps) {
  const [people, setPeople] = useState<ILifePerson[]>(initialPeople);
  const [search, setSearch] = useState("");
  const [relationFilter, setRelationFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("Family");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<LifeRole>("individual");
  const [isRecordOnly, setIsRecordOnly] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");
  const [emergencyPriority, setEmergencyPriority] = useState(0);

  const filteredPeople = people.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.relation.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search)) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()));

    const matchesRelation =
      relationFilter === "all"
        ? true
        : relationFilter === "record_only"
        ? p.isLoginEnabled === false || (!p.email && p.role === "individual")
        : p.relation.toLowerCase() === relationFilter.toLowerCase();

    return matchesSearch && matchesRelation;
  });

  const relations = ["all", "record_only", "Wife", "Brother", "Parents", "Partner", "Engineer", "Staff", "Family"];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relation.trim()) {
      toast.error("Name and relation are required.");
      return;
    }

    setLoading(true);
    try {
      const created = await createPerson({
        name,
        relation,
        phone,
        email: isRecordOnly ? "" : email,
        role: isRecordOnly ? "individual" : role,
        isLoginEnabled: !isRecordOnly,
        personalMessage,
        emergencyPriority: Number(emergencyPriority) || 0,
      });

      setPeople([created, ...people]);
      toast.success(`Profile for ${created.name} created!`);
      setAddModalOpen(false);
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setIsRecordOnly(false);
      setPersonalMessage("");
      setEmergencyPriority(0);
    } catch (err: any) {
      toast.error(err.message || "Failed to create person profile.");
    } finally {
      setLoading(false);
    }
  };

  function maskPhone(phone?: string) {
    if (!phone) return "";
    const cleaned = phone.trim();
    if (cleaned.length <= 6) return cleaned;
    return cleaned.slice(0, 5) + "••••" + cleaned.slice(-4);
  }

  function maskEmail(email?: string) {
    if (!email) return "";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const maskedUser = user.length <= 3 ? user + "•••" : user.slice(0, 3) + "••••";
    return `${maskedUser}@${domain}`;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] tracking-tight">
              People & Access
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/80 shadow-2xs">
              {people.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Designate trusted family, partners, guardians, and advisors with specific access rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
          <span>Add Person</span>
        </button>
      </div>

      {/* Search & Relation Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, relation, phone, or email..."
            className="pl-9.5 h-10 rounded-xl border border-slate-200/80 bg-white text-xs text-[#1E1B4B] placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-2xs"
          />
        </div>

        {/* Relation Pills (horizontal scroll on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {relations.map((rel) => (
            <button
              key={rel}
              onClick={() => setRelationFilter(rel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                relationFilter === rel
                  ? "bg-[#4F46E5] text-white shadow-xs border border-indigo-600"
                  : "bg-white border border-slate-100/90 text-slate-600 hover:text-[#1E1B4B] hover:border-indigo-200/70 shadow-2xs"
              }`}
            >
              {rel === "all" ? "All Relations" : rel === "record_only" ? "Record Only" : rel}
            </button>
          ))}
        </div>
      </div>

      {/* People Cards Grid */}
      {filteredPeople.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-2xs">
            <Users className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E1B4B]">
              No People Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add trusted individuals who may receive legacy messages, emergency instructions, or financial records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
            <span>Add Person</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {filteredPeople.map((person) => {
            const isActive = person.accountStatus === "active" || person.status === "active";
            const isLocked = person.accountStatus === "temporarily_locked" || person.status === "locked";

            return (
              <div
                key={person._id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-200/70 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Avatar, Name, Relation, Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 border border-indigo-200/60 flex items-center justify-center text-[#4F46E5] font-extrabold text-base shrink-0 shadow-2xs">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/people/${person._id}`}
                            className="font-bold text-[14px] sm:text-[15px] text-[#1E1B4B] group-hover:text-[#4F46E5] transition-colors truncate"
                          >
                            {person.name}
                          </Link>
                          {person.guardianStatus && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/70">
                              Guardian
                            </span>
                          )}
                          {person.emergencyPriority ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
                              P{person.emergencyPriority}
                            </span>
                          ) : null}
                          {person.isLoginEnabled === false && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                              Record Only
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-slate-400 font-medium truncate mt-0.5">
                          {person.designation ? `${person.designation} • ` : ""}{person.relation}
                        </p>
                      </div>
                    </div>

                    {/* Status chip */}
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        isActive
                          ? "bg-[#DCFCE7] text-[#16A34A] border-emerald-200/70"
                          : isLocked
                          ? "bg-rose-50 text-rose-600 border-rose-200/70"
                          : "bg-slate-100 text-slate-600 border-slate-200/70"
                      }`}
                    >
                      {person.accountStatus || person.status || "active"}
                    </span>
                  </div>

                  {/* Role and contact preview */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" strokeWidth={2} />
                      <span className="capitalize font-semibold text-[#1E1B4B] truncate">
                        {(person.userRole || person.role || "individual").replace("_", " ")}
                      </span>
                    </div>
                    {person.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2} />
                        <span className="font-mono text-slate-600">{maskPhone(person.phone)}</span>
                      </div>
                    )}
                    {person.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2} />
                        <span className="truncate text-slate-600">{maskEmail(person.email)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Quick Actions: Call, WhatsApp, View Profile */}
                <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between gap-1.5 w-full">
                  <div className="flex items-center gap-1.5">
                    {person.phone && (
                      <a
                        href={`tel:${person.phone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-[#EEF2FF] border border-slate-100 text-slate-700 hover:text-[#4F46E5] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        title="Call Phone"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" strokeWidth={2} />
                        <span>Call</span>
                      </a>
                    )}
                    {(person.whatsapp || person.phone) && (
                      <a
                        href={`https://wa.me/${(person.whatsapp || person.phone || "").replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#DCFCE7]/70 hover:bg-[#DCFCE7] border border-emerald-200/60 text-[#16A34A] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        title="WhatsApp Chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/people/${person._id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EEF2FF] hover:bg-indigo-100/80 border border-indigo-100/80 text-[#4F46E5] text-[11px] font-bold transition-all cursor-pointer ml-auto shadow-2xs"
                    title="View Profile"
                  >
                    <span>Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Person Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-lg rounded-3xl border border-slate-100 bg-white text-slate-900 max-h-[90vh] overflow-y-auto shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span>Add Person Profile</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Sabbir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Relation / Connection *
                </label>
                <Input
                  required
                  placeholder="e.g. Brother, Wife, Engineer"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Phone Number
                </label>
                <Input
                  placeholder="e.g. +880 1700-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  {isRecordOnly ? "Email Address (Optional)" : "Email Address (Clerk Account)"}
                </label>
                <Input
                  type="email"
                  placeholder={isRecordOnly ? "Optional for record-only" : "e.g. sabbir@gmail.com"}
                  value={email}
                  disabled={isRecordOnly}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] rounded-xl disabled:opacity-50"
                />
              </div>
            </div>

            {/* Record-Only Person Toggle */}
            <div
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isRecordOnly
                  ? "bg-[#EEF2FF] border-indigo-200"
                  : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/60"
              }`}
              onClick={() => setIsRecordOnly(!isRecordOnly)}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="isRecordOnlyCheck"
                  checked={isRecordOnly}
                  onChange={(e) => setIsRecordOnly(e.target.checked)}
                  className="rounded border-slate-300 accent-[#4F46E5] w-4 h-4 cursor-pointer"
                />
                <div>
                  <label htmlFor="isRecordOnlyCheck" className="text-xs font-bold text-[#1E1B4B] cursor-pointer">
                    Record-Only Person (No login account)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    For financial care, gifts, debt ledger, & emergency records without requiring an email login.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Access Role
                </label>
                <select
                  value={isRecordOnly ? "individual" : role}
                  disabled={isRecordOnly}
                  onChange={(e) => setRole(e.target.value as LifeRole)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] focus:outline-none disabled:opacity-50 cursor-pointer"
                >
                  <option value="individual">Individual User (Assigned info only)</option>
                  <option value="guardian">Guardian (Family, emergency, medical)</option>
                  <option value="business_staff">Business Staff (Assigned business area)</option>
                  <option value="business_partner">Business Partner (Selected business)</option>
                  <option value="admin">Administrator (Permitted records)</option>
                  <option value="super_admin">Super Admin (Full access)</option>
                  <option value="read_only">Read Only (View-only access)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  Emergency Priority (1 = Highest)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0 (None), 1, 2, 3..."
                  value={emergencyPriority}
                  onChange={(e) => setEmergencyPriority(Number(e.target.value))}
                  className="h-10 border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Personal Message / Initial Note
              </label>
              <textarea
                rows={3}
                placeholder="Private instructions or letter intended for this person..."
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-xs focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Person Profile</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
