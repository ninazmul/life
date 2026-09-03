import mongoose, { Schema, Document } from "mongoose";

export interface ILifeEmergencyAccessDoc extends Document {
  isEmergencyActive: boolean;
  activatedBy?: string;
  activatedAt?: Date;
  primaryAdminEmail: string;
  secondaryAdminEmail?: string;
  reason?: string;
  instructions?: string;
  updatedAt: Date;
}

const LifeEmergencyAccessSchema = new Schema<ILifeEmergencyAccessDoc>(
  {
    isEmergencyActive: { type: Boolean, default: false, index: true },
    activatedBy: { type: String, default: "" },
    activatedAt: { type: Date },
    primaryAdminEmail: { type: String, required: true, default: "" },
    secondaryAdminEmail: { type: String, default: "" },
    reason: { type: String, default: "" },
    instructions: {
      type: String,
      default:
        "Emergency protocol activated. Pre-designated trusted people can access their assigned continuity instructions, business recovery secrets, and emergency documents.",
    },
  },
  { timestamps: true }
);

const LifeEmergencyAccess =
  mongoose.models.LifeEmergencyAccess ||
  mongoose.model<ILifeEmergencyAccessDoc>(
    "LifeEmergencyAccess",
    LifeEmergencyAccessSchema
  );

export default LifeEmergencyAccess;
