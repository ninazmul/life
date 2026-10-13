/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gift,
  HeartHandshake,
  ChevronRight,
  ChevronLeft,
  Users,
  Landmark,
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
  const router = useRouter();

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl bg-white border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#1E1B4B] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B4B] tracking-tight">
                Beneficiaries
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-violet-100/60">
                {beneficiaries.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Designated heirs, legacy allocations & estate instructions
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] text-center">
          <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] flex items-center justify-center mx-auto mb-2">
            <Users className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <p className="text-2xl font-bold text-[#1E1B4B]">{beneficiaries.length}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Beneficiaries</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] text-center">
          <div className="w-9 h-9 rounded-xl bg-[#FFE4E6] flex items-center justify-center mx-auto mb-2">
            <HeartHandshake className="w-4 h-4 text-[#E11D48]" />
          </div>
          <p className="text-2xl font-bold text-[#E11D48]">{messages.length}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Legacy Letters</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] text-center">
          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] flex items-center justify-center mx-auto mb-2">
            <Landmark className="w-4 h-4 text-[#16A34A]" />
          </div>
          <p className="text-2xl font-bold text-[#16A34A]">{assets.length}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Allocated Assets</p>
        </div>
      </div>

      {/* Beneficiaries List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#7C3AED]" />
          Beneficiary Directory
        </h2>

        {beneficiaries.length === 0 ? (
          <div className="p-10 text-center rounded-2xl md:rounded-3xl border border-dashed border-slate-200 bg-white">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] flex items-center justify-center mx-auto mb-3">
              <Gift className="w-7 h-7 text-[#7C3AED]" />
            </div>
            <h3 className="text-sm font-bold text-[#1E1B4B] mb-1">No Beneficiaries Designated</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Designate heirs and asset recipients in the People directory by assigning the beneficiary role.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {beneficiaries.map((b) => {
              const personMessages = messages.filter(
                (m) =>
                  String((m.recipientPersonId as any)?._id || m.recipientPersonId) ===
                  String(b._id)
              );

              const initials = (b.name || "B")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              // Calculate pseudo allocation percentage
              const totalBeneficiaries = beneficiaries.length;
              const allocationPercent = totalBeneficiaries > 0
                ? Math.round(100 / totalBeneficiaries)
                : 0;

              return (
                <Link
                  key={b._id}
                  href={`/people/${b._id}`}
                  className="bg-white rounded-2xl md:rounded-3xl p-5 border border-slate-100/90 shadow-[0_2px_12px_rgba(30,27,75,0.04)] hover:border-indigo-200/70 hover:shadow-md transition-all duration-200 group space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 via-purple-200 to-violet-300 flex items-center justify-center text-[#7C3AED] text-sm font-bold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-violet-100/60">
                          {b.role === "beneficiary" ? "Beneficiary" : b.relation}
                        </span>
                        <h3 className="text-sm font-bold text-[#1E1B4B] mt-1 group-hover:text-[#4F46E5] transition-colors">
                          {b.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">{b.relation}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Allocation meter */}
                  <div className="pt-3 border-t border-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Est. Allocation</span>
                      <span className="font-bold text-[#7C3AED]">{allocationPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500"
                        style={{ width: `${allocationPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <HeartHandshake className="w-3.5 h-3.5 text-[#E11D48]" />
                      {personMessages.length} Legacy Letter{personMessages.length !== 1 ? "s" : ""}
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
