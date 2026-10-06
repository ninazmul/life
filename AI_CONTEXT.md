# 🌿 LIFE — AI Context & Architecture Reference

> **Quick Context for AI Agents**: This file contains the complete system architecture, data models, security protocols, routing, coding conventions, and developer rules for the **LIFE** codebase.
> **DO NOT** spend tokens scanning the entire 60KB documentation or 32 Mongoose models. Use this document as your single source of truth.

---

## 1. Executive Summary & Purpose

- **Application Name**: LIFE (Personal Legacy, Secure Information, Financial Care & Business Continuity)
- **Repository Type**: Next.js 16 Progressive Web App (PWA)
- **Target User**: The Owner, their immediate family, appointed trustees/guardians, and key business partners.
- **Core Problem Solved**: Eliminates catastrophic single-point-of-failure if something happens to the owner (incapacity, emergency, or death). Keeps a military-grade encrypted inventory of personal assets, debts, credentials, server infrastructure, medical records, and operational handover protocols.
- **PWA Feel**: Installable, mobile-first with native-like gestures (`LifeBottomNav`, `LifeHeader`, `LifeSidebar`), glassmorphism, responsive across mobile, tablet, and desktop.
- **Security Posture**: Zero-cache Service Worker, AES-256-GCM vault encryption, scrypt-hashed Master PIN gate, multi-party guardian consensus, and immutable security audit logs.

---

## 2. Technology Stack & Runtime Constraints

| Component | Technology / Version | Notes & Constraints |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.3.4 (App Router)** | Strict App Router. Uses Turbopack (`next dev --turbopack`). |
| **Frontend** | **React 19.0.0** | Server Components by default; add `'use client'` for interactive UI. |
| **Language** | **TypeScript 5 (Strict)** | End-to-end typing. Universal types defined in `types/index.ts`. No `any`. |
| **Database** | **MongoDB + Mongoose 8.24** | Connection pooling via `lib/database/index.ts`. Soft-delete plugin enabled. |
| **Authentication** | **Clerk (`@clerk/nextjs` 6.39)** | Server auth is **async**: `const { userId } = await auth();`. |
| **Styling** | **Tailwind CSS 3.4** | Configured in `tailwind.config.ts` and `app/globals.css`. Uses Radix UI primitives. |
| **Icons & UI** | **Lucide React + Radix UI** | Dialog, Dropdown, Tabs, Tooltip, Select, Label, Slot from `@radix-ui/*`. |
| **Form Handling** | **React Hook Form + Zod** | Schema validation using `zod` and `@hookform/resolvers/zod`. |
| **Toasts** | **react-hot-toast** | Standard toast provider at root layout. |
| **Cryptography** | **Node.js `crypto`** | AES-256-GCM symmetric cipher + scrypt salted key derivation for PIN. |
| **File / Data** | **xlsx** | Excel import/export for financial reports and data exports. |

---

## 3. Directory Layout & File Organization

```
life/
├── app/
│   ├── (auth)/                          # Clerk authentication routes
│   │   ├── sign-in/[[...sign-in]]/      # Clerk Sign-In Page
│   │   └── sign-up/[[...sign-up]]/      # Clerk Sign-Up Page
│   ├── (root)/                          # Authenticated application shell
│   │   ├── layout.tsx                   # Auth guard, Clerk session check, LifeLayoutClient wrapper
│   │   ├── page.tsx                     # Dashboard (/): aggregated balances, health check, alerts
│   │   ├── guide/page.tsx               # Interactive User Guide & Flow Roadmap (/guide)
│   │   ├── business/page.tsx            # Business Continuity, Ventures & Server Handover (/business)
│   │   ├── information/page.tsx         # Medical Dossier, Emergency IDs & Legal Records (/information)
│   │   ├── finance/                     # Financial Care & Dependent Support
│   │   │   ├── page.tsx                 # Master Financial Care Ledger (/finance)
│   │   │   └── [id]/page.tsx            # Dependent Support Dossier & Installments (/finance/[id])
│   │   ├── money/page.tsx               # Money & Debt Ledger: Given / Taken / Invested (/money)
│   │   ├── people/                      # People Directory
│   │   │   ├── page.tsx                 # People list, roles & contact filters (/people)
│   │   │   └── [id]/page.tsx            # 8-Tab Individual Dossier & Permission Manager (/people/[id])
│   │   ├── instructions/page.tsx        # Operational Directives & Delegated Handover Tasks (/instructions)
│   │   ├── assets/page.tsx              # Physical & Digital Asset Portfolio (/assets)
│   │   ├── contacts/page.tsx            # Emergency & Key Professional Contacts Directory (/contacts)
│   │   ├── documents/page.tsx           # Critical Documents Library & Access Tiers (/documents)
│   │   ├── beneficiaries/page.tsx       # Heirs, Beneficiaries & Asset Allocations (/beneficiaries)
│   │   ├── legacy/page.tsx              # Sealed Legacy Messages & Condition Releases (/legacy)
│   │   ├── vault/page.tsx               # AES-256-GCM Encrypted Secrets Vault (/vault)
│   │   ├── guardians/page.tsx           # Trusted Guardians & Multi-Party Consensus (/guardians)
│   │   ├── access/page.tsx              # System Permissions Grid & Emergency Switch (/access)
│   │   ├── activity/page.tsx            # Tamper-Evident Security Audit Log (/activity)
│   │   ├── lifenote/page.tsx            # Life Notes: Secret, Emergency, Scheduled & Standard Notes
│   │   ├── requests/page.tsx            # Inbound / Outbound Request Center
│   │   └── settings/                    # System Settings
│   │       ├── page.tsx                 # Master PIN, Currency, Auto-Conceal & System JSON Export
│   │       └── trash/page.tsx           # Soft-Delete Trash Center & Record Restoration
│   ├── access-denied/page.tsx           # Unauthorized access fallback screen
│   ├── api/documents/                   # Document download/preview API endpoints
│   ├── globals.css                      # Design tokens, CSS variables, glassmorphism, mobile utilities
│   └── layout.tsx                       # Root HTML layout: ClerkProvider, ThemeProvider, fonts
├── components/
│   ├── life/                            # Domain-specific client components
│   │   ├── layout/                      # LifeHeader, LifeSidebar, LifeBottomNav, LifeLayoutClient
│   │   ├── dashboard/                   # LifeDashboardClient & statistical metric cards
│   │   ├── business/                    # BusinessClient, BusinessModal, ContinuityModal
│   │   ├── finance/                     # FinancialSupportList, InstallmentModal, GesnTransactionsView
│   │   ├── money/                       # MoneyClient, MoneyFormModal, SettlementModal
│   │   ├── people/                      # PeopleClient, PersonDetailClient, PersonFormModal
│   │   ├── vault/                       # VaultClient, VaultItemModal, VaultRevealModal
│   │   ├── notes/                       # LifeNoteClient, LifeNoteModal, LifeNoteReader
│   │   ├── messaging/                   # LifeConversationClient (1-on-1 isolated messaging)
│   │   ├── shared/                      # VaultRevealModal, LifeSearchDialog, ConfirmationDialog
│   │   └── PWAProvider.tsx              # PWA lifecycle, offline indicator, install banner prompt
│   ├── providers/                       # ThemeProvider
│   └── ui/                              # Radix / shadcn UI primitive components (button, dialog, etc.)
├── lib/
│   ├── actions/                         # Next.js Server Actions ('use server' for all DB operations)
│   │   ├── index.ts                     # Barrel exports for actions
│   │   ├── lifeAccess.actions.ts        # Access control, role delegation, emergency switch
│   │   ├── lifeActivity.actions.ts      # Immutable audit logging
│   │   ├── lifeAsset.actions.ts         # Asset portfolio CRUD & valuation
│   │   ├── lifeBusiness.actions.ts      # Ventures, partner equity, server infrastructure
│   │   ├── lifeContact.actions.ts       # Emergency contacts CRUD
│   │   ├── lifeConversation.actions.ts  # Isolated 1-on-1 messaging actions
│   │   ├── lifeDashboard.actions.ts     # Aggregated balances, continuity status, attention items
│   │   ├── lifeDocument.actions.ts      # Document library & classification tiers
│   │   ├── lifeEmergencyRecovery.actions.ts # Emergency activation, consensus validation
│   │   ├── lifeEmergencyRequest.actions.ts  # Guardian emergency request voting
│   │   ├── lifeFinancialSupport.actions.ts # Dependent care allowances & installment schedules
│   │   ├── lifeGuardian.actions.ts      # Guardian appointments & verification
│   │   ├── lifeInformation.actions.ts   # Medical records & identity documents
│   │   ├── lifeInstruction.actions.ts   # Operational directives & delegated tasks
│   │   ├── lifeLegacy.actions.ts        # Sealed legacy letters & release conditions
│   │   ├── lifeMoney.actions.ts         # Money given/taken, investments, settlements
│   │   ├── lifeNote.actions.ts          # Life Notes (always-visible, secret, scheduled, emergency)
│   │   ├── lifePeople.actions.ts        # People directory & 8-tab dossier aggregations
│   │   ├── lifeRequest.actions.ts       # Request center actions
│   │   ├── lifeSettings.actions.ts      # Master PIN, currency symbol, full JSON backup
│   │   ├── lifeTrash.actions.ts         # Soft-delete restoration & permanent purge
│   │   └── lifeVault.actions.ts         # AES-256 vault items CRUD & decrypted reveal
│   ├── database/
│   │   ├── index.ts                     # Cached MongoDB connection pool handler
│   │   ├── models/                      # 32 Mongoose data models
│   │   └── plugins/softDelete.ts        # Soft-delete Mongoose plugin (`isDeleted: boolean`)
│   ├── life/
│   │   ├── auth.ts                      # LifeAuthContext, getLifeAuthContext(), RBAC permissions
│   │   ├── crypto.ts                    # AES-256-GCM cipher/decipher & scrypt PIN hash/verify
│   │   ├── module-access.ts             # Module permission checks
│   │   └── notifications.ts             # In-app and system notification dispatcher
│   ├── auth-guard.ts                    # Clerk user to Admin profile resolver & auto-provisioning
│   ├── rbac-utils.ts                    # Role-based permission matrix & effective permission calculator
│   └── utils.ts                         # Universal helpers (cn, formatCurrency, formatDate)
├── public/
│   ├── manifest.json                    # Web App Manifest for mobile installation
│   ├── sw.js                            # Zero-Cache Security Service Worker
│   └── assets/images/                   # Logos, icons, branding
└── types/
    └── index.ts                         # Master TypeScript definitions for all domains & models
```

---

## 4. Database Schema Reference (32 Mongoose Models)

All models reside in `lib/database/models/` and are registered with cached Mongoose instances (`mongoose.models.X || mongoose.model('X', Schema)`).

| Model File | Collection / Entity | Key Fields & Purpose |
| :--- | :--- | :--- |
| `admin.model.ts` | `admins` | Clerk user mapping, admin role (`super_admin`, `admin`, `viewer`), active status, granular module permissions. |
| `lifePerson.model.ts` | `lifepersons` | Central directory for individuals (family, partner, staff, beneficiary). Contact details, WhatsApp, social links, `isLoginEnabled`, `clerkUserId`, `permissions`, `emergencyPriority`. |
| `lifeSettings.model.ts` | `lifesettings` | System configuration: `ownerEmail`, `vaultPinHash` (scrypt-hashed), `currencySymbol` (default `৳`), `autoConcealVaultSeconds` (default 30s), `emergencyMessage`. |
| `lifeVaultItem.model.ts` | `lifevaultitems` | Encrypted credentials: `encryptedSecret`, `secretIv`, `secretAuthTag`, `category` (hosting, router, pin, server, etc.), `visibilityMode`, `assignedToPersonIds`. |
| `lifeBusiness.model.ts` | `lifebusinesses` | Corporate ventures: ownership %, trade licenses, capital invested, bank signers, servers/infrastructure registry, and `handoverChecklist` ("If I Am Not Available"). |
| `lifeMoneyRecord.model.ts` | `lifemoneyrecords` | 4-way financial tracking: `type` (`given`, `taken`, `invest_made`, `invest_received`), `amount`, `paidAmount`, `remainingAmount`, `expectedReturnDate`, `status`. |
| `lifeSettlement.model.ts` | `lifesettlements` | Partial or full settlement logs linked to `lifeMoneyRecord`: `amount`, `date`, `receiptUrl`, `paymentMethod`. |
| `lifeFinancialSupport.model.ts`| `lifefinancialsupports` | Dependent monthly allowances & loans: `recipientPersonId`, `totalAmount`, `repayableOrNot`, `installmentFrequency`, `giftConversions`. |
| `lifeInstallment.model.ts` | `lifeinstallments` | Scheduled repayment installments for financial support: `dueDate`, `amount`, `paidAmount`, `status` (`pending`, `paid`, `overdue`). |
| `lifeAsset.model.ts` | `lifeassets` | Real estate, bank deposits, vehicles, gold, private equity: `category`, `estimatedValue`, `ownershipPercentage`, `physicalLocation`, `documentUrls`. |
| `lifeContact.model.ts` | `lifecontacts` | Emergency & advisory directory: lawyers, primary doctors, accountants, server engineers. 1-tap Phone, WhatsApp, and Email triggers. |
| `lifeDocument.model.ts` | `lifedocuments` | Legal contracts, wills, deeds, incorporation certificates: `documentType`, `fileUrl`, `accessTier` (`public`, `internal`, `confidential`, `emergency_only`). |
| `lifeInstruction.model.ts` | `lifeinstructions` | Handover directives: priority, assigned person, step-by-step action items, trigger condition. |
| `lifeLegacyMessage.model.ts` | `lifelegacymessages` | Condition-sealed letters: `recipientPersonId`, `letterContent`, `releaseTrigger` (`emergency_activation`, `scheduled_date`, `guardian_release`). |
| `lifeGuardian.model.ts` | `lifeguardians` | Appointed trustees: `personId`, `guardianType` (`primary`, `secondary`, `independent`), `verificationStatus`, `votingWeight`. |
| `lifeEmergencyAccess.model.ts` | `lifeemergencyaccesses` | Emergency state singleton: `isEmergencyActive`, `activatedAt`, `activatedBy`, `gracePeriodHours`, `unlockedModules`. |
| `lifeEmergencyRequest.model.ts`| `lifeemergencyrequests` | Inbound emergency access requests: requester details, reason, guardian approval votes, consensus status. |
| `lifeEmergencyRecoveryEvent.model.ts`| `lifeemergencyrecoveryevents` | Historical timeline of emergency triggers, verifications, and relocks. |
| `lifeNote.model.ts` | `lifenotes` | Versatile notes: `noteType` (`internal_admin`, `always_visible`, `manual_release`, `scheduled_release`, `secret_emergency`), `waitingPeriodHours`, user acknowledgements, `needHelp`. |
| `lifeConversation.model.ts` | `lifeconversations` | Isolated 1-on-1 messaging thread between admin and a specific user/dependent. Message attachments, unread counters, pinned threads. |
| `lifeCategory.model.ts` | `lifecategories` | Taxonomy for notes and records: `key`, `name`, `icon`, `color`, `order`. |
| `lifeActivityLog.model.ts` | `lifeactivitylogs` | Immutable audit log: `userId`, `userName`, `action`, `module`, `details`, `ipAddress`, `deviceInfo`, `timestamp`. |
| `lifeTrash.model.ts` / SoftDelete | `lifetrashes` | Soft-deleted records tracking collection, schema origin, payload, deletedAt, restorable flag. |
| `lifeResponsibility.model.ts` | `liferesponsibilities` | Operational responsibilities assigned to specific partners or staff. |
| `lifeRequest.model.ts` | `liferequests` | Formal requests between users and owner (e.g. fund request, document request). |
| `lifePaymentConfirmation.model.ts`| `lifepaymentconfirmations` | Verification proofs for offline financial transactions. |
| `lifeShareHistory.model.ts` | `lifesharehistories` | Records of when and with whom specific confidential records were shared. |
| `lifeNotification.model.ts` | `lifenotifications` | Real-time in-app alerts for users (new messages, payment due, emergency alerts). |
| `lifeRecordPermission.model.ts`| `liferecordpermissions` | Granular per-record overrides for specific users. |
| `lifeInformation.model.ts` | `lifeinformations` | Medical conditions, blood group, allergies, passport, NID, e-TIN. |
| `lifeFinancialHistory.model.ts` | `lifefinancialhistories` | Historic balance snapshot audit logs. |
| `lifeTransaction.model.ts` | `lifetransactions` | Generic financial ledger transaction entries. |

---

## 5. Security & Cryptography Standards

### 1. Vault Secret Encryption (AES-256-GCM)
Located in `lib/life/crypto.ts`:
- **Cipher**: `aes-256-gcm`
- **Key Source**: `process.env.LIFE_VAULT_ENCRYPTION_KEY` || `process.env.CLERK_SECRET_KEY` (hashed with SHA-256 to 32 bytes).
- **IV Length**: 16 bytes random buffer per item (`crypto.randomBytes(16)`).
- **Authentication Tag**: 16 bytes auth tag verified upon deciphering.
- **Rule**: NEVER store plain text passwords, seed phrases, or server root keys in MongoDB. Encrypt on creation via `encryptVaultSecret()`, decrypt only on explicit verified reveal via `decryptVaultSecret()`.

### 2. Master PIN Hashing & Verification
- **Hashing**: Derived using `crypto.scryptSync(pin, salt, 64)`. Salt is 16 bytes random hex.
- **Format**: `salt:derivedKeyHex` stored in `LifeSettings.vaultPinHash`.
- **Comparison**: Verified using `crypto.timingSafeEqual` to eliminate timing attacks.
- **Requirement**: Revealing any vault secret or triggering emergency administrative functions requires Master PIN entry.

### 3. Zero-Cache Service Worker
- `public/sw.js` explicitly intercepts network requests and prevents caching sensitive pages (`/vault`, `/money`, `/finance`, `/information`, `/access`).
- Keeps the PWA installable without leaking confidential financial or credential data to browser offline storage.

### 4. Client-Side Timed Concealment
- Vault secrets revealed in UI automatically re-conceal after a configurable timer (default: **30 seconds**). No unencrypted secret is ever written to `localStorage` or `sessionStorage`.

---

## 6. Authentication & Role-Based Access Control (RBAC)

### 1. Auth Flow
- Authentication is handled by Clerk (`@clerk/nextjs`).
- In Server Actions and Server Components, get identity via:
  ```typescript
  import { auth } from "@clerk/nextjs/server";
  const { userId } = await auth();
  ```
- Use `getLifeAuthContext()` in `lib/life/auth.ts` to get the unified profile:
  ```typescript
  import { getLifeAuthContext } from "@/lib/life/auth";
  const authContext = await getLifeAuthContext();
  // Returns: { userId, email, name, role, isOwner, isAdmin, isGuardian, personId, permissions }
  ```

### 2. First-User Auto-Provisioning
- When the database is initialized and `Admin.countDocuments() === 0`, the first authenticated Clerk user is automatically created as `super_admin` / Owner with full system privileges.

### 3. Role Hierarchy & Access Matrix
- **Owner (`super_admin`)**: Full unrestricted access to all data, settings, vault decryption, and admin actions.
- **Admin (`admin`)**: Manages day-to-day operations, view documents and instructions; cannot access vault secrets or manage access without permission.
- **Guardian (`guardian`)**: Emergency trustee. Gathers access only when Emergency Mode is triggered or by multi-guardian consensus.
- **Business Partner / Staff (`business`)**: Can access assigned ventures, server infrastructure checklists, and business notes.
- **Dependent / Family Member (`individual` / `beneficiary`)**: Access to their personal financial support ledger, assigned notes, and condition-released legacy letters.

---

## 7. Server Actions Architecture & Conventions

All database queries and mutations in LIFE are performed via Next.js Server Actions in `lib/actions/`.

### Server Action Standard Template
```typescript
"use server";

import { connectToDatabase } from "@/lib/database";
import { getLifeAuthContext } from "@/lib/life/auth";
import { revalidatePath } from "next/cache";

export async function sampleLifeAction(params: SomeInputType): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    await connectToDatabase();

    const auth = await getLifeAuthContext();
    if (!auth) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    // Enforce permission check if needed
    if (!auth.isOwner && !auth.permissions.canViewBusiness) {
      return { success: false, error: "Forbidden: insufficient permissions." };
    }

    // Perform query or mutation
    const result = await SomeModel.create({ ...params, createdBy: auth.userId });

    // Invalidate affected paths
    revalidatePath("/business");

    // ALWAYS serialize Mongoose documents before returning to client
    return {
      success: true,
      data: JSON.parse(JSON.stringify(result)),
    };
  } catch (error: any) {
    console.error("Action error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
```

### Critical Rules for Server Actions:
1. **Always connect**: Call `await connectToDatabase()` at the start of every action.
2. **Always serialize**: Never return raw Mongoose documents (`_id`, `Date`, and getters will trigger React serialization warnings). Always `JSON.parse(JSON.stringify(doc))` or `.lean()`.
3. **Always wrap errors**: Return `{ success: boolean, data?: ..., error?: string }` instead of throwing unhandled exceptions to client components.
4. **Revalidate**: Use `revalidatePath("/route")` to trigger fast, instant UI cache updates.

---

## 8. Frontend & UI Architecture

### 1. App Shell Pattern
- `app/(root)/layout.tsx`: Checks Clerk authentication, fetches `LifeAuthContext`, verifies emergency state, renders global toast container (`<Toaster />`), and wraps with `<LifeLayoutClient>`.
- `<LifeLayoutClient>` renders:
  - Desktop header (`LifeHeader`) and sidebar (`LifeSidebar`)
  - Mobile bottom navigation bar (`LifeBottomNav`)
  - Global Search modal (`LifeSearchDialog` triggered by `Cmd+K` / `Ctrl+K`)
  - PWA offline status & install banner (`PWAProvider`)

### 2. Page & Component Pattern
- `app/(root)/<module>/page.tsx`: Server Component that handles initial data prefetching using Server Actions, checks permissions, and passes serialized data to `<Module>Client.tsx`.
- `components/life/<module>/<Module>Client.tsx`: Interactive Client Component with `'use client'`, handling local state, filter bars, modals, and user interactions.

### 3. Styling & Theme Tokens
- Dark mode is default, managed by `next-themes`.
- Custom CSS properties defined in `app/globals.css`.
- Standard color badges:
  - Receivables / Given / Income: Emerald (`text-emerald-500`, `bg-emerald-500/10`)
  - Payables / Taken / Expense: Rose (`text-rose-500`, `bg-rose-500/10`)
  - Investments: Amber (`text-amber-500`, `bg-amber-500/10`)
  - Emergency / Critical: Red / Crimson (`text-red-500`, `bg-red-500/10`)
  - Primary / Brand: Indigo / Violet / Emerald accents

---

## 9. Common Workflows & Business Logic

### 1. Money Given vs Taken
- `Given`: Money lent out by Owner. Expected to be received back. Shows as **Receivable**.
- `Taken`: Money borrowed by Owner. Expected to be paid back. Shows as **Payable**.
- `Invest Made`: Capital deployed into external ventures.
- `Invest Received`: Capital taken from partners for ventures.
- Settlements: Recorded via `createSettlementAction`. Automatically recalculates `paidAmount` and `remainingAmount`, and toggles status from `active` to `partially_settled` or `settled`.

### 2. Dependent Financial Care & Installments
- Supports monthly allowances (living, educational, medical).
- Tracks scheduled installment dates and overdue flags.
- **Gift Conversion**: Supports converting all or part of a loan/debt into an un-repayable gift (`giftConversions` in `LifeFinancialSupport`), automatically adjusting balances and logging the owner's note.

### 3. Emergency Activation & Guardian Consensus
- Two ways to activate Emergency Mode:
  1. **Direct Admin Activation**: Owner or authorized Super Admin flips emergency switch in `/access` with Master PIN.
  2. **Multi-Party Guardian Consensus**: Trusted guardians submit emergency unlock requests. When the threshold (e.g. 2 of 3) is reached, the system initiates a countdown grace period before unlocking designated modules.
- When Emergency Mode is active:
  - Top emergency banner turns bright amber/red across the entire application.
  - Designated guardians and family unlock access to legal contacts, server checklists, continuity instructions, and emergency notes.

### 4. Life Notes & Sealed Legacy Letters
- `LifeNote`: Supports immediate delivery or timed/scheduled release. Includes "Need Help" emergency escalation, reading confirmations, and waiting period timers.
- `LifeConversation`: Isolated 1-on-1 messaging channel between the Owner/Admin and any registered person/dependent, ensuring sensitive conversations remain strictly confidential and isolated.

---

## 10. Development Commands & Environment Setup

### NPM Scripts
- `npm run dev`: Starts Next.js development server with Turbopack (`next dev --turbopack`).
- `npm run build`: Production build (`next build`).
- `npm run start`: Starts production server (`next start`).
- `npm run lint`: Runs ESLint with Next.js rules (`eslint . --ext .ts,.tsx,.js,.jsx`).

### Required Environment Variables (`.env.local`)
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# MongoDB Database Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/life?retryWrites=true&w=majority
MONGODB_DB_NAME=life
MONGODB_MAX_POOL_SIZE=20

# Cryptography & Vault Security
LIFE_VAULT_ENCRYPTION_KEY=your_secure_32_character_master_key!

# GESN External Accounting API (Optional)
GESN_REPORTS_API_URL=https://acc.gesn.net/api/reports
GESN_REPORTS_API_OWNER=SHOUROV
GESN_REPORTS_API_SECRET_KEY=your_gesn_api_secret_key
```

---

## 11. Critical Rules & Anti-Patterns for AI Agents

1. **Next.js 16 Async APIs**:
   - `auth()` from `@clerk/nextjs/server` is **asynchronous**. Always write `const { userId } = await auth();`.
   - Dynamic route params in Next.js 16 page components are promises:
     `export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; }`.
   - `cookies()` and `headers()` from `next/headers` are **asynchronous**. Always `await cookies()`.

2. **Security & Secrets Handling**:
   - **NEVER** log or return decrypted vault secrets in general queries or list views.
   - **NEVER** bypass Master PIN validation on secret reveal.
   - **NEVER** store plain text PINs; always use `hashPin(pin)`.

3. **Mongoose & Database**:
   - **NEVER** import or use Mongoose models without calling `await connectToDatabase()`.
   - **NEVER** re-declare Mongoose models with `mongoose.model('Name', schema)` without checking `mongoose.models.Name` first (prevents OverwriteModelError in hot reload).

4. **Preserve Next.js Agent Markers**:
   - In `AGENTS.md`, never delete the `<!-- BEGIN:nextjs-agent-rules -->` block generated by Next.js. Keeping it preserves clean git diffs across `next dev` runs.

5. **Token Efficiency**:
   - When asked to implement or fix a feature in LIFE, do NOT re-read `docs/APP_DOCUMENTATION.md` or scan all files. Go directly to the relevant Server Action in `lib/actions/` and client component in `components/life/<module>/`.
