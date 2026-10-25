import mongoose, { Schema, Document } from "mongoose";
import { GuardianType } from "@/types";

export interface ILifeGuardianDoc extends Document {
  personId: mongoose.Types.ObjectId;
  guardianType: GuardianType;
  isActive: boolean;
  assignedDate: Date;
  notes?: string;
  isRecoveryGuardian?: boolean;
  isContinuityGuardian?: boolean;
  invitationStatus?: "invited" | "accepted" | "declined" | "removed";
  approvalRule?: string;
  waitingPeriodHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

const LifeGuardianSchema = new Schema<ILifeGuardianDoc>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      unique: true,
      index: true,
    },
    guardianType: {
      type: String,
      enum: ["primary", "secondary", "independent"],
      default: "primary",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
    isRecoveryGuardian: {
      type: Boolean,
      default: true,
      index: true,
    },
    isContinuityGuardian: {
      type: Boolean,
      default: true,
      index: true,
    },
    invitationStatus: {
      type: String,
      enum: ["invited", "accepted", "declined", "removed"],
      default: "accepted",
      index: true,
    },
    approvalRule: {
      type: String,
      default: "2_of_3",
    },
    waitingPeriodHours: {
      type: Number,
      default: 72,
    },
  },
  { timestamps: true }
);

const LifeGuardian =
  mongoose.models.LifeGuardian ||
  mongoose.model<ILifeGuardianDoc>("LifeGuardian", LifeGuardianSchema);

export default LifeGuardian;
