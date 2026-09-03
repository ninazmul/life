import mongoose, { Schema, Document } from "mongoose";
import { DocumentCategory, LifeVisibility } from "@/types";

export interface ILifeDocumentDoc extends Document {
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  relatedPersonId?: mongoose.Types.ObjectId;
  relatedBusinessId?: mongoose.Types.ObjectId;
  assignedToPersonIds: mongoose.Types.ObjectId[];
  visibility: LifeVisibility;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeDocumentSchema = new Schema<ILifeDocumentDoc>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "agreement",
        "receipt",
        "business",
        "property",
        "bank",
        "loan",
        "identity",
        "medical",
        "other",
      ],
      default: "other",
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: "application/pdf" },
    fileSize: { type: Number, default: 0 },
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
    assignedToPersonIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "LifePerson",
        index: true,
      },
    ],
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
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

LifeDocumentSchema.index({ title: "text", category: 1 });

const LifeDocument =
  mongoose.models.LifeDocument ||
  mongoose.model<ILifeDocumentDoc>("LifeDocument", LifeDocumentSchema);

export default LifeDocument;
