/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gift,
  Users,
  HeartHandshake,
  FileText,
  Building,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import { ILifePerson, ILifeLegacyMessage, ILifeAsset } from "@/types";

interface BeneficiariesClientProps {
  beneficiaries: ILifePerson[];
  messages: ILifeLegacyMessage[];
  assets: ILifeAsset[];
  isOwner?: boolean;
}

export function BeneficiariesClient({
  beneficiaries,
  messages,
  assets,
  isOwner = false,
}: BeneficiariesClientProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Beneficiaries
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Designated recipients of legacy allocations, personal messages & estate instructions
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
          <p className="text-xs text-muted-foreground">Designated Beneficiaries</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{beneficiaries.length}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
          <p className="text-xs text-muted-foreground">Legacy Messages</p>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {messages.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Allocated Assets</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {assets.length}
          </p>
        </div>
      </div>

      {/* Beneficiaries List */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-foreground">
          Beneficiary Directory
        </h2>

        {beneficiaries.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
            <Gift className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No beneficiaries designated yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {beneficiaries.map((b) => {
              const personMessages = messages.filter(
                (m) =>
                  String((m.recipientPersonId as any)?._id || m.recipientPersonId) ===
                  String(b._id)
              );

              return (
                <Link
                  key={b._id}
                  href={`/people/${b._id}`}
                  className="p-5 rounded-2xl border border-border bg-card hover:border-purple-500/40 transition-all shadow-sm group space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 font-bold uppercase">
                        {b.role === "beneficiary" ? "Beneficiary" : b.relation}
                      </span>
                      <h3 className="text-base font-bold text-foreground mt-1 group-hover:text-purple-600 transition-colors">
                        {b.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{b.relation}</p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <HeartHandshake className="w-3.5 h-3.5 text-purple-500" />
                      {personMessages.length} Legacy Letter(s)
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
