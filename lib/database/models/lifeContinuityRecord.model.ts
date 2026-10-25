import mongoose, { Schema, Document } from "mongoose";

export interface ILifeContinuityRecordDoc extends Document {
  ownerId: string;
  recordType: "responsibilities" | "instructions" | "emergency" | "legacy_legal";
  ownerTitle: string;
  recipientTitle: string;
  recipientDescription?: string;
  mainContent: string;
  assignedPersonId?: mongoose.Types.ObjectId;
  assignedPersonName?: string;
  assignedRole?: string;
  priority?: "low" | "medium" | "high" | "critical";
  applicableSituation?: string;
  linkedItems: Array<{
    title: string;
    type: "business" | "document" | "responsibility" | "finance" | "other";
    refId?: string;
  }>;
  ownerPrivateNotes?: string;
  status: "active" | "draft" | "archived";
  workStatus: "not_started" | "accepted" | "in_progress" | "submitted" | "completed";
  accessPolicy: {
    method: "immediate" | "timed_request" | "guardian_verified";
    waitingPeriodDays: number;
    waitingPeriodLabel: string;
    notifyApp: boolean;
    notifyEmail: boolean;
    releaseScope: string[];
    requiredApprovals: number;
    guardians: Array<{ guardianId: string; name: string }>;
    isActivated: boolean;
    accessStatus: "private_draft" | "available" | "locked" | "released" | "revoked";
  };
  createdAt: Date;
  updatedAt: Date;
}

const LifeContinuityRecordSchema = new Schema<ILifeContinuityRecordDoc>(
  {
    ownerId: { type: String, default: "owner", index: true },
    recordType: {
      type: String,
      enum: ["responsibilities", "instructions", "emergency", "legacy_legal"],
      required: true,
      index: true,
    },
    ownerTitle: { type: String, required: true, trim: true },
    recipientTitle: { type: String, required: true, trim: true },
    recipientDescription: { type: String, default: "" },
    mainContent: { type: String, required: true },
    assignedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    assignedPersonName: { type: String, trim: true },
    assignedRole: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    applicableSituation: { type: String, default: "" },
    linkedItems: [
      {
        title: { type: String, required: true },
        type: {
          type: String,
          enum: ["business", "document", "responsibility", "finance", "other"],
          default: "document",
        },
        refId: { type: String },
      },
    ],
    ownerPrivateNotes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
    workStatus: {
      type: String,
      enum: ["not_started", "accepted", "in_progress", "submitted", "completed"],
      default: "not_started",
    },
    accessPolicy: {
      method: {
        type: String,
        enum: ["immediate", "timed_request", "guardian_verified"],
        default: "timed_request",
        index: true,
      },
      waitingPeriodDays: { type: Number, default: 7 },
      waitingPeriodLabel: { type: String, default: "7 days" },
      notifyApp: { type: Boolean, default: true },
      notifyEmail: { type: Boolean, default: true },
      releaseScope: [{ type: String }],
      requiredApprovals: { type: Number, default: 2 },
      guardians: [
        {
          guardianId: { type: String },
          name: { type: String },
        },
      ],
      isActivated: { type: Boolean, default: true },
      accessStatus: {
        type: String,
        enum: ["private_draft", "available", "locked", "released", "revoked"],
        default: "locked",
        index: true,
      },
    },
  },
  { timestamps: true }
);

LifeContinuityRecordSchema.index({ ownerTitle: "text", recipientTitle: "text", mainContent: "text" });

const LifeContinuityRecord =
  mongoose.models.LifeContinuityRecord ||
  mongoose.model<ILifeContinuityRecordDoc>("LifeContinuityRecord", LifeContinuityRecordSchema);

export default LifeContinuityRecord;
