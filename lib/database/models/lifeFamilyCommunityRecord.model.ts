import mongoose, { Schema, Document } from "mongoose";

export type FamilyCommunityRecordType = "family_care" | "kids" | "community";
export type FamilyCommunityStatus = "active" | "pending" | "action_required" | "completed";
export type FamilyCommunityPriority = "low" | "medium" | "high" | "urgent";

export interface IFamilyCommunityAttachment {
  name: string;
  url?: string;
  size?: string;
  date?: string;
  type?: string; // 'pdf' | 'image' | 'doc'
}

export interface IFamilyCommunityHistory {
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: string;
}

export interface ILifeFamilyCommunityRecordDoc extends Document {
  recordType: FamilyCommunityRecordType;
  title: string;
  relatedPersonId?: mongoose.Types.ObjectId;
  relatedPersonName?: string;
  relatedPersonAvatar?: string;
  subType?: string; // e.g. "Health Care", "Education", "Relatives", etc.
  description: string;
  institution?: string; // for Kids school/program
  assignedPersonId?: mongoose.Types.ObjectId;
  assignedPersonName?: string;
  startDate?: Date;
  dueDate?: Date;
  priority: FamilyCommunityPriority;
  status: FamilyCommunityStatus;
  notes?: string;
  attachments: IFamilyCommunityAttachment[];
  linkedFinancialId?: mongoose.Types.ObjectId;
  linkedDocumentId?: mongoose.Types.ObjectId;
  linkedResponsibilityId?: mongoose.Types.ObjectId;
  accessPermission: "private" | "owner_only" | "family_shared" | "guardian_accessible";
  createdBy: string;
  history: IFamilyCommunityHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const LifeFamilyCommunityRecordSchema = new Schema<ILifeFamilyCommunityRecordDoc>(
  {
    recordType: {
      type: String,
      enum: ["family_care", "kids", "community"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    relatedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    relatedPersonName: { type: String, trim: true, default: "" },
    relatedPersonAvatar: { type: String, default: "" },
    subType: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    institution: { type: String, trim: true, default: "" },
    assignedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    assignedPersonName: { type: String, trim: true, default: "" },
    startDate: { type: Date },
    dueDate: { type: Date, index: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "pending", "action_required", "completed"],
      default: "active",
      index: true,
    },
    notes: { type: String, trim: true, default: "" },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, default: "" },
        size: { type: String, default: "" },
        date: { type: String, default: "" },
        type: { type: String, default: "pdf" },
      },
    ],
    linkedFinancialId: {
      type: Schema.Types.ObjectId,
      ref: "LifeFinancialSupport",
    },
    linkedDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "LifeDocument",
    },
    linkedResponsibilityId: {
      type: Schema.Types.ObjectId,
      ref: "LifeResponsibility",
    },
    accessPermission: {
      type: String,
      enum: ["private", "owner_only", "family_shared", "guardian_accessible"],
      default: "private",
    },
    createdBy: { type: String, required: true },
    history: [
      {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

LifeFamilyCommunityRecordSchema.index({ recordType: 1, status: 1 });
LifeFamilyCommunityRecordSchema.index({ createdBy: 1 });

const LifeFamilyCommunityRecord =
  mongoose.models.LifeFamilyCommunityRecord ||
  mongoose.model<ILifeFamilyCommunityRecordDoc>(
    "LifeFamilyCommunityRecord",
    LifeFamilyCommunityRecordSchema
  );

export default LifeFamilyCommunityRecord;
