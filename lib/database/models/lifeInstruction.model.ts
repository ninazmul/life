import mongoose, { Schema, Document } from "mongoose";
import {
  InstructionType,
  ResponsibilityPriority,
  VisibilityMode,
} from "@/types";

export interface ILifeInstructionDoc extends Document {
  title: string;
  detailedInstruction: string;
  instructionType: InstructionType;
  assignedPersonId?: mongoose.Types.ObjectId;
  backupPersonId?: mongoose.Types.ObjectId;
  priority: ResponsibilityPriority;
  relatedBusinessId?: mongoose.Types.ObjectId;
  relatedContactId?: mongoose.Types.ObjectId;
  relatedDocumentId?: mongoose.Types.ObjectId;
  visibilityMode: VisibilityMode;
  releaseCondition?: string;
  effectiveDate?: Date;
  reviewDate?: Date;
  status: "active" | "draft" | "archived";
  versionHistory: Array<{
    version: number;
    content: string;
    updatedAt: Date;
    updatedBy: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const LifeInstructionSchema = new Schema<ILifeInstructionDoc>(
  {
    title: { type: String, required: true, trim: true },
    detailedInstruction: { type: String, required: true, trim: true },
    instructionType: {
      type: String,
      enum: [
        "personal",
        "family",
        "business",
        "financial",
        "emergency",
        "medical",
        "property",
        "digital_accounts",
        "employee_salary",
        "religious_funeral",
        "final_wishes",
        "other",
      ],
      default: "personal",
      index: true,
    },
    assignedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    backupPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    relatedBusinessId: {
      type: Schema.Types.ObjectId,
      ref: "LifeBusiness",
    },
    relatedContactId: {
      type: Schema.Types.ObjectId,
      ref: "LifeContact",
    },
    relatedDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "LifeDocument",
    },
    visibilityMode: {
      type: String,
      default: "available_now",
      index: true,
    },
    releaseCondition: { type: String, default: "" },
    effectiveDate: { type: Date },
    reviewDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
    versionHistory: [
      {
        version: { type: Number, required: true },
        content: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const LifeInstruction =
  mongoose.models.LifeInstruction ||
  mongoose.model<ILifeInstructionDoc>("LifeInstruction", LifeInstructionSchema);

export default LifeInstruction;
