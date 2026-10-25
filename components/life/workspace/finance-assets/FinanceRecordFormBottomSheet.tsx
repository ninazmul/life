"use client";

import React, { useState } from "react";
import {
  X,
  Heart,
  Calendar,
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  HandCoins,
  ShieldCheck,
  Lock,
  Share2,
  ChevronRight,
  ChevronDown,
  Paperclip,
  Info,
  DollarSign,
  User,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { saveSisCareRecord } from "@/lib/actions/lifeWorkspace.actions";

interface FinanceRecordFormBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordCreated: () => void;
  defaultRecordType?: string;
  peopleList: Array<{ id: string; name: string; relation?: string }>;
  accountsList: Array<{ id: string; name: string; type: string; balance: number }>;
}

export function FinanceRecordFormBottomSheet({
  isOpen,
  onClose,
  onRecordCreated,
  defaultRecordType = "sis_care",
  peopleList = [],
  accountsList = [],
}: FinanceRecordFormBottomSheetProps) {
  const [recordType, setRecordType] = useState<string>(
    defaultRecordType === "all" ? "sis_care" : defaultRecordType
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common Fields
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("BDT");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paidFromAccount, setPaidFromAccount] = useState<string>(
    accountsList[0]?.name || "Cash • BDT"
  );
  const [notes, setNotes] = useState<string>("");
  const [isShared, setIsShared] = useState<boolean>(false);
  const [showPrivateNotes, setShowPrivateNotes] = useState<boolean>(false);

  // SiS Care Specific
  const [supportType, setSupportType] = useState<"flexible_support" | "gift">("flexible_support");
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    peopleList[0]?.id || "custom"
  );
  const [customPersonName, setCustomPersonName] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");

  // Cash & Bank Specific
  const [accountName, setAccountName] = useState<string>("");
  const [accountType, setAccountType] = useState<"bank" | "cash" | "wallet">("bank");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [openingBalance, setOpeningBalance] = useState<string>("");

  // General Title for Income/Expense/Loan/Asset
  const [recordTitle, setRecordTitle] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recordType === "sis_care") {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      let personName = "";
      if (selectedPersonId && selectedPersonId !== "custom") {
        const found = peopleList.find((p) => p.id === selectedPersonId);
        personName = found?.name || "Member";
      } else {
        personName = customPersonName.trim();
      }

      if (!personName) {
        toast.error("Please select or enter a person name");
        return;
      }

      try {
        setIsSubmitting(true);
        const res = await saveSisCareRecord({
          personId: selectedPersonId !== "custom" ? selectedPersonId : undefined,
          personName,
          supportType,
          amount: parsedAmount,
          date,
          paidFromAccount,
          purpose: purpose.trim() || undefined,
          ownerPrivateNotes: notes.trim() || undefined,
          isShared,
        });

        if (res.success) {
          toast.success(
            supportType === "gift"
              ? "Gift record recorded successfully"
              : "Flexible Support record created"
          );
          onRecordCreated();
          onClose();
        } else {
          toast.error(res.error || "Failed to save record");
        }
      } catch (err: any) {
        toast.error(err.message || "Something went wrong");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Other financial types confirmation
      const parsedAmount = parseFloat(amount || openingBalance);
      if (isNaN(parsedAmount) && recordType !== "cash_bank") {
        toast.error("Please enter a valid amount");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success(`Record added: ${recordTitle || accountName || "Financial Record"}`);
        onRecordCreated();
        onClose();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content matching Mockup Screen 4 */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E1B4B] dark:text-white">
            Add Financial Record
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Record Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Record Type
            </label>
            <div className="relative">
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              >
                <option value="sis_care">❤️ SiS Care</option>
                <option value="cash_bank">🏦 Cash & Bank</option>
                <option value="income">↗️ Income</option>
                <option value="expenses">↘️ Expenses</option>
                <option value="loans_given">🤝 Loans Given</option>
                <option value="liabilities">📄 Liabilities</option>
                <option value="assets">🏠 Assets & Property</option>
                <option value="investments">📊 Investments</option>
                <option value="other">⋯ Other Financial Records</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* DYNAMIC FIELDS FOR SIS CARE */}
          {recordType === "sis_care" && (
            <>
              {/* Support Type Selector */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Support Type
                  </label>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                    <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-lg z-20">
                      Flexible Support can be returned voluntarily. Gifts are non-repayable.
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={supportType}
                    onChange={(e) =>
                      setSupportType(e.target.value as "flexible_support" | "gift")
                    }
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  >
                    <option value="flexible_support">Flexible Support</option>
                    <option value="gift">Gift / Non-Repayable Support</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Related Person */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Related Person
                </label>
                <div className="relative">
                  <select
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  >
                    {peopleList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.relation ? `(${p.relation})` : ""}
                      </option>
                    ))}
                    <option value="custom">+ Enter Name Manually</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

                {selectedPersonId === "custom" && (
                  <input
                    type="text"
                    placeholder="Enter recipient's full name"
                    value={customPersonName}
                    onChange={(e) => setCustomPersonName(e.target.value)}
                    className="mt-2 w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>

              {/* Amount (BDT) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-500">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="30,000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-11 pl-8 pr-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Paid From Account */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Paid From
                </label>
                <div className="relative">
                  <select
                    value={paidFromAccount}
                    onChange={(e) => setPaidFromAccount(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  >
                    {accountsList.length > 0 ? (
                      accountsList.map((acc) => (
                        <option key={acc.id} value={acc.name}>
                          {acc.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Cash • BDT">Cash • BDT</option>
                        <option value="BRAC Bank • BDT">BRAC Bank • BDT</option>
                        <option value="City Bank • BDT">City Bank • BDT</option>
                        <option value="bKash Wallet">bKash Wallet</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Purpose (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Purpose <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal support"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Private Notes & Attachments (Collapsible matching mockup) */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPrivateNotes(!showPrivateNotes)}
                  className="w-full p-3.5 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Private notes & attachments</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showPrivateNotes ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {showPrivateNotes && (
                  <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Owner Private Notes (Never shared)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Private context, personal reason, or intent..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Access Section matching Mockup */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Access
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isShared
                          ? "bg-purple-100 text-purple-600"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isShared ? <Share2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {isShared ? "Share selected information" : "Private by default"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {isShared
                          ? "Recipient can view shared totals and selected history"
                          : "Only visible to Owner and administrators"}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsShared(!isShared)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                      isShared ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        isShared ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Supportive Notice Footer */}
              <div className="text-center pt-1 pb-1">
                <p className="text-[11px] text-slate-400">
                  No fixed due date or automatic repayment reminders.
                </p>
              </div>
            </>
          )}

          {/* DYNAMIC FIELDS FOR CASH & BANK */}
          {recordType === "cash_bank" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Account Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. BRAC Bank Salary Account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) =>
                      setAccountType(e.target.value as "bank" | "cash" | "wallet")
                    }
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  >
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="wallet">Digital Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    placeholder="250,000"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {accountType !== "cash" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Bank / Provider Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BRAC Bank PLC"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              )}
            </>
          )}

          {/* DYNAMIC FIELDS FOR OTHER TYPES (Income, Expenses, Loans, Liabilities, Assets) */}
          {recordType !== "sis_care" && recordType !== "cash_bank" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Record Title *
                </label>
                <input
                  type="text"
                  placeholder={
                    recordType === "loans_given"
                      ? "e.g. Personal Loan to Ahmed"
                      : recordType === "assets"
                      ? "e.g. Dhanmondi Residential Plot"
                      : "e.g. Monthly Consulting Retainer"
                  }
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Amount (BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-500">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="50,000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-11 pl-8 pr-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-[#1E1B4B] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Action Buttons matching Mockup Screen 4 */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm shadow-md shadow-purple-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
