import mongoose, { Schema, Document } from "mongoose";
import { ContactCategory } from "@/types";

export interface ILifeContactDoc extends Document {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  role?: string;
  category: ContactCategory;
  notes?: string;
  whenToContact?: string;
  relatedPersonId?: mongoose.Types.ObjectId;
  relatedBusinessId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LifeContactSchema = new Schema<ILifeContactDoc>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    company: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },
    category: {
      type: String,
      enum: [
        "family",
        "business_partner",
        "engineer",
        "supplier",
        "bank",
        "lawyer",
        "accountant",
        "employee",
        "doctor",
        "other",
      ],
      default: "other",
      index: true,
    },
    notes: { type: String, default: "" },
    whenToContact: { type: String, default: "" },
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
  },
  { timestamps: true }
);

LifeContactSchema.index({ name: "text", phone: "text", company: "text" });

const LifeContact =
  mongoose.models.LifeContact ||
  mongoose.model<ILifeContactDoc>("LifeContact", LifeContactSchema);

export default LifeContact;
