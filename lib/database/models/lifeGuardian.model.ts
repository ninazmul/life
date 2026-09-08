import mongoose, { Schema, Document } from "mongoose";
import { GuardianType } from "@/types";

export interface ILifeGuardianDoc extends Document {
  personId: mongoose.Types.ObjectId;
  guardianType: GuardianType;
  isActive: boolean;
  assignedDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeGuardianSchema = new Schema<ILifeGuardianDoc>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      unique: true,
      index: true,
    },
    guardianType: {
      type: String,
      enum: ["primary", "secondary", "independent"],
      default: "primary",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const LifeGuardian =
  mongoose.models.LifeGuardian ||
  mongoose.model<ILifeGuardianDoc>("LifeGuardian", LifeGuardianSchema);

export default LifeGuardian;
