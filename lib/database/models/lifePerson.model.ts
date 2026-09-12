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
  username?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  status: PersonStatus;
  accountStatus?: AccountStatus;
  role: LifeRole;
  userRole?: LifeRole;
  guardianStatus?: boolean;
  guardianType?: GuardianType;
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
  createdAt: Date;
  updatedAt: Date;
}

const LifePersonSchema = new Schema<ILifePersonDoc>(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    whatsapp: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    country: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    username: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
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

