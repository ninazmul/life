import mongoose, { Schema, Document } from "mongoose";
import { InstallmentStatus } from "@/types";

export interface ILifeInstallmentDoc extends Document {
  financialSupportId: mongoose.Types.ObjectId;
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionReference?: string;
  receiptUrl?: string;
  status: InstallmentStatus;
  note?: string;
  previousVersions: Array<{
    expectedAmount: number;
    dueDate: Date;
    changedAt: Date;
    reason?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LifeInstallmentSchema = new Schema<ILifeInstallmentDoc>(
  {
    financialSupportId: {
      type: Schema.Types.ObjectId,
      ref: "LifeFinancialSupport",
      required: true,
      index: true,
    },
    installmentNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true, index: true },
    expectedAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    paymentDate: { type: Date },
    paymentMethod: { type: String, default: "" },
    transactionReference: { type: String, default: "" },
    receiptUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "upcoming",
        "due",
        "partially_paid",
        "paid",
        "overdue",
        "waived",
        "rescheduled",
      ],
      default: "upcoming",
      index: true,
    },
    note: { type: String, default: "" },
    previousVersions: [
      {
        expectedAmount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

LifeInstallmentSchema.index(
  { financialSupportId: 1, installmentNumber: 1 },
  { unique: true }
);

const LifeInstallment =
  mongoose.models.LifeInstallment ||
  mongoose.model<ILifeInstallmentDoc>("LifeInstallment", LifeInstallmentSchema);

export default LifeInstallment;
