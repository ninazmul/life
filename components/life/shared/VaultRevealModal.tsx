"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { revealVaultSecret } from "@/lib/actions/lifeVault.actions";
import toast from "react-hot-toast";

interface VaultRevealModalProps {
  itemId: string | null;
  itemTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultRevealModal({
  itemId,
  itemTitle,
  open,
  onOpenChange,
}: VaultRevealModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  useEffect(() => {
    if (!open) {
      setPin("");
      setSecret(null);
      setCopied(false);
      setSecondsRemaining(30);
    }
  }, [open]);

  // Countdown timer once secret is revealed
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (secret && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setSecret(null);
            onOpenChange(false);
            toast("Secret concealed automatically for security.", { icon: "🔒" });
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [secret, secondsRemaining, onOpenChange]);

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;

    setLoading(true);
    try {
      const res = await revealVaultSecret(itemId, pin);
      setSecret(res.secret);
      setSecondsRemaining(30);
      toast.success("Secret revealed. Activity logged.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reveal secret.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="life-dialog sm:max-w-md rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-100">
                Secure Vault Reveal
              </DialogTitle>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">
                {itemTitle || "Confidential Secret"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {!secret ? (
          <form onSubmit={handleReveal} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span>
                Enter your Master Security PIN to decrypt this confidential secret. Every reveal is recorded in the permanent audit trail.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Security PIN / Master Code
              </label>
              <Input
                type="password"
                placeholder="Enter PIN (if configured)..."
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="h-11 border-slate-800 bg-slate-900/90 text-slate-100 text-sm focus:border-amber-500"
                autoFocus
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
                className="h-9 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Decrypt Secret
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <span>Auto-conceal in:</span>
              <span className="font-mono font-bold text-emerald-300 text-sm bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Decrypted Secret
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={secret}
                  className="h-11 font-mono text-sm border-slate-800 bg-slate-900/90 text-emerald-300 select-all"
                />
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="h-11 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl"
              >
                Close & Conceal
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
