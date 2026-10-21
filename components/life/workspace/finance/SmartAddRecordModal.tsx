"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Receipt,
  HeartHandshake,
  ArrowRightLeft,
  CreditCard,
  Building2,
  Calendar,
  Lock,
  FileCheck2,
} from "lucide-react";
import { ILifePerson } from "@/types";
import {
  createUnifiedIncome,
  createUnifiedExpense,
  createUnifiedLoan,
  recordUnifiedLoanRepayment,
  createUnifiedSupport,
  createUnifiedTransfer,
  createUnifiedBill,
  getActiveLoansForRepayment,
} from "@/lib/actions/lifeUnifiedFinance.actions";
import toast from "react-hot-toast";

interface SmartAddRecordModalProps {
  activeFilter: string;
  peopleList: ILifePerson[];
  onRecordCreated: () => void;
  currencySymbol?: string;
}

type ActionType =
  | "income"
  | "expense"
  | "loan_given"
  | "loan_taken"
  | "repayment"
  | "support"
  | "sis_care"
  | "transfer"
  | "bill_due";

export function SmartAddRecordModal({
  activeFilter,
  peopleList,
  onRecordCreated,
  currencySymbol = "৳",
}: SmartAddRecordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [personId, setPersonId] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("Bank Transfer");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [destinationAccount, setDestinationAccount] = useState("Cash");

  // Active loans for repayment form
  const [activeLoans, setActiveLoans] = useState<
    Array<{
      id: string;
      title: string;
      personName: string;
      amount: number;
      remainingAmount: number;
    }>
  >([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");

  useEffect(() => {
    if (selectedAction === "repayment") {
      getActiveLoansForRepayment().then((loans) => {
        setActiveLoans(loans);
        if (loans.length > 0 && !selectedLoanId) {
          setSelectedLoanId(loans[0].id);
        }
      });
    }
  }, [selectedAction]);

  const resetForm = () => {
    setSelectedAction(null);
    setAmount("");
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setPersonId("");
    setCategory("");
    setAccount("Bank Transfer");
    setNotes("");
    setDueDate("");
    setSelectedLoanId("");
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleActionSelect = (act: ActionType) => {
    setSelectedAction(act);
    // Pre-fill categories or defaults based on action
    if (act === "sis_care") setCategory("Family Support");
    else if (act === "support") setCategory("Gift");
    else if (act === "income") setCategory("Salary / Revenue");
    else if (act === "expense") setCategory("General Living");
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedAction === "income") {
        await createUnifiedIncome({
          amount: numAmount,
          source: category || "General Income",
          date,
          account,
          description: notes || title,
          personId,
        });
        toast.success("Income recorded successfully!");
      } else if (selectedAction === "expense") {
        await createUnifiedExpense({
          amount: numAmount,
          category: category || "General Expense",
          date,
          account,
          description: notes || title,
          personId,
        });
        toast.success("Expense recorded successfully!");
      } else if (selectedAction === "loan_given" || selectedAction === "loan_taken") {
        if (!personId) {
          toast.error("Please select a counterparty from your People directory");
          setIsSubmitting(false);
          return;
        }
        await createUnifiedLoan({
          type: selectedAction === "loan_given" ? "given" : "taken",
          personId,
          amount: numAmount,
          date,
          dueDate: dueDate || undefined,
          terms: title || notes,
          notes,
        });
        toast.success(`Loan ${selectedAction === "loan_given" ? "disbursed" : "recorded"} successfully!`);
      } else if (selectedAction === "repayment") {
        if (!selectedLoanId) {
          toast.error("Please select an existing loan to apply repayment");
          setIsSubmitting(false);
          return;
        }
        const loan = activeLoans.find((l) => l.id === selectedLoanId);
        if (loan && numAmount > loan.remainingAmount) {
          toast.error(`Repayment cannot exceed outstanding balance of ৳${loan.remainingAmount.toLocaleString()}`);
          setIsSubmitting(false);
          return;
        }
        await recordUnifiedLoanRepayment({
          loanId: selectedLoanId,
          amount: numAmount,
          date,
          account,
          notes,
        });
        toast.success("Loan repayment recorded!");
      } else if (selectedAction === "support" || selectedAction === "sis_care") {
        if (!personId) {
          toast.error("Please select a recipient from People directory");
          setIsSubmitting(false);
          return;
        }
        await createUnifiedSupport({
          title: title || `${selectedAction === "sis_care" ? "SiS Care" : "Support"}`,
          recipientPersonId: personId,
          amount: numAmount,
          supportType: selectedAction === "sis_care" ? "family_support" : "gift",
          date,
          account,
          notes,
        });
        toast.success("Financial support recorded!");
      } else if (selectedAction === "transfer") {
        await createUnifiedTransfer({
          amount: numAmount,
          sourceAccount: account || "Main Bank",
          destinationAccount: destinationAccount || "Cash",
          date,
          notes,
        });
        toast.success("Account transfer recorded!");
      } else if (selectedAction === "bill_due") {
        await createUnifiedBill({
          title: title || "Pending Bill / Commitment",
          amount: numAmount,
          dueDate: dueDate || date,
          account,
          notes,
          personId,
        });
        toast.success("Bill / Due commitment recorded!");
      }

      handleClose();
      onRecordCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Context-aware actions
  const getContextActions = (): Array<{ id: ActionType; label: string; icon: any; color: string }> => {
    if (activeFilter === "loans") {
      return [
        { id: "loan_given", label: "Give Loan", icon: ArrowUpRight, color: "text-amber-600 bg-amber-50" },
        { id: "loan_taken", label: "Receive Loan", icon: ArrowDownLeft, color: "text-purple-600 bg-purple-50" },
        { id: "repayment", label: "Record Repayment", icon: HandCoins, color: "text-sky-600 bg-sky-50" },
      ];
    }
    if (activeFilter === "income") {
      return [
        { id: "income", label: "Add Income", icon: ArrowUpRight, color: "text-emerald-600 bg-emerald-50" },
      ];
    }
    if (activeFilter === "expenses") {
      return [
        { id: "expense", label: "Add Expense", icon: ArrowDownLeft, color: "text-rose-600 bg-rose-50" },
        { id: "bill_due", label: "Add Bill / Due", icon: Receipt, color: "text-orange-600 bg-orange-50" },
      ];
    }
    if (activeFilter === "support") {
      return [
        { id: "sis_care", label: "Add SiS Care", icon: HeartHandshake, color: "text-pink-600 bg-pink-50" },
        { id: "support", label: "Add Gift / Support", icon: HeartHandshake, color: "text-indigo-600 bg-indigo-50" },
      ];
    }
    // Default "All" list
    return [
      { id: "income", label: "Add Income", icon: ArrowUpRight, color: "text-emerald-600 bg-emerald-50" },
      { id: "expense", label: "Add Expense", icon: ArrowDownLeft, color: "text-rose-600 bg-rose-50" },
      { id: "loan_given", label: "Give Loan", icon: ArrowUpRight, color: "text-amber-600 bg-amber-50" },
      { id: "loan_taken", label: "Receive Loan", icon: ArrowDownLeft, color: "text-purple-600 bg-purple-50" },
      { id: "repayment", label: "Record Repayment", icon: HandCoins, color: "text-sky-600 bg-sky-50" },
      { id: "sis_care", label: "Add SiS Care", icon: HeartHandshake, color: "text-pink-600 bg-pink-50" },
      { id: "support", label: "Add Gift / Support", icon: HeartHandshake, color: "text-indigo-600 bg-indigo-50" },
      { id: "transfer", label: "Transfer Money", icon: ArrowRightLeft, color: "text-slate-600 bg-slate-100" },
      { id: "bill_due", label: "Add Bill / Due", icon: Receipt, color: "text-orange-600 bg-orange-50" },
    ];
  };

  const selectedLoan = activeLoans.find((l) => l.id === selectedLoanId);

  return (
    <>
      {/* ── Fixed Floating Smart Add Button (Positioned clear of bottom navigation) ── */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-[13px] shadow-[0_8px_24px_rgba(79,70,229,0.35)] active:scale-95 transition-all cursor-pointer"
          aria-label="Add financial record"
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          <span>Add Record</span>
        </button>
      </div>

      {/* ── Modal Dialog ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#4F46E5] flex items-center justify-center">
                  <Plus className="w-4 h-4" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1E1B4B] dark:text-white leading-tight">
                    {selectedAction ? "Record Details" : "Add Financial Record"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedAction ? "Private by default (Owner Only)" : "Select an action below"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Step 1: Action Picker (if no action selected) */}
              {!selectedAction ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {getContextActions().map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleActionSelect(act.id)}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-all flex items-center gap-2.5 text-left cursor-pointer group active:scale-95"
                      >
                        <div className={`w-8 h-8 rounded-xl ${act.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[12px] sm:text-[13px] font-bold text-[#1E1B4B] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {act.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Step 2: Form Input Fields */
                <form onSubmit={handleSubmit} className="space-y-3.5 text-[12px]">
                  {/* Action Banner */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                    <span className="font-bold text-[#1E1B4B] dark:text-white capitalize">
                      {selectedAction.replace("_", " ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAction(null)}
                      className="text-[11px] font-bold text-[#4F46E5] hover:underline"
                    >
                      Change Type
                    </button>
                  </div>

                  {/* Loan Repayment Specific: Target Loan Picker */}
                  {selectedAction === "repayment" && (
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Select Existing Loan to Repay *
                      </label>
                      {activeLoans.length === 0 ? (
                        <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          No active outstanding loans found with remaining balance.
                        </p>
                      ) : (
                        <select
                          value={selectedLoanId}
                          onChange={(e) => setSelectedLoanId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-medium"
                          required
                        >
                          {activeLoans.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.personName} — Balance: ৳{l.remainingAmount.toLocaleString()} (Total: ৳{l.amount.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      )}
                      {selectedLoan && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Current Outstanding Balance: <strong className="text-rose-600">৳{selectedLoan.remainingAmount.toLocaleString()}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Amount Field (BDT ৳) */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Amount (BDT {currencySymbol}) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[14px]">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-8 pr-3 text-[14px] font-extrabold text-[#1E1B4B] dark:text-white"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Person Selector (for loans, support, income/expense link) */}
                  {selectedAction !== "repayment" && selectedAction !== "transfer" && (
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        {["loan_given", "loan_taken", "support", "sis_care"].includes(selectedAction)
                          ? "Counterparty / Recipient *"
                          : "Linked Person (Optional)"}
                      </label>
                      <select
                        value={personId}
                        onChange={(e) => setPersonId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-medium"
                        required={["loan_given", "loan_taken", "support", "sis_care"].includes(selectedAction)}
                      >
                        <option value="">
                          {["loan_given", "loan_taken", "support", "sis_care"].includes(selectedAction)
                            ? "-- Select from People directory --"
                            : "-- No linked person --"}
                        </option>
                        {peopleList.map((p) => (
                          <option key={String((p as any)._id)} value={String((p as any)._id)}>
                            {p.name} {p.relation ? `(${p.relation})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Title / Description */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Title / Purpose
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={selectedAction === "income" ? "e.g. October Salary" : "e.g. House Rent, Business Advance"}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  {/* Date & Due Date Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-medium"
                        required
                      />
                    </div>

                    {(selectedAction === "loan_given" || selectedAction === "loan_taken" || selectedAction === "bill_due") && (
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* Account / Payment Method */}
                  {selectedAction === "transfer" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Source Account
                        </label>
                        <input
                          type="text"
                          value={account}
                          onChange={(e) => setAccount(e.target.value)}
                          placeholder="e.g. Main Bank"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Destination Account
                        </label>
                        <input
                          type="text"
                          value={destinationAccount}
                          onChange={(e) => setDestinationAccount(e.target.value)}
                          placeholder="e.g. Cash In Hand"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Payment Method / Account
                      </label>
                      <select
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-medium"
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="bKash / Nagad">Mobile Banking (bKash / Nagad)</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes or references..."
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-700 dark:text-slate-200"
                    />
                  </div>

                  {/* Privacy Notice */}
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 border border-slate-200/50">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Private by default. Linking a person does NOT share this record.</span>
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Save Record"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
