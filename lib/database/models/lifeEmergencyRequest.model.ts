import mongoose, { Schema, Document } from "mongoose";
import { EmergencyReason, EmergencyStatus } from "@/types";

export interface ILifeEmergencyRequestDoc extends Document {
  requestedByPersonId: mongoose.Types.ObjectId;
  requestedByName: string;
  requestedByEmail: string;
  reason: EmergencyReason;
  reasonDetails: string;
  supportingDocuments?: string[];
  status: EmergencyStatus;
  approvals: Array<{
    guardianPersonId: mongoose.Types.ObjectId;
    guardianName?: string;
    guardianEmail?: string;
    action: "approve" | "reject";
    date: Date;
    note?: string;
  }>;
  waitingPeriodStart?: Date;
  waitingPeriodEnd?: Date;
  ownerAlertSent: boolean;
  ownerCancelledAt?: Date;
  releasedRecordIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LifeEmergencyRequestSchema = new Schema<ILifeEmergencyRequestDoc>(
  {
    requestedByPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      index: true,
    },
    requestedByName: { type: String, required: true, trim: true },
    requestedByEmail: { type: String, required: true, trim: true, lowercase: true },
    reason: {
      type: String,
      enum: [
        "owner_seriously_ill",
        "owner_hospitalized",
        "owner_unreachable",
        "owner_missing",
        "owner_unable_to_decide",
        "owner_deceased",
        "other",
      ],
      required: true,
    },
    reasonDetails: { type: String, required: true, trim: true },
    supportingDocuments: [{ type: String }],
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "partially_approved",
        "waiting_period",
        "activated",
        "rejected",
        "cancelled",
        "expired",
        "closed",
      ],
      default: "pending_approval",
      index: true,
    },
    approvals: [
      {
        guardianPersonId: {
          type: Schema.Types.ObjectId,
          ref: "LifePerson",
          required: true,
        },
        guardianName: { type: String, trim: true },
        guardianEmail: { type: String, trim: true, lowercase: true },
        action: { type: String, enum: ["approve", "reject"], required: true },
        date: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
    waitingPeriodStart: { type: Date },
    waitingPeriodEnd: { type: Date },
    ownerAlertSent: { type: Boolean, default: false },
    ownerCancelledAt: { type: Date },
    releasedRecordIds: [{ type: String }],
  },
  { timestamps: true }
);

const LifeEmergencyRequest =
  mongoose.models.LifeEmergencyRequest ||
  mongoose.model<ILifeEmergencyRequestDoc>(
    "LifeEmergencyRequest",
    LifeEmergencyRequestSchema
  );

export default LifeEmergencyRequest;
