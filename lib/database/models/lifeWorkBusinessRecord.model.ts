import mongoose, { Schema, Document } from "mongoose";

export type WorkBusinessRecordType = "staff_office" | "business" | "projects";
export type WorkBusinessStatus =
  | "active"
  | "in_progress"
  | "pending"
  | "planning"
  | "completed"
  | "inactive";

export interface IWorkBusinessOwner {
  personId?: mongoose.Types.ObjectId;
  name: string;
  percentage: number;
  role?: string;
  avatarUrl?: string;
}

export interface IWorkBusinessMilestone {
  title: string;
  description?: string;
  targetDate?: Date;
  status: "planned" | "in_progress" | "completed";
  responsiblePersonName?: string;
}

export interface IWorkBusinessAttachment {
  name: string;
  url?: string;
  size?: string;
  date?: string;
  type?: string; // 'pdf' | 'doc' | 'image'
}

export interface IWorkBusinessFinancialLink {
  title: string;
  institution?: string;
  accountNumber?: string;
  amount?: number;
  type?: string;
}

export interface IWorkBusinessHistory {
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: string;
}

export interface ILifeWorkBusinessRecordDoc extends Document {
  recordType: WorkBusinessRecordType;
  subType?: string; // 'staff' | 'office' | 'Technology Company' | 'Infrastructure' etc.
  title: string;
  subtitle?: string;
  description: string;
  status: WorkBusinessStatus;
  priority?: "low" | "medium" | "high" | "urgent";

  // Business / Staff / Project links
  relatedBusinessId?: mongoose.Types.ObjectId;
  relatedBusinessName?: string;
  relatedPersonId?: mongoose.Types.ObjectId;
  relatedPersonName?: string;
  relatedPersonAvatar?: string;
  responsiblePersonId?: mongoose.Types.ObjectId;
  responsiblePersonName?: string;

  // Staff specific
  designation?: string;
  department?: string;
  salaryReference?: string;

  // Business & Office specific
  country?: string;
  city?: string;
  address?: string;
  registrationNumber?: string;
  ownershipType?: string; // 'Sole Proprietorship' | 'Partnership' | 'Private Limited' | 'Public Limited'
  owners: IWorkBusinessOwner[];

  // Dates
  importantDate?: Date; // Incorporation / Joining / Lease start / Project target date
  startDate?: Date;
  endDate?: Date;

  // Projects specific
  budgetReference?: string;
  milestones: IWorkBusinessMilestone[];

  // Attachments and linked records
  linkedDocuments: IWorkBusinessAttachment[];
  linkedFinancials: IWorkBusinessFinancialLink[];
  notes?: string;
  accessPermission: "private" | "owner_only" | "team_shared" | "guardian_accessible";
  createdBy: string;
  history: IWorkBusinessHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const LifeWorkBusinessRecordSchema = new Schema<ILifeWorkBusinessRecordDoc>(
  {
    recordType: {
      type: String,
      enum: ["staff_office", "business", "projects"],
      required: true,
      index: true,
    },
    subType: { type: String, trim: true, default: "" },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "in_progress", "pending", "planning", "completed", "inactive"],
      default: "active",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    relatedBusinessId: {
      type: Schema.Types.ObjectId,
      ref: "LifeBusiness",
      index: true,
    },
    relatedBusinessName: { type: String, trim: true, default: "" },
    relatedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    relatedPersonName: { type: String, trim: true, default: "" },
    relatedPersonAvatar: { type: String, default: "" },
    responsiblePersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    responsiblePersonName: { type: String, trim: true, default: "" },

    designation: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    salaryReference: { type: String, trim: true, default: "" },

    country: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },
    ownershipType: { type: String, trim: true, default: "Private Limited" },
    owners: [
      {
        personId: { type: Schema.Types.ObjectId, ref: "LifePerson" },
        name: { type: String, required: true },
        percentage: { type: Number, default: 0 },
        role: { type: String, default: "" },
        avatarUrl: { type: String, default: "" },
      },
    ],

    importantDate: { type: Date, index: true },
    startDate: { type: Date },
    endDate: { type: Date },

    budgetReference: { type: String, trim: true, default: "" },
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        targetDate: { type: Date },
        status: {
          type: String,
          enum: ["planned", "in_progress", "completed"],
          default: "planned",
        },
        responsiblePersonName: { type: String, default: "" },
      },
    ],

    linkedDocuments: [
      {
        name: { type: String, required: true },
        url: { type: String, default: "" },
        size: { type: String, default: "" },
        date: { type: String, default: "" },
        type: { type: String, default: "pdf" },
      },
    ],
    linkedFinancials: [
      {
        title: { type: String, required: true },
        institution: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        amount: { type: Number, default: 0 },
        type: { type: String, default: "Bank Account" },
      },
    ],

    notes: { type: String, trim: true, default: "" },
    accessPermission: {
      type: String,
      enum: ["private", "owner_only", "team_shared", "guardian_accessible"],
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

LifeWorkBusinessRecordSchema.index({ recordType: 1, status: 1 });
LifeWorkBusinessRecordSchema.index({ createdBy: 1 });

const LifeWorkBusinessRecord =
  mongoose.models.LifeWorkBusinessRecord ||
  mongoose.model<ILifeWorkBusinessRecordDoc>(
    "LifeWorkBusinessRecord",
    LifeWorkBusinessRecordSchema
  );

export default LifeWorkBusinessRecord;
