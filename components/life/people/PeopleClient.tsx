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
      relationFilter === "all" ||
      p.relation.toLowerCase() === relationFilter.toLowerCase();

    return matchesSearch && matchesRelation;
  });

  const relations = ["all", "Wife", "Brother", "Parents", "Partner", "Engineer", "Staff", "Family"];

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
        email,
        role,
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
      setPersonalMessage("");
      setEmergencyPriority(0);
    } catch (err: any) {
      toast.error(err.message || "Failed to create person profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              People & Trusted Network
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {people.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Designate trusted family, partners, and advisors with specific access rules.
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 shadow-sm shadow-emerald-950/30"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Person
        </Button>
      </div>

      {/* Search & Relation Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, relation, phone, or email..."
            className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs"
          />
        </div>

        {/* Relation Pills (horizontal scroll on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {relations.map((rel) => (
            <button
              key={rel}
              onClick={() => setRelationFilter(rel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                relationFilter === rel
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {rel === "all" ? "All Relations" : rel}
            </button>
          ))}
        </div>
      </div>

      {/* People Cards Grid */}
      {filteredPeople.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No People Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add trusted individuals who may receive legacy messages, emergency instructions, or financial records.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            + Add Person
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPeople.map((person) => (
            <div
              key={person._id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                {/* Top: Avatar, Name, Relation, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base shrink-0">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {person.name}
                        </h3>
                        {person.emergencyPriority ? (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                            P{person.emergencyPriority}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {person.relation}
                      </span>
                    </div>
                  </div>

                  {/* Status chip */}
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                      person.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : person.status === "locked"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {person.status}
                  </span>
                </div>

                {/* Role and contact preview */}
                <div className="mt-3.5 space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span className="capitalize font-medium text-slate-300">
                      {person.role.replace("_", " ")}
                    </span>
                  </div>
                  {person.phone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{person.phone}</span>
                    </div>
                  )}
                  {person.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{person.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Actions: Call, WhatsApp, View Profile */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {person.phone && (
                    <a
                      href={`tel:${person.phone}`}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                      title="Call Phone"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {(person.whatsapp || person.phone) && (
                    <a
                      href={`https://wa.me/${(person.whatsapp || person.phone || "").replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                      title="WhatsApp Chat"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-semibold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/30 gap-1 rounded-xl"
                >
                  <Link href={`/people/${person._id}`}>
                    Profile <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Person Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Add Person Profile</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Sabbir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Relation / Connection *
                </label>
                <Input
                  required
                  placeholder="e.g. Brother, Wife, Engineer"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Phone Number
                </label>
                <Input
                  placeholder="e.g. +880 1700-000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Email Address (Clerk Account)
                </label>
                <Input
                  type="email"
                  placeholder="e.g. sabbir@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Access Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as LifeRole)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="individual">Individual User (Assigned info only)</option>
                  <option value="business">Business User (Selected business)</option>
                  <option value="admin">Administrator (Permitted records)</option>
                  <option value="super_admin">Super Admin (Full access)</option>
                  <option value="read_only">Read Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Emergency Priority (1 = Highest)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0 (None), 1, 2, 3..."
                  value={emergencyPriority}
                  onChange={(e) => setEmergencyPriority(Number(e.target.value))}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Personal Message / Initial Note
              </label>
              <textarea
                rows={3}
                placeholder="Private instructions or letter intended for this person..."
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Person Profile
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
