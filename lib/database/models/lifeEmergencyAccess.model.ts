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
  recoveryState: "NORMAL" | "EMERGENCY_PENDING" | "EMERGENCY_ACTIVATED" | "CANCELLED" | "EXPIRED";
  vaultRecoveryState: "VAULT_NORMAL" | "VAULT_LOCKED_PENDING" | "CANCELLED" | "VAULT_RECOVERY_ACTIVATED";
  consecutiveVaultFailures: number;
  isVaultLocked: boolean;
  vaultLockedAt?: Date;
  activeRecoveryEventId?: mongoose.Types.ObjectId;
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
    recoveryState: {
      type: String,
      enum: ["NORMAL", "EMERGENCY_PENDING", "EMERGENCY_ACTIVATED", "CANCELLED", "EXPIRED"],
      default: "NORMAL",
      index: true,
    },
    vaultRecoveryState: {
      type: String,
      enum: ["VAULT_NORMAL", "VAULT_LOCKED_PENDING", "CANCELLED", "VAULT_RECOVERY_ACTIVATED"],
      default: "VAULT_NORMAL",
      index: true,
    },
    consecutiveVaultFailures: { type: Number, default: 0 },
    isVaultLocked: { type: Boolean, default: false },
    vaultLockedAt: { type: Date },
    activeRecoveryEventId: {
      type: Schema.Types.ObjectId,
      ref: "LifeEmergencyRecoveryEvent",
    },
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
