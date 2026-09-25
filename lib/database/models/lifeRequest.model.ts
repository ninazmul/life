import mongoose, { Schema, Document } from "mongoose";

export type RequestCategory =
  | "access_request"
  | "financial_care"
  | "document_access"
  | "note_access"
  | "information_request"
  | "responsibility_request"
  | "general_inquiry"
  | "other";

export type RequestStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export interface IRequestMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachments?: string[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface ILifeRequestDoc extends Document {
  /** Who submitted the request */
  submittedByPersonId?: mongoose.Types.ObjectId;
  submittedByUserId: string;
  submittedByName: string;
  submittedByEmail: string;
  submittedByRole: string;

  category: RequestCategory;
  title: string;
  description: string;
  attachments?: string[];

  /** Related record references (optional) */
  relatedRecordId?: string;
  relatedRecordType?: string;
  relatedRecordName?: string;

  status: RequestStatus;
  adminResponse?: string;
  resolvedBy?: string;
  resolvedAt?: Date;

  /** Conversation thread between user & admin */
  messages: IRequestMessage[];

  /** Count of unread messages for admin */
  unreadByAdmin: number;
  /** Count of unread messages for submitter */
  unreadByUser: number;

  /** Badge visibility helpers */
  isNewForAdmin: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const RequestMessageSchema = new Schema<IRequestMessage>(
  {
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    message: { type: String, required: true, trim: true },
    attachments: [{ type: String }],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const LifeRequestSchema = new Schema<ILifeRequestDoc>(
  {
    submittedByPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    submittedByUserId: { type: String, required: true, index: true },
    submittedByName: { type: String, required: true, trim: true },
    submittedByEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    submittedByRole: { type: String, required: true, default: "individual" },

    category: {
      type: String,
      enum: [
        "access_request",
        "financial_care",
        "document_access",
        "note_access",
        "information_request",
        "responsibility_request",
        "general_inquiry",
        "other",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    attachments: [{ type: String }],

    relatedRecordId: { type: String, default: "" },
    relatedRecordType: { type: String, default: "" },
    relatedRecordName: { type: String, default: "" },

    status: {
      type: String,
      enum: [
        "pending",
        "in_review",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    adminResponse: { type: String, default: "" },
    resolvedBy: { type: String, default: "" },
    resolvedAt: { type: Date },

    messages: [RequestMessageSchema],

    unreadByAdmin: { type: Number, default: 0, index: true },
    unreadByUser: { type: Number, default: 0, index: true },
    isNewForAdmin: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

LifeRequestSchema.index({ submittedByEmail: 1, status: 1 });
LifeRequestSchema.index({ isNewForAdmin: 1, status: 1 });
LifeRequestSchema.index({ createdAt: -1 });

const LifeRequest =
  mongoose.models.LifeRequest ||
  mongoose.model<ILifeRequestDoc>("LifeRequest", LifeRequestSchema);

export default LifeRequest;
