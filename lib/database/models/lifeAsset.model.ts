import mongoose, { Schema, Document } from "mongoose";
import { AssetCategory } from "@/types";

export interface ILifeAssetDoc extends Document {
  name: string;
  category: AssetCategory;
  value: number;
  currency: string;
  ownershipPercentage: number;
  location?: string;
  relatedPersonId?: mongoose.Types.ObjectId;
  relatedBusinessId?: mongoose.Types.ObjectId;
  documents?: string[];
  notes?: string;
  status: "active" | "disposed" | "pledged";
  createdAt: Date;
  updatedAt: Date;
}

const LifeAssetSchema = new Schema<ILifeAssetDoc>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "cash",
        "bank_balance",
        "business_investment",
        "property",
        "vehicle",
        "equipment",
        "valuable",
        "other",
      ],
      default: "other",
      index: true,
    },
    value: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "BDT" },
    ownershipPercentage: { type: Number, default: 100 },
    location: { type: String, trim: true, default: "" },
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
    documents: [{ type: String }],
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "disposed", "pledged"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

LifeAssetSchema.index({ category: 1, status: 1 });

const LifeAsset =
  mongoose.models.LifeAsset ||
  mongoose.model<ILifeAssetDoc>("LifeAsset", LifeAssetSchema);

export default LifeAsset;
