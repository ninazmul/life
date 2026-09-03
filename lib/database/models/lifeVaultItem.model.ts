import mongoose, { Schema, Document } from "mongoose";
import { VaultCategory } from "@/types";

export interface ILifeVaultItemDoc extends Document {
  title: string;
  systemOrWebsite?: string;
  url?: string;
  username?: string;
  encryptedSecret: string;
  secretIv: string;
  secretAuthTag: string;
  recoveryInfo?: string;
  category: VaultCategory;
  ownerPersonId?: mongoose.Types.ObjectId;
  assignedToPersonIds: mongoose.Types.ObjectId[];
  notes?: string;
  lastUpdated: Date;
  createdAt: Date;
}

const LifeVaultItemSchema = new Schema<ILifeVaultItemDoc>(
  {
    title: { type: String, required: true, trim: true },
    systemOrWebsite: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    username: { type: String, trim: true, default: "" },
    encryptedSecret: { type: String, required: true },
    secretIv: { type: String, required: true },
    secretAuthTag: { type: String, required: true },
    recoveryInfo: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "website",
        "business",
        "hosting",
        "domain",
        "email",
        "router",
        "server",
        "pin",
        "recovery",
        "other",
      ],
      default: "website",
      index: true,
    },
    ownerPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    assignedToPersonIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "LifePerson",
        index: true,
      },
    ],
    notes: { type: String, default: "" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LifeVaultItemSchema.index({ category: 1, title: 1 });

const LifeVaultItem =
  mongoose.models.LifeVaultItem ||
  mongoose.model<ILifeVaultItemDoc>("LifeVaultItem", LifeVaultItemSchema);

export default LifeVaultItem;
