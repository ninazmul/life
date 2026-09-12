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

// ─── Guide Content ────────────────────────────────────────────────────────────
const sections: GuideSection[] = [
  {
    id: "dashboard",
    icon: Home,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "Home Dashboard & Command Center",
    subtitle: "Real-time command center & continuity readiness",
    description:
      "The Dashboard serves as the central command console. It provides instantaneous visibility into your continuity readiness, owner safety check-ins, financial snapshot, urgent deadlines, and direct access to your permitted modules.",
    steps: [
      {
        title: "Continuity & Safety State",
        detail:
          "Monitors owner safety check-in status, emergency protocol readiness, number of trusted guardians configured, pending responsibilities, and overall business continuity readiness.",
      },
      {
        title: "Urgent Attention Alerts",
        detail:
          "Automatically highlights overdue financial support installments, upcoming payments, pending tasks, and critical security items requiring prompt action.",
      },
      {
        title: "Money & Wealth Snapshot",
        detail:
          "Displays aggregate totals for Money Given, Money Taken, Investments Made, External Investments Received, Receivables (Due to me), and Payables (To return). (Visible only to authorized users).",
      },
      {
        title: "Permitted Modules Directory",
        detail:
          "Displays quick-access cards to all your active modules with live counts and status badges. Non-admin users only see the modules they have permission to access.",
      },
      {
        title: "Quick Action Shortcuts",
        detail:
          "Use header action buttons to quickly create new financial records, register people, update continuity plans, or review instructions with a single tap.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Make it a routine to check the Dashboard daily. If all indicators are green and operational, your legacy protocols are fully protected.",
      },
      {
        type: "security",
        text: "The Dashboard dynamically adjusts its interface according to user permissions. Non-admin users will never see confidential financial figures or unauthorized modules.",
      },
    ],
    whoCanAccess: "Super Admin & Owner see all modules. Other users see only their permitted modules.",
  },

  {
    id: "business",
    icon: Briefcase,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    border: "border-cyan-200 dark:border-cyan-800/40",
    title: "1. Businesses & Partnerships",
    subtitle: "Enterprise equity, partner continuity & operational handover",
    description:
      "Manage all corporate entities, partnership equity percentages, corporate bank credentials, operating licenses, and the critical 'If I Am Not Available' business continuity protocol.",
    steps: [
      {
        title: "Register Enterprise & Ownership Equity",
        detail:
          "Record company name, registration number, trade license, total valuation, your exact shareholding percentage, and capital invested.",
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
          "Step-by-step operating instructions detailing who assumes managerial control, where backup accounts reside, key vendor contacts, client commitments, and handover priorities.",
      },
      {
        title: "Attach Official Registration Documents",
        detail:
          "Upload or reference certificates of incorporation, memorandum of association, tax registration (TIN/BIN), and board resolutions.",
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
    whoCanAccess: "Super Admin, Owner, and users with the canViewBusiness permission.",
  },

  {
    id: "finance",
    icon: Wallet,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "2. Financial Care & Repayments",
    subtitle: "Financial care, monthly support, installment schedules & settlements",
    description:
      "A dedicated module for tracking financial care provided to relatives/friends, care received, monthly family commitments, installment repayment calendars, and signed settlement agreements.",
    steps: [
      {
        title: "Create Financial Support Record",
        detail:
          "Choose record type: Support Given (lent/family allowance) or Support Taken (borrowed). Specify beneficiary person, total principal amount, and purpose.",
      },
      {
        title: "Configure Repayment & Installment Schedule",
        detail:
          "Define payment terms: Lump sum or Monthly installments. Specify start date, installment amount, expected settlement date, and payment method (bKash, Bank, Cash).",
      },
      {
        title: "Log Installment Payments",
        detail:
          "Each time an installment is paid or received, record the date, amount, transaction reference, and optional receipt attachment. The remaining balance recalculates automatically.",
      },
      {
        title: "Monitor Overdue & Upcoming Alerts",
        detail:
          "The system automatically tracks due dates and tags overdue payments with prominent warning badges on your Dashboard and Finance lists.",
      },
      {
        title: "Attach Proof of Agreement",
        detail:
          "Upload promissory notes, cheques, signed stamps, or transfer receipts to ensure complete legal transparency.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "For recurrent monthly family support (e.g., parents or dependents), enable recurring status to track monthly disbursement history accurately.",
      },
      {
        type: "info",
        text: "Non-owner users who are granted financial access see a personalized summary showing their own obligations and transactions.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and users with the canViewFinancial permission.",
  },

  {
    id: "money",
    icon: Coins,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800/40",
    title: "3. Money Overview & Ledger",
    subtitle: "Receivables, payables, investments & net financial standing",
    description:
      "A consolidated double-entry ledger detailing all financial obligations: Money Given, Money Taken, Investments Made in ventures, External Capital Received, To Receive (due to you), and To Pay (owed to others).",
    steps: [
      {
        title: "Inspect Aggregate Financial Balances",
        detail:
          "Review the top stat cards: Total Given, Total Taken, Invested, Investment Received, Receivables, and Payables to see your live net liquidity standing.",
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
          "Every money record links directly to a person profile or business entity so you can see complete transaction history per counterparty.",
      },
    ],
    tips: [
      {
        type: "warning",
        text: "Keep every entry backed by a linked person in the People directory to prevent ambiguity regarding who owes or is owed money.",
      },
      {
        type: "tip",
        text: "Use the 'Detailed Financials' breakdown when reviewing estate net worth or planning debt settlements.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and users with the canViewFinancial permission.",
  },

  {
    id: "assets",
    icon: Layers,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    border: "border-indigo-200 dark:border-indigo-800/40",
    title: "4. Assets & Properties",
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
          "Clearly document where the original deeds, registration blue books, tax receipts, or keys are physically located (e.g., 'Almirah #2, Bank Safe Locker 4B').",
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
    whoCanAccess: "Super Admin, Owner, and users with canViewFinancial or canViewBusiness permissions.",
  },

  {
    id: "vault",
    icon: KeyRound,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800/40",
    title: "5. Secure Vault (AES-256)",
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
          "Provide account username/email, login URL, and the secret password or private key. Data is encrypted before saving to the database.",
      },
      {
        title: "Reveal Secret with Master PIN",
        detail:
          "To view or copy a secret, click the eye icon. Enter your 4-to-6 digit Master PIN. The secret unlocks temporarily with a live self-clearing countdown.",
      },
      {
        title: "Audit Trail Logging",
        detail:
          "Every reveal operation creates an immutable security log entry with timestamp, actor email, IP address, and item title.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "If you forget your Master PIN, vault secrets cannot be decrypted without administrative reset. Store your Master PIN securely in a physical offline location.",
      },
      {
        type: "warning",
        text: "Never share your Master PIN via WhatsApp, SMS, or unencrypted messaging channels.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and users with explicit canRevealVault permission.",
  },

  {
    id: "information",
    icon: FileText,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800/40",
    title: "6. Personal Information & Identity",
    subtitle: "National ID, passports, blood group, medical data & policies",
    description:
      "A centralized repository for identity records, official government IDs, health and medical directions, insurance policy numbers, and personal emergency directives.",
    steps: [
      {
        title: "National Identity & Passport Data",
        detail:
          "Record NID number, Smart Card ID, Passport number, expiry date, issuing authority, and birth certificate registration number.",
      },
      {
        title: "Health, Blood Group & Medical Directives",
        detail:
          "Save blood group, chronic conditions, ongoing medications, known severe allergies, and preferred emergency hospital/doctor.",
      },
      {
        title: "Life & Health Insurance Policies",
        detail:
          "Record insurance policy numbers, insurer company, sum assured, premium renewal dates, and emergency claim contact numbers.",
      },
      {
        title: "Personal Credentials & Tax Information",
        detail:
          "Keep e-TIN number, tax circle, driving license number, and utility account registration IDs readily accessible.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Keep digital photo copies of your NID and passport attached in the Critical Documents module for immediate access when traveling.",
      },
      {
        type: "info",
        text: "Medical emergency info can save precious time during unexpected hospitalizations.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and users with the canViewPersonal permission.",
  },

  {
    id: "people",
    icon: Users,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "7. People Directory & Team",
    subtitle: "Family, partners, key employees (Sabbir, Sana) & access roles",
    description:
      "Maintain the core directory of trusted people: Wife, Brother, Children, Parents, Business Partners, Key Employees (e.g., Sabbir, Sana), and Nominees. Assign granular module permissions and emergency delegation status.",
    steps: [
      {
        title: "Add Person Profile",
        detail:
          "Enter full name, relationship (Wife, Brother, Partner, Employee), phone number, email address, physical address, and emergency priority rank.",
      },
      {
        title: "Assign User Role & Account Type",
        detail:
          "Set role: Family Member, Business Partner, Responsible Person, Beneficiary, Trusted Guardian, or Administrator.",
      },
      {
        title: "Configure Granular Module Permissions",
        detail:
          "Grant specific checkboxes: canViewPersonal, canViewBusiness, canViewFinancial, canViewSensitive, canRevealVault, canManageAccess, canAccessEmergency.",
      },
      {
        title: "Set Guardian Status",
        detail:
          "Designate whether the person serves as an Emergency Guardian (Primary, Secondary, or Independent) for multi-party consensus unlocking.",
      },
      {
        title: "Manage Account Status",
        detail:
          "Easily set person status to Active, Temporarily Locked, or Archived to instantly revoke system access when roles change.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Only grant canRevealVault or canManageAccess to individuals with absolute trust. For employees like Sabbir or Sana, grant strictly the modules they need for business continuity.",
      },
      {
        type: "tip",
        text: "Linking a person's registered Clerk email allows them to sign into LIFE Vault and see their personalized portal view.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and users with canManageAccess or canViewPersonal permissions.",
  },

  {
    id: "contacts",
    icon: Contact,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800/40",
    title: "8. Important Contacts Directory",
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
          "Add context notes such as 'Handles land registration documents', 'Primary cardiologist', or 'Auditor for company tax filing'.",
      },
      {
        title: "One-Touch Emergency Actions",
        detail:
          "Use the direct Call, Message, or Email action buttons directly from mobile or desktop without copying numbers.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Ensure your family knows to refer to this list first if they ever need legal counsel, tax filings, or banking assistance on your behalf.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and users with the canViewPersonal permission.",
  },

  {
    id: "documents",
    icon: FolderLock,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    border: "border-purple-200 dark:border-purple-800/40",
    title: "9. Critical Documents Repository",
    subtitle: "Deeds, contracts, trade licenses, agreements & physical file tags",
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
          "Document the exact physical location where the original hardcopy is kept (e.g. 'Blue File Folder, Office Almirah Top Shelf').",
      },
      {
        title: "Upload Secure Digital Scan / Attachment",
        detail:
          "Attach PDF scans or high-resolution photos of the document for instant online preview and emergency verification.",
      },
      {
        title: "Link to Related People or Businesses",
        detail:
          "Associate the document with specific businesses, properties, or partners for contextual lookup across modules.",
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
    whoCanAccess: "Super Admin, Owner, and users with canViewPersonal or canViewSensitive permissions.",
  },

  {
    id: "instructions",
    icon: FileText,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800/40",
    title: "10. Responsibilities & Instructions",
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
          "Select the responsible individual from your People directory (e.g., Wife, Brother, Sabbir, Sana) so the instruction appears on their portal.",
      },
      {
        title: "Detail Step-by-Step Procedure",
        detail:
          "Write comprehensive, unambiguous instructions. Include specific account numbers, contacts to call, deadlines, and execution orders.",
      },
      {
        title: "Track Execution & Status",
        detail:
          "Monitor status: Active, In Progress, Completed, or On Hold. Assignees can view their responsibilities and update progress.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Be as specific as possible in your handover instructions. Step-by-step guides prevent confusion and disagreements during stressful transitions.",
      },
      {
        type: "info",
        text: "Non-owner assignees who sign in see their assigned instructions under 'Responsibilities' on their dashboard.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and assigned users with the canViewPersonal permission.",
  },

  {
    id: "beneficiaries",
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
          "Assign specific assets (Properties, Bank Accounts, Shares) and allocate percentage shares for each beneficiary according to your wishes.",
      },
      {
        title: "Attach Nominee Declarations",
        detail:
          "Document official bank nominee forms, company share transfer declarations, or notarized gift deeds.",
      },
      {
        title: "Link Legacy Letters",
        detail:
          "Connect personalized legacy letters and audio messages directly to the intended beneficiary for private delivery.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Ensure allocation percentages across each asset or company total 100% to avoid estate ambiguity.",
      },
      {
        type: "security",
        text: "Beneficiary details are confidential and accessible only to the Owner and authorized legal delegates.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and users with canViewFinancial or canViewPersonal permissions.",
  },

  {
    id: "legacy",
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
          "Review the message preview, save, and seal. The system securely encrypts the content until the release protocol fires.",
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
    whoCanAccess: "Owner creates and manages all messages. Designated recipients receive access upon verified release.",
  },

  {
    id: "guardians",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800/40",
    title: "13. Trusted Guardians & Emergency Protocol",
    subtitle: "Multi-party consensus, countdown grace period & emergency unlocking",
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
          "Set the approval threshold (e.g., 2 of 3 guardians must confirm). A single rogue guardian cannot trigger emergency mode unilaterally.",
      },
      {
        title: "Set Countdown Grace Period",
        detail:
          "Specify the safety cancellation window (e.g. 24, 48, or 72 hours). When guardians initiate an emergency request, the Owner receives instant alerts and can cancel with a single tap if it was a false alarm.",
      },
      {
        title: "Emergency Activation & Dynamic Elevation",
        detail:
          "If the countdown expires without owner cancellation, Emergency Mode activates. Permitted continuity instructions, designated vault secrets, and emergency directives unlock for designated delegates.",
      },
      {
        title: "Owner One-Tap Normalization",
        detail:
          "The Owner can deactivate Emergency Mode at any time, instantly locking emergency access and restoring normal operation.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Multi-party consensus (e.g., requiring both Wife AND Brother to approve) prevents unilateral hostile takeover or accidental unlocking.",
      },
      {
        type: "warning",
        text: "Always inform your appointed guardians about their role and verify that their phone numbers and emails are kept updated.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and appointed Guardians (canAccessEmergency).",
  },

  {
    id: "permissions",
    icon: ShieldCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "14. Access Control & Permission Rules",
    subtitle: "Super admin privileges, user module filtering & route protection",
    description:
      "LIFE enforces strict role-based access control (RBAC). The core principle is: Only Super Admin / Owner sees all modules. Other users only see and access the modules they have been explicitly granted permission to view.",
    steps: [
      {
        title: "Super Admin & Owner Role",
        detail:
          "The Owner / Super Admin has unrestricted access to all 13 modules, full system settings, security logs, financial balances, and user permission management.",
      },
      {
        title: "Module Permission Flags",
        detail:
          "Assign specific permission flags to people: canViewPersonal, canViewBusiness, canViewFinancial, canViewSensitive, canRevealVault, canManageAccess, and canAccessEmergency.",
      },
      {
        title: "Automatic UI Navigation Filtering",
        detail:
          "The desktop Sidebar, mobile Bottom Navigation bar, and 'More' drawer automatically filter out all modules the user lacks permission for. Empty sections are completely hidden.",
      },
      {
        title: "Personalized Dashboard Views",
        detail:
          "Non-admin users see an 'Authorized Access Portal' displaying only their permitted directory cards, action buttons, and assigned responsibilities. Financial figures and secrets are hidden.",
      },
      {
        title: "Server-Side Route Protection",
        detail:
          "Direct browser URL navigation is enforced on the server. If an unauthorized user attempts to open a restricted route (e.g. /vault or /finance), they are automatically redirected to the home screen.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Follow the principle of least privilege: assign employees and external partners only the exact modules they need for business continuity.",
      },
      {
        type: "tip",
        text: "You can modify or revoke a person's permissions instantly from the People directory or Access management screen.",
      },
    ],
    whoCanAccess: "Super Admin and Owner exclusively manage permissions for all other users.",
  },

  {
    id: "activity",
    icon: History,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    border: "border-violet-200 dark:border-violet-800/40",
    title: "15. Security Audit & Activity Log",
    subtitle: "Real-time security logs, secret reveal tracking & tamper evidence",
    description:
      "A complete, tamper-evident audit log of every meaningful action inside LIFE Vault. Logs cannot be modified or deleted. Provides full transparency into who accessed what and when.",
    steps: [
      {
        title: "Automatic System Logging",
        detail:
          "Every user sign-in, vault secret reveal, financial update, document download, permission change, and emergency mode event is automatically recorded.",
      },
      {
        title: "Detailed Event Metadata",
        detail:
          "Each log entry includes timestamp, actor email, actor name, action category, affected item/entity, and status.",
      },
      {
        title: "Filter by Activity Type",
        detail:
          "Filter by categories: Vault Reveals, Authentication, Financial Records, Continuity Changes, Emergency State, and Access Edits.",
      },
      {
        title: "Security Incident Review",
        detail:
          "If unexpected behavior or an unauthorized sign-in attempt occurs, review the audit log immediately to identify the actor and timestamp.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Review the Activity Log periodically to verify that vault secret reveals correspond only to authorized operations.",
      },
      {
        type: "info",
        text: "Log entries are stored permanently in the database and cannot be cleared by standard users.",
      },
    ],
    whoCanAccess: "Super Admin, Owner, and administrators with canManageAccess permission.",
  },

  {
    id: "settings",
    icon: Settings,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/50",
    border: "border-slate-200 dark:border-slate-800/40",
    title: "16. System Settings, Master PIN & PWA",
    subtitle: "Master PIN configuration, encrypted backup & mobile installation",
    description:
      "Manage security parameters, configure your Master PIN for vault reveals, export encrypted offline backups, and install LIFE Vault as a native Progressive Web App (PWA) on iPhone and Android.",
    steps: [
      {
        title: "Configure / Change Master PIN",
        detail:
          "Set a strong 4-to-6 digit Master PIN. The PIN is required whenever revealing encrypted vault secrets or modifying high-security emergency settings.",
      },
      {
        title: "Export Complete Encrypted Backup",
        detail:
          "Download a full JSON snapshot of your entire database — people, businesses, financial records, assets, encrypted vault ciphertexts, and legacy messages — for cold offline storage.",
      },
      {
        title: "Install as Mobile PWA",
        detail:
          "On iPhone: open Safari, tap the Share icon, and select 'Add to Home Screen'. On Android: tap the browser menu and select 'Install App'. Enjoys fullscreen native mobile experience.",
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
        text: "Installing LIFE Vault as a PWA gives you fast one-tap access from your phone's home screen with biometric unlocking.",
      },
    ],
    whoCanAccess: "Owner only for Master PIN and backup exports. Admins for general settings.",
  },
];

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const tipIconMap = {
  tip: {
    icon: Zap,
    label: "Tip",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
  },
  info: {
    icon: Info,
    label: "Note",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
  },
  security: {
    icon: Shield,
    label: "Security",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-300",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function UserGuideClient() {
  const [activeId, setActiveId] = useState<string>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const activeIndex = sections.findIndex((s) => s.id === activeId);
  const active = sections[activeIndex >= 0 ? activeIndex : 0];
  const ActiveIcon = active.icon;

  const prevSection = activeIndex > 0 ? sections[activeIndex - 1] : null;
  const nextSection = activeIndex < sections.length - 1 ? sections[activeIndex + 1] : null;

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
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {activeIndex + 1}/{sections.length}
          </span>
        </div>

        {/* Section List */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Guide modules">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            const isActive = section.id === activeId;
            return (
              <button
                key={section.id}
                onClick={() => selectSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium group relative
                  ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-500" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground/70 group-hover:text-foreground"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="truncate flex-1">{section.title}</span>
                <span
                  className={`text-[10px] font-mono shrink-0 ${
                    isActive ? "text-emerald-500 font-bold" : "text-muted-foreground/50"
                  }`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Hint */}
        <div className="shrink-0 p-3 m-2 rounded-xl bg-muted/40 border border-border/80 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground/80 mb-0.5">Permission Notice</p>
          <p className="leading-relaxed text-[10px]">
            Super Admin sees all modules. Other users only see modules granted in their access profile.
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
            <span className="max-w-[140px] truncate text-left">{active.title}</span>
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-background/80 border border-border/60">
              {activeIndex + 1}/{sections.length}
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
                  <ActiveIcon className={`w-6 h-6 sm:w-7 sm:h-7 ${active.color}`} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p className={`text-xs font-bold uppercase tracking-wider ${active.color}`}>
                      {active.subtitle}
                    </p>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-background/80 border border-border text-muted-foreground">
                      Module {activeIndex + 1} of {sections.length}
                    </span>
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
                <UserCheck className="w-4 h-4 shrink-0 text-emerald-500" strokeWidth={2} />
                <span className="truncate">
                  <strong className="text-foreground/90 font-semibold">Who Can Access:</strong>{" "}
                  {active.whoCanAccess}
                </span>
              </div>
            </div>

            {/* Steps: How to use it */}
            <section aria-labelledby="steps-heading" className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  id="steps-heading"
                  className="text-xs sm:text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
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
            <section aria-labelledby="tips-heading" className="space-y-3 sm:space-y-4">
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
                        <TipIcon className={`w-4 h-4 shrink-0 ${tipConfig.color}`} strokeWidth={2} />
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
                <span className="font-bold text-sm text-foreground">Topics</span>
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
            <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Mobile guide topics">
              {sections.map((section, idx) => {
                const Icon = section.icon;
                const isActive = section.id === activeId;
                return (
                  <button
                    key={section.id}
                    onClick={() => selectSection(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium
                      ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground/70"
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className="truncate flex-1">{section.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </button>
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
