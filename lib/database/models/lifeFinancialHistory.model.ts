import mongoose, { Schema, Document } from "mongoose";

export interface ILifeFinancialHistoryDoc extends Document {
  financialSupportId: mongoose.Types.ObjectId;
  eventType:
    | "support_created"
    | "amount_received"
    | "schedule_added"
    | "installment_paid"
    | "due_date_changed"
    | "payment_paused"
    | "amount_waived"
    | "converted_to_gift"
    | "fully_repaid"
    | "record_closed"
    | "correction";
  description: string;
  amount?: number;
  previousValue?: string;
  newValue?: string;
  performedBy: string;
  performedByName?: string;
  createdAt: Date;
}

const LifeFinancialHistorySchema = new Schema<ILifeFinancialHistoryDoc>(
  {
    financialSupportId: {
      type: Schema.Types.ObjectId,
      ref: "LifeFinancialSupport",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "support_created",
        "amount_received",
        "schedule_added",
        "installment_paid",
        "due_date_changed",
        "payment_paused",
        "amount_waived",
        "converted_to_gift",
        "fully_repaid",
        "record_closed",
        "correction",
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number },
    previousValue: { type: String, default: "" },
    newValue: { type: String, default: "" },
    performedBy: { type: String, required: true },
    performedByName: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LifeFinancialHistorySchema.index({ financialSupportId: 1, createdAt: -1 });

const LifeFinancialHistory =
  mongoose.models.LifeFinancialHistory ||
  mongoose.model<ILifeFinancialHistoryDoc>(
    "LifeFinancialHistory",
    LifeFinancialHistorySchema
  );

export default LifeFinancialHistory;
