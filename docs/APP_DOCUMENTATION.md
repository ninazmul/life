# LIFE — Technical Architecture & System Documentation

**Personal Legacy, Secure Information & Business Continuity PWA**

---

## 1. Executive Overview & System Concept

**LIFE** is a private, encrypted personal asset registry, financial ledger, and continuity management system.

### What LIFE Is Not
- **Not a generic Notes App**: Traditional note apps lack structured relationships, debt tracking, server infrastructure logs, and granular access delegation.
- **Not a standard corporate ERP**: Traditional ERPs are bloated with supply chain, inventory, and point-of-sale features irrelevant to personal life and private ventures.

### What LIFE Is
LIFE is an ultra-secure, mobile-first single source of truth designed for the Owner. It ensures that in the event of an emergency, incapacity, or death, designated trustees, family members, and business partners have exact clarity regarding:
1. What assets and liabilities exist (receivables, debts, real estate, bank deposits, private equity).
2. What critical actions must be performed immediately (server maintenance, loan payments, continuity steps).
3. Who must be contacted (lawyers, doctors, system engineers, key partners).
4. What credentials and documents they are authorized to access (passwords, server keys, deeds, legacy letters).

The platform functions as an installable **Progressive Web App (PWA)** with a mobile-native feel on iOS and Android, while delivering a comprehensive desktop experience.

---

## 2. Technology Stack & Directory Architecture

### Core Technologies
- **Framework**: Next.js 15.5 (App Router with Turbopack)
- **Frontend**: React 19 (React Server Components + interactive Client Components)
- **Language**: TypeScript 5 (Strict mode with end-to-end typing)
- **Styling**: Tailwind CSS 3.4 + Radix UI Primitives + Lucide React
- **Theme**: `next-themes` (Dark Mode / Light Mode with CSS custom properties)
- **Database**: MongoDB with Mongoose 8 (Connection pooling, schema validation, compound indexes)
- **Authentication**: Clerk Auth (`@clerk/nextjs`)
- **Cryptography**: Node.js `crypto` with `aes-256-gcm`
- **PWA**: Web App Manifest (`public/manifest.json`) and Zero-Cache Service Worker (`public/sw.js`)

### Directory Structure

```
├── app/
│   ├── (auth)/                          # Clerk authentication routes
│   │   ├── sign-in/[[...sign-in]]/      # Clerk Sign-In Page
│   │   └── sign-up/[[...sign-up]]/      # Clerk Sign-Up Page
│   ├── (root)/                          # Authenticated application shell
│   │   ├── layout.tsx                   # Master App Shell (Header, Sidebar, BottomNav, PWAProvider)
│   │   ├── page.tsx                     # Dashboard (/)
│   │   ├── people/                      # People Directory
│   │   │   ├── page.tsx                 # People list view
│   │   │   └── [id]/page.tsx            # 8-Tab Individual Dossier
│   │   ├── money/page.tsx               # Money & Debt Ledger
│   │   ├── information/page.tsx         # Categorized Notes & Instructions
│   │   ├── business/page.tsx            # Business Continuity & "If I Am Not Available"
│   │   ├── assets/page.tsx              # Asset Portfolio Registry
│   │   ├── contacts/page.tsx            # Emergency & Key Contacts
│   │   ├── documents/page.tsx           # Private Documents Library
│   │   ├── vault/page.tsx               # Encrypted Secrets Vault
│   │   ├── legacy/page.tsx              # Sealed Legacy Letters & Last Messages
│   │   ├── access/page.tsx              # Permissions Grid & Emergency Mode
│   │   ├── activity/page.tsx            # Tamper-Evident Security Audit Log
│   │   └── settings/page.tsx            # Master PIN & System Export
│   ├── access-denied/page.tsx           # Unauthorized access fallback
│   ├── globals.css                      # Global styles, Tailwind directives, design tokens
│   └── layout.tsx                       # Root HTML layout with ClerkProvider & ThemeProvider
├── components/
│   └── life/                            # Life application component library
│       ├── layout/                      # LifeHeader, LifeSidebar, LifeBottomNav
│       ├── dashboard/                   # LifeDashboardClient & metric widgets
│       ├── people/                      # PeopleClient, PersonDetailClient, PersonFormModal
│       ├── money/                       # MoneyClient, MoneyFormModal, SettlementModal
│       ├── information/                 # InformationClient, InformationModal
│       ├── business/                    # BusinessClient, BusinessModal, ContinuityStepModal
│       ├── assets/                      # AssetsClient, AssetModal
│       ├── contacts/                    # ContactsClient, ContactModal
│       ├── documents/                   # DocumentsClient, DocumentModal
│       ├── vault/                       # VaultClient, VaultItemModal
│       ├── legacy/                      # LegacyClient, LegacyMessageModal, LegacyReader
│       ├── access/                      # AccessClient, EmergencyModeModal
│       ├── activity/                    # ActivityClient, AuditTimeline
│       ├── settings/                    # SettingsClient, MasterPINModal
│       ├── shared/                      # VaultRevealModal, LifeSearchDialog, ConfirmationDialog
│       └── PWAProvider.tsx              # PWA lifecycle, offline indicator & install prompt
├── lib/
│   ├── actions/                         # Next.js Server Actions (All DB Operations)
│   │   ├── index.ts                     # Barrel re-export
│   │   ├── lifeAccess.actions.ts        # Access control, delegation & emergency switch
│   │   ├── lifeActivity.actions.ts      # Immutable activity audit logging
│   │   ├── lifeAsset.actions.ts         # Asset portfolio operations
│   │   ├── lifeBusiness.actions.ts      # Business ventures & continuity steps
│   │   ├── lifeContact.actions.ts       # Emergency contacts CRUD
│   │   ├── lifeDashboard.actions.ts     # Aggregated metrics & attention queries
│   │   ├── lifeDocument.actions.ts      # Documents CRUD
│   │   ├── lifeInformation.actions.ts   # Information notes & priority tags
│   │   ├── lifeLegacy.actions.ts        # Legacy messages & release conditions
│   │   ├── lifeMoney.actions.ts         # Money records, settlements & calculations
│   │   ├── lifePeople.actions.ts        # People directory & dossier data
│   │   ├── lifeSettings.actions.ts      # Master PIN, system settings & JSON export
│   │   └── lifeVault.actions.ts         # Vault secrets CRUD & decrypt action
│   ├── database/
│   │   ├── index.ts                     # MongoDB connection caching
│   │   └── models/                      # 14 Mongoose Data Models
│   └── life/
│       ├── auth.ts                      # Server-side auth context, RBAC & audit helper
│       └── crypto.ts                    # AES-256-GCM cipher/decipher implementation
├── public/
│   ├── manifest.json                    # Web App Manifest for mobile installation
│   ├── sw.js                            # Zero-cache security Service Worker
│   └── assets/images/                   # Logos, icons, and avatars
└── types/
    └── index.ts                         # Universal TypeScript interfaces & enums
```

---

## 3. Security, Cryptography & Access Control

The security model of LIFE is architected around confidentiality at rest, zero data leakage in transit or client-side caching, and role-based access.

### 3.1 Cryptographic Engine (`lib/life/crypto.ts`)
Vault items store sensitive passwords, API keys, private keys, router credentials, and bank pins. These secrets are protected via symmetric authenticated encryption:
- **Algorithm**: `aes-256-gcm` (Advanced Encryption Standard in Galois/Counter Mode).
- **Key Derivation**: 256-bit key generated from `LIFE_VAULT_ENCRYPTION_KEY` using SHA-256 hashing.
- **Initialization Vector (IV)**: A unique, cryptographically random 16-byte buffer (`crypto.randomBytes(16)`) is generated for every encryption operation.
- **Authentication Tag**: GCM produces a 16-byte authentication tag verifying data integrity. Any alteration to the ciphertext in the database causes decryption to fail.
- **Storage Fields**:
  - `encryptedSecret`: Hex-encoded ciphertext.
  - `secretIv`: Hex-encoded initialization vector.
  - `secretAuthTag`: Hex-encoded authentication tag.

### 3.2 Master PIN Verification & Auto-Concealment
1. **Server Verification**: When a user clicks "Reveal Secret" in the Vault, the client invokes `revealVaultSecret({ vaultItemId, pin })`.
2. **PIN Validation**: The server compares the provided PIN against the hashed PIN in `LifeSettings` (or environment fallback `LIFE_MASTER_PIN`). If invalid, an unauthorized audit log is recorded and an error is returned.
3. **Decryption on Demand**: Upon correct PIN validation, the secret is decrypted in server memory and returned directly to the client.
4. **Auto-Concealing Timer**: The UI opens the `VaultRevealModal`, which displays an animated 30-second countdown. When the timer hits zero, the secret is wiped from client component state.
5. **Tamper-Evident Audit**: Every reveal event is logged in `LifeActivityLog` with the viewer's user ID, name, email, IP context, and timestamp.

### 3.3 Zero-Cache Security Service Worker (`public/sw.js`)
PWA service workers typically cache API responses and static assets for offline usage. Because LIFE stores highly confidential records, caching sensitive data in browser-controlled caches creates security vulnerabilities on shared or stolen devices.

`public/sw.js` implements a strict **Zero-Cache Policy**:
```javascript
const SENSITIVE_PATTERNS = [
  '/vault',
  '/money',
  '/documents',
  '/people',
  '/legacy',
  '/access',
  '/activity',
  '/settings',
  '/api/'
];
```
Any network request matching these patterns is forced to bypass the cache and execute directly over network with `no-store` directives. Only public static assets (CSS, fonts, logos) are cached.

### 3.4 Multi-Tier Role-Based Access Control (RBAC)
User authorization is determined dynamically by `getLifeAuthContext()` in `lib/life/auth.ts`:

1. **Owner / Super Admin**:
   - First user who signs up automatically receives `super_admin` status in MongoDB.
   - Has unrestricted read/write/delete privileges across all modules, settings, and vault secrets.
2. **Admin**:
   - Delegated trustees who can manage business continuity, log money transactions, and view emergency instructions.
3. **Individual (Family / Loved Ones)**:
   - Linked to a `LifePerson` record. Can view their own personal dossier, private messages from the Owner, emergency contacts, and assigned tasks.
4. **Business Partner**:
   - Linked to specific `LifeBusiness` venture records. Can view assigned venture server notes, supplier contacts, and continuity checklists.
5. **Read-Only / Custom**:
   - Granular permissions (`canViewPersonal`, `canViewBusiness`, `canViewFinancial`, `canViewSensitive`, `canRevealVault`, `canManageAccess`, `canAccessEmergency`).

### 3.5 Emergency Mode Continuity Protocol
In the event of an accident, medical emergency, or sudden absence of the Owner:
- An authorized Admin or Owner activates **Emergency Mode** via `/access`.
- Activating Emergency Mode sets `isEmergencyActive = true` in `LifeEmergencyAccess`.
- Legacy letters marked with `releaseCondition: 'emergency_only'` immediately unlock for designated recipients.
- Business continuity checklists ("If I Am Not Available") become prominent alerts on the dashboard.
- Emergency contacts and contingency directives become globally visible to all active trustees.
- A critical tamper-evident alert is written to the activity audit log.

---

## 4. Module Specifications & Operational Workflows

### 4.1 Dashboard (`/`)
- **Route**: `app/(root)/page.tsx`
- **Component**: `components/life/dashboard/LifeDashboardClient.tsx`
- **Actions**: `lib/actions/lifeDashboard.actions.ts` (`getLifeDashboardData`)
- **Capabilities**:
  - Net financial balance card: Total Given, Total Taken, Net Position.
  - Active emergency mode status banner with 1-click trigger.
  - Attention cards: Overdue money settlements, unassigned continuity steps, high-priority emergency instructions.
  - Quick action floating shortcuts: New Person, Record Money, Add Secret, New Note.

### 4.2 People Directory & Dossier (`/people`, `/people/[id]`)
- **Routes**:
  - Directory: `app/(root)/people/page.tsx`
  - Dossier: `app/(root)/people/[id]/page.tsx`
- **Components**:
  - Directory: `components/life/people/PeopleClient.tsx`
  - Dossier: `components/life/people/PersonDetailClient.tsx`
- **Actions**: `lib/actions/lifePeople.actions.ts`
- **Dossier Tabs**:
  1. **Overview**: Contact info, relationship chip, status toggle (Active/Locked), quick action buttons (Call, WhatsApp, Email).
  2. **Personal Message**: Private letter or memo dedicated specifically to this person.
  3. **Financial**: All active money records (Given/Taken/Invested) involving this person with running balances.
  4. **Documents**: Identification cards, passports, contracts, and legal papers associated with them.
  5. **Contacts**: Relevant key contacts associated with this person (e.g., their doctor, lawyer, or emergency contact).
  6. **Responsibilities**: Action items and responsibilities they must assume if the Owner is absent.
  7. **Business Instructions**: Step-by-step procedures for handling joint business interests.
  8. **Access Rules**: Granular permissions controlling what this person can see when authenticated.

### 4.3 Money & Debt Ledger (`/money`)
- **Route**: `app/(root)/money/page.tsx`
- **Component**: `components/life/money/MoneyClient.tsx`
- **Actions**: `lib/actions/lifeMoney.actions.ts`
- **Capabilities**:
  - Filter by record type: `given` (Receivable), `taken` (Payable), `invest_made` (Investments in others), `invest_received` (Investments taken).
  - Status tracking: `active`, `partially_returned`, `returned`, `written_off`.
  - Record Settlements: Modal allowing partial or full repayments with payment method, transaction reference, and notes. Updates the parent record's `returnedAmount` and `status` automatically.
  - Summary metrics: Total Receivables, Total Payables, Active Investments, Net Cashflow balance.

### 4.4 Encrypted Secrets Vault (`/vault`)
- **Route**: `app/(root)/vault/page.tsx`
- **Component**: `components/life/vault/VaultClient.tsx`
- **Actions**: `lib/actions/lifeVault.actions.ts`
- **Capabilities**:
  - Secure storage for credentials, seed phrases, recovery codes, and router passwords.
  - Category filters: Credentials, Infrastructure, Financial, Personal, Emergency.
  - Reveal Modal with Master PIN prompt and 30-second auto-conceal countdown timer.
  - Direct 1-tap copy of username and revealed secret.

### 4.5 Business Continuity & Ventures (`/business`)
- **Route**: `app/(root)/business/page.tsx`
- **Component**: `components/life/business/BusinessClient.tsx`
- **Actions**: `lib/actions/lifeBusiness.actions.ts`
- **Capabilities**:
  - Venture cards showing Legal Name, Personal Ownership %, Monthly Expenses, and Partner List.
  - Server & Hosting Registry: Server IP, Hosting Provider, Control Panel URL, and Primary System Engineer Contact.
  - **"If I Am Not Available" Checklist**: Step-by-step ordered continuity steps with assigned responsible persons, contact phones, and execution instructions.

### 4.6 Asset Portfolio (`/assets`)
- **Route**: `app/(root)/assets/page.tsx`
- **Component**: `components/life/assets/AssetsClient.tsx`
- **Actions**: `lib/actions/lifeAsset.actions.ts`
- **Capabilities**:
  - Portfolio tracking across categories: Real Estate, Financial/Bank, Vehicle, Valuables/Gold, Business Equity, Other.
  - Records ownership percentage, purchase value, current estimated valuation, and physical location.
  - Total portfolio valuation calculator.

### 4.7 Emergency & Key Contacts (`/contacts`)
- **Route**: `app/(root)/contacts/page.tsx`
- **Component**: `components/life/contacts/ContactsClient.tsx`
- **Actions**: `lib/actions/lifeContact.actions.ts`
- **Capabilities**:
  - Fast-dial directory for Emergency Services, Family, Lawyers, Doctors, Accountants, and Engineers.
  - Direct 1-tap buttons: Call (`tel:`), WhatsApp message (`wa.me`), Email (`mailto:`), and Copy Phone.
  - Ranked emergency priority tags (Priority 1, Priority 2, Priority 3).

### 4.8 Critical Documents Library (`/documents`)
- **Route**: `app/(root)/documents/page.tsx`
- **Component**: `components/life/documents/DocumentsClient.tsx`
- **Actions**: `lib/actions/lifeDocument.actions.ts`
- **Capabilities**:
  - Repository for title deeds, contracts, tax certificates, wills, and identification documents.
  - Association with specific People or Business Ventures.
  - Access tier gating: `standard`, `confidential`, `emergency_only`.

### 4.9 Sealed Legacy Messages (`/legacy`)
- **Route**: `app/(root)/legacy/page.tsx`
- **Component**: `components/life/legacy/LegacyClient.tsx`
- **Actions**: `lib/actions/lifeLegacy.actions.ts`
- **Capabilities**:
  - Sealed letters, video links, and instructions addressed to specific loved ones or partners.
  - Release conditions:
    - `emergency_only`: Sealed until Emergency Mode is toggled ON.
    - `admin_can_release`: Sealed until an Admin explicitly releases it.
    - `scheduled_release`: Sealed until a designated calendar date.
    - `released`: Open for viewing.
  - Clean, immersive reading interface for viewing released messages.

### 4.10 Access Delegation & Emergency Mode (`/access`)
- **Route**: `app/(root)/access/page.tsx`
- **Component**: `components/life/access/AccessClient.tsx`
- **Actions**: `lib/actions/lifeAccess.actions.ts`
- **Capabilities**:
  - Master Emergency Mode toggle with confirmation modal and emergency broadcast notes.
  - Delegation of Primary Admin and Secondary Admin trustees.
  - Granular permissions grid controlling module access per person.

### 4.11 Tamper-Evident Security Audit (`/activity`)
- **Route**: `app/(root)/activity/page.tsx`
- **Component**: `components/life/activity/ActivityClient.tsx`
- **Actions**: `lib/actions/lifeActivity.actions.ts`
- **Capabilities**:
  - Immutable timeline of actions: Secret Revealed, Money Created/Settled, Emergency Mode Toggled, Person Locked/Unlocked, Access Modified.
  - Filters by Action Type and Resource.
  - Details include Actor Email, Role, IP context, and exact timestamps.

### 4.12 Settings, Master PIN & Backups (`/settings`)
- **Route**: `app/(root)/settings/page.tsx`
- **Component**: `components/life/settings/SettingsClient.tsx`
- **Actions**: `lib/actions/lifeSettings.actions.ts`
- **Capabilities**:
  - Configure or change Master Security PIN.
  - PWA diagnostic panel: Service worker status, offline cache status, install state.
  - Complete JSON Backup Export: Downloads a single structured, encrypted JSON file containing all system data for offline cold-storage backup.

---

## 5. Database Schema & Data Dictionary

All schemas reside in `lib/database/models/`:

### 5.1 `LifePerson` (`lifePerson.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `String` (Required) | Full name of the individual |
| `relation` | `String` (Required) | Relationship (e.g. Wife, Brother, Business Partner, Engineer) |
| `phone` | `String` | Contact phone number |
| `whatsapp` | `String` | WhatsApp direct contact number |
| `email` | `String` | Email address (used for auth matching) |
| `avatarUrl` | `String` | URL or path to avatar image |
| `status` | `String` (Enum) | `active`, `locked`, `archived` (Default: `active`) |
| `role` | `String` (Enum) | `owner`, `admin`, `individual`, `business`, `read_only` |
| `permissions` | `Object` | Granular boolean permission flags |
| `emergencyPriority`| `Number` | Calling order in emergencies (1 = First call) |
| `personalMessage` | `String` | Private message dedicated to this person |
| `responsibilities` | `[String]` | List of responsibilities delegated to this person |
| `businessInstructions`| `[String]`| List of operational directives for this person |
| `clerkUserId` | `String` | Synced Clerk user ID for authentication linkage |

### 5.2 `LifeMoneyRecord` (`lifeMoneyRecord.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | `String` (Enum) | `given`, `taken`, `invest_made`, `invest_received` |
| `title` | `String` (Required) | Short description of the loan/investment |
| `personId` | `ObjectId` (Ref) | Reference to `LifePerson` |
| `personName` | `String` | Denormalized person name for fast lookup |
| `amount` | `Number` (Required) | Principal monetary amount |
| `returnedAmount` | `Number` | Total amount returned/settled to date |
| `currency` | `String` | Currency code (Default: `BDT`) |
| `date` | `Date` | Transaction origination date |
| `dueDate` | `Date` | Expected return/maturity date |
| `status` | `String` (Enum) | `active`, `partially_returned`, `returned`, `written_off` |
| `notes` | `String` | Contextual notes and terms |

### 5.3 `LifeSettlement` (`lifeSettlement.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `moneyRecordId` | `ObjectId` (Ref) | Reference to parent `LifeMoneyRecord` |
| `amount` | `Number` (Required) | Amount paid in this settlement installment |
| `date` | `Date` | Date of settlement payment |
| `paymentMethod` | `String` | Bank transfer, Cash, bKash, Cheque |
| `reference` | `String` | Bank transaction ID / Receipt number |
| `notes` | `String` | Additional repayment notes |

### 5.4 `LifeVaultItem` (`lifeVaultItem.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `String` (Required) | Secret title (e.g. "Primary AWS Root Key") |
| `category` | `String` (Enum) | `credentials`, `infrastructure`, `financial`, `personal`, `emergency` |
| `username` | `String` | Associated username / email |
| `encryptedSecret`| `String` (Required) | AES-256-GCM hex ciphertext |
| `secretIv` | `String` (Required) | 16-byte hex initialization vector |
| `secretAuthTag` | `String` (Required) | 16-byte hex GCM authentication tag |
| `url` | `String` | Associated login or management URL |
| `notes` | `String` | Recovery instructions or hint |
| `isEmergency` | `Boolean` | Accessible during Emergency Mode |

### 5.5 `LifeBusiness` (`lifeBusiness.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `String` (Required) | Business / Venture name |
| `legalName` | `String` | Formal legal company name |
| `ownershipPercentage`| `Number` | Owner's percentage stake |
| `status` | `String` (Enum) | `active`, `inactive`, `pending` |
| `partners` | `[Object]` | Partner names, person IDs, and stakes |
| `serverInfo` | `Object` | Hosting, domain, IP, serverType, dashboardUrl |
| `engineerContact` | `Object` | Name, phone, email of primary engineer |
| `supplierContact` | `Object` | Name, phone, email of primary supplier |
| `continuitySteps` | `[Object]` | Ordered contingency steps with responsible person & phone |

### 5.6 `LifeAsset` (`lifeAsset.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `String` (Required) | Asset title (e.g. "Dhanmondi Apartment") |
| `category` | `String` (Enum) | `real_estate`, `financial`, `vehicle`, `valuables`, `business`, `other` |
| `estimatedValue` | `Number` | Current market value |
| `ownershipPercentage`| `Number` | Ownership stake (0-100%) |
| `location` | `String` | Physical address or bank branch |
| `accountNumber` | `String` | Bank account / Deed registration number |

### 5.7 `LifeLegacyMessage` (`lifeLegacyMessage.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `String` (Required) | Letter subject |
| `recipientPersonId` | `ObjectId` (Ref) | Designated recipient (`LifePerson`) |
| `content` | `String` (Required) | Message body / last words / instructions |
| `releaseCondition` | `String` (Enum) | `emergency_only`, `admin_can_release`, `scheduled_release`, `released` |
| `scheduledReleaseDate`| `Date` | Release date (if condition is scheduled) |
| `isSealed` | `Boolean` | Whether letter is sealed from view |

### 5.8 `LifeActivityLog` (`lifeActivityLog.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `actorEmail` | `String` | Email of user performing action |
| `actorName` | `String` | Full name of user |
| `actorRole` | `String` | Role at time of action |
| `action` | `String` | Action verb (e.g. `reveal_secret`, `emergency_activated`) |
| `resourceType` | `String` | Target resource (`vault`, `money`, `person`, etc.) |
| `resourceId` | `String` | Target resource ID |
| `resourceName` | `String` | Human-readable name of resource |
| `details` | `String` | Detailed operational narrative |
| `timestamp` | `Date` | Indexed execution timestamp |

---

## 6. Server Actions Reference (`lib/actions/`)

All database mutations and queries are implemented as Next.js Server Actions with strict auth verification:

| Action File | Key Functions | Description |
| :--- | :--- | :--- |
| `lifeDashboard.actions.ts` | `getLifeDashboardData()` | Aggregates finances, continuity state, and attention items |
| `lifePeople.actions.ts` | `getPeople()`, `getPersonById()`, `createPerson()`, `updatePerson()`, `deletePerson()` | Manages directory and 8-tab dossier data |
| `lifeMoney.actions.ts` | `getMoneyRecords()`, `createMoneyRecord()`, `updateMoneyRecord()`, `deleteMoneyRecord()`, `recordSettlement()` | Financial ledger, debt records, and settlement installments |
| `lifeVault.actions.ts` | `getVaultItems()`, `createVaultItem()`, `updateVaultItem()`, `deleteVaultItem()`, `revealVaultSecret()` | AES-256-GCM encrypted secrets CRUD and PIN verification |
| `lifeBusiness.actions.ts` | `getBusinesses()`, `getBusinessById()`, `createBusiness()`, `updateBusiness()`, `addContinuityStep()`, `toggleContinuityStep()` | Ventures, hosting records, and contingency checklists |
| `lifeAsset.actions.ts` | `getAssets()`, `createAsset()`, `updateAsset()`, `deleteAsset()` | Asset portfolio registry and valuations |
| `lifeContact.actions.ts` | `getContacts()`, `createContact()`, `updateContact()`, `deleteContact()` | Emergency contacts with priority ranking |
| `lifeDocument.actions.ts` | `getDocuments()`, `createDocument()`, `updateDocument()`, `deleteDocument()` | Critical document repository |
| `lifeLegacy.actions.ts` | `getLegacyMessages()`, `createLegacyMessage()`, `updateLegacyMessage()`, `releaseLegacyMessage()` | Condition-released legacy messages |
| `lifeInformation.actions.ts`| `getInformation()`, `createInformation()`, `updateInformation()`, `deleteInformation()` | Categorized notes and priority directives |
| `lifeAccess.actions.ts` | `getAccessState()`, `toggleEmergencyMode()`, `updatePersonPermissions()`, `setPrimaryAdmin()` | Emergency mode switch and granular RBAC |
| `lifeActivity.actions.ts` | `getActivityLogs()` | Immutable security audit query |
| `lifeSettings.actions.ts` | `getLifeSettings()`, `setMasterPin()`, `exportFullSystemData()` | Master PIN configuration and complete JSON backup export |

---

## 7. PWA Architecture & Mobile Experience

LIFE is optimized for installation as a standalone mobile Progressive Web App.

### Key PWA Features:
1. **App Shell**:
   - `LifeBottomNav`: Persistent bottom navigation on mobile devices with tabs for `Home`, `People`, `Money`, `Vault`, and `More`.
   - `LifeHeader`: Compact mobile app bar displaying the official brand logo, global search button (`⌘K`), emergency mode indicator badge, and user avatar.
   - `LifeSidebar`: Collapsible sidebar on desktop displays with grouped navigation (Core, Security & Vault, Continuity, System).
2. **Web App Manifest (`public/manifest.json`)**:
   - `display: standalone` removes browser chrome for native app look.
   - `theme_color`: Tailored dark theme color `#0a0f1d`.
   - Responsive launcher icons: 192x192 and 512x512 maskable PNGs.
3. **PWA Lifecycle Provider (`components/life/PWAProvider.tsx`)**:
   - Listens for `beforeinstallprompt` to present native-feeling install prompts.
   - Monitors `navigator.onLine` to display real-time offline warning badges.
   - Coordinates service worker registration and updates.

---

## 8. Deployment, Operations & Disaster Recovery

### Environment Variables
Ensure all variables are configured in `.env.local` or your production deployment environment:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/life?retryWrites=true&w=majority

# Security Keys
LIFE_VAULT_ENCRYPTION_KEY=super-secure-32-char-random-key-here
LIFE_MASTER_PIN=1234
```

### First-Time Initialization
1. Deploy application and start the server (`npm run build && npm start`).
2. Navigate to the app URL and sign up via Clerk.
3. The system detects zero registered admins in MongoDB and automatically creates an `Admin` record for the first signed-in user with role `super_admin`.
4. Go to `/settings` and set your personal 4-to-6 digit Master Security PIN.

### Disaster Recovery & Cold-Storage Backups
To protect against database loss or cloud provider failure:
1. Navigate to `/settings`.
2. Click **Export Complete Encrypted JSON Backup**.
3. The server generates a timestamped, comprehensive snapshot of all collections (People, Money, Assets, Businesses, Contacts, Documents, Vault Ciphertexts, Legacy Messages, Settings).
4. Save this `.json` file to an encrypted offline storage device (e.g. an encrypted USB drive or cold-storage vault).
