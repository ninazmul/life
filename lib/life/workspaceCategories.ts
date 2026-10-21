import {
  Users,
  Baby,
  UserCog,
  Briefcase,
  FolderKanban,
  Globe2,
  Fingerprint,
  HeartPulse,
  Wallet,
  Landmark,
  FileText,
  Lock,
  ClipboardCheck,
  ScrollText,
  Siren,
  ShieldCheck,
  Sprout,
  Scale,
  type LucideIcon,
} from "lucide-react";

export type WorkspaceSectionId = "my_spaces" | "core_vault" | "continuity";

export interface WorkspaceCategoryConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  sectionId: WorkspaceSectionId;
  isImplemented: boolean;
  color: string;
  badgeColor?: string;
  fallbackRoute?: string;
}

export interface WorkspaceSectionConfig {
  id: WorkspaceSectionId;
  title: string;
  shortDesc: string;
  categories: WorkspaceCategoryConfig[];
}

export const WORKSPACE_SECTIONS: WorkspaceSectionConfig[] = [
  {
    id: "my_spaces",
    title: "My Spaces",
    shortDesc: "Family, staff, business & community areas",
    categories: [
      {
        id: "family_care",
        title: "Family Care",
        description: "Family members, relationships, dependency & care",
        icon: Users,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#6366F1] bg-[#EEF2FF] dark:bg-indigo-950/40 border-indigo-100",
        fallbackRoute: "/people",
      },
      {
        id: "kids",
        title: "Kids",
        description: "Children's info, education records & future planning",
        icon: Baby,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#EC4899] bg-[#FCE7F3] dark:bg-pink-950/40 border-pink-100",
        fallbackRoute: "/people",
      },
      {
        id: "staff_office",
        title: "Staff & Office",
        description: "Employees, domestic staff & office continuity",
        icon: UserCog,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40 border-sky-100",
        fallbackRoute: "/people",
      },
      {
        id: "business",
        title: "Business",
        description: "Ventures, partner equity & infrastructure handover",
        icon: Briefcase,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40 border-emerald-100",
        fallbackRoute: "/business",
      },
      {
        id: "projects",
        title: "Projects",
        description: "Personal, technical & commercial ongoing initiatives",
        icon: FolderKanban,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#D97706] bg-[#FEF3C7] dark:bg-amber-950/40 border-amber-100",
        fallbackRoute: "/instructions",
      },
      {
        id: "community",
        title: "Community",
        description: "Social associations, charity circles & community ties",
        icon: Globe2,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#7C3AED] bg-[#F3E8FF] dark:bg-purple-950/40 border-purple-100",
        fallbackRoute: "/people",
      },
    ],
  },
  {
    id: "core_vault",
    title: "Core Vault",
    shortDesc: "Financials, health, assets, deeds & secrets",
    categories: [
      {
        id: "personal",
        title: "Personal",
        description: "Personal identity dossier, official IDs & biometrics",
        icon: Fingerprint,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#6366F1] bg-[#EEF2FF] dark:bg-indigo-950/40 border-indigo-100",
        fallbackRoute: "/information",
      },
      {
        id: "health",
        title: "Health",
        description: "Medical directives, prescriptions, allergies & histories",
        icon: HeartPulse,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#DC2626] bg-[#FEE2E2] dark:bg-red-950/40 border-red-100",
        fallbackRoute: "/information",
      },
      {
        id: "finance_loans",
        title: "Finance & Loans",
        description: "Income, expenses, loan registry, support & dues",
        icon: Wallet,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40 border-emerald-100",
        fallbackRoute: "/workspace?section=core_vault&category=finance_loans",
      },
      {
        id: "assets_property",
        title: "Assets & Property",
        description: "Land, residential deeds, vehicles & physical holdings",
        icon: Landmark,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40 border-sky-100",
        fallbackRoute: "/assets",
      },
      {
        id: "documents",
        title: "Documents",
        description: "Legal papers, notarized contracts, wills & certificates",
        icon: FileText,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40 border-indigo-100",
        fallbackRoute: "/documents",
      },
      {
        id: "digital_vault",
        title: "Digital Vault",
        description: "AES-256 encrypted passwords, servers, keys & recovery pins",
        icon: Lock,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#7C3AED] bg-[#F3E8FF] dark:bg-purple-950/40 border-purple-100",
        fallbackRoute: "/vault",
      },
    ],
  },
  {
    id: "continuity",
    title: "Continuity",
    shortDesc: "Protocols, emergency switch, posthumous letters & wills",
    categories: [
      {
        id: "responsibilities",
        title: "Responsibilities",
        description: "Delegated family & business operational responsibilities",
        icon: ClipboardCheck,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40 border-emerald-100",
        fallbackRoute: "/instructions",
      },
      {
        id: "instructions",
        title: "Instructions",
        description: "Step-by-step handover protocols & procedural directives",
        icon: ScrollText,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40 border-sky-100",
        fallbackRoute: "/instructions",
      },
      {
        id: "emergency",
        title: "Emergency",
        description: "Emergency contacts, SOS trigger & immediate crisis procedures",
        icon: Siren,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#DC2626] bg-[#FEE2E2] dark:bg-red-950/40 border-red-100",
        fallbackRoute: "/contacts",
      },
      {
        id: "access_control",
        title: "Access Control",
        description: "Guardian consensus, permissions grid & access keys",
        icon: ShieldCheck,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#D97706] bg-[#FEF3C7] dark:bg-amber-950/40 border-amber-100",
        fallbackRoute: "/access",
      },
      {
        id: "after_death",
        title: "After-Death",
        description: "Posthumous handover, condition-sealed legacy letters",
        icon: Sprout,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#E11D48] bg-[#FFE4E6] dark:bg-rose-950/40 border-rose-100",
        fallbackRoute: "/legacy",
      },
      {
        id: "will_legal",
        title: "Will & Legal",
        description: "Statutory wills, legal trusts & formal guardianship",
        icon: Scale,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40 border-indigo-100",
        fallbackRoute: "/documents",
      },
    ],
  },
];

export function getSectionById(id: string): WorkspaceSectionConfig | undefined {
  return WORKSPACE_SECTIONS.find((s) => s.id === id);
}

export function getCategoryById(
  sectionId: string,
  categoryId: string
): WorkspaceCategoryConfig | undefined {
  const section = getSectionById(sectionId);
  if (!section) return undefined;
  return section.categories.find((c) => c.id === categoryId);
}
