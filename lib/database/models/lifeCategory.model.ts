import mongoose, { Schema, Document } from "mongoose";
import { MainCategoryKey } from "@/types";

export interface ILifeCategoryDoc extends Document {
  mainCategory: MainCategoryKey;
  name: string;
  description?: string;
  order: number;
  isArchived: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeCategorySchema = new Schema<ILifeCategoryDoc>(
  {
    mainCategory: {
      type: String,
      enum: [
        "financial_care",
        "estate_wasiyyah",
        "roles_responsibilities",
        "emergency_contacts",
        "security_access",
        "instructions_messages",
      ],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

LifeCategorySchema.index({ mainCategory: 1, order: 1 });
LifeCategorySchema.index({ mainCategory: 1, name: 1 });

const LifeCategory =
  mongoose.models.LifeCategory ||
  mongoose.model<ILifeCategoryDoc>("LifeCategory", LifeCategorySchema);

export default LifeCategory;
