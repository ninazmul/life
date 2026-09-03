import mongoose, { Schema, Document } from "mongoose";
import { LifeInfoCategory, LifePriority, LifeVisibility } from "@/types";

export interface ILifeInformationDoc extends Document {
  title: string;
  summary?: string;
  content: string;
  category: LifeInfoCategory;
  relatedPersonId?: mongoose.Types.ObjectId;
  relatedBusinessId?: mongoose.Types.ObjectId;
  priority: LifePriority;
  visibility: LifeVisibility;
  scheduledReleaseDate?: Date;
  isEmergency: boolean;
  attachments?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LifeInformationSchema = new Schema<ILifeInformationDoc>(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: "" },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["personal", "business", "instruction", "emergency", "other"],
      default: "personal",
      index: true,
    },
    relatedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    relatedBusinessId: {
      type: Schema.Types.ObjectId,
      ref: "LifeBusiness",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    visibility: {
      type: String,
      enum: [
        "visible_now",
        "hidden",
        "admin_can_release",
        "emergency_only",
        "scheduled_release",
      ],
      default: "visible_now",
      index: true,
    },
    scheduledReleaseDate: { type: Date },
    isEmergency: { type: Boolean, default: false, index: true },
    attachments: [{ type: String }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

LifeInformationSchema.index({ title: "text", content: "text", tags: "text" });

const LifeInformation =
  mongoose.models.LifeInformation ||
  mongoose.model<ILifeInformationDoc>(
    "LifeInformation",
    LifeInformationSchema
  );

export default LifeInformation;
