/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Contact,
  Plus,
  Search,
  Phone,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Building,
  HelpCircle,
  Trash2,
  Loader2,
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
  ILifeContact,
  ContactCategory,
  ILifePerson,
  ILifeBusiness,
} from "@/types";
import {
  createContact,
  deleteContact,
} from "@/lib/actions/lifeContact.actions";
import toast from "react-hot-toast";

interface ContactsClientProps {
  initialContacts: ILifeContact[];
  people: ILifePerson[];
  businesses: ILifeBusiness[];
}

export function ContactsClient({
  initialContacts,
  people,
  businesses,
}: ContactsClientProps) {
  const [contacts, setContacts] = useState<ILifeContact[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState<ContactCategory>("family");
  const [whenToContact, setWhenToContact] = useState("");
  const [notes, setNotes] = useState("");

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || c.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    "family",
    "business_partner",
    "engineer",
    "supplier",
    "bank",
    "lawyer",
    "accountant",
    "employee",
    "doctor",
    "other",
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone number are required.");
      return;
    }

    setLoading(true);
    try {
      const created = await createContact({
        name,
        phone,
        whatsapp: whatsapp || phone,
        email,
        company,
        role,
        category,
        whenToContact,
        notes,
      });

      setContacts([created, ...contacts]);
      toast.success(`Contact "${created.name}" added!`);
      setAddModalOpen(false);
      // Reset
      setName("");
      setPhone("");
      setWhatsapp("");
      setEmail("");
      setCompany("");
      setWhenToContact("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add contact.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, contactName: string) => {
    if (!confirm(`Delete contact "${contactName}"?`)) return;
    try {
      await deleteContact(id);
      setContacts(contacts.filter((c) => c._id !== id));
      toast.success("Contact deleted.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contact.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              <h1 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">
                Contact Directory
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/80">
                {contacts.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Key emergency advisors, lawyers, doctors, engineers, and suppliers
              with 1-tap call & messaging.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Contact
        </Button>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, company, or role..."
            className="pl-9 h-10 rounded-xl border-slate-200/80 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap capitalize transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#4F46E5] text-white shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 shadow-xs"
              }`}
            >
              {cat === "all" ? "All Contacts" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Cards */}
      {filteredContacts.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-2 shadow-xs">
          <Contact className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-black text-[#1E1B4B]">
            No Contacts Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Save critical contacts like family doctors, lawyers, bankers, and
            server engineers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredContacts.map((c) => (
            <div
              key={c._id}
              className="p-4 sm:p-5 rounded-2xl md:rounded-3xl bg-white border border-slate-100/90 hover:border-indigo-200/70 hover:shadow-md transition-all flex flex-col justify-between group shadow-[0_2px_12px_rgba(30,27,75,0.04)]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                    c.category === 'family' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    c.category === 'engineer' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    c.category === 'business_partner' || c.category === 'supplier' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                    c.category === 'bank' || c.category === 'accountant' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    c.category === 'lawyer' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    c.category === 'doctor' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {c.category.replace("_", " ")}
                  </span>
                  {c.company && (
                    <span className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                      {c.company}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-[#1E1B4B] group-hover:text-[#4F46E5] transition-colors mt-2.5 line-clamp-1">
                  {c.name}
                </h3>

                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {c.phone}
                </p>

                {c.whenToContact && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#4F46E5] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      Why/When: {c.whenToContact}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: 1-tap Call, WhatsApp, Email, Copy */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${c.phone}`}
                    className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center transition-all shadow-xs"
                    title="Call Phone"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${(c.whatsapp || c.phone).replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center transition-all shadow-xs"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 hover:text-[#4F46E5] hover:bg-[#EEF2FF] hover:border-indigo-200 flex items-center justify-center transition-all shadow-xs"
                      title="Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleCopy(c.phone, c._id)}
                    className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all shadow-xs cursor-pointer"
                    title="Copy Phone"
                  >
                    {copiedId === c._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(c._id, c.name)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-md rounded-3xl border border-slate-100 bg-white text-[#1E1B4B] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E1B4B] flex items-center gap-2">
              <Contact className="w-5 h-5 text-[#4F46E5]" />
              <span>Add Directory Contact</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Contact Name *
              </label>
              <Input
                required
                placeholder="e.g. Barrister Rafiqul Islam or Dr. Kamal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Phone Number *
                </label>
                <Input
                  required
                  placeholder="e.g. +880 1700..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ContactCategory)
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400 focus:outline-none cursor-pointer"
                >
                  <option value="family">Family</option>
                  <option value="business_partner">Business Partner</option>
                  <option value="engineer">Engineer / Technical</option>
                  <option value="supplier">Supplier</option>
                  <option value="bank">Bank Manager / Banker</option>
                  <option value="lawyer">Lawyer / Legal</option>
                  <option value="accountant">Accountant</option>
                  <option value="doctor">Doctor</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Company / Organization
                </label>
                <Input
                  placeholder="e.g. Supreme Court Chambers"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="e.g. contact@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                When & Why to Contact This Person
              </label>
              <Input
                placeholder="e.g. Contact immediately if server lease renewal issue happens"
                value={whenToContact}
                onChange={(e) => setWhenToContact(e.target.value)}
                className="h-10 border-slate-200/80 bg-slate-50/50 text-[#1E1B4B] text-xs focus:bg-white focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 px-4 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs transition-all active:scale-95"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Contact
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
