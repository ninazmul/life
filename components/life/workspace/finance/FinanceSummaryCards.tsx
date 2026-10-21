"use client";

import { UnifiedFinancialSummary } from "@/lib/actions/lifeUnifiedFinance.actions";
import { Wallet, Coins, ArrowUpRight, ArrowDownLeft, Receipt, Users, CreditCard } from "lucide-react";

interface FinanceSummaryCardsProps {
  summary: UnifiedFinancialSummary;
  currencySymbol?: string;
}

function formatMoney(amount: number, symbol = "৳"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0${symbol}`;
  }
  return `${Number(amount).toLocaleString("en-US")}${symbol}`;
}

export function FinanceSummaryCards({
  summary,
  currencySymbol = "৳",
}: FinanceSummaryCardsProps) {
  const cards = [
    { ...summary.card1, icon: ArrowUpRight, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100" },
    { ...summary.card2, icon: ArrowDownLeft, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-100" },
    summary.card3 ? { ...summary.card3, icon: Wallet, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100" } : null,
    summary.card4 ? { ...summary.card4, icon: Receipt, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-100" } : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: number;
    count?: number;
    icon: any;
    color: string;
  }>;

  return (
    <div className={`grid gap-2 sm:gap-2.5 ${cards.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : cards.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_10px_rgba(30,27,75,0.03)] flex items-start gap-2.5 transition-all"
          >
            <div className={`w-8 h-8 rounded-xl ${card.color} flex items-center justify-center shrink-0 border shadow-2xs`}>
              <Icon className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate leading-tight">
                {card.label}
              </span>
              <p className="text-[15px] sm:text-[16px] font-extrabold text-[#1E1B4B] dark:text-white truncate leading-tight mt-0.5">
                {formatMoney(card.value, currencySymbol)}
              </p>
              {typeof card.count === "number" && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
                  {card.count} record{card.count === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
