// ============================================================
// LIFE — Personal Legacy, Secure Information & Continuity Types
// ============================================================

export type LifeRole =
  | "owner"
  | "super_admin"
  | "admin"
  | "individual"
  | "business"
  | "read_only"
  | "custom";

export interface LifePermission {
  canViewPersonal: boolean;
  canViewBusiness: boolean;
  canViewFinancial: boolean;
  canViewSensitive: boolean;
  canRevealVault: boolean;
  canManageAccess: boolean;
  canAccessEmergency: boolean;
  allowedPersonIds?: string[];
  allowedBusinessIds?: string[];
}

export type PersonStatus = "active" | "locked" | "archived";

export interface ILifePerson {
  _id: string;
  name: string;
  relation: string; // e.g., Wife, Brother, Parents, Sabbir, Sana, Business Partner, Engineer, Staff, Other
  phone?: string;
  whatsapp?: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  status: PersonStatus;
  role: LifeRole;
  permissions: LifePermission;
  emergencyPriority?: number;
  personalMessage?: string;
  responsibilities?: string[];
  businessInstructions?: string[];
  notes?: string;
  clerkUserId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type LifeInfoCategory =
  | "personal"
  | "business"
  | "instruction"
  | "emergency"
  | "other";

export type LifePriority = "low" | "medium" | "high" | "critical";

export type LifeVisibility =
  | "visible_now"
  | "hidden"
  | "admin_can_release"
  | "emergency_only"
  | "scheduled_release";

export interface ILifeInformation {
  _id: string;
  title: string;
  summary?: string;
  content: string;
  category: LifeInfoCategory;
  relatedPersonId?: string | ILifePerson;
  relatedBusinessId?: string | ILifeBusiness;
  priority: LifePriority;
  visibility: LifeVisibility;
  scheduledReleaseDate?: Date | string;
  isEmergency: boolean;
  attachments?: string[];
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ILifeContinuityStep {
  id: string;
  order: number;
  title: string;
  description?: string;
  responsiblePersonId?: string | ILifePerson;
  responsiblePersonName?: string;
  contactPhone?: string;
  instructions?: string;
  documents?: string[];
  isCompleted: boolean;
}

export interface ILifeBusiness {
  _id: string;
  name: string;
  legalName?: string;
  ownershipPercentage: number;
  status: "active" | "inactive" | "pending";
  partners: Array<{
    name: string;
    personId?: string | ILifePerson;
    ownershipPercentage: number;
    role?: string;
  }>;
  serverInfo?: {
    hosting?: string;
    domain?: string;
    ip?: string;
    serverType?: string;
    dashboardUrl?: string;
    notes?: string;
  };
  engineerContact?: {
    name?: string;
    phone?: string;
    email?: string;
    personId?: string;
  };
  supplierContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  monthlyExpenses?: number;
  outstandingPayments?: number;
  receivables?: number;
  agreements?: Array<{
    title: string;
    fileUrl: string;
    date?: string;
  }>;
  instructions?: string;
  continuitySteps: ILifeContinuityStep[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type LifeMoneyType =
  | "given"
  | "taken"
  | "invest_made"
  | "invest_received";

export type LifeMoneyStatus =
  | "active"
  | "partially_returned"
  | "fully_returned"
  | "overdue"
  | "written_off"
  | "closed";

export interface ILifeSettlement {
  _id: string;
  moneyRecordId: string;
  amount: number;
  date: Date | string;
  paymentMethod: "cash" | "bank_transfer" | "bkash" | "nagad" | "cheque" | "other";
  reference?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: Date | string;
}

export interface ILifeMoneyRecord {
  _id: string;
  type: LifeMoneyType;
  personId?: string | ILifePerson;
  personName?: string;
  organization?: string;
  businessId?: string | ILifeBusiness;
  amount: number;
  currency: string;
  date: Date | string;
  purpose?: string;
  expectedReturnDate?: Date | string;
  interestRate?: string | number;
  profitShare?: string | number;
  ownershipPercentage?: number;
  paidAmount: number;
  remainingAmount: number;
  status: LifeMoneyStatus;
  notes?: string;
  attachments?: string[];
  settlements?: ILifeSettlement[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type LifeTransactionType =
  | "money_in"
  | "money_out"
  | "loan_given"
  | "loan_received"
  | "loan_repayment"
  | "invest_made"
  | "invest_received"
  | "invest_return"
  | "expense"
  | "income"
  | "other";

export interface ILifeTransaction {
  _id: string;
  amount: number;
  type: LifeTransactionType;
  date: Date | string;
  personId?: string | ILifePerson;
  personName?: string;
  businessId?: string | ILifeBusiness;
  category?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  attachment?: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
  createdAt: Date | string;
}

export type AssetCategory =
  | "cash"
  | "bank_balance"
  | "business_investment"
  | "property"
  | "vehicle"
  | "equipment"
  | "valuable"
  | "other";

export interface ILifeAsset {
  _id: string;
  name: string;
  category: AssetCategory;
  value: number;
  currency: string;
  ownershipPercentage: number;
  location?: string;
  relatedPersonId?: string | ILifePerson;
  relatedBusinessId?: string | ILifeBusiness;
  documents?: string[];
  notes?: string;
  status: "active" | "disposed" | "pledged";
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type ContactCategory =
  | "family"
  | "business_partner"
  | "engineer"
  | "supplier"
  | "bank"
  | "lawyer"
  | "accountant"
  | "employee"
  | "doctor"
  | "other";

export interface ILifeContact {
  _id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  role?: string;
  category: ContactCategory;
  notes?: string;
  whenToContact?: string;
  relatedPersonId?: string | ILifePerson;
  relatedBusinessId?: string | ILifeBusiness;
  createdAt: Date | string;
}

export type DocumentCategory =
  | "agreement"
  | "receipt"
  | "business"
  | "property"
  | "bank"
  | "loan"
  | "identity"
  | "medical"
  | "other";

export interface ILifeDocument {
  _id: string;
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  relatedPersonId?: string | ILifePerson;
  relatedBusinessId?: string | ILifeBusiness;
  assignedToPersonIds?: string[];
  visibility: LifeVisibility;
  notes?: string;
  createdAt: Date | string;
}

export type VaultCategory =
  | "website"
  | "business"
  | "hosting"
  | "domain"
  | "email"
  | "router"
  | "server"
  | "pin"
  | "recovery"
  | "other";

export interface ILifeVaultItem {
  _id: string;
  title: string;
  systemOrWebsite?: string;
  url?: string;
  username?: string;
  encryptedSecret: string;
  secretIv: string;
  secretAuthTag: string;
  recoveryInfo?: string;
  category: VaultCategory;
  ownerPersonId?: string;
  assignedToPersonIds?: string[];
  notes?: string;
  lastUpdated: Date | string;
  createdAt: Date | string;
}

export interface ILifeLegacyMessage {
  _id: string;
  title: string;
  recipientPersonId: string | ILifePerson;
  recipientName: string;
  message: string;
  attachments?: string[];
  visibility: LifeVisibility;
  releaseCondition: string;
  scheduledDate?: Date | string;
  isReleased: boolean;
  releasedAt?: Date | string;
  releasedBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ILifeEmergencyAccess {
  _id: string;
  isEmergencyActive: boolean;
  activatedBy?: string;
  activatedAt?: Date | string;
  primaryAdminEmail: string;
  secondaryAdminEmail?: string;
  reason?: string;
  instructions?: string;
  updatedAt: Date | string;
}

export interface ILifeActivityLog {
  _id: string;
  actorEmail: string;
  actorName?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date | string;
}

export interface LifeDashboardStats {
  peopleCount: number;
  infoCount: number;
  businessCount: number;
  assetsTotalValue: number;
  moneyGivenTotal: number;
  moneyGivenRemaining: number;
  moneyTakenTotal: number;
  moneyTakenRemaining: number;
  investedTotal: number;
  investmentReceivedTotal: number;
  receivablesTotal: number;
  payablesTotal: number;
  urgentItems: Array<{
    id: string;
    title: string;
    category: string;
    dueText?: string;
    severity: "high" | "medium" | "low";
    link: string;
  }>;
  recentActivities: ILifeActivityLog[];
}

// ------------------------------------------------------------
// Core Administrative / RBAC legacy compatibility
// ------------------------------------------------------------

export type AdminRole =
  | "super_admin"
  | "admin"
  | "editor"
  | "moderator"
  | "viewer"
  | "custom";

export type PermissionLevel = "none" | "read" | "write";

export type AppModule =
  | "life"
  | "people"
  | "information"
  | "business"
  | "money"
  | "assets"
  | "contacts"
  | "documents"
  | "vault"
  | "legacy"
  | "access"
  | "activity"
  | "settings";

export type ModulePermissions = Record<AppModule, PermissionLevel>;

export interface IAdminUser {
  _id: string;
  email: string;
  name?: string;
  role: AdminRole;
  permissions?: Partial<ModulePermissions>;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type Admin = IAdminUser;
