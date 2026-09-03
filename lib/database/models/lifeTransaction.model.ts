import mongoose, { Schema, Document } from "mongoose";
import { LifeTransactionType } from "@/types";

export interface ILifeTransactionDoc extends Document {
  amount: number;
  type: LifeTransactionType;
  date: Date;
  personId?: mongoose.Types.ObjectId;
  personName?: string;
  businessId?: mongoose.Types.ObjectId;
  category?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  attachment?: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
  createdAt: Date;
}

const LifeTransactionSchema = new Schema<ILifeTransactionDoc>(
  {
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: [
        "money_in",
        "money_out",
        "loan_given",
        "loan_received",
        "loan_repayment",
        "invest_made",
        "invest_received",
        "invest_return",
        "expense",
        "income",
        "other",
      ],
      required: true,
      index: true,
    },
    date: { type: Date, required: true, default: Date.now, index: true },
    personId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    personName: { type: String, trim: true, default: "" },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "LifeBusiness",
      index: true,
    },
    category: { type: String, default: "General" },
    paymentMethod: { type: String, default: "Cash" },
    reference: { type: String, default: "" },
    notes: { type: String, default: "" },
    attachment: { type: String, default: "" },
    relatedRecordId: { type: String, index: true },
    relatedRecordType: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LifeTransactionSchema.index({ date: -1, type: 1 });

const LifeTransaction =
  mongoose.models.LifeTransaction ||
  mongoose.model<ILifeTransactionDoc>(
    "LifeTransaction",
    LifeTransactionSchema
  );

export default LifeTransaction;
