"use client";

import { useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { recordSettlement } from "@/lib/actions/lifeMoney.actions";
import toast from "react-hot-toast";

interface SettlementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moneyRecord: {
    _id: string;
    personName?: string;
    organization?: string;
    type: string;
    amount: number;
    remainingAmount: number;
  } | null;
}

export function SettlementModal({
  open,
  onOpenChange,
  moneyRecord,
}: SettlementModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moneyRecord) return;

    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error("Please enter a valid repayment amount.");
      return;
    }

    if (num > moneyRecord.remainingAmount) {
      toast.error(`Amount cannot exceed remaining balance of ৳${moneyRecord.remainingAmount.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      await recordSettlement({
        moneyRecordId: moneyRecord._id,
        amount: num,
        paymentMethod,
        reference,
        notes,
      });
      toast.success(`Settlement of ৳${num.toLocaleString()} recorded successfully!`);
      onOpenChange(false);
      setAmount("");
      setReference("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record settlement.");
    } finally {
      setLoading(false);
    }
  };

  if (!moneyRecord) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="life-dialog sm:max-w-md rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-100">
                Record Settlement Repayment
              </DialogTitle>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">
                {moneyRecord.personName || moneyRecord.organization} • Total ৳{moneyRecord.amount.toLocaleString()}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <span>Remaining Due Balance:</span>
            <span className="font-extrabold text-sm text-emerald-300 font-mono">
              ৳{moneyRecord.remainingAmount.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Settlement Amount (৳)
            </label>
            <Input
              type="number"
              placeholder="e.g. 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={moneyRecord.remainingAmount}
              required
              className="h-11 border-slate-800 bg-slate-900/90 text-slate-100 text-sm focus:border-emerald-500 font-mono"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="cash">Cash in Hand</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Reference / Transaction ID
            </label>
            <Input
              placeholder="e.g. TrxID or Bank Cheque #"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Notes (Optional)
            </label>
            <Input
              placeholder="e.g. First partial repayment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 border-slate-800 bg-slate-900/90 text-slate-100 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Settlement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
