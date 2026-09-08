import mongoose, { Schema, Document } from "mongoose";
import { RecordType, VisibilityMode } from "@/types";

export interface ILifeRecordPermissionDoc extends Document {
  recordId: string;
  recordType: RecordType;
  assignedPersonId: mongoose.Types.ObjectId;
  visibilityMode: VisibilityMode;
  releaseCondition?: string;
  guardianApprovalRequired: boolean;
  requiredApprovals: number;
  waitingPeriodHours: number;
  effectiveDate?: Date;
  expiryDate?: Date;
  canView: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canShare: boolean;
  reVerificationRequired: boolean;
  isReleased: boolean;
  releasedAt?: Date;
  releasedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeRecordPermissionSchema = new Schema<ILifeRecordPermissionDoc>(
  {
    recordId: { type: String, required: true, index: true },
    recordType: {
      type: String,
      enum: [
        "financial_support",
        "business",
        "responsibility",
        "document",
        "vault_item",
        "legacy_message",
        "instruction",
        "contact",
        "asset",
      ],
      required: true,
      index: true,
    },
    assignedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      index: true,
    },
    visibilityMode: {
      type: String,
      enum: [
        "owner_only",
        "available_now",
        "emergency_only",
        "after_death_only",
        "emergency_or_after_death",
        "manual_release",
        "scheduled_release",
        "hidden_draft",
        "revoked_archived",
        // legacy
        "visible_now",
        "hidden",
        "admin_can_release",
      ],
      default: "available_now",
      index: true,
    },
    releaseCondition: { type: String, default: "" },
    guardianApprovalRequired: { type: Boolean, default: false },
    requiredApprovals: { type: Number, default: 2 },
    waitingPeriodHours: { type: Number, default: 72 },
    effectiveDate: { type: Date },
    expiryDate: { type: Date },
    canView: { type: Boolean, default: true },
    canDownload: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canShare: { type: Boolean, default: false },
    reVerificationRequired: { type: Boolean, default: false },
    isReleased: { type: Boolean, default: false, index: true },
    releasedAt: { type: Date },
    releasedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

LifeRecordPermissionSchema.index({ recordId: 1, assignedPersonId: 1 }, { unique: true });

const LifeRecordPermission =
  mongoose.models.LifeRecordPermission ||
  mongoose.model<ILifeRecordPermissionDoc>(
    "LifeRecordPermission",
    LifeRecordPermissionSchema
  );

export default LifeRecordPermission;
