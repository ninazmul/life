"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  Wallet,
  Briefcase,
  Layers,
  Contact,
  FolderLock,
  HeartHandshake,
  ShieldAlert,
  History,
  Settings,
  BookOpen,
  NotebookPen,
  CheckSquare,
  KeyRound,
  ScrollText,
  Stethoscope,
  Scale,
  Users,
  Inbox,
} from "lucide-react";

interface LifeVaultMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MORE_SECTIONS = [
  {
    title: "Life Modules",
    items: [
      { label: "Money & Debt", href: "/money", icon: Wallet, desc: "Given, taken, investments" },
      { label: "Financial Care", href: "/finance", icon: HeartHandshake, desc: "Allowances & installments" },
      { label: "Business", href: "/business", icon: Briefcase, desc: "Ventures & continuity" },
      { label: "Assets", href: "/assets", icon: Layers, desc: "Properties & valuables" },
      { label: "Vault", href: "/vault", icon: KeyRound, desc: "Encrypted secrets" },
      { label: "Information", href: "/information", icon: Stethoscope, desc: "Medical & identity" },
      { label: "Instructions", href: "/instructions", icon: CheckSquare, desc: "Directives & handover" },
      { label: "Contacts", href: "/contacts", icon: Contact, desc: "Emergency & advisory" },
      { label: "Beneficiaries", href: "/beneficiaries", icon: Users, desc: "Heirs & allocations" },
      { label: "Legacy", href: "/legacy", icon: ScrollText, desc: "Sealed messages" },
      { label: "Notes", href: "/lifenote", icon: NotebookPen, desc: "Private notes & memos" },
      { label: "Requests", href: "/requests", icon: Inbox, desc: "Inbound & outbound" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Guardians", href: "/guardians", icon: ShieldAlert, desc: "Trustees & consensus" },
      { label: "Access", href: "/access", icon: FolderLock, desc: "Permissions & emergency" },
      { label: "Activity Log", href: "/activity", icon: History, desc: "Security audit trail" },
      { label: "Settings", href: "/settings", icon: Settings, desc: "PIN, currency & backup" },
      { label: "User Guide", href: "/guide", icon: BookOpen, desc: "Help & onboarding" },
    ],
  },
];

export function LifeVaultMoreSheet({ open, onOpenChange }: LifeVaultMoreSheetProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 pb-safe">
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-base font-bold text-[var(--lv-navy)]">
            All Sections
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5 text-slate-400" />
          </button>
        </div>

        {/* Sections */}
        {MORE_SECTIONS.map((section) => (
          <div key={section.title} className="mb-3">
            <p className="px-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {section.title}
            </p>
            <div className="px-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? "bg-indigo-100" : "bg-slate-100"
                      }`}
                    >
                      <Icon
                        className={`w-4.5 h-4.5 ${
                          isActive ? "text-indigo-600" : "text-slate-500"
                        }`}
                        strokeWidth={1.8}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="h-6" />
      </div>
    </>
  );
}
