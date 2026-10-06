<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🌿 LIFE — AI Agent Context & Fast Reference Manual

> **CRITICAL INSTRUCTION FOR AI AGENTS**:
> This file contains the complete system architecture, data models, security protocols, routing, coding conventions, and developer rules for the **LIFE** codebase.
> **DO NOT** scan the full repository, read all 32 Mongoose models, or read the 60KB documentation file (`docs/APP_DOCUMENTATION.md`).
> Everything you need to plan, write, or fix code in this application is defined in this document.

---

## 1. Executive Summary & Core Mission

- **App Name**: LIFE (Personal Legacy, Secure Information, Financial Care & Business Continuity)
- **Tech Stack**: Next.js 16.3.4 (App Router) + React 19 + Turbopack + TypeScript 5 + MongoDB / Mongoose 8.24 + Clerk 6.39 + Tailwind CSS 3.4 + Radix UI.
- **Core Purpose**: Private, encrypted personal asset registry, debt ledger, business continuity engine, and emergency management system. Ensures that if something happens to the owner (incapacity, emergency, or death), designated guardians, trustees, family members, and business partners have instant clarity regarding assets, debts, credentials, server infrastructure, medical directives, and handover protocols.
- **Form Factor**: Mobile-first installable PWA with native-like gestures (`LifeBottomNav`, `LifeHeader`, `LifeSidebar`), glassmorphic modals, and desktop responsiveness.
- **Security Posture**: Zero-cache Service Worker, AES-256-GCM vault encryption, scrypt-hashed Master PIN gate, multi-party guardian consensus, and tamper-evident audit logging.

---

## 2. Quick Directory Map

- `app/(root)/`: All authenticated page routes:
  - `page.tsx`: Dashboard (/)
  - `guide/`: Interactive User Guide & Flow Roadmap (/guide)
  - `business/`: Ventures, Partner Equity & Server Handover (/business)
  - `information/`: Medical Dossier, Emergency IDs & Legal Records (/information)
  - `finance/`: Dependent Care Allowances & Installment Schedules (/finance)
  - `money/`: Given / Taken / Invested Debt Ledger (/money)
  - `people/`: People Directory & 8-Tab Individual Dossier (/people, /people/[id])
  - `instructions/`: Operational Directives & Delegated Handover Tasks (/instructions)
  - `assets/`: Asset Portfolio Registry (/assets)
  - `contacts/`: Emergency & Professional Contacts (/contacts)
  - `documents/`: Critical Documents Library (/documents)
  - `beneficiaries/`: Heirs & Asset Allocation (/beneficiaries)
  - `legacy/`: Condition-Sealed Legacy Letters (/legacy)
  - `vault/`: AES-256-GCM Encrypted Secrets Vault (/vault)
  - `guardians/`: Trusted Guardians & Multi-Party Consensus (/guardians)
  - `access/`: Permissions Grid & Emergency Switch (/access)
  - `activity/`: Tamper-Evident Security Audit Log (/activity)
  - `lifenote/`: Rich Life Notes (standard, secret, emergency, scheduled) (/lifenote)
  - `requests/`: Inbound & Outbound Request Center (/requests)
  - `settings/`: Master PIN, Currency, Auto-Conceal & System JSON Export (/settings)
  - `settings/trash/`: Soft-Delete Trash Recovery Center (/settings/trash)
- `components/life/`: Domain-specific client components (e.g. `layout/`, `dashboard/`, `money/`, `vault/`, `notes/`, `messaging/`).
- `lib/actions/`: Next.js Server Actions (`'use server'`) for all database operations and business logic.
- `lib/database/`: Mongoose connection handler (`index.ts`) and all 32 Mongoose models (`models/`).
- `lib/life/`:
  - `auth.ts`: `getLifeAuthContext()`, RBAC permissions matrix, and role resolution.
  - `crypto.ts`: AES-256-GCM cipher/decipher and scrypt-based Master PIN hashing.
  - `module-access.ts`: Per-module permission validation.
- `types/index.ts`: Master TypeScript interfaces and enums for all domains.
- `public/`: Web App Manifest (`manifest.json`) and Zero-Cache Security Service Worker (`sw.js`).

---

## 3. Database Schema Quick Reference (32 Mongoose Models)

All models are located in `lib/database/models/` and utilize `mongoose.models.X || mongoose.model('X', Schema)`:

1. **`admin.model.ts` (`Admin`)**: Clerk user email mapping, role (`super_admin`, `admin`, `viewer`), active status, module permissions.
2. **`lifePerson.model.ts` (`LifePerson`)**: Directory of people (family, partner, staff, beneficiary). Contact info, WhatsApp, social links, `isLoginEnabled`, `clerkUserId`, granular `permissions`, `emergencyPriority`.
3. **`lifeSettings.model.ts` (`LifeSettings`)**: System singleton: `ownerEmail`, `vaultPinHash` (scrypt), `currencySymbol` (default `৳`), `autoConcealVaultSeconds` (default 30s), `emergencyMessage`.
4. **`lifeVaultItem.model.ts` (`LifeVaultItem`)**: AES-256-GCM encrypted secrets: `encryptedSecret`, `secretIv`, `secretAuthTag`, `category` (website, hosting, server, router, pin, recovery, etc.), `visibilityMode`, `assignedToPersonIds`.
5. **`lifeBusiness.model.ts` (`LifeBusiness`)**: Corporate entities: ownership %, trade licenses, capital invested, bank signers, servers/infrastructure registry, and `handoverChecklist` ("If I Am Not Available").
6. **`lifeMoneyRecord.model.ts` (`LifeMoneyRecord`)**: 4-way financial tracking: `type` (`given`, `taken`, `invest_made`, `invest_received`), `amount`, `paidAmount`, `remainingAmount`, `expectedReturnDate`, `status`.
7. **`lifeSettlement.model.ts` (`LifeSettlement`)**: Partial or full payment settlement records linked to `LifeMoneyRecord`.
8. **`lifeFinancialSupport.model.ts` (`LifeFinancialSupport`)**: Dependent care commitments, living allowances, educational expenses, repayable/non-repayable loans, gift conversions.
9. **`lifeInstallment.model.ts` (`LifeInstallment`)**: Scheduled repayment installments for financial support.
10. **`lifeAsset.model.ts` (`LifeAsset`)**: Physical & digital assets (real estate, vehicles, gold, bank deposits), physical document locations, beneficiary links.
11. **`lifeContact.model.ts` (`LifeContact`)**: Emergency & advisory contacts (lawyers, doctors, accountants, engineers) with 1-tap Call/WhatsApp/Email triggers.
12. **`lifeDocument.model.ts` (`LifeDocument`)**: Critical legal papers, deeds, wills, contracts, access classification tiers (`public`, `internal`, `confidential`, `emergency_only`).
13. **`lifeInstruction.model.ts` (`LifeInstruction`)**: Operational directives, prioritized handover workflows, assigned persons.
14. **`lifeLegacyMessage.model.ts` (`LifeLegacyMessage`)**: Condition-sealed letters: `releaseTrigger` (`emergency_activation`, `scheduled_date`, `guardian_release`).
15. **`lifeGuardian.model.ts` (`LifeGuardian`)**: Appointed trustees: `guardianType` (`primary`, `secondary`, `independent`), voting weight, verification status.
16. **`lifeEmergencyAccess.model.ts` (`LifeEmergencyAccess`)**: Emergency state singleton: `isEmergencyActive`, `activatedAt`, `activatedBy`, `gracePeriodHours`, `unlockedModules`.
17. **`lifeEmergencyRequest.model.ts` (`LifeEmergencyRequest`)**: Guardian emergency unlock requests and voting consensus.
18. **`lifeEmergencyRecoveryEvent.model.ts` (`LifeEmergencyRecoveryEvent`)**: Historic log of emergency state changes.
19. **`lifeNote.model.ts` (`LifeNote`)**: Notes system: `noteType` (`internal_admin`, `always_visible`, `manual_release`, `scheduled_release`, `secret_emergency`), waiting periods, user acknowledgements, `needHelp`.
20. **`lifeConversation.model.ts` (`LifeConversation`)**: Isolated 1-on-1 messaging threads between Admin/Owner and specific registered people/dependents.
21. **`lifeCategory.model.ts` (`LifeCategory`)**: Dynamic category taxonomy for notes and records.
22. **`lifeActivityLog.model.ts` (`LifeActivityLog`)**: Immutable audit log: `userId`, `action`, `module`, `details`, `ipAddress`, `deviceInfo`.
23. **`lifeTrash.actions.ts` / Soft-Delete Plugin**: Mongoose plugin marking `isDeleted: true` for soft-deletion and recovery in `/settings/trash`.
24. **Other Supporting Models**: `lifeNotification.model.ts`, `lifeRequest.model.ts`, `lifeResponsibility.model.ts`, `lifePaymentConfirmation.model.ts`, `lifeShareHistory.model.ts`, `lifeRecordPermission.model.ts`, `lifeInformation.model.ts`, `lifeFinancialHistory.model.ts`, `lifeTransaction.model.ts`.

---

## 4. Security & Cryptography Guidelines

- **AES-256-GCM Vault Encryption**:
  - Always use `encryptVaultSecret(text)` and `decryptVaultSecret(hex, iv, tag)` from `lib/life/crypto.ts`.
  - NEVER log or return decrypted secrets in list queries. Secrets are decrypted exclusively upon calling `revealVaultSecret(itemId, pin)` after Master PIN validation.
- **Master PIN Hashing**:
  - PINs are hashed using `hashPin(pin)` with `crypto.scrypt` and 16-byte random salt (`salt:keyHex`).
  - Verification uses constant-time `crypto.timingSafeEqual` via `verifyPin(pin, hash)`.
- **Zero-Cache Service Worker**:
  - `public/sw.js` explicitly blocks caching of sensitive routes (`/vault`, `/money`, `/finance`, `/information`, `/access`).
- **Timed Concealment**:
  - Client components automatically hide revealed secrets after a countdown (default 30 seconds). Never store decrypted secrets in browser storage (`localStorage` or `sessionStorage`).

---

## 5. Authentication & Access Control (RBAC)

- Authenticated session retrieved via Clerk: `const { userId } = await auth();` (Async in Next.js 16).
- Unified profile retrieved via `const auth = await getLifeAuthContext();` (`lib/life/auth.ts`).
- **Auto-Promotion**: If database has no admins (`Admin.countDocuments() === 0`), the first authenticated user is automatically created as `super_admin` / Owner.
- **Roles**:
  - `owner` / `super_admin`: Full, unrestricted access to all data, settings, vault decryption, and admin controls.
  - `admin`: Day-to-day administration; restricted from vault decryption or access delegation unless explicitly granted.
  - `guardian`: Emergency trustee; unlocked upon Emergency Mode trigger or multi-guardian consensus.
  - `business`: Business partner/staff; restricted to assigned ventures, infrastructure checklists, and business notes.
  - `individual` / `beneficiary`: Restricted to assigned financial support, personal dossiers, and released legacy letters.

---

## 6. Server Actions & Backend Coding Standards

All database queries and mutations MUST be written as Next.js Server Actions in `lib/actions/`.

```typescript
"use server";

import { connectToDatabase } from "@/lib/database";
import { getLifeAuthContext } from "@/lib/life/auth";
import { revalidatePath } from "next/cache";

export async function sampleServerAction(payload: any): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    await connectToDatabase();
    const auth = await getLifeAuthContext();
    if (!auth) return { success: false, error: "Unauthorized" };

    // Enforce permission checks if required
    if (!auth.isOwner && !auth.permissions.canViewBusiness) {
      return { success: false, error: "Forbidden" };
    }

    // Database operation
    const doc = await SomeModel.create({ ...payload, createdBy: auth.userId });

    revalidatePath("/some-path");

    // ALWAYS serialize Mongoose documents before returning to client
    return {
      success: true,
      data: JSON.parse(JSON.stringify(doc)),
    };
  } catch (err: any) {
    console.error("Action error:", err);
    return { success: false, error: err.message || "Operation failed" };
  }
}
```

### Critical Rules for Server Actions:
1. **Always connect**: Start every Server Action with `await connectToDatabase()`.
2. **Always serialize**: Return plain objects (`JSON.parse(JSON.stringify(doc))` or `.lean()`) to prevent Next.js React 19 serialization errors.
3. **Safe response envelope**: Return `{ success: boolean, data?: T, error?: string }` instead of throwing raw exceptions.
4. **Revalidate**: Call `revalidatePath("/route")` to refresh server-rendered pages instantly.

---

## 7. Frontend & Component Patterns

- **Server vs Client**:
  - `app/(root)/<module>/page.tsx`: Server Component that calls Server Actions to fetch data, verifies permissions, and passes serialized props to `<Module>Client`.
  - `components/life/<module>/<Module>Client.tsx`: Client Component (`'use client'`) managing UI state, tabs, search/filters, and dialog modals.
- **Forms**: Use `react-hook-form` paired with `@hookform/resolvers/zod` and `zod` schemas.
- **Toasts**: Use `toast.success()` and `toast.error()` from `react-hot-toast`.
- **Icons**: Import only from `lucide-react`.
- **Modals / Dialogs**: Use Radix UI primitives styled with Tailwind (e.g. `@radix-ui/react-dialog`).

---

## 8. Critical Gotchas & Anti-Patterns to Avoid

1. **Next.js 16 Breaking Changes**:
   - `auth()` from `@clerk/nextjs/server` is **async**: ALWAYS `await auth()`.
   - Dynamic route `params` are **Promises**: ALWAYS `const { id } = await params;`.
   - `cookies()` and `headers()` are **async**: ALWAYS `await cookies()`.
2. **Never expose raw secrets**:
   - Never return `encryptedSecret`, `secretIv`, or `secretAuthTag` in general list queries.
3. **Never write plain-text PINs**:
   - Always hash PINs with `hashPin(pin)` before saving to `LifeSettings`.
4. **Preserve Next.js Block in `AGENTS.md`**:
   - Keep `<!-- BEGIN:nextjs-agent-rules --> ... <!-- END:nextjs-agent-rules -->` intact to prevent `next dev` from re-creating uncommitted diffs.
5. **No unnecessary re-scanning**:
   - Do NOT run deep file searches or re-read documentation when asked to add or fix a feature. Refer to the directory map and schema reference above to jump straight to the relevant file.
