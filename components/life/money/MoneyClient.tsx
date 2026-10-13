/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Receipt,
  Calendar,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SettlementModal } from "@/components/life/shared/SettlementModal";
import {
  ILifeMoneyRecord,
  ILifeTransaction,
  LifeMoneyType,
  ILifePerson,
  ILifeBusiness,
} from "@/types";
import { createMoneyRecord } from "@/lib/actions/lifeMoney.actions";
import toast from "react-hot-toast";

interface MoneyClientProps {
  overview: any;
  records: ILifeMoneyRecord[];
  transactions: ILifeTransaction[];
  people: ILifePerson[];
  businesses: ILifeBusiness[];
}

export function MoneyClient({
  overview,
  records: initialRecords,
  transactions: initialTransactions,
  people,
  businesses,
}: MoneyClientProps) {
  const [records, setRecords] = useState<ILifeMoneyRecord[]>(initialRecords);
  const [transactions] = useState<ILifeTransaction[]>(initialTransactions);
  const [activeTab, setActiveTab] = useState("overview");

  // Add Money Record Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<LifeMoneyType>("given");
  const [personId, setPersonId] = useState("none");
  const [personName, setPersonName] = useState("");
  const [businessId, setBusinessId] = useState("none");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [profitShare, setProfitShare] = useState("");
  const [ownershipPercentage, setOwnershipPercentage] = useState("");
  const [notes, setNotes] = useState("");

  // Settlement Modal State
  const [selectedRecordForSettlement, setSelectedRecordForSettlement] =
    useState<any | null>(null);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);

  const handleOpenSettlement = (record: any) => {
    setSelectedRecordForSettlement(record);
    setSettlementModalOpen(true);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      const created = await createMoneyRecord({
        type,
        personId: personId !== "none" ? personId : undefined,
        personName,
        businessId: businessId !== "none" ? businessId : undefined,
        amount: num,
        purpose,
        expectedReturnDate,
        interestRate,
        profitShare,
        ownershipPercentage: Number(ownershipPercentage) || 0,
        notes,
      });

      setRecords([created, ...records]);
      toast.success(
        `${type.replace("_", " ").toUpperCase()} record added successfully!`,
      );
      setAddModalOpen(false);
      // Reset form
      setAmount("");
      setPurpose("");
      setPersonName("");
      setExpectedReturnDate("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create money record.");
    } finally {
      setLoading(false);
    }
  };

  const givenRecords = records.filter((r) => r.type === "given");
  const takenRecords = records.filter((r) => r.type === "taken");
  const investmentRecords = records.filter(
    (r) => r.type === "invest_made" || r.type === "invest_received",
  );
  const receivables = givenRecords.filter((r) => r.remainingAmount > 0);
  const payables = takenRecords.filter((r) => r.remainingAmount > 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] tracking-tight">
              Money Management
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/80 shadow-2xs">
              Financial Care & Equity
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Transparent tracking of financial care provided, received, and active investments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
          <span>Add Money Record</span>
        </button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-200/70 hover:shadow-md transition-all">
          <span className="text-[11px] font-semibold text-slate-500">
            Care Provided
          </span>
          <div className="text-lg sm:text-xl font-bold text-[#1E1B4B] font-mono mt-1">
            ৳{overview?.given?.total?.toLocaleString() || 0}
          </div>
          <span className="text-[10px] font-semibold text-[#16A34A] block mt-0.5">
            Rem: ৳{overview?.given?.remaining?.toLocaleString() || 0}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-amber-200/70 hover:shadow-md transition-all">
          <span className="text-[11px] font-semibold text-slate-500">
            Care Received
          </span>
          <div className="text-lg sm:text-xl font-bold text-[#D97706] font-mono mt-1">
            ৳{overview?.taken?.total?.toLocaleString() || 0}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
            Due: ৳{overview?.taken?.remaining?.toLocaleString() || 0}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-sky-200/70 hover:shadow-md transition-all">
          <span className="text-[11px] font-semibold text-slate-500">
            Investment Made
          </span>
          <div className="text-lg sm:text-xl font-bold text-[#0284C7] font-mono mt-1">
            ৳{overview?.investMade?.total?.toLocaleString() || 0}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
            Equity/Return
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-200/70 hover:shadow-md transition-all">
          <span className="text-[11px] font-semibold text-slate-500">
            Investment Received
          </span>
          <div className="text-lg sm:text-xl font-bold text-[#4F46E5] font-mono mt-1">
            ৳{overview?.investReceived?.total?.toLocaleString() || 0}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
            Partner capital
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#DCFCE7]/40 border border-emerald-200/80 shadow-[0_2px_12px_rgba(22,163,74,0.04)] hover:shadow-md transition-all">
          <span className="text-[11px] font-semibold text-[#16A34A] flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" strokeWidth={2.4} />
            Receivable
          </span>
          <div className="text-lg sm:text-xl font-bold text-[#16A34A] font-mono mt-1">
            ৳{overview?.receivables?.toLocaleString() || 0}
          </div>
          <span className="text-[10px] font-semibold text-[#16A34A]/80 block mt-0.5">
            Pending returns
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-[0_2px_12px_rgba(225,29,72,0.04)] hover:shadow-md transition-all">
          <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" strokeWidth={2.4} />
            Payable
          </span>
          <div className="text-lg sm:text-xl font-bold text-rose-600 font-mono mt-1">
            ৳{overview?.payables?.toLocaleString() || 0}
          </div>
          <span className="text-[10px] font-semibold text-rose-500 block mt-0.5">Obligations</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-white p-1 rounded-2xl border border-slate-100/90 shadow-2xs flex overflow-x-auto scrollbar-none max-w-full justify-start h-auto gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-xs text-slate-600 hover:text-[#1E1B4B] transition-all cursor-pointer"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="given"
            className="rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-xs text-slate-600 hover:text-[#1E1B4B] transition-all cursor-pointer"
          >
            Care Provided ({givenRecords.length})
          </TabsTrigger>
          <TabsTrigger
            value="taken"
            className="rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-xs text-slate-600 hover:text-[#1E1B4B] transition-all cursor-pointer"
          >
            Care Received ({takenRecords.length})
          </TabsTrigger>
          <TabsTrigger
            value="investments"
            className="rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-xs text-slate-600 hover:text-[#1E1B4B] transition-all cursor-pointer"
          >
            Investments ({investmentRecords.length})
          </TabsTrigger>
          <TabsTrigger
            value="receivables"
            className="rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-xs text-slate-600 hover:text-[#1E1B4B] transition-all cursor-pointer"
          >
            Receivables ({receivables.length})
          </TabsTrigger>
          <TabsTrigger
            value="payables"
            className="rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-xs text-slate-600 hover:text-[#1E1B4B] transition-all cursor-pointer"
          >
            Payables ({payables.length})
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-[#4F46E5] data-[state=active]:text-white data-[state=active]:shadow-xs text-slate-600 hover:text-[#1E1B4B] transition-all cursor-pointer"
          >
            Transactions Ledger
          </TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Urgent Receivables List */}
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4" strokeWidth={2.4} />
                  <span>Pending Receivables</span>
                </h3>
                <span className="text-xs font-bold text-[#16A34A] font-mono px-2 py-0.5 rounded-full bg-[#DCFCE7] border border-emerald-200/70">
                  {receivables.length} Active
                </span>
              </div>
              {receivables.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No pending receivables.
                </p>
              ) : (
                <div className="space-y-2">
                  {receivables.slice(0, 5).map((rec) => (
                    <div
                      key={rec._id}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between hover:bg-[#EEF2FF]/40 transition-colors"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#1E1B4B]">
                          {rec.personName || "Counterparty"}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {rec.purpose || "Money Lent"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#16A34A] font-mono">
                          ৳{rec.remainingAmount.toLocaleString()}
                        </span>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenSettlement(rec)}
                            className="h-6 px-2.5 text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] hover:bg-emerald-200/80 rounded-lg transition-colors cursor-pointer"
                          >
                            + Settle
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Urgent Payables List */}
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
                  <span>Pending Payables</span>
                </h3>
                <span className="text-xs font-bold text-rose-600 font-mono px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200/70">
                  {payables.length} Active
                </span>
              </div>
              {payables.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No pending debts or payables.
                </p>
              ) : (
                <div className="space-y-2">
                  {payables.slice(0, 5).map((rec) => (
                    <div
                      key={rec._id}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between hover:bg-rose-50/40 transition-colors"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#1E1B4B]">
                          {rec.personName || "Lender"}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {rec.purpose || "Money Borrowed"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-rose-600 font-mono">
                          ৳{rec.remainingAmount.toLocaleString()}
                        </span>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenSettlement(rec)}
                            className="h-6 px-2.5 text-[10px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            + Repay
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Money Given */}
        <TabsContent value="given" className="space-y-3 outline-none">
          {renderRecordList(
            givenRecords,
            "No money given records yet.",
            handleOpenSettlement,
          )}
        </TabsContent>

        {/* Tab: Money Taken */}
        <TabsContent value="taken" className="space-y-3 outline-none">
          {renderRecordList(
            takenRecords,
            "No borrowed money records.",
            handleOpenSettlement,
          )}
        </TabsContent>

        {/* Tab: Investments */}
        <TabsContent value="investments" className="space-y-3 outline-none">
          {renderRecordList(
            investmentRecords,
            "No investments tracked yet.",
            handleOpenSettlement,
          )}
        </TabsContent>

        {/* Tab: Receivables */}
        <TabsContent value="receivables" className="space-y-3 outline-none">
          {renderRecordList(
            receivables,
            "No active receivables due.",
            handleOpenSettlement,
          )}
        </TabsContent>

        {/* Tab: Payables */}
        <TabsContent value="payables" className="space-y-3 outline-none">
          {renderRecordList(
            payables,
            "No active payables due.",
            handleOpenSettlement,
          )}
        </TabsContent>

        {/* Tab: Transactions Ledger */}
        <TabsContent value="transactions" className="outline-none">
          <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No financial transactions recorded.
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="p-3.5 sm:p-4 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                      ৳
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">
                        {tx.personName || "Financial Movement"}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {tx.type.replace("_", " ")} •{" "}
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm font-mono text-emerald-700 dark:text-emerald-300">
                    ৳{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Money Record Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="life-dialog sm:max-w-lg rounded-3xl border border-border/80 dark:border-slate-800 bg-white dark:bg-slate-950 text-foreground max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-300" />
              <span>Add Financial Record</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRecord} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Record Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LifeMoneyType)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="given">Financial Care Provided</option>
                  <option value="taken">Financial Care Received</option>
                  <option value="invest_made">
                    Investment Made (My equity/capital)
                  </option>
                  <option value="invest_received">
                    Investment Received (External investor)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Amount (৳) *
                </label>
                <Input
                  required
                  type="number"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Related Person
                </label>
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
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
                  Or Name / Organization
                </label>
                <Input
                  placeholder="e.g. Brother, Sabbir, Bank"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Purpose / Description
                </label>
                <Input
                  placeholder="e.g. Business expansion, Family support"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Expected Return / Due Date
                </label>
                <Input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
                />
              </div>
            </div>

            {/* Investment specific fields */}
            {(type === "invest_made" || type === "invest_received") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cyan-300">
                    Ownership Percentage (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 20"
                    value={ownershipPercentage}
                    onChange={(e) => setOwnershipPercentage(e.target.value)}
                    className="h-9 border-slate-800 bg-slate-900 text-slate-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cyan-300">
                    Profit Share Terms
                  </label>
                  <Input
                    placeholder="e.g. 25% annual profit"
                    value={profitShare}
                    onChange={(e) => setProfitShare(e.target.value)}
                    className="h-9 border-slate-800 bg-slate-900 text-slate-100 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Notes
              </label>
              <textarea
                rows={2}
                placeholder="Additional terms or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
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
                <span>Save Financial Record</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settlement Recording Modal */}
      <SettlementModal
        open={settlementModalOpen}
        onOpenChange={setSettlementModalOpen}
        moneyRecord={selectedRecordForSettlement}
      />
    </div>
  );
}

function renderRecordList(
  records: ILifeMoneyRecord[],
  emptyMessage: string,
  onSettle: (record: any) => void,
) {
  if (records.length === 0) {
    return (
      <div className="p-10 rounded-3xl border border-dashed border-slate-200 bg-white/60 text-center text-xs text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
      {records.map((rec) => (
        <div
          key={rec._id}
          className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-200/70 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-indigo-100/70">
                  {rec.type.replace("_", " ")}
                </span>
                <h3 className="font-bold text-[15px] text-[#1E1B4B] mt-1.5">
                  {rec.personName || "Counterparty"}
                </h3>
                {rec.purpose && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{rec.purpose}</p>
                )}
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  rec.status === "fully_returned"
                    ? "bg-[#DCFCE7] text-[#16A34A] border-emerald-200/70"
                    : rec.status === "overdue"
                    ? "bg-rose-50 text-rose-600 border-rose-200/70"
                    : "bg-slate-100 text-slate-600 border-slate-200/70"
                }`}
              >
                {rec.status.replace("_", " ")}
              </span>
            </div>

            {/* Financial Amounts breakdown */}
            <div className="mt-3.5 grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100/80 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Total</span>
                <p className="font-bold text-[#1E1B4B] font-mono mt-0.5">
                  ৳{rec.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Returned</span>
                <p className="font-bold text-slate-500 font-mono mt-0.5">
                  ৳{rec.paidAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400">Remaining</span>
                <p className="font-bold text-[#16A34A] font-mono mt-0.5">
                  ৳{rec.remainingAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Settlements history snapshot */}
            {rec.settlements && rec.settlements.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Settlements History ({rec.settlements.length})
                </span>
                <div className="space-y-1">
                  {rec.settlements.map((s, idx) => (
                    <div
                      key={s._id || idx}
                      className="flex items-center justify-between text-[11px] text-slate-500"
                    >
                      <span>
                        Settlement #{idx + 1} (
                        {new Date(s.date).toLocaleDateString()})
                      </span>
                      <span className="font-mono font-bold text-[#1E1B4B]">
                        ৳{s.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Settle action */}
          {rec.remainingAmount > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => onSettle(rec)}
                className="h-7.5 px-3.5 text-xs bg-[#4F46E5] hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold gap-1 shadow-2xs transition-all cursor-pointer"
              >
                + Record Settlement
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
