import mongoose, { Schema, Document } from "mongoose";
import { LifeRole, PersonStatus } from "@/types";

export interface ILifePersonDoc extends Document {
  name: string;
  relation: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
  status: PersonStatus;
  role: LifeRole;
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
  clerkUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifePersonSchema = new Schema<ILifePersonDoc>(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    whatsapp: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    username: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "locked", "archived"],
      default: "active",
      index: true,
    },
    role: {
      type: String,
      enum: [
        "owner",
        "super_admin",
        "admin",
        "individual",
        "business",
        "read_only",
        "custom",
      ],
      default: "individual",
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
    clerkUserId: { type: String, index: true },
  },
  { timestamps: true }
);

LifePersonSchema.index({ email: 1 });
LifePersonSchema.index({ name: 1, relation: 1 });

const LifePerson =
  mongoose.models.LifePerson ||
  mongoose.model<ILifePersonDoc>("LifePerson", LifePersonSchema);

export default LifePerson;
