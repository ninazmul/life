import mongoose, { Schema, Document } from "mongoose";

export interface ILifeSettingsDoc extends Document {
  ownerEmail: string;
  vaultPinHash?: string;
  currencySymbol: string;
  emergencyMessage: string;
  autoConcealVaultSeconds: number;
  enablePwaInstallBanner: boolean;
  updatedAt: Date;
}

const LifeSettingsSchema = new Schema<ILifeSettingsDoc>(
  {
    ownerEmail: { type: String, required: true, unique: true, index: true },
    vaultPinHash: { type: String, default: "" }, // hashed PIN for revealing vault
    currencySymbol: { type: String, default: "৳" },
    emergencyMessage: {
      type: String,
      default:
        "Emergency instructions and critical continuity records have been unlocked for designated family and partners.",
    },
    autoConcealVaultSeconds: { type: Number, default: 30 },
    enablePwaInstallBanner: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LifeSettings =
  mongoose.models.LifeSettings ||
  mongoose.model<ILifeSettingsDoc>("LifeSettings", LifeSettingsSchema);

export default LifeSettings;
