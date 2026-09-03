import mongoose, { Schema, Document } from "mongoose";
import { LifeVisibility } from "@/types";

export interface ILifeLegacyMessageDoc extends Document {
  title: string;
  recipientPersonId: mongoose.Types.ObjectId;
  recipientName: string;
  message: string;
  attachments: string[];
  visibility: LifeVisibility;
  releaseCondition: string;
  scheduledDate?: Date;
  isReleased: boolean;
  releasedAt?: Date;
  releasedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeLegacyMessageSchema = new Schema<ILifeLegacyMessageDoc>(
  {
    title: { type: String, required: true, trim: true },
    recipientPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      index: true,
    },
    recipientName: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    visibility: {
      type: String,
      enum: [
        "visible_now",
        "hidden",
        "admin_can_release",
        "emergency_only",
        "scheduled_release",
      ],
      default: "admin_can_release",
      index: true,
    },
    releaseCondition: { type: String, default: "" },
    scheduledDate: { type: Date },
    isReleased: { type: Boolean, default: false, index: true },
    releasedAt: { type: Date },
    releasedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

const LifeLegacyMessage =
  mongoose.models.LifeLegacyMessage ||
  mongoose.model<ILifeLegacyMessageDoc>(
    "LifeLegacyMessage",
    LifeLegacyMessageSchema
  );

export default LifeLegacyMessage;
