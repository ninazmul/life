import mongoose, { Schema, Document } from "mongoose";
import { NotificationType } from "@/types";

export interface ILifeNotificationDoc extends Document {
  recipientEmail: string;
  recipientPersonId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const LifeNotificationSchema = new Schema<ILifeNotificationDoc>(
  {
    recipientEmail: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    recipientPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      default: "system",
      index: true,
    },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LifeNotificationSchema.index({ recipientEmail: 1, isRead: 1, createdAt: -1 });

const LifeNotification =
  mongoose.models.LifeNotification ||
  mongoose.model<ILifeNotificationDoc>("LifeNotification", LifeNotificationSchema);

export default LifeNotification;
