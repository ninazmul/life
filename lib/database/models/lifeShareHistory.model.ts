import mongoose, { Schema, Document } from "mongoose";

export interface ILifeShareHistoryDoc extends Document {
  businessId: mongoose.Types.ObjectId;
  personId: mongoose.Types.ObjectId;
  personName?: string;
  previousShare: number;
  newShare: number;
  effectiveDate: Date;
  reason: string;
  supportingAgreement?: string;
  approvedBy: string;
  witnessVerifier?: string;
  previousVersionSnapshot?: string;
  createdAt: Date;
}

const LifeShareHistorySchema = new Schema<ILifeShareHistoryDoc>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "LifeBusiness",
      required: true,
      index: true,
    },
    personId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      index: true,
    },
    personName: { type: String, trim: true, default: "" },
    previousShare: { type: Number, required: true },
    newShare: { type: Number, required: true },
    effectiveDate: { type: Date, default: Date.now },
    reason: { type: String, required: true, trim: true },
    supportingAgreement: { type: String, default: "" },
    approvedBy: { type: String, required: true },
    witnessVerifier: { type: String, default: "" },
    previousVersionSnapshot: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LifeShareHistorySchema.index({ businessId: 1, effectiveDate: -1 });

const LifeShareHistory =
  mongoose.models.LifeShareHistory ||
  mongoose.model<ILifeShareHistoryDoc>(
    "LifeShareHistory",
    LifeShareHistorySchema
  );

export default LifeShareHistory;
