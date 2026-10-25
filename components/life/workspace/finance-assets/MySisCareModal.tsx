"use client";

import React from "react";
import { X, Heart, ArrowUpRight, ArrowDownLeft, Gift, Shield, Check } from "lucide-react";
import { SisCareRecordDTO } from "@/lib/actions/lifeWorkspace.actions";

interface MySisCareModalProps {
  record: SisCareRecordDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function MySisCareModal({ record, isOpen, onClose }: MySisCareModalProps) {
  if (!isOpen) return null;

  const sharedTransactions = (record.transactions || []).filter(
    (t) => t.isShared && t.type !== "forgiveness"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Top Handle */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header (Mockup Screen 5) */}
        <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              {record.personName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B4B] dark:text-white">
                My SiS Care
              </h3>
              <p className="text-xs text-slate-500">Personal Care & Financial Support</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Support Banner Card (Screen 5) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 to-purple-50/80 border border-rose-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs text-rose-500 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-900 block">
                Support from Saurav
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Return whenever you are able.
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-purple-700 border border-purple-100 shadow-2xs">
                  <Shield className="w-3 h-3 text-purple-500" />
                  Shared with you
                </span>
              </div>
            </div>
          </div>

          {/* 3 Summary Stats (Screen 5) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Received
              </span>
              <span className="text-xs font-bold text-slate-800">
                ৳ {record.totalGiven.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
                Returned
              </span>
              <span className="text-xs font-bold text-emerald-700">
                ৳ {record.totalReturned.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-600 block tracking-wider">
                Remaining
              </span>
              <span className="text-xs font-black text-purple-700">
                ৳ {record.remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Support History (Screen 5) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Support history
            </h4>
            <div className="space-y-2">
              {sharedTransactions.length > 0 ? (
                sharedTransactions.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          t.type === "return"
                            ? "bg-red-50 text-red-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {t.type === "return" ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 capitalize block">
                          {t.type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(t.date).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          • {t.account}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        t.type === "return" ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {t.type === "return" ? "-" : "+"}৳ {t.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">
                  No support transactions shared.
                </div>
              )}
            </div>
          </div>

          {/* Gifts Section (Screen 5) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gifts
            </h4>
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Eid gift
                  </span>
                  <span className="text-[11px] text-slate-400">
                    2 Apr 2026 • Cash • BDT
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 block">৳ 2,000</span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                  No repayment
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notice (Screen 5) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              ℹ Only selected records shared with you appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
