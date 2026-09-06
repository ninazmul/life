"use client";

import { useState } from "react";
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
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Shield,
  UserCheck,
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
    title: "Home Dashboard",
    subtitle: "Your command center overview",
    description:
      "The Dashboard is the first screen you see after signing in. It gives you an instant financial snapshot, alerts you to anything needing your attention, and provides quick-action shortcuts to the most common tasks.",
    steps: [
      {
        title: "Financial Summary Cards",
        detail:
          "The top row shows Total Given (money you lent), Total Taken (money you borrowed), and your Net Balance. These numbers update live from your Money records.",
      },
      {
        title: "Continuity Status",
        detail:
          "A prominent indicator shows whether Emergency Mode is Active or Standby. If active, a red badge appears throughout the app. Tap it to go to the Access & Emergency page.",
      },
      {
        title: "Attention Items",
        detail:
          "Cards highlighting overdue repayments, high-priority emergency notes, and incomplete continuity steps that need your action.",
      },
      {
        title: "Quick Actions",
        detail:
          "Floating shortcut buttons let you immediately: Add a Person, Record Money, Save a Vault Secret, or Write a Note — without navigating away.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Use the Dashboard as your daily 30-second health check — if everything looks green, you're covered.",
      },
      {
        type: "info",
        text: "Numbers are computed on the server each load, so they always reflect the latest database state.",
      },
    ],
    whoCanAccess: "Owner & Admins — full view. Others see delegated summaries.",
  },
  {
    id: "people",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800/40",
    title: "People Directory",
    subtitle: "Relationship profiles and dossiers",
    description:
      "The People module is the heart of LIFE. Every important person in your life — family, business partners, advisors, engineers — gets a detailed profile linked to your financial, business, and legacy records.",
    steps: [
      {
        title: "Browse & Filter",
        detail:
          "View all people at a glance. Filter by relation (Wife, Brother, Partner, Engineer…) or status (Active, Locked, Archived). Use global search (⌘K) to find anyone instantly.",
      },
      {
        title: "Create a Person Profile",
        detail:
          "Tap + Add Person and fill in: Name, Relation, Phone, WhatsApp, Email, and Role. The Role determines what they can see if they ever sign in.",
      },
      {
        title: "Open the 8-Tab Dossier",
        detail:
          "Click any person card to open their full profile with 8 tabs: Overview · Personal Message · Financial · Documents · Contacts · Responsibilities · Business Instructions · Access Rules.",
      },
      {
        title: "Personal Message Tab",
        detail:
          "Write a private letter or memo dedicated exclusively to this person — things you want them to know but only you can see unless you choose to share.",
      },
      {
        title: "Responsibilities Tab",
        detail:
          "List the specific tasks this person must handle if you are unavailable (e.g. 'Pay the server bills', 'Contact the lawyer', 'Manage the shop').",
      },
      {
        title: "Access Rules Tab",
        detail:
          "Control exactly what this person sees if they authenticate: toggle Personal Records, Business Records, Financial Data, Sensitive Files, Vault Reveals, and Emergency Access independently.",
      },
      {
        title: "Lock or Archive",
        detail:
          "Set status to Locked to immediately block their access without deleting their profile. Set Archived to hide them from normal views.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Add every key person — even if they never sign in. Their profile links to money records, legacy messages, and continuity steps.",
      },
      {
        type: "warning",
        text: "Setting a person's status to Locked immediately blocks their login the next time they try to authenticate.",
      },
      {
        type: "security",
        text: "Roles are enforced server-side. Changing the Access Rules tab for a person takes effect on their next page load.",
      },
    ],
    whoCanAccess: "Owner & Admins — full control. Individuals see only their own profile.",
  },
  {
    id: "money",
    icon: Wallet,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800/40",
    title: "Money & Debt Ledger",
    subtitle: "Track every receivable, payable, and investment",
    description:
      "The Money module is a structured personal ledger that tracks every financial relationship — money you gave, money you took, investments you made, and capital partners invested in you. It also handles full and partial settlements.",
    steps: [
      {
        title: "Choose a Record Type",
        detail:
          "There are 4 types: Given (you lent money — receivable), Taken (you borrowed — payable), Invest Made (you invested in someone), Invest Received (someone invested in you).",
      },
      {
        title: "Add a Money Record",
        detail:
          "Tap + Record Money, choose the type, link to a Person, enter amount, date, due date, and any notes on terms or interest. Hit Save.",
      },
      {
        title: "Track Status",
        detail:
          "Each record shows status: Active (still owed), Partially Returned, Returned (fully settled), Written Off. The status updates automatically as you log settlements.",
      },
      {
        title: "Log a Settlement",
        detail:
          "Tap Settle on any active record. Enter the payment amount, date, payment method (Bank, Cash, bKash, Cheque), and a reference number. The returned amount and status update instantly.",
      },
      {
        title: "View Summary Cards",
        detail:
          "The header shows your total Receivables (money owed to you), Payables (money you owe), Active Investments, and your Net Cashflow Balance.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Always link a record to a Person profile so your financial data appears in their 8-tab dossier automatically.",
      },
      {
        type: "info",
        text: "Partial settlements are logged in a separate history — you can see every installment payment individually.",
      },
      {
        type: "warning",
        text: "Written Off records are excluded from balance calculations but kept for historical reference.",
      },
    ],
    whoCanAccess: "Owner & Admins — full ledger. Others see only delegated records.",
  },
  {
    id: "vault",
    icon: KeyRound,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    border: "border-violet-200 dark:border-violet-800/40",
    title: "Encrypted Secrets Vault",
    subtitle: "AES-256-GCM encrypted credentials storage",
    description:
      "The Vault stores your most sensitive secrets — passwords, server keys, bank PINs, WiFi passwords, seed phrases — encrypted with military-grade AES-256-GCM. Secrets are never visible in list views. Decrypting requires entering your Master Security PIN.",
    steps: [
      {
        title: "Browse Vault Items",
        detail:
          "All items show title, category, and username — but the actual secret is masked as ••••••••. Filter by category: Credentials, Infrastructure, Financial, Personal, Emergency.",
      },
      {
        title: "Add a Vault Item",
        detail:
          "Tap + Add Secret, choose category, enter title, username/email, the secret value, and an optional URL and notes. The secret is encrypted before it leaves your browser.",
      },
      {
        title: "Reveal a Secret",
        detail:
          "Tap Reveal on any item. A modal appears asking for your Master Security PIN. Enter it correctly and the decrypted secret appears.",
      },
      {
        title: "30-Second Auto-Conceal",
        detail:
          "Once revealed, a countdown timer shows 30 seconds. When it reaches zero, the secret is automatically wiped from the screen. You must re-enter your PIN to reveal again.",
      },
      {
        title: "Copy & Use",
        detail:
          "While revealed, tap the Copy icon to copy the secret to your clipboard. The clipboard entry is not cleared automatically — close the tab after use on shared devices.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "Every single secret reveal is permanently logged in the Activity Audit with your identity and timestamp. There is no silent access.",
      },
      {
        type: "security",
        text: "Secrets are encrypted with a unique IV per item. Even if the database were compromised, individual secrets remain cryptographically protected.",
      },
      {
        type: "warning",
        text: "If you forget your Master PIN, there is no recovery path — encrypted secrets cannot be decrypted without it. Store your PIN safely.",
      },
      {
        type: "tip",
        text: "Mark critical credentials (hosting root, domain registrar) as Emergency type so they surface first during a crisis.",
      },
    ],
    whoCanAccess: "Owner & Admins with canRevealVault permission only.",
  },
  {
    id: "information",
    icon: FileText,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/50",
    border: "border-teal-200 dark:border-teal-800/40",
    title: "Information & Notes",
    subtitle: "Categorized notes, instructions, and emergency data",
    description:
      "Information & Notes is your structured knowledge base. Write personal memos, critical operational instructions, emergency protocols, and business notes — each with a priority level and visibility state.",
    steps: [
      {
        title: "Categories",
        detail:
          "Notes belong to one of 5 categories: Personal, Business, Instruction, Emergency, Other. Filter the list by category to focus on what you need.",
      },
      {
        title: "Priority Levels",
        detail:
          "Set Low, Medium, High, or Critical priority. Critical notes appear at the top and are highlighted with a red chip.",
      },
      {
        title: "Visibility States",
        detail:
          "Control who can see a note: Visible Now (everyone with access), Hidden (only you), Admin Can Release (only visible when an admin unlocks), Emergency Only (visible only during Emergency Mode), Scheduled Release (visible after a date).",
      },
      {
        title: "Create a Note",
        detail:
          "Tap + Add Note, choose category and priority, write title and content, set visibility, and optionally link to a Person or Business. Save.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Use Emergency category + Emergency Only visibility for notes your family should only read in a crisis — e.g. bank account locations, safe combinations.",
      },
      {
        type: "info",
        text: "Notes marked Instruction are ideal for step-by-step procedures like 'How to renew the domain' or 'Monthly supplier payment process'.",
      },
    ],
    whoCanAccess: "Owner & Admins — full view. Others see notes based on visibility settings.",
  },
  {
    id: "business",
    icon: Briefcase,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    border: "border-orange-200 dark:border-orange-800/40",
    title: "Business & Continuity",
    subtitle: '"If I Am Not Available" engine',
    description:
      'The Business module catalogs your ventures and — critically — defines what happens to each one if you are suddenly unavailable. The "If I Am Not Available" checklist is the operational continuity playbook for your partners and family.',
    steps: [
      {
        title: "Add a Business Venture",
        detail:
          "Tap + Add Business, enter name, legal name, your ownership %, status, and partner details. Each partner can be linked to a Person profile.",
      },
      {
        title: "Server & Infrastructure Info",
        detail:
          "Record hosting provider, server IP, control panel URL, server type, and the primary System Engineer contact (name, phone, email). This ensures someone can keep servers running without you.",
      },
      {
        title: "Build the Continuity Checklist",
        detail:
          "Under each business, add ordered continuity steps. Each step has: a title, description, responsible person, their contact phone, and specific instructions. Example: Step 1 — 'Call Rafiq (engineer) to keep servers online. Phone: 017XXXXXXXX'.",
      },
      {
        title: "Mark Steps Complete",
        detail:
          "During an emergency, trustees can mark each step as complete directly in the app, giving a live progress view of the continuity process.",
      },
    ],
    tips: [
      {
        type: "warning",
        text: "Without a continuity plan, your business can fail within days of an emergency. Fill this in as a priority.",
      },
      {
        type: "tip",
        text: "Link each continuity step to a Person profile — so the responsible person's phone is pre-filled and reachable in 1 tap.",
      },
      {
        type: "info",
        text: "Expense and receivables fields on the business card give trustees an instant picture of the financial health of the venture.",
      },
    ],
    whoCanAccess: "Owner & Admins — full control. Business role sees assigned ventures only.",
  },
  {
    id: "assets",
    icon: Layers,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    border: "border-cyan-200 dark:border-cyan-800/40",
    title: "Assets Portfolio",
    subtitle: "Real estate, bank deposits, valuables and equity",
    description:
      "Document everything you own — properties, bank balances, vehicles, gold, and business equity — with ownership percentages and valuations so trustees have an accurate picture of the estate.",
    steps: [
      {
        title: "Asset Categories",
        detail:
          "Real Estate, Financial / Bank, Vehicle, Valuables / Gold, Business Equity, Other. Filter by category to focus on specific asset classes.",
      },
      {
        title: "Add an Asset",
        detail:
          "Enter name, category, current estimated value, your ownership % (e.g. 50% if jointly owned), physical location or bank branch, and an account/registration number.",
      },
      {
        title: "Total Portfolio View",
        detail:
          "The header shows total estimated portfolio value, weighted by your ownership percentage across all assets.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Link title deeds and ownership documents in the Documents module, then cross-reference here for a complete asset record.",
      },
      {
        type: "info",
        text: "For jointly owned property, record your % ownership accurately — this helps trustees and lawyers during inheritance proceedings.",
      },
    ],
    whoCanAccess: "Owner & Admins. Others see only during active Emergency Mode (if granted).",
  },
  {
    id: "contacts",
    icon: Contact,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800/40",
    title: "Contact Directory",
    subtitle: "Emergency contacts with 1-tap direct action",
    description:
      "A fast-access directory of every critical contact — family, lawyers, doctors, engineers, suppliers — with 1-tap calling, WhatsApp, and email buttons. Built for emergencies when every second matters.",
    steps: [
      {
        title: "Contact Categories",
        detail:
          "Family, Legal (lawyers), Medical (doctors), Technical (engineers), Financial (accountants), Suppliers, Emergency Services, Other.",
      },
      {
        title: "Emergency Priority Ranking",
        detail:
          "Set Priority 1, 2, 3 on each contact. Priority 1 contacts appear at the top and are the first people to call in a crisis.",
      },
      {
        title: "1-Tap Actions",
        detail:
          "Each card shows: Call (opens tel: dialer), WhatsApp (opens wa.me chat), Email (opens mailto:), and Copy Phone. No need to memorize or navigate away.",
      },
      {
        title: "Add a Contact",
        detail:
          "Tap + Add Contact, enter name, category, role/relation, phone numbers, email, priority ranking, and notes. Optionally link to a Person profile.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Add your lawyer, doctor, and primary engineer as Priority 1 — these are the people who must be reached first in any emergency.",
      },
      {
        type: "info",
        text: "Emergency contacts are visible to all authenticated users regardless of their permission level, since they may need to call during a crisis.",
      },
    ],
    whoCanAccess: "All authenticated users can view emergency contacts. Full management requires Admin.",
  },
  {
    id: "documents",
    icon: FolderLock,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    border: "border-indigo-200 dark:border-indigo-800/40",
    title: "Documents Library",
    subtitle: "Private deeds, contracts, and certificates",
    description:
      "Store references and links to your most critical documents — title deeds, wills, company incorporation papers, insurance policies, tax certificates, and agreements — organized by category and access tier.",
    steps: [
      {
        title: "Document Categories",
        detail:
          "Legal, Property, Financial, Identity, Insurance, Business, Medical, Personal, Other.",
      },
      {
        title: "Access Tiers",
        detail:
          "Standard (visible to all authorized users), Confidential (Admin-only), Emergency Only (only visible when Emergency Mode is active).",
      },
      {
        title: "Add a Document",
        detail:
          "Enter title, category, access tier, a file URL (cloud storage link), description, and optionally link to a Person or Business. The app stores references — actual files should be in secure cloud storage.",
      },
      {
        title: "Link to People & Businesses",
        detail:
          "Documents linked to a Person appear in their 8-tab dossier automatically, giving trustees a complete per-person document view.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "LIFE stores document metadata and links — not raw files. Keep actual files in an encrypted cloud vault (iCloud, encrypted Google Drive, etc.).",
      },
      {
        type: "tip",
        text: "Mark your Will and Insurance policy as Emergency Only — they surface immediately when Emergency Mode is activated.",
      },
    ],
    whoCanAccess: "Owner & Admins — full access. Others see documents matching their tier.",
  },
  {
    id: "legacy",
    icon: HeartHandshake,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    border: "border-rose-200 dark:border-rose-800/40",
    title: "Legacy Messages",
    subtitle: "Sealed farewell letters and last instructions",
    description:
      "Legacy Messages are private letters, voice memos (linked), or detailed instructions you write for specific loved ones or partners — sealed and only unlocked under the conditions you define.",
    steps: [
      {
        title: "Write a Legacy Message",
        detail:
          "Tap + New Message, choose the recipient (from your People directory), write the title and full content, and set a release condition.",
      },
      {
        title: "Release Conditions",
        detail:
          "Emergency Only: Unlocked when Emergency Mode is activated. Admin Can Release: An Admin manually unseals it. Scheduled Release: Unlocks after a specific future date. Released: Already open for the recipient.",
      },
      {
        title: "Read a Released Letter",
        detail:
          "When a letter is released and the recipient is authenticated, they see it in an immersive distraction-free reader with your name, date, and full message.",
      },
      {
        title: "Seal and Unseal",
        detail:
          "As the Owner or Admin, you can manually release any message at any time from the Legacy list — or re-seal it if needed.",
      },
    ],
    tips: [
      {
        type: "tip",
        text: "Write at least one message for each key family member — even if it's a short note saying where important things are.",
      },
      {
        type: "warning",
        text: "Messages marked Emergency Only are automatically visible to recipients the moment Emergency Mode is activated — no additional action required.",
      },
      {
        type: "info",
        text: "You can write business instruction letters too — e.g. to your business partner explaining what to do if you can no longer manage the venture.",
      },
    ],
    whoCanAccess: "Owner & Admins write. Recipients see only their own released messages.",
  },
  {
    id: "access",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    border: "border-red-200 dark:border-red-800/40",
    title: "Access & Emergency",
    subtitle: "Delegate control and activate emergency protocols",
    description:
      "The Access module is the control room for trust and crisis management. From here you designate primary and secondary trustees, manage granular per-user permissions, and trigger Emergency Mode.",
    steps: [
      {
        title: "Emergency Mode Switch",
        detail:
          "The large Emergency Mode button is the master trigger. When activated: legacy letters marked Emergency Only unlock, business continuity checklists go prominent, and designated trustees receive elevated access.",
      },
      {
        title: "Designate Primary & Secondary Admins",
        detail:
          "Set one Primary Admin (your most trusted person, e.g. spouse or senior partner) and one Secondary Admin (backup). They gain Admin-level access when Emergency Mode is active.",
      },
      {
        title: "Per-User Permissions Grid",
        detail:
          "For each person in your directory, toggle individual permissions: View Personal Records, View Business Records, View Financial Data, View Sensitive Files, Reveal Vault Secrets, Manage Access, Access Emergency Protocols.",
      },
      {
        title: "Deactivating Emergency Mode",
        detail:
          "Emergency Mode can be deactivated by the Owner or an Admin. All emergency-gated content returns to sealed state immediately.",
      },
    ],
    tips: [
      {
        type: "warning",
        text: "Activating Emergency Mode is a significant action — it immediately exposes sealed legacy letters and continuity plans to your designated trustees.",
      },
      {
        type: "security",
        text: "Every Emergency Mode activation and deactivation is permanently logged in the Activity Audit with timestamp and actor identity.",
      },
      {
        type: "tip",
        text: "Review and update your trustee delegation at least once a year — life circumstances change.",
      },
    ],
    whoCanAccess: "Owner & Admins only. The Emergency Mode switch is Owner-exclusive.",
  },
  {
    id: "activity",
    icon: History,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-900/50",
    border: "border-slate-200 dark:border-slate-700/40",
    title: "Activity & Audit Trail",
    subtitle: "Tamper-evident security timeline",
    description:
      "Every critical action in LIFE — vault reveals, emergency activations, money creations, access changes — is permanently recorded in the Activity Audit with actor identity, timestamp, and action details. It cannot be edited or deleted.",
    steps: [
      {
        title: "Timeline View",
        detail:
          "Scroll through a reverse-chronological feed of all system events. Each entry shows: who did it, what they did, which resource was affected, and when.",
      },
      {
        title: "Filter by Action Type",
        detail:
          "Filter the timeline by event type: Vault Reveal, Emergency, Money, Access Changed, Person Modified, Settings, or All.",
      },
      {
        title: "What Gets Logged",
        detail:
          "Vault secret revealed (with viewer identity), Emergency Mode on/off, Money record created/settled, Person locked/unlocked, Access permissions changed, Master PIN changed, Settings updated.",
      },
    ],
    tips: [
      {
        type: "security",
        text: "The audit log is append-only and cannot be modified by anyone, including the Owner. This is by design — it ensures accountability.",
      },
      {
        type: "info",
        text: "Review the audit log periodically to verify no unauthorized vault reveals or access changes have occurred.",
      },
    ],
    whoCanAccess: "Owner & Admins see all logs. Others see only their own actions.",
  },
  {
    id: "settings",
    icon: Settings,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800/40",
    title: "Settings & Backup",
    subtitle: "Master PIN, PWA status, and encrypted backup",
    description:
      "Settings lets you configure your Master Security PIN (required for all vault reveals), check your PWA installation health, and export a full encrypted backup of your entire LIFE database.",
    steps: [
      {
        title: "Set or Change Master PIN",
        detail:
          "Your Master Security PIN protects all vault secret reveals. It must be 4–6 digits. Go to Settings → Master PIN → Set PIN. You will need to enter your current PIN to change it.",
      },
      {
        title: "PWA Installation Status",
        detail:
          "A panel shows whether LIFE is installed as a standalone PWA on this device, and whether the Service Worker (zero-cache security) is active. If the SW is not registered, sensitive routes may not be protected from caching.",
      },
      {
        title: "Export Encrypted Backup",
        detail:
          "Tap Export System Backup to download a complete JSON snapshot of your LIFE data — all people, money, assets, businesses, vault ciphertexts, and legacy messages. Store this file in an encrypted offline location.",
      },
    ],
    tips: [
      {
        type: "warning",
        text: "If you forget your Master PIN, vault secrets CANNOT be recovered. There is no bypass. Store your PIN in a physical safe or a trusted offline location.",
      },
      {
        type: "tip",
        text: "Run an encrypted backup at least monthly, or after any major update to your data.",
      },
      {
        type: "security",
        text: "The backup file contains vault ciphertext (not plaintext) — it is only useful with the original LIFE_VAULT_ENCRYPTION_KEY environment variable.",
      },
    ],
    whoCanAccess: "Owner only for PIN changes. Admin for read-only settings view.",
  },
];

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const tipIconMap = {
  tip: { icon: Zap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40" },
  warning: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40" },
  info: { icon: Info, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40" },
  security: { icon: Shield, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function UserGuideClient() {
  const [activeId, setActiveId] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const ActiveIcon = active.icon;

  return (
    <div className="flex min-h-[calc(100dvh-57px)] bg-background">
      {/* ── Sidebar Nav ── */}
      <aside
        className={`shrink-0 border-r border-border bg-card/80 backdrop-blur-sm overflow-y-auto transition-all duration-300
          ${sidebarOpen ? "w-64" : "w-14 md:w-64"}
          hidden sm:flex flex-col`}
      >
        {/* Sidebar header */}
        <div className="sticky top-0 bg-card/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-2.5 z-10">
          <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
          <span className="font-bold text-sm text-foreground hidden md:block tracking-tight">
            User Guide
          </span>
        </div>

        <nav className="p-2 space-y-0.5" aria-label="Guide sections">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeId;
            return (
              <button
                key={section.id}
                onClick={() => setActiveId(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-xs font-medium group
                  ${isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-500" : "text-muted-foreground/60 group-hover:text-foreground"}`}
                  strokeWidth={2}
                />
                <span className="hidden md:block truncate">{section.title}</span>
                {isActive && (
                  <span className="hidden md:block ml-auto">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom hint */}
        <div className="hidden md:block mt-auto p-3 m-2 rounded-xl bg-muted/50 border border-border text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground/70 mb-1">Need more help?</p>
          <p className="leading-relaxed">
            Check the technical docs or contact your system administrator.
          </p>
        </div>
      </aside>

      {/* ── Mobile section picker ── */}
      <div className="sm:hidden w-full border-b border-border bg-card sticky top-0 z-20 px-3 py-2 overflow-x-auto flex gap-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              onClick={() => setActiveId(section.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 border transition-all
                ${isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span>{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto" id="guide-content">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Section Header */}
          <div className={`rounded-2xl border p-6 ${active.bg} ${active.border}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${active.bg} ${active.border}`}>
                <ActiveIcon className={`w-6 h-6 ${active.color}`} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${active.color}`}>
                  {active.subtitle}
                </p>
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {active.title}
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {active.description}
                </p>
              </div>
            </div>

            {/* Who can access */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-background/60 rounded-xl px-3 py-2 border border-border/50">
              <UserCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" strokeWidth={2} />
              <span><strong className="text-foreground/80">Access:</strong> {active.whoCanAccess}</span>
            </div>
          </div>

          {/* Step-by-step */}
          <section aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
              How to use it
            </h2>
            <div className="space-y-3">
              {active.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-card border border-border hover:border-muted-foreground/20 transition-colors"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-extrabold text-foreground/60 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-1">{step.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tips, Warnings, Security Notes */}
          <section aria-labelledby="tips-heading">
            <h2 id="tips-heading" className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" strokeWidth={2} />
              Tips & Important Notes
            </h2>
            <div className="space-y-3">
              {active.tips.map((tip, i) => {
                const { icon: TipIcon, color, bg } = tipIconMap[tip.type];
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-xs leading-relaxed ${bg}`}
                  >
                    <TipIcon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} strokeWidth={2} />
                    <p className="text-foreground/80">{tip.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Navigation between sections */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {(() => {
              const idx = sections.findIndex((s) => s.id === activeId);
              const prev = sections[idx - 1];
              const next = sections[idx + 1];
              return (
                <>
                  <button
                    onClick={() => prev && setActiveId(prev.id)}
                    disabled={!prev}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    {prev ? prev.title : ""}
                  </button>
                  <span className="text-[11px] text-muted-foreground/50 font-mono">
                    {sections.findIndex((s) => s.id === activeId) + 1} / {sections.length}
                  </span>
                  <button
                    onClick={() => next && setActiveId(next.id)}
                    disabled={!next}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {next ? next.title : ""}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
