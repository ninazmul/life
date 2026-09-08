import mongoose, { Schema, Document } from "mongoose";
import {
  ResponsibilityPriority,
  ResponsibilityStatus,
  UserResponsibilityResponse,
  VisibilityMode,
} from "@/types";

export interface ILifeResponsibilityDoc extends Document {
  title: string;
  detailedInstruction: string;
  relatedBusinessId?: mongoose.Types.ObjectId;
  assignedPersonId: mongoose.Types.ObjectId;
  backupPersonId?: mongoose.Types.ObjectId;
  priority: ResponsibilityPriority;
  startDate?: Date;
  deadline?: Date;
  relatedContactId?: mongoose.Types.ObjectId;
  relatedDocumentId?: mongoose.Types.ObjectId;
  relatedVaultItemId?: mongoose.Types.ObjectId;
  completionStatus: ResponsibilityStatus;
  ownerNote?: string;
  userResponse?: UserResponsibilityResponse;
  userResponseNote?: string;
  responseDate?: Date;
  responseDevice?: string;
  visibilityMode: VisibilityMode;
  releaseCondition?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeResponsibilitySchema = new Schema<ILifeResponsibilityDoc>(
  {
    title: { type: String, required: true, trim: true },
    detailedInstruction: { type: String, required: true, trim: true },
    relatedBusinessId: {
      type: Schema.Types.ObjectId,
      ref: "LifeBusiness",
      index: true,
    },
    assignedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
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
    startDate: { type: Date },
    deadline: { type: Date, index: true },
    relatedContactId: {
      type: Schema.Types.ObjectId,
      ref: "LifeContact",
    },
    relatedDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "LifeDocument",
    },
    relatedVaultItemId: {
      type: Schema.Types.ObjectId,
      ref: "LifeVaultItem",
    },
    completionStatus: {
      type: String,
      enum: [
        "not_started",
        "in_progress",
        "waiting",
        "completed",
        "unable_to_complete",
      ],
      default: "not_started",
      index: true,
    },
    ownerNote: { type: String, default: "" },
    userResponse: {
      type: String,
      enum: [
        "read",
        "understand",
        "accept",
        "need_clarification",
        "cannot_perform",
        "",
      ],
      default: "",
    },
    userResponseNote: { type: String, default: "" },
    responseDate: { type: Date },
    responseDevice: { type: String, default: "" },
    visibilityMode: {
      type: String,
      default: "available_now",
      index: true,
    },
    releaseCondition: { type: String, default: "" },
  },
  { timestamps: true }
);

const LifeResponsibility =
  mongoose.models.LifeResponsibility ||
  mongoose.model<ILifeResponsibilityDoc>(
    "LifeResponsibility",
    LifeResponsibilitySchema
  );

export default LifeResponsibility;
