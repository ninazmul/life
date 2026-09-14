import mongoose, { Schema, Document } from "mongoose";
import {
  RecoveryEventType,
  EmergencyRecoveryState,
  VaultRecoveryState,
} from "@/types";

export interface ILifeEmergencyRecoveryEventDoc extends Document {
  eventType: RecoveryEventType;
  status: EmergencyRecoveryState | VaultRecoveryState;
  triggeredBy: {
    personId?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: string;
  };
  triggeredAt: Date;
  reason?: string;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    session?: string;
  };
  countdownEndsAt: Date;
  simulationFastForwardHours: number;
  remindersSent: Array<{
    timestamp: Date;
    hoursRemaining: number;
  }>;
  cancelledBy?: {
    personId?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    cancelledAt: Date;
    verificationMethod: string;
  };
  activatedAt?: Date;
  emergencyAccessPolicy?: {
    accessStartsAt?: Date;
    accessExpiresAt?: Date;
    grantedRecordIds: string[];
    grantedVaultItemIds: string[];
    isRevoked: boolean;
  };
  vaultFailureMetadata?: {
    consecutiveFailures: number;
    lockedAt: Date;
    targetVaultItemTitle?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LifeEmergencyRecoveryEventSchema =
  new Schema<ILifeEmergencyRecoveryEventDoc>(
    {
      eventType: {
        type: String,
        enum: ["emergency_button", "vault_failed_attempts"],
        required: true,
        index: true,
      },
      status: {
        type: String,
        enum: [
          "NORMAL",
          "EMERGENCY_PENDING",
          "CANCELLED",
          "EMERGENCY_ACTIVATED",
          "EXPIRED",
          "VAULT_NORMAL",
          "VAULT_LOCKED_PENDING",
          "VAULT_RECOVERY_ACTIVATED",
        ],
        required: true,
        index: true,
      },
      triggeredBy: {
        personId: { type: Schema.Types.ObjectId, ref: "LifePerson" },
        name: { type: String, required: true },
        email: { type: String, required: true },
        role: { type: String, default: "emergency_contact" },
      },
      triggeredAt: { type: Date, default: Date.now },
      reason: { type: String, default: "" },
      deviceInfo: {
        userAgent: { type: String, default: "" },
        ip: { type: String, default: "" },
        session: { type: String, default: "" },
      },
      countdownEndsAt: { type: Date, required: true, index: true },
      simulationFastForwardHours: { type: Number, default: 0 },
      remindersSent: [
        {
          timestamp: { type: Date, default: Date.now },
          hoursRemaining: { type: Number },
        },
      ],
      cancelledBy: {
        personId: { type: Schema.Types.ObjectId, ref: "LifePerson" },
        name: { type: String },
        email: { type: String },
        cancelledAt: { type: Date },
        verificationMethod: { type: String },
      },
      activatedAt: { type: Date },
      emergencyAccessPolicy: {
        accessStartsAt: { type: Date },
        accessExpiresAt: { type: Date },
        grantedRecordIds: [{ type: String }],
        grantedVaultItemIds: [{ type: String }],
        isRevoked: { type: Boolean, default: false },
      },
      vaultFailureMetadata: {
        consecutiveFailures: { type: Number, default: 0 },
        lockedAt: { type: Date },
        targetVaultItemTitle: { type: String, default: "" },
      },
    },
    { timestamps: true }
  );

const LifeEmergencyRecoveryEvent =
  mongoose.models.LifeEmergencyRecoveryEvent ||
  mongoose.model<ILifeEmergencyRecoveryEventDoc>(
    "LifeEmergencyRecoveryEvent",
    LifeEmergencyRecoveryEventSchema
  );

export default LifeEmergencyRecoveryEvent;
