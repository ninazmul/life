/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Contact Directory
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {contacts.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Key emergency advisors, lawyers, doctors, engineers, and suppliers
            with 1-tap call & messaging.
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Contact
        </Button>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, company, or role..."
            className="pl-9 h-10 rounded-xl border-border bg-secondary text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap capitalize transition-all ${
                categoryFilter === cat
                  ? "bg-sky-600 text-white font-semibold shadow-xs"
                  : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All Contacts" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Cards */}
      {filteredContacts.length === 0 ? (
        <div className="p-10 rounded-3xl border border-dashed border-border text-center space-y-2">
          <Contact className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-muted-foreground">
            No Contacts Found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Save critical contacts like family doctors, lawyers, bankers, and
            server engineers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredContacts.map((c) => (
            <div
              key={c._id}
              className="p-4 rounded-2xl bg-secondary border border-border hover:border-border transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {c.category.replace("_", " ")}
                  </span>
                  {c.company && (
                    <span className="text-xs text-muted-foreground font-medium truncate max-w-[140px]">
                      {c.company}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-foreground mt-2 line-clamp-1">
                  {c.name}
                </h3>

                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {c.phone}
                </p>

                {c.whenToContact && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-muted text-xs text-muted-foreground flex items-start gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      Why/When: {c.whenToContact}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons: 1-tap Call, WhatsApp, Email, Copy */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${c.phone}`}
                    className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                    title="Call Phone"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${(c.whatsapp || c.phone).replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-sky-400 hover:bg-sky-950/40 transition-colors"
                      title="Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleCopy(c.phone, c._id)}
                    className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-white transition-colors"
                    title="Copy Phone"
                  >
                    {copiedId === c._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(c._id, c.name)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
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
        <DialogContent className="life-dialog sm:max-w-md rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Contact className="w-5 h-5 text-sky-400" />
              <span>Add Directory Contact</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Contact Name *
              </label>
              <Input
                required
                placeholder="e.g. Barrister Rafiqul Islam or Dr. Kamal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Phone Number *
                </label>
                <Input
                  required
                  placeholder="e.g. +880 1700..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-sky-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ContactCategory)
                  }
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-sky-500 focus:outline-none"
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
                <label className="text-xs font-semibold text-slate-300">
                  Company / Organization
                </label>
                <Input
                  placeholder="e.g. Supreme Court Chambers"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="e.g. contact@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                When & Why to Contact This Person
              </label>
              <Input
                placeholder="e.g. Contact immediately if server lease renewal issue happens"
                value={whenToContact}
                onChange={(e) => setWhenToContact(e.target.value)}
                className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
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
                className="h-9 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
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
