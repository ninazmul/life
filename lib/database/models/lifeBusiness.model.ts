import mongoose, { Schema, Document } from "mongoose";
import { ILifeContinuityStep } from "@/types";

export interface ILifeBusinessDoc extends Document {
  name: string;
  legalName?: string;
  registrationNumber?: string;
  businessType?: string;
  country?: string;
  ownershipPercentage: number;
  estimatedValue?: number;
  status: "active" | "inactive" | "pending";
  partners: Array<{
    name: string;
    personId?: mongoose.Types.ObjectId;
    ownershipPercentage: number;
    role?: string;
    initialCapital?: number;
    additionalInvestment?: number;
    profitDistribution?: string;
    lossResponsibility?: string;
    withdrawnAmount?: number;
    receivablePayable?: number;
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
  continuityInstructions?: {
    first24Hours?: string;
    first7Days?: string;
    contactList?: string;
    serverMaintenance?: string;
    staffSalaryResponsible?: string;
    supplierPaymentResponsible?: string;
    customerSupportResponsible?: string;
    importantAccountAccess?: string;
    soloDecisionRestrictions?: string;
    maxApprovedExpense?: number;
    continuityDirection?: "operate" | "transfer" | "sell";
  };
  assignedResponsibilities?: mongoose.Types.ObjectId[];
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
    registrationNumber: { type: String, trim: true, default: "" },
    businessType: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    ownershipPercentage: { type: Number, default: 100 },
    estimatedValue: { type: Number, default: 0 },
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
        initialCapital: { type: Number, default: 0 },
        additionalInvestment: { type: Number, default: 0 },
        profitDistribution: { type: String, default: "" },
        lossResponsibility: { type: String, default: "" },
        withdrawnAmount: { type: Number, default: 0 },
        receivablePayable: { type: Number, default: 0 },
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
    continuityInstructions: {
      first24Hours: { type: String, default: "" },
      first7Days: { type: String, default: "" },
      contactList: { type: String, default: "" },
      serverMaintenance: { type: String, default: "" },
      staffSalaryResponsible: { type: String, default: "" },
      supplierPaymentResponsible: { type: String, default: "" },
      customerSupportResponsible: { type: String, default: "" },
      importantAccountAccess: { type: String, default: "" },
      soloDecisionRestrictions: { type: String, default: "" },
      maxApprovedExpense: { type: Number, default: 0 },
      continuityDirection: {
        type: String,
        enum: ["operate", "transfer", "sell", ""],
        default: "operate",
      },
    },
    assignedResponsibilities: [
      { type: Schema.Types.ObjectId, ref: "LifeResponsibility" },
    ],
    continuitySteps: [ContinuityStepSchema],
  },
  { timestamps: true }
);

const LifeBusiness =
  mongoose.models.LifeBusiness ||
  mongoose.model<ILifeBusinessDoc>("LifeBusiness", LifeBusinessSchema);

export default LifeBusiness;
