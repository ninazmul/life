// ============================================================
// LIFE — Personal Legacy, Secure Information & Continuity Types
// ============================================================

export type LifeRole =
  | "owner"
  | "guardian"
  | "administrator"
  | "business_partner"
  | "responsible_person"
  | "beneficiary"
  | "read_only"
  // Legacy compatibility:
  | "super_admin"
  | "admin"
  | "individual"
  | "business"
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

export type AccountStatus =
  | "invited"
  | "active"
  | "temporarily_locked"
  | "disabled"
  | "archived"
  | "locked";

export type GuardianType = "primary" | "secondary" | "independent";

export type ApprovalRule =
  | "one_guardian"
  | "two_guardians"
  | "any_two_of_three"
  | "owner_manual"
  | "guardian_with_waiting";

export type VisibilityMode =
  | "owner_only"
  | "available_now"
  | "emergency_only"
  | "after_death_only"
  | "emergency_or_after_death"
  | "manual_release"
  | "scheduled_release"
  | "hidden_draft"
  | "revoked_archived"
  // Legacy compatibility:
  | "visible_now"
  | "hidden"
  | "admin_can_release";

export interface ILifePerson {
  _id: string;
  name: string;
  relation: string; // e.g., Wife, Brother, Parents, Sabbir, Sana, Business Partner, Engineer, Staff, Other
  designation?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  country?: string;
  address?: string;
  username?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  status: PersonStatus;
  accountStatus?: AccountStatus;
  role: LifeRole;
  userRole?: LifeRole;
  guardianStatus?: boolean;
  guardianType?: GuardianType;
  permissions: LifePermission;
  emergencyPriority?: number;
  personalMessage?: string;
  responsibilities?: string[];
  businessInstructions?: string[];
  notes?: string;
  generalNotes?: string;
  lastLogin?: Date | string;
  lastActivity?: Date | string;
  isLoginEnabled?: boolean;
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
  ownerSafetyStatus?: "safe" | "emergency" | "check_in_overdue";
  emergencyModeStatus?: string;
  trustedGuardiansCount?: number;
  pendingAccessRequestsCount?: number;
  pendingResponsibilitiesCount?: number;
  businessContinuityReadiness?: number;
  upcomingPaymentsCount?: number;
  overduePaymentsCount?: number;
  expiringDocumentsCount?: number;
  securityAlertsCount?: number;
  lastBackupDate?: Date | string;
  currencyTotals?: Record<string, { given: number; repaid: number; remaining: number }>;
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

// ============================================================
// Life Vault — Enhanced Modules & Security Types
// ============================================================

export type EmergencyReason =
  | "owner_seriously_ill"
  | "owner_hospitalized"
  | "owner_unreachable"
  | "owner_missing"
  | "owner_unable_to_decide"
  | "owner_deceased"
  | "other";

export type EmergencyStatus =
  | "draft"
  | "pending_approval"
  | "partially_approved"
  | "waiting_period"
  | "activated"
  | "rejected"
  | "cancelled"
  | "expired"
  | "closed";

export interface ILifeGuardianConfig {
  _id?: string;
  approvalRule: ApprovalRule;
  defaultWaitingPeriodHours: number;
  ownerAlertChannels: ("email" | "sms")[];
  isActive: boolean;
}

export interface ILifeGuardian {
  _id: string;
  personId: string | ILifePerson;
  guardianType: GuardianType;
  isActive: boolean;
  assignedDate: Date | string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ILifeEmergencyApproval {
  guardianPersonId: string;
  guardianName?: string;
  guardianEmail?: string;
  action: "approve" | "reject";
  date: Date | string;
  note?: string;
}

export interface ILifeEmergencyRequest {
  _id: string;
  requestedByPersonId: string;
  requestedByName: string;
  requestedByEmail: string;
  reason: EmergencyReason;
  reasonDetails: string;
  supportingDocuments?: string[];
  status: EmergencyStatus;
  approvals: ILifeEmergencyApproval[];
  waitingPeriodStart?: Date | string;
  waitingPeriodEnd?: Date | string;
  ownerAlertSent: boolean;
  ownerCancelledAt?: Date | string;
  releasedRecordIds?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type RecordType =
  | "financial_support"
  | "business"
  | "responsibility"
  | "document"
  | "vault_item"
  | "legacy_message"
  | "instruction"
  | "contact"
  | "asset";

export interface ILifeRecordPermission {
  _id?: string;
  recordId: string;
  recordType: RecordType;
  assignedPersonId: string;
  visibilityMode: VisibilityMode;
  releaseCondition?: string;
  guardianApprovalRequired: boolean;
  requiredApprovals: number;
  waitingPeriodHours: number;
  effectiveDate?: Date | string;
  expiryDate?: Date | string;
  canView: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canShare: boolean;
  reVerificationRequired: boolean;
  isReleased: boolean;
  releasedAt?: Date | string;
  releasedBy?: string;
}

// Responsibilities (§6)
export type ResponsibilityPriority = "low" | "medium" | "high" | "critical";
export type ResponsibilityStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "completed"
  | "unable_to_complete";

export type UserResponsibilityResponse =
  | "read"
  | "understand"
  | "accept"
  | "need_clarification"
  | "cannot_perform";

export interface ILifeResponsibility {
  _id: string;
  title: string;
  detailedInstruction: string;
  relatedBusinessId?: string | ILifeBusiness;
  assignedPersonId: string | ILifePerson;
  backupPersonId?: string | ILifePerson;
  priority: ResponsibilityPriority;
  startDate?: Date | string;
  deadline?: Date | string;
  relatedContactId?: string | ILifeContact;
  relatedDocumentId?: string | ILifeDocument;
  relatedVaultItemId?: string | ILifeVaultItem;
  completionStatus: ResponsibilityStatus;
  ownerNote?: string;
  userResponse?: UserResponsibilityResponse;
  userResponseNote?: string;
  responseDate?: Date | string;
  responseDevice?: string;
  visibilityMode: VisibilityMode;
  releaseCondition?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Financial Support (§9 - §16)
export type FinancialSupportType =
  | "repayable_support"
  | "personal_loan"
  | "salary_advance"
  | "business_advance"
  | "emergency_support"
  | "medical_support"
  | "family_support"
  | "gift"
  | "conditional_gift"
  | "investment"
  | "other";

export type FinancialSupportStatus =
  | "active"
  | "repayment_not_started"
  | "partially_repaid"
  | "fully_repaid"
  | "overdue"
  | "paused"
  | "extended"
  | "waived"
  | "converted_to_gift"
  | "gift"
  | "closed"
  | "disputed"
  | "cancelled";

export type InstallmentFrequency =
  | "monthly"
  | "weekly"
  | "yearly"
  | "one_time"
  | "custom";

export type InstallmentStatus =
  | "upcoming"
  | "due"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "waived"
  | "rescheduled";

export type PaymentConfirmationStatus =
  | "submitted"
  | "pending_confirmation"
  | "approved"
  | "rejected"
  | "correction_required";

export interface ILifeGiftConversion {
  amount: number;
  conversionType: "partial" | "full";
  previousRemaining: number;
  newRemaining: number;
  conversionDate: Date | string;
  ownerNote?: string;
  supportingDocument?: string;
  createdAt: Date | string;
}

export interface ILifeFinancialSupport {
  _id: string;
  title: string;
  recipientPersonId: string | ILifePerson;
  supportType: FinancialSupportType;
  relatedBusinessId?: string | ILifeBusiness;
  totalAmount: number;
  currency: string;
  givenDate: Date | string;
  paymentMethod: string;
  transactionReference?: string;
  purpose?: string;
  repayableOrNot: boolean;
  repaymentStartDate?: Date | string;
  installmentFrequency?: InstallmentFrequency;
  installmentAmount?: number;
  numberOfInstallments?: number;
  dueDate?: Date | string;
  gracePeriod?: number; // in days
  totalRepaid: number;
  remainingBalance: number;
  nextPaymentDate?: Date | string;
  status: FinancialSupportStatus;
  supportingDocument?: string;
  ownerPrivateNote?: string;
  recipientVisibleNote?: string;
  visibilityMode: VisibilityMode;
  createdBy: string;
  giftConversions?: ILifeGiftConversion[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ILifeInstallment {
  _id: string;
  financialSupportId: string;
  installmentNumber: number;
  dueDate: Date | string;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate?: Date | string;
  paymentMethod?: string;
  transactionReference?: string;
  receiptUrl?: string;
  status: InstallmentStatus;
  note?: string;
  previousVersions?: Array<{
    expectedAmount: number;
    dueDate: Date | string;
    changedAt: Date | string;
    reason?: string;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ILifePaymentConfirmation {
  _id: string;
  financialSupportId: string;
  installmentId?: string;
  submittedByPersonId: string;
  submittedByName: string;
  amount: number;
  currency: string;
  paymentDate: Date | string;
  paymentMethod: string;
  transactionReference?: string;
  receiptUrl?: string;
  status: PaymentConfirmationStatus;
  reviewedBy?: string;
  reviewedAt?: Date | string;
  reviewNote?: string;
  createdAt: Date | string;
}

export interface ILifeFinancialHistory {
  _id: string;
  financialSupportId: string;
  eventType:
    | "support_created"
    | "amount_received"
    | "schedule_added"
    | "installment_paid"
    | "due_date_changed"
    | "payment_paused"
    | "amount_waived"
    | "converted_to_gift"
    | "fully_repaid"
    | "record_closed"
    | "correction";
  description: string;
  amount?: number;
  previousValue?: string | number;
  newValue?: string | number;
  performedBy: string;
  performedByName?: string;
  createdAt: Date | string;
}

// Business & Partnership (§18, §19)
export interface ILifeShareHistory {
  _id: string;
  businessId: string;
  personId: string | ILifePerson;
  personName?: string;
  previousShare: number;
  newShare: number;
  effectiveDate: Date | string;
  reason: string;
  supportingAgreement?: string;
  approvedBy: string;
  witnessVerifier?: string;
  previousVersionSnapshot?: string;
  createdAt: Date | string;
}

export interface ILifeBusinessContinuity {
  first24Hours?: string;
  first7Days?: string;
  contactListInstructions?: string;
  serverMaintenanceInstructions?: string;
  staffSalaryResponsiblePersonId?: string;
  supplierPaymentResponsiblePersonId?: string;
  customerSupportResponsiblePersonId?: string;
  importantAccountAccessInstructions?: string;
  soloDecisionRestrictions?: string;
  maxApprovedExpense?: number;
  continuityDirection?: "operate" | "transfer" | "sell";
  notes?: string;
}

// Instructions (§20)
export type InstructionType =
  | "personal"
  | "family"
  | "business"
  | "financial"
  | "emergency"
  | "medical"
  | "property"
  | "digital_accounts"
  | "employee_salary"
  | "religious_funeral"
  | "final_wishes"
  | "other";

export interface ILifeInstruction {
  _id: string;
  title: string;
  detailedInstruction: string;
  instructionType: InstructionType;
  assignedPersonId?: string | ILifePerson;
  backupPersonId?: string | ILifePerson;
  priority: ResponsibilityPriority;
  relatedBusinessId?: string | ILifeBusiness;
  relatedContactId?: string | ILifeContact;
  relatedDocumentId?: string | ILifeDocument;
  visibilityMode: VisibilityMode;
  releaseCondition?: string;
  effectiveDate?: Date | string;
  reviewDate?: Date | string;
  status: "active" | "draft" | "archived";
  versionHistory?: Array<{
    version: number;
    content: string;
    updatedAt: Date | string;
    updatedBy: string;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}
