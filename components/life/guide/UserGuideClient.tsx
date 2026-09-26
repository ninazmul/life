"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Home,
  Users,
  Wallet,
  KeyRound,
  FileText,
  Briefcase,
  Layers,
  Contact,
  FolderLock,
  HeartHandshake,
  ShieldAlert,
  History,
  Settings,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Shield,
  UserCheck,
  Coins,
  ShieldCheck,
  Lock,
  Rocket,
  Trash2,
  UserCircle,
  Clock,
  NotebookPen,
  ClipboardList,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Step {
  title: string;
  detail: string;
}

interface Tip {
  type: "tip" | "warning" | "info" | "security";
  text: string;
}

interface GuideSection {
  id: string;
  category: "Onboarding & Setup" | "Core Command" | "Records & Continuity" | "Legacy & Security";
  serial: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  title: string;
  subtitle: string;
  description: string;
  steps: Step[];
  tips: Tip[];
  whoCanAccess: string;
}

export const GUIDE_CATEGORIES = [
  "Onboarding & Setup",
  "Core Command",
  "Records & Continuity",
  "Legacy & Security",
] as const;

// ─── Guide Content ────────────────────────────────────────────────────────────
const sections: GuideSection[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 00. Getting Started — Full Admin Onboarding
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "getting-started",
    category: "Onboarding & Setup",
    serial: "00",
    icon: Rocket,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "Getting Started — Full Admin Onboarding",
    subtitle: "Complete setup flow from account creation to production readiness",
    description:
      "This section walks you through the complete LIFE Vault setup flow from Day 1. Follow these steps in order to fully configure your vault, register your family and team, set up financial tracking, secure your secrets, and prepare your emergency continuity plan.",
    steps: [
      {
        title: "Step 1 → Sign Up & First Login",
        detail:
          "Create your LIFE Vault account using email or Google SSO. After signing in for the first time, the system automatically designates you as the Super Admin / Owner. You are the only user with unrestricted access to all modules.",
      },
      {
        title: "Step 2 → Configure Master PIN (Settings)",
        detail:
          "Go to Settings → Master PIN. Set a strong 4–6 digit PIN. This PIN is required every time you reveal encrypted vault secrets, change emergency settings, or perform high-security operations. Write it down and store it securely offline — there is no recovery mechanism.",
      },
      {
        title: "Step 3 → Register Your People (People Directory)",
        detail:
          "Go to People → Add Person. Register your family members (Wife, Parents, Children, Siblings), business partners, key employees (e.g. Sabbir, Sana), and trusted friends. Enter their full name, relationship, phone number, WhatsApp, email, and social links (Facebook, Messenger, Instagram, TikTok, Telegram, LinkedIn, YouTube, Website). Select from the 7 specialized roles: Super Admin, Administrator, Guardian, Business Staff, Business Partner, Individual User, or Read Only. For individuals who only serve as references (e.g. loan debtors, dependents, emergency references) and do not need portal login credentials, toggle 'Record-Only Person'.",
      },
      {
        title: "Step 4 → Assign Granular Permissions with 2-Step Audit Review",
        detail:
          "For each person, configure module-level capabilities (canViewPersonal, canViewBusiness, canViewFinancial, canViewSensitive, canRevealVault, canManageAccess, canAccessEmergency, canManageSecretNotes) and Note access scopes. Before applying changes, Step 2 displays a complete visual confirmation preview of [+ Permissions Added] and [- Permissions Revoked], guaranteeing transparent auditability and zero accidental privilege grants.",
      },
      {
        title: "Step 5 → Add Personal Information & Identity Records",
        detail:
          "Go to Personal Information. Enter your NID, Passport, Birth Certificate, Blood Group, Chronic Conditions, Allergies, Medications, Preferred Hospital, Insurance Policy numbers, e-TIN, Driving License, and Tax Circle. This data is critical during medical emergencies and estate settlements.",
      },
      {
        title: "Step 6 → Register Your Businesses",
        detail:
          "Go to Businesses → Add Business. Record company name, registration number, trade license, your equity percentage, capital invested, and partners. Document corporate bank accounts with authorized signatories. Fill the 'If I Am Not Available' handover checklist for each business.",
      },
      {
        title: "Step 7 → Set Up Finance & Real-Time Accounting",
        detail:
          "Go to Finance to access both your live ACC.GESN.NET Accounting Ledger (tracking corporate/personal income, expenses, cash on hand, bank balances, and full transaction history in SAR) and Personal Financial Support (monthly family allowances, personal loans given/taken, installment repayment schedules, and gift conversions). Go to Money Overview for the double-entry net worth ledger (Investments Made, Capital Received, Receivables, and Payables).",
      },
      {
        title: "Step 8 → Catalog All Assets & Properties",
        detail:
          "Go to Assets → Add Asset. Record every real estate property, bank account/FDR, vehicle, gold/jewelry, and digital holding. Include purchase value, current market estimate, ownership percentage, physical document locations (e.g. 'Almirah #2, Bank Safe Locker 4B'), and designated nominees.",
      },
      {
        title: "Step 9 → Populate the Secure Vault",
        detail:
          "Go to Vault → Add Item. Store all sensitive credentials: banking PINs, email passwords, server SSH keys, crypto seed phrases, social media logins, and API keys. Each entry is AES-256 encrypted. Secrets are only revealed with your Master PIN and every reveal is permanently logged.",
      },
      {
        title: "Step 10 → Upload Critical Documents",
        detail:
          "Go to Documents → Add Document. Catalog property deeds, trade licenses, partnership agreements, lease contracts, power of attorney, insurance papers. Tag each with its physical file location, upload scanned PDF copies, and link to relevant people/businesses.",
      },
      {
        title: "Step 11 → Write Instructions & Responsibilities",
        detail:
          "Go to Instructions → Create Directive. Write clear, step-by-step handover instructions: 'What to do', 'Who should do it', and 'In what order'. Assign each instruction to a specific person from your directory. Set priority: High, Medium, or Normal.",
      },
      {
        title: "Step 12 → Record Important Professional Contacts",
        detail:
          "Go to Important Contacts → Add Contact. Enter your lawyers, doctors, accountants, banking officers, IT support, insurance agents — categorized by function. Include their phone, email, office address, and working hours. These contacts get one-touch Call/WhatsApp/Email actions.",
      },
      {
        title: "Step 13 → Map Beneficiaries & Inheritance",
        detail:
          "Go to Beneficiaries → Define Beneficiary. Map which family members inherit which assets, with percentage allocations. Attach nominee declarations, share transfer forms, and notarized deeds. Link legacy letters for private delivery.",
      },
      {
        title: "Step 14 → Write Legacy Messages",
        detail:
          "Go to Legacy Messages → Compose Message. Write personal letters, advice, or farewell messages for your wife, children, siblings, or friends. Choose a release trigger: Emergency Protocol Activation, Specific Future Date, or Manual Release by Primary Guardian. Messages remain encrypted until triggered.",
      },
      {
        title: "Step 15 → Appoint Trusted Guardians & Configure Emergency Protocol",
        detail:
          "Go to Guardians → Designate Guardians. Appoint 2–5 trusted individuals (e.g. Wife as Primary, Brother as Secondary). Set the multi-party consensus threshold (e.g. 2 of 3 must approve). Set the countdown grace period (24, 48, or 72 hours). This is the fail-safe: if guardians initiate emergency access and you don't cancel within the grace period, emergency mode activates and designated vault secrets, instructions, and legacy messages unlock.",
      },
      {
        title: "Step 16 → Review Dashboard & Command Center",
        detail:
          "Return to the Home Dashboard. Verify your My Life Profile metrics, the 4-card Financial Overview (Total Income, Available Cash, Assets & Investments, Total Net Worth in SAR), Six Quick Action modules, continuity readiness, and urgent alerts. If everything shows green — congratulations, your LIFE Vault is fully configured and production-ready.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Complete steps 1–5 on Day 1 (Personal + People setup). Steps 6–10 (Business, Finance, Assets, Vault, Documents) in Week 1. Steps 11–15 (Instructions, Contacts, Beneficiaries, Legacy, Guardians) in Week 2. Step 16 daily ongoing.",
      },
      {
        type: "security",
        text: "Your Master PIN is the only key to unlock vault secrets. Losing it means encrypted secrets cannot be recovered without an admin reset. Store your Master PIN in a physical, offline, fireproof location.",
      },
      {
        type: "warning",
        text: "Never skip the Guardian configuration step. Without guardians, your family will have zero emergency access to your LIFE Vault if you are incapacitated.",
      },
    ],
    whoCanAccess:
      "This full setup flow is for the Super Admin / Owner only. Other users receive scoped access based on the permissions you assign in Step 4.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 01. 01. Home Dashboard & Life Command Center
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    category: "Core Command",
    serial: "01",
    icon: Home,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "01. Home Dashboard & Life Command Center",
    subtitle: "Central command console, My Life Profile, Financial Overview & Quick Actions",
    description:
      "The Life Command Center serves as the central executive console. It provides instantaneous visibility into your personal life profile, live SAR financial net worth overview, quick-access action buttons, continuity & safety monitoring, and urgent deadlines.",
    steps: [
      {
        title: "1. Life Command Center Header & Status Badge",
        detail:
          "The top of the command center displays the title along with a live operational status badge (e.g. 'Continuity System v1.0 · Secured'), confirming that all vault security and monitoring services are active.",
      },
      {
        title: "2. My Life Profile & Embedded Financial Overview",
        detail:
          "Positioned directly below the title, My Life Profile serves as the central personal information hub. Owners and Super Admins see profile metrics and the real-time four-card Financial Overview: Total Income Received, Available Cash, Assets & Investments, and Total Net Worth. Other users see only their personal support and commitment summary, never the Owner's accounting overview. Use 'View My Profile', '+ Add Information', and '+ Add Income' for the related personal workflows.",
      },
      {
        title: "3. ⚡ Quick Actions & Dynamic Subcategories",
        detail:
          "Directly below My Life Profile, six balanced quick action cards provide one-touch navigation to the major life-management modules with real-time live summaries: (1) Financial Care — active support & due installments; (2) Estate & Wasiyyah — testament completion percentage; (3) Roles & Responsibilities — assigned life directives; (4) Emergency Contacts & Help — verified emergency contacts; (5) Security & Access — active access rules and security status; (6) Instructions & Messages — saved legacy instructions. Furthermore, Super Admins can click 'Manage Subcategories' inside the Quick Actions dropdown to launch the Subcategory Management Console — offering full reordering (up/down), inline editing, archiving, and deletion safeguards across all 6 main categories.",
      },
      {
        title: "4. Profile Quick Actions",
        detail:
          "The circular icons under My Life Profile open Requests or Requests Inbox, Messages, LifeNote, and Financial Overview. Their badges show pending requests, unread messages, assigned notes, or financial items. The Requests icon is labeled 'Requests Inbox' for Owners and Super Admins and 'Request Center' for other users.",
      },
      {
        title: "5. Continuity & Safety State",
        detail:
          "Positioned directly beneath the Six Quick Actions, this monitoring layer details owner safety check-in status, emergency protocol readiness, number of trusted guardians configured, pending responsibilities, and overall business continuity readiness. A green status confirms all protocols are active and healthy.",
      },
      {
        title: "6. Urgent Attention Alerts & Money Snapshot",
        detail:
          "Automatically highlights overdue financial support installments, upcoming payments, pending tasks, and critical security items requiring prompt action. Also displays aggregate totals for Money Given, Money Taken, Investments, Receivables, and Payables in real-time.",
      },
      {
        title: "7. Permitted Modules Directory & Recent Activity",
        detail:
          "Displays quick-access cards to all your active modules with live counts and status badges. Non-admin users only see the modules they have permission to access. Includes a live audit feed of recent life activities.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "My Life Profile is your central personal hub. Tap 'View My Profile' or click anywhere on the card to inspect your comprehensive 18-part Owner Life Dossier.",
      },
      {
        type: "info",
        text: "The Financial Overview embedded under My Life Profile calculates your Net Worth in real-time combining live cash & income from ACC.GESN.NET and your recorded asset portfolio in SAR.",
      },
      {
        type: "tip",
        text: "Currency standard: All accounting figures and Dashboard Financial Overview amounts are tracked in Saudi Riyal (SAR). Suffixes are displayed in muted small text at the end of values for clean visual hierarchy.",
      },
      {
        type: "security",
        text: "The Dashboard dynamically adjusts its interface according to user permissions. Non-admin users will never see confidential financial figures, unauthorized modules, or Owner private records.",
      },
    ],
    whoCanAccess:
      "Super Admin & Owner see the full command center with My Life Profile and live financial net worth. Other users see only their permitted modules and personal view.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. BUSINESSES
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 02. 02. People Directory & Team
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "people",
    category: "Core Command",
    serial: "02",
    icon: Users,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "02. People Directory & Team",
    subtitle:
      "Family, partners, team & Record-Only individuals",
    description:
      "Maintain the core directory of trusted people: Wife, Brother, Children, Parents, Business Partners, Key Employees, and Nominees. Assign granular module permissions and emergency delegation status. The directory also supports Record-Only Persons who don't need login accounts.",
    steps: [
      {
        title: "Add Person Profile",
        detail:
          "Enter full name, relationship (Wife, Brother, Partner, Employee), phone number, WhatsApp, email address, physical address, and emergency priority rank.",
      },
      {
        title: "Record-Only Persons (No Login Account)",
        detail:
          "Check 'Record-Only Person (No login account)' when adding individuals who do not need system access — such as financial aid recipients, loan borrowers/lenders, external doctors, or dependents. They can be selected across Financial Care, Money Records, and Emergency Contacts without requiring an email or Clerk login. A 'Record Only' badge is displayed on their profile card.",
      },
      {
        title: "Filter by Relation or Record-Only",
        detail:
          "Use the top filter pills to quickly view 'All Relations', 'Record Only' individuals, 'Wife', 'Brother', 'Parents', 'Partner', 'Engineer', or 'Staff'. The search bar filters in real-time by name, relation, phone, or email.",
      },
      {
        title: "Add Social Links",
        detail:
          "Optionally link their social media accounts: Facebook, Messenger, Instagram, TikTok, Telegram, LinkedIn, YouTube, and personal Website. Only icons with linked accounts appear on their profile — unlinked platforms are hidden completely.",
      },
      {
        title: "Assign System Role & Account Type",
        detail:
          "Choose from the 7 built-in system roles: (1) Super Admin (full system ownership and unconstrained override); (2) Administrator (permitted records and day-to-day operations); (3) Guardian (family members, medical directives, emergency consensus activation); (4) Business Staff (assigned operational areas and continuity procedures); (5) Business Partner (shared enterprise accounts, capital & liabilities); (6) Individual User (assigned profile records only); or (7) Read Only (view-only inspection without editing or vault reveal).",
      },
      {
        title: "Record-Only Persons vs Login-Enabled Accounts",
        detail:
          "The 'Record-Only Person' switch permanently deactivates login credentials for individuals who are strictly documented for ledger and relationship purposes (such as dependents, minor children, deceased relatives, aid recipients, or loan parties). This prevents credential sprawl and guarantees system boundary integrity.",
      },
      {
        title: "Edit Profile & Access with 2-Step Diff Confirmation",
        detail:
          "Admins can open the 'Edit Profile & Access' modal on any person's profile to manage both personal information and permissions in a unified dialog. Step 1 allows toggling module capabilities, role, and note scopes. Clicking 'Review Changes' transitions to Step 2, displaying a side-by-side color-coded audit diff: [+ Permissions Added] in green and [- Permissions Revoked] in red, which is permanently logged in the system audit trail upon confirmation.",
      },
      {
        title: "Set Guardian Status",
        detail:
          "Designate whether the person serves as an Emergency Guardian (Primary, Secondary, or Independent) for multi-party consensus unlocking. Guardians can initiate emergency protocol activation.",
      },
      {
        title: "Quick Actions on People List",
        detail:
          "The People list shows each person's card with quick action buttons: Call (direct phone dial), WhatsApp (opens WhatsApp chat), and Profile (opens the full profile page). Buttons only appear when the person has a phone number or WhatsApp configured.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Use 'Record-Only' for people you lend money to or provide support for, but who do not need access to the LIFE Vault application.",
      },
      {
        type: "security",
        text: "Only grant canRevealVault or canManageAccess to individuals with absolute trust. For employees, grant strictly the modules they need for business continuity.",
      },
      {
        type: "info",
        text: "Social link icons only appear on the profile when that platform has a URL configured. Empty platforms are completely hidden for a clean, uncluttered interface.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with canManageAccess or canViewPersonal permissions.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. PERSON PROFILE DEEP DIVE (Owner Life Dossier & 8 Standard Tabs)
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 02B. 02B. Person Profile & Owner Life Dossier
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "person-profile",
    category: "Core Command",
    serial: "02B",
    icon: UserCircle,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/50",
    border: "border-teal-200 dark:border-teal-800/40",
    title: "02B. Person Profile & Owner Life Dossier",
    subtitle:
      "Master Owner Dossier, Overview, Contact, Instructions, Finance & Access",
    description:
      "Each person in the People Directory has a dedicated profile page. When viewing the Owner Profile, an exclusive Owner Life Dossier provides access to all 18 structured life-record areas. For team and family members, 8 structured tabs organize all linked records.",
    steps: [
      {
        title: "Owner Life Dossier (Exclusive Master Tab for Owner)",
        detail:
          "When viewing the Owner Profile as an authorized administrator, the 'Owner Life Dossier' tab organizes all 18 core life areas: (1) Personal Information & Identity; (2) Identity Documents (Passports, NID with downloads); (3) Medical History & Health Status; (4) Current Health Conditions; (5) Medicines & Treatments; (6) Allergies & Blood Group; (7) Doctors & Preferred Hospitals; (8) Important Life Events & History; (9) Family Information; (10) Business History & Designation; (11) Personal Financial Records; (12) Private Notes; (13) Assets & Property Registry; (14) Loans, Gifts & Financial Help; (15) Important Relationships; (16) Emergency Safety Information; (17) Wasiyyah & Legacy Directives; (18) Documents Archive. Non-admin users are strictly forbidden from viewing this dossier.",
      },
      {
        title: "Tab 1 → Overview",
        detail:
          "Shows a quick summary card: the person's full name, relationship, role, status badge (Active/Locked/Archived), photo, and key contact details. Displays an aggregate count of their linked records across all tabs.",
      },
      {
        title: "Tab 2 → Contact & Social",
        detail:
          "Displays the person's Mobile Number with a direct Call button, WhatsApp with a Message button, and Email with an Email button. Below contact cards, displays active social media links (Facebook, Instagram, LinkedIn, etc.) that open in a new tab.",
      },
      {
        title: "Tab 3 → Personal Message",
        detail:
          "A private message or letter from the Owner to this person. Only the Owner can write and edit personal messages, and it is strictly visible only to the recipient.",
      },
      {
        title: "Tab 4 → Instructions & Responsibilities",
        detail:
          "Lists all instructions and responsibilities assigned to this person from the Instructions module. Displays category, priority, status, and step-by-step procedures.",
      },
      {
        title: "Tab 5 → Financial Care",
        detail:
          "Lists all financial support records and money records associated with this person: support programs, given/taken funds, installment progress, and repayment status.",
      },
      {
        title: "Tab 6 → Important Contacts",
        detail:
          "Shows all professional contacts (lawyers, doctors, accountants) linked to this person with one-touch Call, WhatsApp, and Email buttons.",
      },
      {
        title: "Tab 7 → Documents",
        detail:
          "Lists all critical documents associated with this person — agreements, receipts, identity documents, and contracts with direct view and download links.",
      },
      {
        title: "Tab 8 → Access Information",
        detail:
          "Shows the person's permission configuration: module access flags, guardian designation, account type, and login status. Super Admin / Owner can modify access flags from here.",
      },
      {
        title: "Tab 9 → Notes & Secret Emergency Notes",
        detail:
          "A comprehensive notes workspace supporting 5 distinct note classifications: (1) Always Visible (standard instructions & notes); (2) Secret Emergency Note (AES encrypted and sealed until authorized release); (3) Internal Admin Only (private operator directives); (4) Manual Release; and (5) Scheduled Release. Features a custom waiting period (default 48 hours). When an authorized person submits an unlock request, a live countdown timer begins. Super Admins receive in-app notifications and can approve immediately, extend the countdown by +24 hours, reject, or cancel. Once released, the assigned person can mark as Read, Acknowledge, flag for Follow-up, mark as Completed, or submit written responses. Super Admins can re-lock the note at any time, and the Version History dialog records all prior revisions with timestamps and editor identities.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Strict IDOR mitigation prevents unauthorized users from inspecting another person's profile or the Owner Life Dossier. Non-admin users can only view their own assigned profile.",
      },
      {
        type: "tip",
        text: "The Owner Life Dossier tab provides instant links to Add Health Notes, Manage Doctors, View Asset Registry, and Open the Wasiyyah Hub.",
      },
      {
        type: "info",
        text: "Tab count badges update automatically in real-time as you add or remove linked records across the platform.",
      },
    ],
    whoCanAccess:
      "Super Admin and Owner see all tabs and the Owner Life Dossier. Other users see only their own permitted profile tabs.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. IMPORTANT CONTACTS
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 03. 03. Financial Care & Support Ledger
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "finance",
    category: "Core Command",
    serial: "03",
    icon: Wallet,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "03. Financial Care & Support Ledger",
    subtitle:
      "Real-time ACC.GESN.NET accounting (SAR), personal support & repayments",
    description:
      "A dual-engine financial command center: (1) Live integration with the ACC.GESN.NET enterprise accounting ledger tracking corporate/personal income, expenses, cash, and bank accounts in SAR; and (2) Personal Financial Support tracking family care, monthly allowances, installments, and settlement agreements.",
    steps: [
      {
        title: "Switch Between Accounting Ledger & Personal Support",
        detail:
          "Use the main view toggle at the top of /finance to switch between 'ACC Transactions (Accounting Ledger)' for real-time double-entry accounting records, and 'Personal Financial Support' for family allowances, personal borrowings, and gifts.",
      },
      {
        title: "ACC.GESN.NET Real-Time Accounting Sync",
        detail:
          "Connected live to acc.gesn.net (Owner: SHOUROV). Displays live KPI cards: Total Income Received, Total Expenses, Net Margin, Cash on Hand, and Bank Balances. All figures are strictly denominated in Saudi Riyal (SAR) with muted 'SAR' suffixes at the end of values.",
      },
      {
        title: "Filter Accounting by Period & Instant Search",
        detail:
          "Filter live accounting records by period (All Time, Today, This Month, Last Month, This Year) or use the instant search bar to find transactions by counterparty, memo, account, or category. Toggle between standard pagination and smooth infinite scroll mode.",
      },
      {
        title: "Inspect Account Balances & Expense Categories",
        detail:
          "View detailed balance badges for Cash on Hand, Corporate Bank Accounts, and interactive category pills showing where funds flow in SAR to understand cash velocity at a glance.",
      },
      {
        title: "Create Personal Financial Support Records",
        detail:
          "Choose record type: Support Given (lent/family allowance) or Support Taken (borrowed). Specify beneficiary person from your People directory, total principal amount, currency (BDT, SAR, USD, etc.), and purpose.",
      },
      {
        title: "Configure Repayment & Installment Schedule",
        detail:
          "Define payment terms: Lump sum or Monthly installments. Specify start date, installment amount, expected settlement date, and payment method (bKash, Bank, Cash).",
      },
      {
        title: "Log Installment Payments & Gift Conversions",
        detail:
          "Each time an installment is paid or received, record the date, amount, transaction reference, and optional receipt attachment. The remaining balance recalculates automatically. Optionally convert any personal support record into a non-repayable Gift with a full audit trail.",
      },
      {
        title: "Monitor Overdue & Upcoming Alerts",
        detail:
          "The system automatically tracks due dates and tags overdue payments with prominent warning badges on your Dashboard and Finance lists. Never miss a payment deadline.",
      },
      {
        title: "Attach Proof of Agreement",
        detail:
          "Upload promissory notes, cheques, signed stamps, or transfer receipts to ensure complete legal transparency and prevent future disputes.",
      },
      {
        title: "View Financial Care on Person Profile",
        detail:
          "Every financial record linked to a person automatically appears in their Profile → Financial Care tab. This gives you a complete per-person financial history at a glance.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Currency standard: All accounting ledger transactions and balances from ACC.GESN.NET are strictly denominated in SAR (Saudi Riyal). Amounts display a clean, muted 'SAR' label at the end of values without cluttering repeating symbols.",
      },
      {
        type: "info",
        text: "Dual-currency flexibility: While the ACC.GESN.NET accounting ledger operates strictly in SAR, personal financial support records can be logged in local currencies (BDT, SAR, USD) based on agreement terms.",
      },
      {
        type: "tip",
        text: "For recurrent monthly family support (e.g., parents or dependents), enable recurring status to track monthly disbursement history accurately.",
      },
      {
        type: "security",
        text: "Non-owner users who are granted financial access see a personalized summary showing their own obligations and transactions, with zero access to confidential corporate accounting ledgers.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with the canViewFinancial permission.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. MONEY OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 03B. 03B. Money Overview & Debt Ledger
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "money",
    category: "Core Command",
    serial: "03B",
    icon: Coins,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800/40",
    title: "03B. Money Overview & Debt Ledger",
    subtitle: "Receivables, payables, investments & net financial standing",
    description:
      "A consolidated double-entry balance sheet detailing all financial obligations and venture capital: Money Given (loans/receivables), Money Taken (borrowings/payables), Investments Made in ventures, External Capital Received, To Receive (due to you), and To Pay (owed to others). Complements the live operational accounting in Finance.",
    steps: [
      {
        title: "Inspect Aggregate Financial Balances",
        detail:
          "Review the top stat cards: Total Given, Total Taken, Invested, Investment Received, Receivables, and Payables to see your live net liquidity standing at a glance.",
      },
      {
        title: "Filter by Transaction Category",
        detail:
          "Toggle between Given, Taken, Investment Made, and Investment Received tabs to inspect counterparties, original amounts, repayments, and remaining balances.",
      },
      {
        title: "Record Direct Ledger Transactions",
        detail:
          "Log lump-sum settlements, interest-free personal borrowings, or venture investments with dates, counterparties, and settlement terms.",
      },
      {
        title: "Cross-Reference With People & Businesses",
        detail:
          "Every money record links directly to a person profile or business entity so you can see complete transaction history per counterparty in one place.",
      },
    ],
    tips: [
      {
        type: "info",
        text: "Finance vs Money: Use '/finance' for operational accounting via ACC.GESN.NET (SAR) and family installment support. Use '/money' for your master net-worth balance sheet of loans, venture investments, and debt obligations.",
      },
      {
        type: "warning",
        text: "Keep every entry backed by a linked person in the People directory to prevent ambiguity regarding who owes or is owed money.",
      },
      {
        type: "tip",
        text: "Use the 'Detailed Financials' breakdown when reviewing estate net worth or planning debt settlements before inheritance distribution.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with the canViewFinancial permission.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. ASSETS
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 04. 04. Secure Vault (AES-256)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "vault",
    category: "Core Command",
    serial: "04",
    icon: KeyRound,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800/40",
    title: "04. Secure Vault (AES-256)",
    subtitle: "Encrypted passwords, server keys, seed phrases & master PIN",
    description:
      "The most sensitive module in LIFE. Secrets are encrypted using military-grade AES-256 encryption. Plaintext is never stored on disk. Revealing any secret requires entering your Master PIN and is permanently logged in the audit trail.",
    steps: [
      {
        title: "Create a Vault Item",
        detail:
          "Choose secret type: Web Account, Server Key / SSH, Recovery Phrase / Crypto, Financial PIN, Document Secret, or General Password.",
      },
      {
        title: "Enter Secret Data & URL",
        detail:
          "Provide account username/email, login URL, and the secret password or private key. Data is encrypted at the application layer before being stored in the database. The plaintext never touches the disk.",
      },
      {
        title: "Reveal Secret with Master PIN",
        detail:
          "To view or copy a secret, click the eye icon. Enter your 4-to-6 digit Master PIN. The secret unlocks temporarily with a live self-clearing countdown timer. After the timer expires, the secret is hidden again automatically.",
      },
      {
        title: "Audit Trail Logging",
        detail:
          "Every reveal operation creates an immutable security log entry with timestamp, actor email, IP address, and item title. This log cannot be edited or deleted — ensuring full accountability.",
      },
      {
        title: "Soft Delete & Recovery",
        detail:
          "Accidentally deleted vault items go to the Trash bin (Settings → Trash) and can be recovered by the Owner within the retention period. After that, they are permanently purged.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "If you forget your Master PIN, vault secrets cannot be decrypted without administrative reset. Store your Master PIN securely in a physical offline location (e.g., written in a sealed envelope inside a fireproof safe).",
      },
      {
        type: "warning",
        text: "Never share your Master PIN via WhatsApp, SMS, or unencrypted messaging channels. Treat it like a bank vault combination.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with explicit canRevealVault permission.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. PERSONAL INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 05. 05. Responsibilities & Instructions
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "instructions",
    category: "Records & Continuity",
    serial: "05",
    icon: FileText,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800/40",
    title: "05. Responsibilities & Instructions",
    subtitle: "Directives, ongoing commitments, tasks & emergency handovers",
    description:
      "Clear, actionable instructions for your family, business partners, and employees. Outlines 'What to do', 'Who should do it', step-by-step priority sequences, and ongoing personal obligations.",
    steps: [
      {
        title: "Create Directive or Responsibility",
        detail:
          "Give the instruction a clear title, category (Family Welfare, Business Duty, Financial Handover, Religious Directive), and priority level (High, Medium, Normal).",
      },
      {
        title: "Assign to Designated Person",
        detail:
          "Select the responsible individual from your People directory so the instruction appears on their portal and their Person Profile → Instructions tab.",
      },
      {
        title: "Detail Step-by-Step Procedure",
        detail:
          "Write comprehensive, unambiguous instructions. Include specific account numbers, contacts to call, deadlines, and execution orders. Be as specific as possible to prevent confusion.",
      },
      {
        title: "Track Execution & Status",
        detail:
          "Monitor status: Active, In Progress, Completed, or On Hold. Assignees can view their responsibilities and update progress from their personalized portal.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Be as specific as possible in your handover instructions. Step-by-step guides prevent confusion and disagreements during stressful transitions.",
      },
      {
        type: "info",
        text: "Non-owner assignees who sign in see their assigned instructions under 'Responsibilities' on their dashboard and on their Person Profile → Instructions tab.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and assigned users with the canViewPersonal permission.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 05B. LIFENOTE — Released Notes & Recipient Support
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "lifenote",
    category: "Records & Continuity",
    serial: "05B",
    icon: NotebookPen,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    border: "border-violet-200 dark:border-violet-800/40",
    title: "05B. LifeNote — Personal Notes & Directives",
    subtitle: "Released notes, designated-person directives & recipient support",
    description:
      "LifeNote is the private note vault for notes that are available now. Owners and Super Admins create and manage directives for specific people; recipients use it to read released notes and ask the Owner for help. Future and protected notes are handled separately in Request Center until access is granted.",
    steps: [
      {
        title: "Create a Note",
        detail:
          "Give the note a title, write the content, assign a person, and choose its note type. Always Visible notes are available immediately. Manual, Scheduled, and Secret Emergency notes stay protected until released through their future-note access flow. Internal Admin notes remain private to management.",
      },
      {
        title: "Assign to a Person",
        detail:
          "Select the recipient from your People directory. Released notes appear in that person's LifeNote view. Protected notes do not expose their content there; the recipient can find and request them in Request Center. The recipient receives an in-app notification after approval or release.",
      },
      {
        title: "Set Priority & Category",
        detail:
          "Assign a priority level (Low, Medium, High, Critical) and an optional category or tags to organize your notes. Pinned notes always appear at the top of the list.",
      },
      {
        title: "Read a Note or Ask for Help",
        detail:
          "Recipients can open a released note with View. Opening it records that it has been seen. Use Need Help to send the Owner a question or assistance request; this creates a linked conversation in Request Center.",
      },
      {
        title: "Manage Released Secret Notes",
        detail:
          "Owners and Super Admins can review the release state of secret notes and relock a released secret note when needed. Access requests, approvals, rejections, and releases are recorded in the note history and Activity Log.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Use 'Secret Emergency' type for your most sensitive messages — final wishes, PIN disclosures, or legal directives. They only unlock when truly needed.",
      },
      {
        type: "info",
        text: "LifeNote contains released notes only. A protected note's title and access controls appear in Request Center, while its content remains hidden until it is released.",
      },
      {
        type: "warning",
        text: "Internal Admin notes are never visible to the assigned person — use them for your own private reference only.",
      },
    ],
    whoCanAccess:
      "Owner and Super Admin can create and manage all notes. Assigned users with canViewPersonal or canViewSensitive permission can view their released notes.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 05C. REQUEST CENTER — Requests, Messages & Future Note Access
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "request-center",
    category: "Records & Continuity",
    serial: "05C",
    icon: ClipboardList,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "05C. Request Center & Direct Messaging",
    subtitle: "Isolated 1-on-1 messaging, user threads, and protected note access",
    description:
      "Request Center features an isolated 1-on-1 conversation system alongside inquiry tickets and future note controls. A regular User only ever sees their private conversation with the Super Admin. The Super Admin manages an individual message thread for each user with file attachments, seen status, and note references.",
    steps: [
      {
        title: "Private 1-on-1 Messaging (Regular User)",
        detail:
          "Open the Direct Messages tab or tap the Messages icon on your dashboard to access your private channel with the Super Admin. You can exchange text messages, upload file attachments (up to 8MB), and check delivery and seen status with timestamps.",
      },
      {
        title: "Super Admin User Directory",
        detail:
          "Super Admins and Owners see a separate conversation list for every registered user, complete with search, unread badge counters, and latest activity timestamps. Clicking any user's name opens only that user's private individual thread with zero cross-user crosstalk.",
      },
      {
        title: "Need Help Directives Integration",
        detail:
          "When a recipient clicks 'Need Help' on any assigned LifeNote, the message is automatically posted into their private conversation thread with a prominent, clickable card referencing the exact Note title and link.",
      },
      {
        title: "Strict User Isolation & Access Control",
        detail:
          "Conversations are strictly isolated by authenticated email and identity. Non-admin users are technically blocked from querying, reading, or sending into another user's conversation thread.",
      },
      {
        title: "Future & Protected Note Access",
        detail:
          "View protected continuity directives under Future Notes. Request access when needed to trigger owner review or countdown timers before release into LifeNote.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Strict User Isolation: Regular users can only ever access their private 1-on-1 conversation with the Super Admin. Cross-user access is blocked at the database and API level.",
      },
      {
        type: "tip",
        text: "Attachments & Seen Receipts: Both users and Super Admins can attach files and preview images. Sent messages display '✓ Sent' when delivered and '✓✓ Seen' once read by the recipient.",
      },
      {
        type: "info",
        text: "Need Help messages from LifeNotes link directly to the note, giving the Super Admin full context to respond immediately.",
      },
    ],
    whoCanAccess:
      "All authenticated users can message the Super Admin. Super Admins and Owners can view and manage all individual user conversation threads.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. BENEFICIARIES
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 06. 06. Personal Information & Identity
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "information",
    category: "Records & Continuity",
    serial: "06",
    icon: FileText,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800/40",
    title: "06. Personal Information & Identity",
    subtitle: "National ID, passports, blood group, medical data & policies",
    description:
      "A centralized repository for identity records, official government IDs, health and medical directions, insurance policy numbers, and personal emergency directives.",
    steps: [
      {
        title: "National Identity & Passport Data",
        detail:
          "Record NID number, Smart Card ID, Passport number, expiry date, issuing authority, and birth certificate registration number. Keep this data updated before every international trip.",
      },
      {
        title: "Health, Blood Group & Medical Directives",
        detail:
          "Save blood group, chronic conditions, ongoing medications, known severe allergies, and preferred emergency hospital/doctor. This information can save precious minutes during medical emergencies.",
      },
      {
        title: "Life & Health Insurance Policies",
        detail:
          "Record insurance policy numbers, insurer company, sum assured, premium renewal dates, and emergency claim contact numbers. Link relevant documents from the Documents module.",
      },
      {
        title: "Personal Credentials & Tax Information",
        detail:
          "Keep e-TIN number, tax circle, driving license number, and utility account registration IDs readily accessible for quick reference during filing seasons.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Keep digital photo copies of your NID and passport attached in the Critical Documents module for immediate access when traveling.",
      },
      {
        type: "info",
        text: "Medical emergency info can save precious time during unexpected hospitalizations. Share this section's access with immediate family.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with the canViewPersonal permission.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. PEOPLE DIRECTORY
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 07. 07. Businesses & Partnerships
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "business",
    category: "Records & Continuity",
    serial: "07",
    icon: Briefcase,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    border: "border-cyan-200 dark:border-cyan-800/40",
    title: "07. Businesses & Partnerships",
    subtitle: "Enterprise equity, partner continuity & operational handover",
    description:
      "Manage all corporate entities, partnership equity percentages, corporate bank credentials, operating licenses, and the critical 'If I Am Not Available' business continuity protocol.",
    steps: [
      {
        title: "Register Enterprise & Ownership Equity",
        detail:
          "Record company name, registration number, trade license, total valuation, your exact shareholding percentage, and capital invested. Include TIN/BIN registration details.",
      },
      {
        title: "Map Business Partners & Co-Founders",
        detail:
          "Link partners from your People directory, specify their equity stake, designated roles, profit-sharing terms, and signed partnership deed copies.",
      },
      {
        title: "Document Corporate Banking & Signatories",
        detail:
          "Record corporate bank accounts, branch details, routing numbers, and authorized signatories required for emergency payroll and operational continuity.",
      },
      {
        title: "Fill 'If I Am Not Available' Checklist",
        detail:
          "Step-by-step operating instructions detailing who assumes managerial control, where backup accounts reside, key vendor contacts, client commitments, and handover priorities. This is one of the most critical continuity documents.",
      },
      {
        title: "Attach Official Registration Documents",
        detail:
          "Upload or reference certificates of incorporation, memorandum of association, tax registration (TIN/BIN), board resolutions, and any government-issued operating permits.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Regularly update partner equity and bank signatories whenever corporate restructuring or share dilution takes place.",
      },
      {
        type: "security",
        text: "The 'If I Am Not Available' checklist is one of the most important continuity documents. Ensure your designated partners or managers know where to locate it.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with the canViewBusiness permission.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  // 3. FINANCIAL CARE & ACCOUNTING LEDGER
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 08. 08. Assets & Properties
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "assets",
    category: "Records & Continuity",
    serial: "08",
    icon: Layers,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    border: "border-indigo-200 dark:border-indigo-800/40",
    title: "08. Assets & Properties",
    subtitle: "Real estate, bank accounts, vehicles, gold & valuables",
    description:
      "Catalog all real estate properties, plots, residential apartments, vehicle registrations, bank deposits, fixed deposits (FDR), gold/jewelry, and physical document storage locations.",
    steps: [
      {
        title: "Select Asset Category",
        detail:
          "Choose from Real Estate, Bank Account/FDR, Vehicle, Gold & Valuables, Digital Holdings, or Other Asset types.",
      },
      {
        title: "Record Ownership & Financial Valuation",
        detail:
          "Enter purchase value, estimated current market value, purchase date, ownership share percentage, and whether the asset generates monthly rental income.",
      },
      {
        title: "Specify Physical Document Locations",
        detail:
          "Clearly document where the original deeds, registration blue books, tax receipts, or keys are physically located (e.g., 'Almirah #2, Bank Safe Locker 4B'). This prevents frantic searches during urgent situations.",
      },
      {
        title: "Designate Primary Nominees",
        detail:
          "Link designated beneficiaries from your People directory to define intended inheritance or custody upon emergency activation.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Updating estimated market values once or twice a year keeps your overall estate valuation realistic for succession planning.",
      },
      {
        type: "security",
        text: "Never write bank account PINs or locker master passwords in asset description fields — store all secrets strictly in the Secure Vault.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with canViewFinancial or canViewBusiness permissions.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. VAULT
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 09. 09. Important Contacts Directory
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "contacts",
    category: "Records & Continuity",
    serial: "09",
    icon: Contact,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800/40",
    title: "09. Important Contacts Directory",
    subtitle: "Lawyers, doctors, accountants, bankers & emergency advisors",
    description:
      "A curated directory of your essential professional support network. Categorized by function with one-touch phone call, WhatsApp, and email shortcuts for rapid emergency response.",
    steps: [
      {
        title: "Add Professional Contact",
        detail:
          "Select category: Legal / Lawyer, Medical / Doctor, Financial / Accountant, Banking Officer, IT & Systems, Insurance Agent, or Personal Emergency.",
      },
      {
        title: "Fill Contact Information",
        detail:
          "Enter name, company/firm, primary phone, secondary phone, email, chamber/office address, and working hours.",
      },
      {
        title: "Specify Special Instructions",
        detail:
          "Add context notes such as 'Handles land registration documents', 'Primary cardiologist', or 'Auditor for company tax filing'. These notes help family members quickly understand each contact's purpose.",
      },
      {
        title: "One-Touch Emergency Actions",
        detail:
          "Use the direct Call, WhatsApp Message, or Email action buttons directly from mobile or desktop without copying numbers. These work on both the contacts list and person profile's Important Contacts tab.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Ensure your family knows to refer to this list first if they ever need legal counsel, tax filings, or banking assistance on your behalf.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with the canViewPersonal permission.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. DOCUMENTS
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. 10. Critical Documents Repository
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "documents",
    category: "Records & Continuity",
    serial: "10",
    icon: FolderLock,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    border: "border-purple-200 dark:border-purple-800/40",
    title: "10. Critical Documents Repository",
    subtitle:
      "Deeds, contracts, trade licenses, agreements & physical file tags",
    description:
      "Secure digital archive and physical indexing for critical paperwork: property title deeds, trade licenses, partnership agreements, lease contracts, power of attorney, and bank certificates.",
    steps: [
      {
        title: "Catalog Document Entry",
        detail:
          "Provide document title, category (Legal, Property, Business, Financial, Identity), issue date, expiry date, and issuing authority.",
      },
      {
        title: "Record Physical File Location Tag",
        detail:
          "Document the exact physical location where the original hardcopy is kept (e.g. 'Blue File Folder, Office Almirah Top Shelf'). This is often the most valuable piece of information during emergencies.",
      },
      {
        title: "Upload Secure Digital Scan / Attachment",
        detail:
          "Attach PDF scans or high-resolution photos of the document for instant online preview and emergency verification. Files are securely stored and access-controlled.",
      },
      {
        title: "Link to Related People or Businesses",
        detail:
          "Associate the document with specific businesses, properties, or partners for contextual lookup across modules. Linked documents appear on the person's profile Documents tab.",
      },
      {
        title: "Soft Delete & Recovery",
        detail:
          "Accidentally deleted documents go to Trash (Settings → Trash) and can be recovered by the Owner. This prevents accidental permanent data loss.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Physical location tags prevent frantic searches during urgent situations when original stamped deeds are needed immediately.",
      },
      {
        type: "security",
        text: "Encrypted file attachments are protected so only authorized family and administrators can download them.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with canViewPersonal or canViewSensitive permissions.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. INSTRUCTIONS
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. 11. Beneficiaries & Heirs
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "beneficiaries",
    category: "Records & Continuity",
    serial: "11",
    icon: HeartHandshake,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    border: "border-rose-200 dark:border-rose-800/40",
    title: "11. Beneficiaries & Heirs",
    subtitle: "Asset allocations, nominee mapping & legacy distributions",
    description:
      "A structured overview of designated heirs and beneficiaries (Wife, Son, Daughter, Parents, Siblings) with asset allocations, inheritance percentages, and nominee designations.",
    steps: [
      {
        title: "Define Beneficiary List",
        detail:
          "Select family members and loved ones from the People directory with relationship details, National IDs, and contact numbers.",
      },
      {
        title: "Map Asset Distributions & Percentages",
        detail:
          "Assign specific assets (Properties, Bank Accounts, Shares) and allocate percentage shares for each beneficiary according to your wishes or legal requirements.",
      },
      {
        title: "Attach Nominee Declarations",
        detail:
          "Document official bank nominee forms, company share transfer declarations, or notarized gift deeds.",
      },
      {
        title: "Link Legacy Letters",
        detail:
          "Connect personalized legacy letters and audio messages directly to the intended beneficiary for private delivery upon trigger conditions.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Ensure allocation percentages across each asset or company total 100% to avoid estate ambiguity and legal disputes.",
      },
      {
        type: "security",
        text: "Beneficiary details are confidential and accessible only to the Owner and authorized legal delegates.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and users with canViewFinancial or canViewPersonal permissions.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. LEGACY
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. 12. Legacy Messages & Final Wishes
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "legacy",
    category: "Legacy & Security",
    serial: "12",
    icon: BookOpen,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/50",
    border: "border-pink-200 dark:border-pink-800/40",
    title: "12. Legacy Messages & Final Wishes",
    subtitle: "Private letters, video messages & emergency release triggers",
    description:
      "Leave personal, emotional messages, advice, video links, or confidential instructions for your wife, children, siblings, or lifelong friends. Messages remain sealed until designated trigger conditions are met.",
    steps: [
      {
        title: "Compose Legacy Message",
        detail:
          "Specify the recipient from your People directory. Write your letter using the rich text editor or attach secure media links.",
      },
      {
        title: "Select Release Trigger Condition",
        detail:
          "Choose delivery trigger: On Emergency Protocol Activation, On Specified Future Date, or Manual Release by Primary Guardian.",
      },
      {
        title: "Define Confidentiality & Privacy Level",
        detail:
          "Mark message as Strictly Private (only the recipient can decrypt upon release) or Family Shared.",
      },
      {
        title: "Test & Seal Message",
        detail:
          "Review the message preview, save, and seal. The system securely encrypts the content until the release protocol fires. Once sealed, the content cannot be read by anyone — including administrators.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Write from the heart. Share life values, advice for your children's future milestones, and reassuring words for your family.",
      },
      {
        type: "security",
        text: "Messages are securely locked. No one — not even administrators — can prematurely decrypt private legacy letters before release triggers fire.",
      },
    ],
    whoCanAccess:
      "Owner creates and manages all messages. Designated recipients receive access upon verified release.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. GUARDIANS
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. 13. Trusted Guardians & Emergency Protocol
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "guardians",
    category: "Legacy & Security",
    serial: "13",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800/40",
    title: "13. Trusted Guardians & Emergency Protocol",
    subtitle:
      "Multi-party consensus, countdown grace period & emergency unlocking",
    description:
      "The fail-safe emergency access engine. Designed to prevent unauthorized access while guaranteeing family continuity if the owner is incapacitated or unreachable. Requires multi-guardian consensus and an owner cancellation grace period.",
    steps: [
      {
        title: "Designate Trusted Guardians",
        detail:
          "Appoint 2 to 5 trusted individuals (e.g., Wife as Primary, Brother as Secondary, Trusted Partner as Independent) from the People directory.",
      },
      {
        title: "Configure Multi-Party Consensus Threshold",
        detail:
          "Set the approval threshold (e.g., 2 of 3 guardians must confirm). A single rogue guardian cannot trigger emergency mode unilaterally — consensus is required.",
      },
      {
        title: "Set Countdown Grace Period",
        detail:
          "Specify the safety cancellation window (e.g. 24, 48, or 72 hours). When guardians initiate an emergency request, the Owner receives instant alerts via email/SMS and can cancel with a single tap if it was a false alarm.",
      },
      {
        title: "Emergency Activation & Dynamic Elevation",
        detail:
          "If the countdown expires without owner cancellation, Emergency Mode activates. Permitted continuity instructions, designated vault secrets, and emergency directives unlock for designated delegates automatically.",
      },
      {
        title: "Owner One-Tap Normalization",
        detail:
          "The Owner can deactivate Emergency Mode at any time, instantly locking emergency access and restoring normal operation. No data is permanently exposed.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Multi-party consensus (e.g., requiring both Wife AND Brother to approve) prevents unilateral hostile takeover or accidental unlocking.",
      },
      {
        type: "warning",
        text: "Always inform your appointed guardians about their role and verify that their phone numbers and emails are kept updated. Test the emergency flow at least once.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and appointed Guardians (canAccessEmergency).",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 13B. 48-HOUR EMERGENCY RECOVERY & CONTINUITY SYSTEM
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 13B. 13B. 48-Hour Emergency Recovery System
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "emergency-recovery",
    category: "Legacy & Security",
    serial: "13B",
    icon: Clock,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800/40",
    title: "13B. 48-Hour Emergency Recovery System",
    subtitle:
      "Server-side countdown, Master PIN cancellation, vault lockout protection & predefined continuity policy",
    description:
      "When an authorized Emergency Contact or Guardian activates the Emergency Button, a server-side 48-hour cancellation countdown begins. During this period, the Owner or any Super Admin can cancel the event using their Master Security PIN. If not cancelled within 48 hours, the predefined Emergency Continuity Access Policy activates automatically — granting temporary, scoped emergency access to designated trustees without permanently elevating any privileges.",
    steps: [
      {
        title: "Step 1: Emergency Button Activation",
        detail:
          "An authorized Emergency Contact, Guardian, or Trustee (NOT the Owner themselves) clicks the 'Activate Emergency (48h Protocol)' button on the Access Control page. They must provide a reason and confirm that the Owner is unavailable. The system records: who triggered it, date/time, device/session, IP address, and the stated reason.",
      },
      {
        title: "Step 2: Immediate Email Notification",
        detail:
          "Instant email alerts are dispatched to all configured Super Admin and Owner accounts. The notification clearly states: 'Emergency Recovery Activated — 48 Hours Remaining'. Emails NEVER contain passwords, vault secrets, or PIN codes.",
      },
      {
        title: "Step 3: 48-Hour Server-Side Countdown",
        detail:
          "A server-side countdown timer ('countdownEndsAt') starts. The remaining time is displayed live in the Access Control dashboard with a real-time HH:MM:SS countdown badge. This timer cannot be manipulated by the client clock — it is enforced entirely on the server.",
      },
      {
        title: "Step 4: Owner / Super Admin Cancellation",
        detail:
          "During the 48-hour window, any authorized Super Admin can cancel the recovery event. Cancellation requires re-verification using the Master Security PIN. On cancellation: the system returns to Standby, vault lockouts are cleared, access is resealed, cancellation emails are sent, and the event is logged in the Audit Trail.",
      },
      {
        title: "Step 5: After 48 Hours — Predefined Continuity Policy Activates",
        detail:
          "If not cancelled, the Emergency Continuity Access Policy activates automatically. Designated trustees receive temporary, scoped emergency access to ONLY emergency-marked records. Owner-only records, private notes, and hidden drafts remain strictly concealed. All views and downloads are audited. No permanent Super Admin escalation occurs — access expires after the configured access window.",
      },
      {
        title: "Step 6: Access Expiration & Automatic Revocation",
        detail:
          "After the emergency access window expires ('accessExpiresAt'), all temporary emergency permissions are automatically revoked and the system returns to normal operation. No manual intervention is required.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "The Owner cannot trigger Emergency Mode on themselves. This prevents social engineering attacks where someone forces the owner to activate emergency access. Only designated Emergency Contacts and Guardians can initiate the 48-hour sequence.",
      },
      {
        type: "warning",
        text: "Master Vault passwords and secrets are NEVER included in email notifications, audit logs, or API responses to unauthorized users. The system enforces zero-knowledge secret handling at every level.",
      },
      {
        type: "tip",
        text: "Use the '[Test Simulation] Advance +48h' button in the Access Control page to instantly simulate the 48-hour countdown expiring. This allows you to verify the full flow without waiting 2 real days.",
      },
      {
        type: "security",
        text: "15 consecutive failed Vault PIN attempts will trigger an automatic vault lockout with its own 48-hour recovery sequence. Super Admins are immediately notified by email and can resolve the lockout from Access Control.",
      },
    ],
    whoCanAccess:
      "Emergency trigger: Designated Emergency Contacts & Guardians only. Cancellation: Super Admin / Owner with Master PIN. Dashboard view: Super Admin / Owner.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. 14. Access Control & Permission Rules
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "permissions",
    category: "Legacy & Security",
    serial: "14",
    icon: ShieldCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "14. Access Control & Permission Rules",
    subtitle:
      "Super admin privileges, user module filtering & route protection",
    description:
      "LIFE enforces strict role-based access control (RBAC). The core principle is: Only Super Admin / Owner sees all modules. Other users only see and access the modules they have been explicitly granted permission to view.",
    steps: [
      {
        title: "Super Admin & Owner Role",
        detail:
          "The Owner / Super Admin has unrestricted access to all 13+ modules, full system settings, security logs, financial balances, and user permission management. There is only one Super Admin per LIFE Vault instance.",
      },
      {
        title: "The 7 Core System Roles & Capability Presets",
        detail:
          "LIFE features 7 well-defined system roles with automated capability defaults: (1) Super Admin — complete unconstrained ownership across all modules; (2) Administrator — operational management across permitted areas; (3) Guardian — family care, medical records, and emergency consensus triggers; (4) Business Staff — access to assigned business continuity directives and operations; (5) Business Partner — corporate accounts, business assets, and capital agreements; (6) Individual User — isolated access strictly limited to their own assigned records; and (7) Read Only — viewing allowed records without modification rights or vault revelation.",
      },
      {
        title: "Module Permission Flags & Notes Scopes",
        detail:
          "Assign specific permission flags to people: canViewPersonal (identity, contacts), canViewBusiness (companies, partners), canViewFinancial (money, assets, finance), canViewSensitive (restricted data), canRevealVault (decrypt secrets), canManageAccess (edit permissions), canAccessEmergency (guardian duties), and canManageSecretNotes. Business accounting remains restricted to Owners and Super Admins, while permitted users see only their scoped Personal Financial Care. Also configure Notes Access Scope: All Notes, Assigned Notes Only, or None.",
      },
      {
        title: "Real-Time In-App Notification Center",
        detail:
          "The header features a live notification bell with a dynamic unread badge count. Users receive instant interactive alerts when: an unlock request is submitted for a secret note, an unlock countdown is running or expiring, a note is released or shared, permissions are modified, or an operational deadline is approaching. Users can view alerts with 1-tap navigation to the relevant record or mark notifications as read.",
      },
      {
        title: "Automatic UI Navigation Filtering",
        detail:
          "The desktop Sidebar, mobile Bottom Navigation bar, and 'More' drawer automatically filter out all modules the user lacks permission for. Empty sections are completely hidden — users never see modules they can't access.",
      },
      {
        title: "Personalized Dashboard Views",
        detail:
          "Non-admin users see an 'Authorized Access Portal' displaying only their permitted directory cards, action buttons, assigned responsibilities, and personal support or commitment information. Owner accounting figures, business accounting, secrets, and unauthorized modules remain hidden.",
      },
      {
        title: "Server-Side Route Protection (IDOR Prevention)",
        detail:
          "Direct browser URL navigation is enforced on the server. If an unauthorized user attempts to open a restricted route (e.g. /vault or /finance), they are automatically redirected to the access-denied page. This prevents IDOR (Insecure Direct Object Reference) attacks.",
      },
      {
        title: "Self-Edit Restrictions & Owner Protection",
        detail:
          "Non-admin users who access their own profile can update only their phone number, WhatsApp, email, and social links. They cannot modify their own permissions, role, status, or other people's data. Furthermore, Super Admins cannot alter Owner-level master credentials or permissions without explicit Owner verification.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Follow the principle of least privilege: assign employees and external partners only the exact modules they need for business continuity. Review permissions quarterly.",
      },
      {
        type: "tip",
        text: "You can modify or revoke a person's permissions instantly from the People directory, their Person Profile → Access Information tab, or the Access management screen.",
      },
    ],
    whoCanAccess:
      "Super Admin and Owner exclusively manage permissions for all other users.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 17. ACTIVITY LOG
  // ─────────────────────────────────────────────────────────────────────────────,

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. 15. Security Audit & Activity Log
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "activity",
    category: "Legacy & Security",
    serial: "15",
    icon: History,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    border: "border-violet-200 dark:border-violet-800/40",
    title: "15. Security Audit & Activity Log",
    subtitle:
      "Real-time security logs, secret reveal tracking & tamper evidence",
    description:
      "A complete, tamper-evident audit log of every meaningful action inside LIFE Vault. Logs cannot be modified or deleted. Provides full transparency into who accessed what and when.",
    steps: [
      {
        title: "Automatic System Logging",
        detail:
          "Every user sign-in, vault secret reveal, financial update, document download, permission change, and emergency mode event is automatically recorded with zero manual effort.",
      },
      {
        title: "Detailed Event Metadata",
        detail:
          "Each log entry includes timestamp, actor email, actor name, action category, affected item/entity, and status (success/failure).",
      },
      {
        title: "Filter by Activity Type",
        detail:
          "Filter by categories: Vault Reveals, Authentication, Financial Records, Continuity Changes, Emergency State, and Access Edits. Use date range filters to narrow down specific time windows.",
      },
      {
        title: "Security Incident Review",
        detail:
          "If unexpected behavior or an unauthorized sign-in attempt occurs, review the audit log immediately to identify the actor and timestamp. Logs are immutable — they cannot be edited or deleted by anyone.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Review the Activity Log periodically (at least monthly) to verify that vault secret reveals correspond only to authorized operations.",
      },
      {
        type: "info",
        text: "Log entries are stored permanently in the database and cannot be cleared by standard users. This ensures full legal accountability.",
      },
    ],
    whoCanAccess:
      "Super Admin, Owner, and administrators with canManageAccess permission.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. 16. System Settings, Master PIN & PWA
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "settings",
    category: "Legacy & Security",
    serial: "16",
    icon: Settings,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/50",
    border: "border-slate-200 dark:border-slate-800/40",
    title: "16. System Settings, Master PIN & PWA",
    subtitle:
      "Master PIN configuration, encrypted backup & mobile installation",
    description:
      "Manage security parameters, configure your Master PIN for vault reveals, export encrypted offline backups, access the Trash recovery system, and install LIFE Vault as a native Progressive Web App (PWA) on iPhone and Android.",
    steps: [
      {
        title: "Configure / Change Master PIN",
        detail:
          "Set a strong 4-to-6 digit Master PIN. The PIN is required whenever revealing encrypted vault secrets or modifying high-security emergency settings. You can change it anytime from Settings, but the old PIN is needed to set a new one.",
      },
      {
        title: "Export Complete Encrypted Backup",
        detail:
          "Download a full JSON snapshot of your entire database — people, businesses, financial records, assets, encrypted vault ciphertexts, and legacy messages — for cold offline storage on an encrypted USB drive.",
      },
      {
        title: "Access Trash & Recovery",
        detail:
          "Navigate to Settings → Trash to view all soft-deleted records. Recover accidentally deleted People, Documents, or Vault Items with one tap. See Module 16 (Trash & Recovery) for full details.",
      },
      {
        title: "Install as Mobile PWA",
        detail:
          "On iPhone: open Safari, tap the Share icon, and select 'Add to Home Screen'. On Android: tap the browser menu and select 'Install App'. Enjoy fullscreen native mobile experience with biometric unlocking.",
      },
      {
        title: "Emergency Notification Webhooks",
        detail:
          "Configure emergency alert SMS/email webhooks so appointed delegates and family receive instant notifications during emergency protocol activation.",
      },
    ],
    tips: [
      {
        type: "warning",
        text: "Never store your backup file on public cloud storage without additional encryption. Keep backups on an encrypted USB drive in a fireproof safe.",
      },
      {
        type: "tip",
        text: "Installing LIFE Vault as a PWA gives you fast one-tap access from your phone's home screen with instant load times and offline capability.",
      },
    ],
    whoCanAccess:
      "Owner only for Master PIN, backup exports, and Trash access. Admins for general settings.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 16B. 16B. Trash & Recovery System
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "trash",
    category: "Legacy & Security",
    serial: "16B",
    icon: Trash2,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    border: "border-orange-200 dark:border-orange-800/40",
    title: "16B. Trash & Recovery System",
    subtitle:
      "Soft delete, recovery window & permanent purge",
    description:
      "LIFE Vault implements a safe soft-delete system. When you delete a record (Person, Document, or Vault Item), it is not permanently destroyed — it moves to the Trash bin where it can be reviewed and recovered by the Owner.",
    steps: [
      {
        title: "How Soft Delete Works",
        detail:
          "When you click 'Delete' on a Person, Document, or Vault Item, the record is marked as deleted but remains in the database. It disappears from all active lists and modules but is preserved in the Trash.",
      },
      {
        title: "Access the Trash Bin",
        detail:
          "Go to Settings → Trash. The Trash page shows all soft-deleted records organized by entity type (People, Documents, Vault Items) with the deletion date and the user who deleted them.",
      },
      {
        title: "Recover a Deleted Record",
        detail:
          "Click the 'Restore' button next to any trashed record to recover it. The record is immediately restored to its original location with all data intact — nothing is lost.",
      },
      {
        title: "Permanent Purge",
        detail:
          "The Owner can permanently delete a trashed record by clicking 'Delete Forever'. Once permanently purged, the record cannot be recovered under any circumstances. Use this only when you are absolutely certain.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Always check the Trash before asking for technical support about missing records. Most 'lost' records are simply in the Trash waiting to be recovered.",
      },
      {
        type: "warning",
        text: "Permanent deletion is irreversible. Only the Owner can perform permanent purges. Standard users can soft-delete but not permanently destroy records.",
      },
      {
        type: "security",
        text: "All delete and recovery operations are recorded in the Activity Log with actor identification and timestamps.",
      },
    ],
    whoCanAccess:
      "Owner only. Standard users can soft-delete records they have permission to manage, but only the Owner can access the Trash bin and perform recovery or permanent purge.",
  },
];

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const tipIconMap = {
  tip: {
    icon: Zap,
    label: "Tip",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
  },
  info: {
    icon: Info,
    label: "Note",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40",
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
  },
  security: {
    icon: Shield,
    label: "Security",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40",
    badge:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-300",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function UserGuideClient() {
  const [activeId, setActiveId] = useState<string>("getting-started");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const activeIndex = sections.findIndex((s) => s.id === activeId);
  const active = sections[activeIndex >= 0 ? activeIndex : 0];
  const ActiveIcon = active.icon;

  const prevSection = activeIndex > 0 ? sections[activeIndex - 1] : null;
  const nextSection =
    activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null;

  const selectSection = useCallback((id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
  }, []);

  // Scroll to top whenever section changes
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeId]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="flex h-[calc(100dvh-57px)] overflow-hidden bg-background relative">
      {/* ── Desktop Sidebar (md+) ── */}
      <aside
        className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-border bg-card/60 backdrop-blur-sm h-full overflow-hidden"
        aria-label="Desktop Guide Navigation"
      >
        {/* Sidebar Header */}
        <div className="shrink-0 px-4 py-3.5 border-b border-border bg-card/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground tracking-tight leading-none">
                User Guide
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {sections.length} module guides
              </p>
            </div>
          </div>

        </div>

        {/* Section List */}
        <nav
          className="flex-1 overflow-y-auto p-2 space-y-4"
          aria-label="Guide modules"
        >
          {GUIDE_CATEGORIES.map((category) => {
            const catSections = sections.filter((s) => s.category === category);
            if (catSections.length === 0) return null;
            return (
              <div key={category} className="space-y-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60 px-3 py-1">
                  {category}
                </h3>
                <div className="space-y-0.5">
                  {catSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = section.id === activeId;
                    return (
                      <button
                        key={section.id}
                        onClick={() => selectSection(section.id)}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-xs font-medium group relative ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-emerald-500" />
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground/70 group-hover:text-foreground"
                            }`}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span className="truncate">{section.title}</span>
                        </div>

                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Hint */}
        <div className="shrink-0 p-3 m-2 rounded-xl bg-muted/40 border border-border/80 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground/80 mb-0.5">
            Permission Notice
          </p>
          <p className="leading-relaxed text-[10px]">
            Super Admin sees all modules. Other users only see modules granted in
            their access profile.
          </p>
        </div>
      </aside>

      {/* ── Main Column ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Sticky Top Header (md:hidden) */}
        <header className="md:hidden shrink-0 border-b border-border bg-card/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between gap-2 z-20">
          {/* Drawer toggle button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/70 hover:bg-muted text-foreground border border-border text-xs font-semibold shrink-0 active:scale-95 transition-all"
            aria-label="Open topic menu"
          >
            <Menu className="w-4 h-4 text-muted-foreground" />
            <span className="max-w-[140px] truncate text-left">
              {active.title}
            </span>

          </button>

          {/* Quick Prev / Next icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => prevSection && selectSection(prevSection.id)}
              disabled={!prevSection}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/60 transition-colors"
              aria-label="Previous section"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextSection && selectSection(nextSection.id)}
              disabled={!nextSection}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted/60 transition-colors"
              aria-label="Next section"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Content View */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto"
          id="guide-content"
          tabIndex={-1}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-12">
            {/* Section Hero Card */}
            <div
              className={`rounded-2xl border p-4 sm:p-6 transition-colors shadow-xs ${active.bg} ${active.border}`}
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div
                  className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border shadow-xs bg-background/80 ${active.border}`}
                >
                  <ActiveIcon
                    className={`w-6 h-6 sm:w-7 sm:h-7 ${active.color}`}
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${active.color}`}
                    >
                      {active.subtitle}
                    </p>

                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                    {active.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                    {active.description}
                  </p>
                </div>
              </div>

              {/* Access permission badge */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground bg-background/50 rounded-xl px-3 py-2 border border-border/50">
                <UserCheck
                  className="w-4 h-4 shrink-0 text-emerald-500"
                  strokeWidth={2}
                />
                <span className="truncate">
                  <strong className="text-foreground/90 font-semibold">
                    Who Can Access:
                  </strong>{" "}
                  {active.whoCanAccess}
                </span>
              </div>
            </div>

            {/* Steps: How to use it */}
            <section
              aria-labelledby="steps-heading"
              className="space-y-3 sm:space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2
                  id="steps-heading"
                  className="text-xs sm:text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"
                >
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-500"
                    strokeWidth={2}
                  />
                  How It Works & Step-by-Step Guide
                </h2>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {active.steps.length} steps
                </span>
              </div>

              <div className="space-y-3">
                {active.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 hover:border-border transition-all shadow-xs"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold mt-0.5">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tips & Best Practices */}
            <section
              aria-labelledby="tips-heading"
              className="space-y-3 sm:space-y-4"
            >
              <h2
                id="tips-heading"
                className="text-xs sm:text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-500" strokeWidth={2} />
                Security Rules & Important Tips
              </h2>

              <div className="space-y-3">
                {active.tips.map((tip, i) => {
                  const tipConfig = tipIconMap[tip.type];
                  const TipIcon = tipConfig.icon;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl border text-xs leading-relaxed transition-all shadow-xs ${tipConfig.bg}`}
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <TipIcon
                          className={`w-4 h-4 shrink-0 ${tipConfig.color}`}
                          strokeWidth={2}
                        />
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${tipConfig.badge}`}
                        >
                          {tipConfig.label}
                        </span>
                      </div>
                      <p className="text-foreground/90 font-medium sm:pt-0.5">
                        {tip.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Bottom Section Pager Navigation */}
            <nav
              className="pt-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
              aria-label="Section pagination"
            >
              {prevSection ? (
                <button
                  onClick={() => selectSection(prevSection.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/60 text-foreground transition-all group text-left"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:-translate-x-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Previous
                    </p>
                    <p className="text-xs font-semibold truncate text-foreground">
                      {prevSection.title}
                    </p>
                  </div>
                </button>
              ) : (
                <div className="hidden sm:block flex-1" />
              )}

              <div className="text-center font-mono text-[11px] text-muted-foreground/70 py-1">
                {activeIndex + 1} / {sections.length}
              </div>

              {nextSection ? (
                <button
                  onClick={() => selectSection(nextSection.id)}
                  className="flex items-center justify-end gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/60 text-foreground transition-all group text-right"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Next
                    </p>
                    <p className="text-xs font-semibold truncate text-foreground">
                      {nextSection.title}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <div className="hidden sm:block flex-1" />
              )}
            </nav>
          </div>
        </main>
      </div>

      {/* ── Mobile Navigation Drawer Modal ── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="User Guide Topics"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in drawer sheet from left */}
          <div className="relative w-4/5 max-w-xs bg-card border-r border-border h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="shrink-0 px-4 py-3.5 border-b border-border flex items-center justify-between bg-card/90">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm text-foreground">
                  Topics
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="Close guide menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Topic List */}
            <nav
              className="flex-1 overflow-y-auto p-2 space-y-4"
              aria-label="Mobile guide topics"
            >
              {GUIDE_CATEGORIES.map((category) => {
                const catSections = sections.filter((s) => s.category === category);
                if (catSections.length === 0) return null;
                return (
                  <div key={category} className="space-y-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60 px-3 py-1">
                      {category}
                    </h3>
                    <div className="space-y-0.5">
                      {catSections.map((section) => {
                        const Icon = section.icon;
                        const isActive = section.id === activeId;
                        return (
                          <button
                            key={section.id}
                            onClick={() => selectSection(section.id)}
                            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-xs font-medium ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isActive
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground/70"
                                }`}
                                strokeWidth={isActive ? 2.5 : 2}
                              />
                              <span className="truncate">{section.title}</span>
                            </div>

                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Drawer Footer Notice */}
            <div className="shrink-0 p-3 border-t border-border bg-muted/20 text-[10px] text-muted-foreground leading-relaxed">
              Super Admin sees all modules. Others see only granted modules.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
