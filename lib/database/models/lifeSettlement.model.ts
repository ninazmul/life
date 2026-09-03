import mongoose, { Schema, Document } from "mongoose";

export interface ILifeSettlementDoc extends Document {
  moneyRecordId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
}

const LifeSettlementSchema = new Schema<ILifeSettlementDoc>(
  {
    moneyRecordId: {
      type: Schema.Types.ObjectId,
      ref: "LifeMoneyRecord",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "bkash", "nagad", "cheque", "other"],
      default: "bank_transfer",
    },
    reference: { type: String, trim: true, default: "" },
    notes: { type: String, default: "" },
    receiptUrl: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const LifeSettlement =
  mongoose.models.LifeSettlement ||
  mongoose.model<ILifeSettlementDoc>("LifeSettlement", LifeSettlementSchema);

export default LifeSettlement;
