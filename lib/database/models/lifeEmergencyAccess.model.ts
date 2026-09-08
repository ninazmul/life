import mongoose, { Schema, Document } from "mongoose";

export interface ILifeEmergencyAccessDoc extends Document {
  isEmergencyActive: boolean;
  activatedBy?: string;
  activatedAt?: Date;
  primaryAdminEmail: string;
  secondaryAdminEmail?: string;
  reason?: string;
  instructions?: string;
  guardianApprovalRule: string;
  defaultWaitingPeriodHours: number;
  ownerAlertChannels: string[];
  activeRequestId?: mongoose.Types.ObjectId;
  ownerSafetyStatus: "safe" | "emergency" | "check_in_overdue";
  lastSafetyCheckIn?: Date;
  updatedAt: Date;
}

const LifeEmergencyAccessSchema = new Schema<ILifeEmergencyAccessDoc>(
  {
    isEmergencyActive: { type: Boolean, default: false, index: true },
    activatedBy: { type: String, default: "" },
    activatedAt: { type: Date },
    primaryAdminEmail: { type: String, default: "" },
    secondaryAdminEmail: { type: String, default: "" },
    reason: { type: String, default: "" },
    instructions: {
      type: String,
      default:
        "Emergency protocol activated. Pre-designated trusted people can access their assigned continuity instructions, business recovery secrets, and emergency documents.",
    },
    guardianApprovalRule: {
      type: String,
      enum: [
        "one_guardian",
        "two_guardians",
        "any_two_of_three",
        "owner_manual",
        "guardian_with_waiting",
      ],
      default: "any_two_of_three",
    },
    defaultWaitingPeriodHours: { type: Number, default: 72 },
    ownerAlertChannels: { type: [String], default: ["email"] },
    activeRequestId: {
      type: Schema.Types.ObjectId,
      ref: "LifeEmergencyRequest",
    },
    ownerSafetyStatus: {
      type: String,
      enum: ["safe", "emergency", "check_in_overdue"],
      default: "safe",
    },
    lastSafetyCheckIn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const LifeEmergencyAccess =
  mongoose.models.LifeEmergencyAccess ||
  mongoose.model<ILifeEmergencyAccessDoc>(
    "LifeEmergencyAccess",
    LifeEmergencyAccessSchema
  );

export default LifeEmergencyAccess;
