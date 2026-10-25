import mongoose, { Schema, Document } from "mongoose";

export type AccountRecoveryStatus =
  | "submitted"
  | "guardian_review"
  | "more_info_needed"
  | "waiting_period"
  | "final_verification"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired";

export type RecoveryReason =
  | "forgot_credentials"
  | "lost_phone"
  | "lost_authenticator"
  | "compromised_account"
  | "other";

export interface IRecoveryGuardianApproval {
  guardianPersonId: mongoose.Types.ObjectId;
  guardianName: string;
  guardianEmail: string;
  action: "approve" | "reject" | "request_info";
  note?: string;
  date: Date;
}

export interface ILifeAccountRecoveryDoc extends Document {
  recoveryCode: string;
  accountEmail: string;
  claimantName: string;
  claimantContactEmail: string;
  claimantPhone?: string;
  reason: RecoveryReason;
  reasonDetails: string;
  status: AccountRecoveryStatus;
  currentStep: 1 | 2 | 3 | 4 | 5;
  guardianApprovals: IRecoveryGuardianApproval[];
  requiredApprovals: number;
  waitingPeriodHours: number;
  waitingPeriodStart?: Date;
  waitingPeriodEnd?: Date;
  finalVerificationCompleted: boolean;
  restoredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  adminNotes?: string;
  deviceInfo?: {
    ip?: string;
    userAgent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryGuardianApprovalSchema = new Schema<IRecoveryGuardianApproval>(
  {
    guardianPersonId: { type: Schema.Types.ObjectId, ref: "LifePerson", required: true },
    guardianName: { type: String, required: true },
    guardianEmail: { type: String, required: true },
    action: {
      type: String,
      enum: ["approve", "reject", "request_info"],
      required: true,
    },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LifeAccountRecoverySchema = new Schema<ILifeAccountRecoveryDoc>(
  {
    recoveryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    accountEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    claimantName: { type: String, required: true, trim: true },
    claimantContactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    claimantPhone: { type: String, default: "" },
    reason: {
      type: String,
      enum: [
        "forgot_credentials",
        "lost_phone",
        "lost_authenticator",
        "compromised_account",
        "other",
      ],
      required: true,
    },
    reasonDetails: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [
        "submitted",
        "guardian_review",
        "more_info_needed",
        "waiting_period",
        "final_verification",
        "completed",
        "rejected",
        "cancelled",
        "expired",
      ],
      default: "submitted",
      index: true,
    },
    currentStep: { type: Number, default: 1, min: 1, max: 5 },
    guardianApprovals: [RecoveryGuardianApprovalSchema],
    requiredApprovals: { type: Number, default: 2 },
    waitingPeriodHours: { type: Number, default: 72 },
    waitingPeriodStart: { type: Date },
    waitingPeriodEnd: { type: Date },
    finalVerificationCompleted: { type: Boolean, default: false },
    restoredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    deviceInfo: {
      ip: { type: String, default: "" },
      userAgent: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const LifeAccountRecovery =
  mongoose.models.LifeAccountRecovery ||
  mongoose.model<ILifeAccountRecoveryDoc>(
    "LifeAccountRecovery",
    LifeAccountRecoverySchema
  );

export default LifeAccountRecovery;
