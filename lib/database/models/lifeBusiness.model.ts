import mongoose, { Schema, Document } from "mongoose";
import { ILifeContinuityStep } from "@/types";

export interface ILifeBusinessDoc extends Document {
  name: string;
  legalName?: string;
  ownershipPercentage: number;
  status: "active" | "inactive" | "pending";
  partners: Array<{
    name: string;
    personId?: mongoose.Types.ObjectId;
    ownershipPercentage: number;
    role?: string;
  }>;
  serverInfo?: {
    hosting?: string;
    domain?: string;
    ip?: string;
    serverType?: string;
    dashboardUrl?: string;
    notes?: string;
  };
  engineerContact?: {
    name?: string;
    phone?: string;
    email?: string;
    personId?: mongoose.Types.ObjectId;
  };
  supplierContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  monthlyExpenses?: number;
  outstandingPayments?: number;
  receivables?: number;
  agreements?: Array<{
    title: string;
    fileUrl: string;
    date?: string;
  }>;
  instructions?: string;
  continuitySteps: ILifeContinuityStep[];
  createdAt: Date;
  updatedAt: Date;
}

const ContinuityStepSchema = new Schema<ILifeContinuityStep>(
  {
    id: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    responsiblePersonId: { type: Schema.Types.ObjectId, ref: "LifePerson" },
    responsiblePersonName: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    instructions: { type: String, default: "" },
    documents: [{ type: String }],
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const LifeBusinessSchema = new Schema<ILifeBusinessDoc>(
  {
    name: { type: String, required: true, trim: true, index: true },
    legalName: { type: String, trim: true, default: "" },
    ownershipPercentage: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
      index: true,
    },
    partners: [
      {
        name: { type: String, required: true },
        personId: { type: Schema.Types.ObjectId, ref: "LifePerson" },
        ownershipPercentage: { type: Number, default: 0 },
        role: { type: String, default: "" },
      },
    ],
    serverInfo: {
      hosting: { type: String, default: "" },
      domain: { type: String, default: "" },
      ip: { type: String, default: "" },
      serverType: { type: String, default: "" },
      dashboardUrl: { type: String, default: "" },
      notes: { type: String, default: "" },
    },
    engineerContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      personId: { type: Schema.Types.ObjectId, ref: "LifePerson" },
    },
    supplierContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    monthlyExpenses: { type: Number, default: 0 },
    outstandingPayments: { type: Number, default: 0 },
    receivables: { type: Number, default: 0 },
    agreements: [
      {
        title: { type: String, required: true },
        fileUrl: { type: String, required: true },
        date: { type: String, default: "" },
      },
    ],
    instructions: { type: String, default: "" },
    continuitySteps: [ContinuityStepSchema],
  },
  { timestamps: true }
);

const LifeBusiness =
  mongoose.models.LifeBusiness ||
  mongoose.model<ILifeBusinessDoc>("LifeBusiness", LifeBusinessSchema);

export default LifeBusiness;
