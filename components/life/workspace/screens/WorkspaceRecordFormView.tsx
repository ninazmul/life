"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  WorkspaceCategoryConfig,
  WorkspaceSubcategoryConfig,
} from "@/lib/life/workspaceCategories";
import { WorkspaceRecordItem } from "@/lib/actions/lifeWorkspace.actions";

interface WorkspaceRecordFormViewProps {
  category: WorkspaceCategoryConfig;
  subcategory: WorkspaceSubcategoryConfig;
  initialRecord?: WorkspaceRecordItem | null;
  onBack: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
}

export function WorkspaceRecordFormView({
  category,
  subcategory,
  initialRecord,
  onBack,
  onSave,
}: WorkspaceRecordFormViewProps) {
  const isEditing = Boolean(initialRecord);

  const [title, setTitle] = useState(initialRecord?.title || "");
  const [accountType, setAccountType] = useState(
    initialRecord?.subtitle ? initialRecord.subtitle.split("\n")[0] : "Savings Account"
  );
  const [accountNumber, setAccountNumber] = useState(
    initialRecord?.referenceNumber || ""
  );
  const [amount, setAmount] = useState(
    initialRecord?.amount !== undefined ? String(initialRecord.amount) : "0"
  );
  const [branch, setBranch] = useState(
    initialRecord?.details?.["Branch / Location"] || ""
  );
  const [currency, setCurrency] = useState(initialRecord?.currency || "BDT (৳)");
  const [notes, setNotes] = useState(initialRecord?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        name: title.trim(),
        accountType,
        accountNumber: accountNumber.trim(),
        amount: Number(amount.replace(/[^0-9.]/g, "")) || 0,
        value: Number(amount.replace(/[^0-9.]/g, "")) || 0,
        branch: branch.trim(),
        currency,
        notes: notes.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 pb-28 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-8 h-8 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center text-slate-600 shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[#1E1B4B] tracking-tight leading-snug truncate">
            {isEditing ? `Edit ${subcategory.unitLabel || "Record"}` : `Add ${subcategory.unitLabel || "Record"}`}
          </h1>
          <p className="text-[12px] text-slate-500 font-normal truncate mt-0.5">
            {isEditing
              ? `Update ${subcategory.title.toLowerCase()} details`
              : `Create a new ${subcategory.title.toLowerCase()} record`}
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name / Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1E1B4B]">
            {subcategory.id === "cash_bank" ? "Bank Name" : "Record Name / Title"}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={subcategory.id === "cash_bank" ? "e.g. BRAC Bank" : "Enter record name"}
            className="w-full bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Account / Category Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1E1B4B]">
            {subcategory.id === "cash_bank" ? "Account Type" : "Category Type"}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full appearance-none bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Savings Account">Savings Account</option>
              <option value="Current Account">Current Account</option>
              <option value="Fixed Deposit">Fixed Deposit</option>
              <option value="Mobile Wallet">Mobile Wallet (bKash/Nagad)</option>
              <option value="Cash">Physical Cash</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Account Number / Identifier */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1E1B4B]">
            {subcategory.id === "cash_bank" ? "Account Number" : "Reference / ID"}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={
              subcategory.id === "cash_bank"
                ? "Enter account number (e.g. 150120...)"
                : "Enter reference or document number"
            }
            className="w-full bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Current Balance / Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1E1B4B]">
            {subcategory.amountField === "balance" ? "Current Balance" : "Amount / Value"}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">
              ৳
            </span>
            <input
              type="text"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-white rounded-xl border border-slate-200 pl-8 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Branch / Location */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1E1B4B]">
            Branch / Location
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Enter branch name (optional)"
            className="w-full bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#1E1B4B]">
            Currency
          </label>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full appearance-none bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="BDT (৳)">BDT (৳)</option>
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="GBP (£)">GBP (£)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#1E1B4B]">
              Notes
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {notes.length}/500
            </span>
          </div>
          <textarea
            maxLength={500}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes (optional)"
            className="w-full bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Bottom Actions: Cancel & Save */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="py-2.5 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-8 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
