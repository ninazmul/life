import mongoose, { Schema, Document } from "mongoose";

export type SisCareSupportType = "flexible_support" | "gift";
export type SisCareStatus = "active" | "closed";

export interface ISisCareTransaction {
  id?: string;
  type: "support" | "return" | "forgiveness" | "gift";
  amount: number;
  date: Date;
  account?: string;
  currency?: string;
  notes?: string;
  isShared?: boolean;
  performedBy: string;
}

export interface ISisCareForgiveness {
  amount: number;
  date: Date;
  reason?: string;
  performedBy: string;
}

export interface ILifeSisCareRecordDoc extends Document {
  personId?: mongoose.Types.ObjectId;
  personName: string;
  personAvatar?: string;
  supportType: SisCareSupportType;
  title: string;
  totalGiven: number;
  totalReturned: number;
  totalForgiven: number;
  remainingBalance: number;
  currency: string;
  status: SisCareStatus;
  isShared: boolean;
  isVerifiedAccount: boolean;
  paidFromAccount?: string;
  purpose?: string;
  ownerPrivateNotes?: string;
  futureInstructions?: string;
  transactions: ISisCareTransaction[];
  forgivenessHistory: ISisCareForgiveness[];
  sharedSettings: {
    isProfileAccessEnabled: boolean;
    visibleRecordIds: string[];
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeSisCareRecordSchema = new Schema<ILifeSisCareRecordDoc>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    personName: { type: String, required: true, trim: true },
    personAvatar: { type: String, default: "" },
    supportType: {
      type: String,
      enum: ["flexible_support", "gift"],
      default: "flexible_support",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    totalGiven: { type: Number, default: 0 },
    totalReturned: { type: Number, default: 0 },
    totalForgiven: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    currency: { type: String, default: "BDT" },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
    isShared: { type: Boolean, default: false },
    isVerifiedAccount: { type: Boolean, default: true },
    paidFromAccount: { type: String, default: "Cash • BDT" },
    purpose: { type: String, default: "Personal support" },
    ownerPrivateNotes: { type: String, default: "" },
    futureInstructions: { type: String, default: "" },
    transactions: [
      {
        type: {
          type: String,
          enum: ["support", "return", "forgiveness", "gift"],
          required: true,
        },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        account: { type: String, default: "Cash • BDT" },
        currency: { type: String, default: "BDT" },
        notes: { type: String, default: "" },
        isShared: { type: Boolean, default: true },
        performedBy: { type: String, default: "Shahidul (Owner)" },
      },
    ],
    forgivenessHistory: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
        performedBy: { type: String, default: "Shahidul (Owner)" },
      },
    ],
    sharedSettings: {
      isProfileAccessEnabled: { type: Boolean, default: true },
      visibleRecordIds: [{ type: String }],
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

LifeSisCareRecordSchema.index({ status: 1, supportType: 1 });
LifeSisCareRecordSchema.index({ createdBy: 1 });

const LifeSisCareRecord =
  mongoose.models.LifeSisCareRecord ||
  mongoose.model<ILifeSisCareRecordDoc>("LifeSisCareRecord", LifeSisCareRecordSchema);

export default LifeSisCareRecord;
