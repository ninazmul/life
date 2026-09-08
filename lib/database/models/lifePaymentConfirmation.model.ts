import mongoose, { Schema, Document } from "mongoose";
import { PaymentConfirmationStatus } from "@/types";

export interface ILifePaymentConfirmationDoc extends Document {
  financialSupportId: mongoose.Types.ObjectId;
  installmentId?: mongoose.Types.ObjectId;
  submittedByPersonId: mongoose.Types.ObjectId;
  submittedByName: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: string;
  transactionReference?: string;
  receiptUrl?: string;
  status: PaymentConfirmationStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifePaymentConfirmationSchema = new Schema<ILifePaymentConfirmationDoc>(
  {
    financialSupportId: {
      type: Schema.Types.ObjectId,
      ref: "LifeFinancialSupport",
      required: true,
      index: true,
    },
    installmentId: {
      type: Schema.Types.ObjectId,
      ref: "LifeInstallment",
      index: true,
    },
    submittedByPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      index: true,
    },
    submittedByName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: "BDT" },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, required: true },
    transactionReference: { type: String, default: "" },
    receiptUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "submitted",
        "pending_confirmation",
        "approved",
        "rejected",
        "correction_required",
      ],
      default: "submitted",
      index: true,
    },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

const LifePaymentConfirmation =
  mongoose.models.LifePaymentConfirmation ||
  mongoose.model<ILifePaymentConfirmationDoc>(
    "LifePaymentConfirmation",
    LifePaymentConfirmationSchema
  );

export default LifePaymentConfirmation;
