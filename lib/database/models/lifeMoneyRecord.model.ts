import mongoose, { Schema, Document } from "mongoose";
import { LifeMoneyType, LifeMoneyStatus } from "@/types";

export interface ILifeMoneyRecordDoc extends Document {
  type: LifeMoneyType;
  personId?: mongoose.Types.ObjectId;
  personName?: string;
  organization?: string;
  businessId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  date: Date;
  purpose?: string;
  expectedReturnDate?: Date;
  interestRate?: string;
  profitShare?: string;
  ownershipPercentage?: number;
  paidAmount: number;
  remainingAmount: number;
  status: LifeMoneyStatus;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LifeMoneyRecordSchema = new Schema<ILifeMoneyRecordDoc>(
  {
    type: {
      type: String,
      enum: ["given", "taken", "invest_made", "invest_received"],
      required: true,
      index: true,
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    personName: { type: String, trim: true, default: "" },
    organization: { type: String, trim: true, default: "" },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "LifeBusiness",
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "BDT" },
    date: { type: Date, required: true, default: Date.now, index: true },
    purpose: { type: String, trim: true, default: "" },
    expectedReturnDate: { type: Date, index: true },
    interestRate: { type: String, default: "" },
    profitShare: { type: String, default: "" },
    ownershipPercentage: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "active",
        "partially_returned",
        "fully_returned",
        "overdue",
        "written_off",
        "closed",
      ],
      default: "active",
      index: true,
    },
    notes: { type: String, default: "" },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

LifeMoneyRecordSchema.index({ type: 1, status: 1 });
LifeMoneyRecordSchema.index({ personId: 1, type: 1 });

const LifeMoneyRecord =
  mongoose.models.LifeMoneyRecord ||
  mongoose.model<ILifeMoneyRecordDoc>(
    "LifeMoneyRecord",
    LifeMoneyRecordSchema
  );

export default LifeMoneyRecord;
