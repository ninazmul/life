import mongoose, { Schema, Document } from "mongoose";
import {
  FinancialSupportType,
  FinancialSupportStatus,
  InstallmentFrequency,
  VisibilityMode,
} from "@/types";

export interface ILifeFinancialSupportDoc extends Document {
  title: string;
  recipientPersonId: mongoose.Types.ObjectId;
  supportType: FinancialSupportType;
  relatedBusinessId?: mongoose.Types.ObjectId;
  totalAmount: number;
  currency: string;
  givenDate: Date;
  paymentMethod: string;
  transactionReference?: string;
  purpose?: string;
  repayableOrNot: boolean;
  repaymentStartDate?: Date;
  installmentFrequency?: InstallmentFrequency;
  installmentAmount?: number;
  numberOfInstallments?: number;
  dueDate?: Date;
  gracePeriod?: number;
  totalRepaid: number;
  remainingBalance: number;
  nextPaymentDate?: Date;
  status: FinancialSupportStatus;
  supportingDocument?: string;
  ownerPrivateNote?: string;
  recipientVisibleNote?: string;
  visibilityMode: VisibilityMode;
  createdBy: string;
  giftConversions: Array<{
    amount: number;
    conversionType: "partial" | "full";
    previousRemaining: number;
    newRemaining: number;
    conversionDate: Date;
    ownerNote?: string;
    supportingDocument?: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LifeFinancialSupportSchema = new Schema<ILifeFinancialSupportDoc>(
  {
    title: { type: String, required: true, trim: true },
    recipientPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      index: true,
    },
    supportType: {
      type: String,
      enum: [
        "repayable_support",
        "personal_loan",
        "salary_advance",
        "business_advance",
        "emergency_support",
        "medical_support",
        "family_support",
        "gift",
        "conditional_gift",
        "investment",
        "other",
      ],
      default: "repayable_support",
      index: true,
    },
    relatedBusinessId: {
      type: Schema.Types.ObjectId,
      ref: "LifeBusiness",
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
    givenDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, default: "bank_transfer" },
    transactionReference: { type: String, default: "" },
    purpose: { type: String, default: "" },
    repayableOrNot: { type: Boolean, default: true },
    repaymentStartDate: { type: Date },
    installmentFrequency: {
      type: String,
      enum: ["monthly", "weekly", "yearly", "one_time", "custom", ""],
      default: "monthly",
    },
    installmentAmount: { type: Number, default: 0 },
    numberOfInstallments: { type: Number, default: 0 },
    dueDate: { type: Date },
    gracePeriod: { type: Number, default: 0 },
    totalRepaid: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    nextPaymentDate: { type: Date },
    status: {
      type: String,
      enum: [
        "active",
        "repayment_not_started",
        "partially_repaid",
        "fully_repaid",
        "overdue",
        "paused",
        "extended",
        "waived",
        "converted_to_gift",
        "gift",
        "closed",
        "disputed",
        "cancelled",
      ],
      default: "active",
      index: true,
    },
    supportingDocument: { type: String, default: "" },
    ownerPrivateNote: { type: String, default: "" },
    recipientVisibleNote: { type: String, default: "" },
    visibilityMode: {
      type: String,
      default: "available_now",
      index: true,
    },
    createdBy: { type: String, required: true },
    giftConversions: [
      {
        amount: { type: Number, required: true },
        conversionType: { type: String, enum: ["partial", "full"], required: true },
        previousRemaining: { type: Number, required: true },
        newRemaining: { type: Number, required: true },
        conversionDate: { type: Date, default: Date.now },
        ownerNote: { type: String, default: "" },
        supportingDocument: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

LifeFinancialSupportSchema.index({ recipientPersonId: 1, status: 1 });
LifeFinancialSupportSchema.index({ currency: 1 });

const LifeFinancialSupport =
  mongoose.models.LifeFinancialSupport ||
  mongoose.model<ILifeFinancialSupportDoc>(
    "LifeFinancialSupport",
    LifeFinancialSupportSchema
  );

export default LifeFinancialSupport;
