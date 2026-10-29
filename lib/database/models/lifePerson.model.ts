import mongoose, { Schema, Document } from "mongoose";
import { LifeRole, PersonStatus, AccountStatus, GuardianType } from "@/types";
import { softDeletePlugin } from "../plugins/softDelete";

export interface ILifePersonDoc extends Document {
  name: string;
  relation: string;
  designation?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  country?: string;
  address?: string;
  permanentAddress?: string;
  username?: string;
  displayName?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  nationality?: string;
  about?: string;
  preferredName?: string;
  bloodGroup?: string;
  allergies?: string;
  hasNoAllergies?: boolean;
  medicalConditions?: string;
  currentMedicines?: string;
  medicalHistory?: Array<{
    id: string;
    title: string;
    condition: string;
    dateRange: string;
    hospitalOrDoctor?: string;
    notes?: string;
    linkedReportId?: string;
  }>;
  emergencyRelationship?: string;
  isEmergencyPrimary?: boolean;
  status: PersonStatus;
  accountStatus?: AccountStatus;
  role: LifeRole;
  userRole?: LifeRole;
  guardianStatus?: boolean;
  guardianType?: GuardianType;
  supportRoles?: string[];
  permissions: {
    canViewPersonal: boolean;
    canViewBusiness: boolean;
    canViewFinancial: boolean;
    canViewSensitive: boolean;
    canRevealVault: boolean;
    canManageAccess: boolean;
    canAccessEmergency: boolean;
    allowedPersonIds?: string[];
    allowedBusinessIds?: string[];
    allowedCategoryKeys?: string[];
    allowedSubcategoryIds?: string[];
    crud?: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }>;
    notesAccessScope?: "all" | "assigned_only" | "none";
    canManageSecretNotes?: boolean;
  };
  emergencyPriority?: number;
  personalMessage?: string;
  responsibilities?: string[];
  businessInstructions?: string[];
  notes?: string;
  generalNotes?: string;
  lastLogin?: Date;
  lastActivity?: Date;
  isLoginEnabled?: boolean;
  isRecordOnly?: boolean;
  clerkUserId?: string;
  socialLinks?: {
    facebook?: string;
    messenger?: string;
    instagram?: string;
    tiktok?: string;
    telegram?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
  };
  category?: string;
  registrationStatus?:
    | "not_invited"
    | "invitation_sent"
    | "invite_expired"
    | "active_user"
    | "disabled";
  tags?: string[];
  connections?: string[];
  isImportant?: boolean;
  isEmergencyContact?: boolean;
  shortNote?: string;
  ownerNote?: string;
  invitationSentAt?: Date;
  invitationExpiresAt?: Date;
  invitationToken?: string;
  invitationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifePersonSchema = new Schema<ILifePersonDoc>(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    whatsapp: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    country: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    permanentAddress: { type: String, trim: true, default: "" },
    username: { type: String, trim: true, default: "" },
    displayName: { type: String, trim: true, default: "" },
    dateOfBirth: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
    nationality: { type: String, trim: true, default: "" },
    about: { type: String, trim: true, default: "" },
    preferredName: { type: String, trim: true, default: "" },
    bloodGroup: { type: String, trim: true, default: "" },
    allergies: { type: String, trim: true, default: "" },
    hasNoAllergies: { type: Boolean, default: false },
    medicalConditions: { type: String, trim: true, default: "" },
    currentMedicines: { type: String, trim: true, default: "" },
    medicalHistory: [
      {
        id: { type: String },
        title: { type: String },
        condition: { type: String },
        dateRange: { type: String },
        hospitalOrDoctor: { type: String },
        notes: { type: String },
        linkedReportId: { type: String },
      },
    ],
    emergencyRelationship: { type: String, trim: true, default: "" },
    isEmergencyPrimary: { type: Boolean, default: false },
    category: {
      type: String,
      default: "Family",
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: [
        "not_invited",
        "invitation_sent",
        "invite_expired",
        "active_user",
        "disabled",
      ],
      default: "not_invited",
      index: true,
    },
    tags: [{ type: String }],
    connections: [{ type: String }],
    isImportant: { type: Boolean, default: false },
    isEmergencyContact: { type: Boolean, default: false },
    shortNote: { type: String, trim: true, default: "" },
    ownerNote: { type: String, trim: true, default: "" },
    invitationSentAt: { type: Date },
    invitationExpiresAt: { type: Date },
    invitationToken: { type: String },
    invitationUrl: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "locked", "disabled", "archived"],
      default: "active",
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ["active", "locked", "disabled", "archived", "invited", "temporarily_locked"],
      default: "active",
      index: true,
    },
    isLoginEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    isRecordOnly: {
      type: Boolean,
      default: false,
      index: true,
    },
    role: {
      type: String,
      default: "individual",
    },
    userRole: {
      type: String,
      default: "responsible_person",
    },
    guardianStatus: { type: Boolean, default: false, index: true },
    guardianType: {
      type: String,
      enum: ["primary", "secondary", "independent", ""],
      default: "",
    },
    supportRoles: [{ type: String, index: true }],
    permissions: {
      canViewPersonal: { type: Boolean, default: false },
      canViewBusiness: { type: Boolean, default: false },
      canViewFinancial: { type: Boolean, default: false },
      canViewSensitive: { type: Boolean, default: false },
      canRevealVault: { type: Boolean, default: false },
      canManageAccess: { type: Boolean, default: false },
      canAccessEmergency: { type: Boolean, default: false },
      allowedPersonIds: [{ type: String }],
      allowedBusinessIds: [{ type: String }],
      allowedCategoryKeys: [{ type: String }],
      allowedSubcategoryIds: [{ type: String }],
      crud: { type: Schema.Types.Mixed, default: {} },
      notesAccessScope: {
        type: String,
        enum: ["all", "assigned_only", "none"],
        default: "assigned_only",
      },
      canManageSecretNotes: { type: Boolean, default: false },
    },
    emergencyPriority: { type: Number, default: 0 },
    personalMessage: { type: String, default: "" },
    responsibilities: [{ type: String }],
    businessInstructions: [{ type: String }],
    notes: { type: String, default: "" },
    generalNotes: { type: String, default: "" },
    lastLogin: { type: Date },
    lastActivity: { type: Date },
    clerkUserId: { type: String, index: true },
    socialLinks: {
      facebook: { type: String, trim: true, default: "" },
      messenger: { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
      tiktok: { type: String, trim: true, default: "" },
      telegram: { type: String, trim: true, default: "" },
      linkedin: { type: String, trim: true, default: "" },
      youtube: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true }
);

LifePersonSchema.plugin(softDeletePlugin);
LifePersonSchema.index({ email: 1 });
LifePersonSchema.index({ name: 1, relation: 1 });

const LifePerson =
  mongoose.models.LifePerson ||
  mongoose.model<ILifePersonDoc>("LifePerson", LifePersonSchema);

export default LifePerson;

