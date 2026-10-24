import {
  Users,
  Baby,
  UserCog,
  Briefcase,
  FolderKanban,
  Globe2,
  HeartPulse,
  Wallet,
  Landmark,
  FileText,
  Lock,
  ClipboardCheck,
  ScrollText,
  Siren,
  Shield,
  ShieldCheck,
  Sprout,
  Scale,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Coins,
  HandCoins,
  Home,
  Wrench,
  Settings,
  BookOpen,
  Clock,
  Database,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceSubcategoryConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  badge?: string;
  filterTabs?: Array<{ id: string; label: string }>;
  unitLabel?: string; // e.g. "Account", "Asset", "Loan", "Person", "Duty"
  amountField?: string;
}

export interface WorkspaceCategoryConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  badgeColor?: string;
  fallbackRoute?: string;
  subcategories: WorkspaceSubcategoryConfig[];
}

export const WORKSPACE_CATEGORIES: WorkspaceCategoryConfig[] = [
  // 1. People & Family
  {
    id: "people_family",
    title: "People & Family",
    description: "Family, relationships, contacts, invitations and permissions.",
    icon: Users,
    color: "text-[#6366F1] bg-[#EEF2FF] dark:bg-indigo-950/40 border-indigo-100",
    subcategories: [
      {
        id: "family_care",
        title: "Family Care",
        description: "Family members, relationships, dependency & care",
        icon: HeartPulse,
        color: "text-[#6366F1] bg-[#EEF2FF] dark:bg-indigo-950/40 border-indigo-100",
        unitLabel: "Care Record",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "pending", label: "Pending" },
          { id: "completed", label: "Completed" },
        ],
      },
      {
        id: "kids",
        title: "Kids",
        description: "Children's info, education records & future planning",
        icon: Baby,
        color: "text-[#EC4899] bg-[#FCE7F3] dark:bg-pink-950/40 border-pink-100",
        unitLabel: "Child Record",
        filterTabs: [
          { id: "all", label: "All Children" },
          { id: "education", label: "Education" },
          { id: "guardianship", label: "Guardianship" },
        ],
      },
      {
        id: "community",
        title: "Community",
        description: "Social connections, friends, relatives & support",
        icon: Globe2,
        color: "text-[#7C3AED] bg-[#F3E8FF] dark:bg-purple-950/40 border-purple-100",
        unitLabel: "Contact",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "friends", label: "Friends" },
          { id: "relatives", label: "Relatives" },
          { id: "groups", label: "Groups" },
        ],
      },
    ],
  },

  // 2. Work & Business
  {
    id: "work_business",
    title: "Work & Business",
    description: "Work, projects, business records and professional information.",
    icon: Briefcase,
    color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40 border-sky-100",
    subcategories: [
      {
        id: "staff_office",
        title: "Staff & Office",
        description: "Staff, employees, domestic staff & office continuity",
        icon: UserCog,
        color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40 border-sky-100",
        unitLabel: "Staff Member",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
          { id: "responsibilities", label: "Duties" },
        ],
      },
      {
        id: "business",
        title: "Business",
        description: "Ventures, partner equity & infrastructure handover",
        icon: Briefcase,
        color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40 border-emerald-100",
        unitLabel: "Business Entity",
        filterTabs: [
          { id: "all", label: "All Businesses" },
          { id: "active", label: "Active" },
          { id: "partnerships", label: "Partnerships" },
        ],
      },
      {
        id: "projects",
        title: "Projects",
        description: "Personal, technical & commercial ongoing initiatives",
        icon: FolderKanban,
        color: "text-[#D97706] bg-[#FEF3C7] dark:bg-amber-950/40 border-amber-100",
        unitLabel: "Project",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "planned", label: "Planned" },
          { id: "completed", label: "Completed" },
        ],
      },
    ],
  },

  // 3. Finance & Assets
  {
    id: "finance_assets",
    title: "Finance & Assets",
    description: "Income, expenses, assets, liabilities and financial records.",
    icon: BarChart3,
    color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40 border-emerald-100",
    subcategories: [
      {
        id: "cash_bank",
        title: "Cash & Bank",
        description: "Bank accounts, cash and wallets",
        icon: Landmark,
        color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40 border-sky-100",
        unitLabel: "Account",
        amountField: "balance",
        filterTabs: [
          { id: "all", label: "All Accounts" },
          { id: "bank", label: "Bank" },
          { id: "cash", label: "Cash" },
          { id: "wallet", label: "Wallet" },
        ],
      },
      {
        id: "income",
        title: "Income",
        description: "Salary, business income and other earnings",
        icon: TrendingUp,
        color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40 border-emerald-100",
        unitLabel: "Income Record",
        amountField: "amount",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "salary", label: "Salary" },
          { id: "business", label: "Business" },
          { id: "investment", label: "Investment" },
        ],
      },
      {
        id: "expenses",
        title: "Expenses",
        description: "Regular and one-time expenses",
        icon: Wallet,
        color: "text-[#E11D48] bg-[#FFE4E6] dark:bg-rose-950/40 border-rose-100",
        unitLabel: "Expense",
        amountField: "amount",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "personal", label: "Personal" },
          { id: "family", label: "Family" },
          { id: "business", label: "Business" },
        ],
      },
      {
        id: "assets",
        title: "Assets",
        description: "Land, property, vehicles and other assets",
        icon: Home,
        color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40 border-sky-100",
        unitLabel: "Asset",
        amountField: "value",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "property", label: "Land & Property" },
          { id: "vehicle", label: "Vehicle" },
          { id: "valuable", label: "Valuables" },
        ],
      },
      {
        id: "liabilities",
        title: "Liabilities",
        description: "Loans, outstanding bills and other liabilities",
        icon: AlertCircle,
        color: "text-[#DC2626] bg-[#FEE2E2] dark:bg-red-950/40 border-red-100",
        unitLabel: "Liability",
        amountField: "remainingAmount",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "loans_received", label: "Loans Received" },
          { id: "bills", label: "Bills & Dues" },
          { id: "settled", label: "Settled" },
        ],
      },
      {
        id: "loans_given",
        title: "Loans Given",
        description: "Money lent to others and repayment tracking",
        icon: HandCoins,
        color: "text-[#D97706] bg-[#FEF3C7] dark:bg-amber-950/40 border-amber-100",
        unitLabel: "Loan",
        amountField: "remainingAmount",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "partially_returned", label: "Partially Paid" },
          { id: "overdue", label: "Overdue" },
          { id: "completed", label: "Settled" },
        ],
      },
      {
        id: "investments",
        title: "Investments",
        description: "Business, shares and other investments",
        icon: Coins,
        color: "text-[#7C3AED] bg-[#F3E8FF] dark:bg-purple-950/40 border-purple-100",
        unitLabel: "Investment",
        amountField: "value",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "business", label: "Business Equity" },
          { id: "stocks", label: "Shares & Bonds" },
        ],
      },
      {
        id: "other_financial",
        title: "Other Financial Records",
        description: "Other income, expense or financial items (SiS Care, gifts)",
        icon: FileText,
        color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40 border-indigo-100",
        unitLabel: "Support Record",
        amountField: "amount",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "sis_care", label: "SiS Care" },
          { id: "gifts", label: "Gifts" },
          { id: "assistance", label: "Assistance" },
        ],
      },
    ],
  },

  // 4. Secure Vault
  {
    id: "secure_vault",
    title: "Secure Vault",
    description: "Important documents, credentials and sensitive information.",
    icon: Shield,
    color: "text-[#4F46E5] bg-[#EEF2FF] dark:bg-indigo-950/40 border-indigo-100",
    subcategories: [
      {
        id: "documents",
        title: "Documents",
        description: "Legal papers, notarized contracts, deeds & certificates",
        icon: FileText,
        color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40 border-indigo-100",
        unitLabel: "Document",
        filterTabs: [
          { id: "all", label: "All Documents" },
          { id: "property", label: "Property Deeds" },
          { id: "business", label: "Business" },
          { id: "identity", label: "Identity" },
          { id: "legal", label: "Legal" },
        ],
      },
      {
        id: "digital_vault",
        title: "Digital Vault",
        description: "AES-256 encrypted passwords, servers, keys & recovery pins",
        icon: Lock,
        color: "text-[#7C3AED] bg-[#F3E8FF] dark:bg-purple-950/40 border-purple-100",
        unitLabel: "Vault Secret",
        filterTabs: [
          { id: "all", label: "All Secrets" },
          { id: "server", label: "Servers" },
          { id: "banking", label: "Banking" },
          { id: "website", label: "Websites" },
          { id: "recovery", label: "Recovery" },
        ],
      },
      {
        id: "access_control",
        title: "Access Control",
        description: "Guardian consensus, permissions grid & access keys",
        icon: ShieldCheck,
        color: "text-[#D97706] bg-[#FEF3C7] dark:bg-amber-950/40 border-amber-100",
        unitLabel: "Permission Rule",
        filterTabs: [
          { id: "all", label: "All Permissions" },
          { id: "active", label: "Active" },
          { id: "pending", label: "Pending" },
          { id: "guardians", label: "Guardians" },
        ],
      },
    ],
  },

  // 5. Life Continuity
  {
    id: "life_continuity",
    title: "Life Continuity",
    description: "Plans, wishes, responsibilities and legacy & handover.",
    icon: Sprout,
    color: "text-[#E11D48] bg-[#FFE4E6] dark:bg-rose-950/40 border-rose-100",
    subcategories: [
      {
        id: "responsibilities",
        title: "Responsibilities",
        description: "Delegated family & business operational responsibilities",
        icon: ClipboardCheck,
        color: "text-[#16A34A] bg-[#DCFCE7] dark:bg-emerald-950/40 border-emerald-100",
        unitLabel: "Duty",
        filterTabs: [
          { id: "all", label: "All Duties" },
          { id: "assigned", label: "Assigned" },
          { id: "in_progress", label: "In Progress" },
          { id: "completed", label: "Completed" },
        ],
      },
      {
        id: "instructions",
        title: "Instructions",
        description: "Step-by-step handover protocols & procedural directives",
        icon: ScrollText,
        color: "text-[#0284C7] bg-[#E0F2FE] dark:bg-sky-950/40 border-sky-100",
        unitLabel: "Directive",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "general", label: "General" },
          { id: "private", label: "Private" },
          { id: "conditional", label: "Conditional" },
        ],
      },
      {
        id: "emergency",
        title: "Emergency",
        description: "Emergency contacts, SOS trigger & immediate crisis procedures",
        icon: Siren,
        color: "text-[#DC2626] bg-[#FEE2E2] dark:bg-red-950/40 border-red-100",
        unitLabel: "Emergency Plan",
        filterTabs: [
          { id: "all", label: "All Protocols" },
          { id: "contacts", label: "Contacts" },
          { id: "medical", label: "Medical" },
          { id: "legal", label: "Advisors" },
        ],
      },
      {
        id: "legacy_legal",
        title: "Legacy & Legal",
        description: "Statutory wills, legal trusts & posthumous handover",
        icon: Scale,
        color: "text-[#4338CA] bg-[#E0E7FF] dark:bg-indigo-950/40 border-indigo-100",
        unitLabel: "Legal Plan",
        filterTabs: [
          { id: "all", label: "All" },
          { id: "wills", label: "Will & Trust" },
          { id: "letters", label: "Sealed Letters" },
          { id: "handover", label: "Handover" },
        ],
      },
    ],
  },

  // 6. Tools & Support
  {
    id: "tools_support",
    title: "Tools & Support",
    description: "App settings, guides and support resources.",
    icon: Wrench,
    color: "text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200",
    subcategories: [
      {
        id: "app_settings",
        title: "App Settings",
        description: "Language, theme, PIN, currency & notifications",
        icon: Settings,
        color: "text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200",
        unitLabel: "Setting",
      },
      {
        id: "guides",
        title: "Guides & Help",
        description: "Step-by-step guides, FAQs and user manuals",
        icon: BookOpen,
        color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100",
        unitLabel: "Guide",
      },
      {
        id: "activity_history",
        title: "Activity History",
        description: "Tamper-evident audit trail of system events",
        icon: Clock,
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100",
        unitLabel: "Activity Log",
      },
      {
        id: "data_backup",
        title: "Data & Backup Utilities",
        description: "System backup, recovery status & JSON export",
        icon: Database,
        color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-100",
        unitLabel: "Utility",
      },
    ],
  },
];

export function getWorkspaceCategory(id: string): WorkspaceCategoryConfig | undefined {
  return WORKSPACE_CATEGORIES.find((c) => c.id === id);
}

export function getWorkspaceSubcategory(
  categoryId: string,
  subcategoryId: string
): WorkspaceSubcategoryConfig | undefined {
  const cat = getWorkspaceCategory(categoryId);
  if (!cat) return undefined;
  return cat.subcategories.find((s) => s.id === subcategoryId);
}

// ------------------------------------------------------------------
// Legacy Compatibility Adapters
// ------------------------------------------------------------------
export type WorkspaceSectionId = "my_spaces" | "core_vault" | "continuity";

export interface LegacyWorkspaceCategoryConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  sectionId: WorkspaceSectionId;
  isImplemented: boolean;
  color: string;
  fallbackRoute?: string;
}

export interface LegacyWorkspaceSectionConfig {
  id: WorkspaceSectionId;
  title: string;
  shortDesc: string;
  categories: LegacyWorkspaceCategoryConfig[];
}

export type WorkspaceSectionConfig = LegacyWorkspaceSectionConfig;

export const WORKSPACE_SECTIONS: LegacyWorkspaceSectionConfig[] = [
  {
    id: "my_spaces",
    title: "People & Work",
    shortDesc: "Family, staff, business & projects",
    categories: [
      {
        id: "family_care",
        title: "Family Care",
        description: "Family members, relationships, dependency & care",
        icon: HeartPulse,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#6366F1] bg-[#EEF2FF] border-indigo-100",
      },
      {
        id: "kids",
        title: "Kids",
        description: "Children's info, education records & future planning",
        icon: Baby,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#EC4899] bg-[#FCE7F3] border-pink-100",
      },
      {
        id: "staff_office",
        title: "Staff & Office",
        description: "Employees, domestic staff & office operations",
        icon: UserCog,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#0284C7] bg-[#E0F2FE] border-sky-100",
      },
      {
        id: "business",
        title: "Business",
        description: "Ventures, partner equity & infrastructure handover",
        icon: Briefcase,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#16A34A] bg-[#DCFCE7] border-emerald-100",
      },
      {
        id: "projects",
        title: "Projects",
        description: "Personal, technical & commercial ongoing initiatives",
        icon: FolderKanban,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#D97706] bg-[#FEF3C7] border-amber-100",
      },
      {
        id: "community",
        title: "Community",
        description: "Social associations, charity circles & community ties",
        icon: Globe2,
        sectionId: "my_spaces",
        isImplemented: true,
        color: "text-[#7C3AED] bg-[#F3E8FF] border-purple-100",
      },
    ],
  },
  {
    id: "core_vault",
    title: "Finance & Vault",
    shortDesc: "Financials, assets, deeds & secure credentials",
    categories: [
      {
        id: "cash_bank",
        title: "Cash & Bank",
        description: "Bank accounts, cash & liquidity",
        icon: Landmark,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#0284C7] bg-[#E0F2FE] border-sky-100",
      },
      {
        id: "finance_loans",
        title: "Finance & Loans",
        description: "Income, expenses, loan registry, support & dues",
        icon: Wallet,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#16A34A] bg-[#DCFCE7] border-emerald-100",
      },
      {
        id: "assets_property",
        title: "Assets & Property",
        description: "Land, residential deeds, vehicles & physical holdings",
        icon: Home,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#0284C7] bg-[#E0F2FE] border-sky-100",
      },
      {
        id: "documents",
        title: "Documents",
        description: "Legal papers, notarized contracts, wills & certificates",
        icon: FileText,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#4338CA] bg-[#E0E7FF] border-indigo-100",
      },
      {
        id: "digital_vault",
        title: "Digital Vault",
        description: "AES-256 encrypted passwords, servers, keys & recovery pins",
        icon: Lock,
        sectionId: "core_vault",
        isImplemented: true,
        color: "text-[#7C3AED] bg-[#F3E8FF] border-purple-100",
      },
    ],
  },
  {
    id: "continuity",
    title: "Continuity",
    shortDesc: "Directives, emergency switch & posthumous handover",
    categories: [
      {
        id: "responsibilities",
        title: "Responsibilities",
        description: "Delegated family & business operational responsibilities",
        icon: ClipboardCheck,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#16A34A] bg-[#DCFCE7] border-emerald-100",
      },
      {
        id: "instructions",
        title: "Instructions",
        description: "Step-by-step handover protocols & procedural directives",
        icon: ScrollText,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#0284C7] bg-[#E0F2FE] border-sky-100",
      },
      {
        id: "emergency",
        title: "Emergency",
        description: "Emergency contacts, SOS trigger & immediate crisis procedures",
        icon: Siren,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#DC2626] bg-[#FEE2E2] border-red-100",
      },
      {
        id: "access_control",
        title: "Access Control",
        description: "Guardian consensus, permissions grid & access keys",
        icon: ShieldCheck,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#D97706] bg-[#FEF3C7] border-amber-100",
      },
      {
        id: "legacy_legal",
        title: "Legacy & Legal",
        description: "Posthumous handover, statutory wills & legacy letters",
        icon: Scale,
        sectionId: "continuity",
        isImplemented: true,
        color: "text-[#E11D48] bg-[#FFE4E6] border-rose-100",
      },
    ],
  },
];

export function getSectionById(id: string): LegacyWorkspaceSectionConfig | undefined {
  return WORKSPACE_SECTIONS.find((s) => s.id === id);
}

export function getCategoryById(
  sectionId: string,
  categoryId: string
): LegacyWorkspaceCategoryConfig | undefined {
  const section = getSectionById(sectionId);
  if (!section) return undefined;
  return section.categories.find((c) => c.id === categoryId);
}
