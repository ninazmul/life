import mongoose, { Schema, Document } from "mongoose";
import { IConversationMessage, IConversationAttachment } from "@/types";

export interface ILifeConversationDoc extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  userRole?: string;
  personId?: mongoose.Types.ObjectId;

  messages: IConversationMessage[];

  unreadByAdmin: number;
  unreadByUser: number;

  lastMessageText?: string;
  lastMessageAt?: Date;
  lastMessageSenderRole?: string;
  isPinned?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ConversationAttachmentSchema = new Schema<IConversationAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String },
    size: { type: Number },
  },
  { _id: false },
);

const ConversationMessageSchema = new Schema<IConversationMessage>(
  {
    senderId: { type: String, required: true },
    senderEmail: { type: String, required: true, lowercase: true, trim: true },
    senderName: { type: String, required: true, trim: true },
    senderRole: { type: String, required: true },
    message: { type: String, default: "", trim: true },
    attachments: [ConversationAttachmentSchema],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    noteRef: {
      noteId: { type: String },
      noteTitle: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const LifeConversationSchema = new Schema<ILifeConversationDoc>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userName: { type: String, required: true, trim: true },
    userRole: { type: String, default: "individual" },
    personId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      index: true,
    },
    messages: [ConversationMessageSchema],
    unreadByAdmin: { type: Number, default: 0, min: 0 },
    unreadByUser: { type: Number, default: 0, min: 0 },
    lastMessageText: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessageSenderRole: { type: String },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

LifeConversationSchema.index({ userEmail: 1 }, { unique: true });
LifeConversationSchema.index({ lastMessageAt: -1 });

const LifeConversation =
  mongoose.models.LifeConversation ||
  mongoose.model<ILifeConversationDoc>(
    "LifeConversation",
    LifeConversationSchema,
  );

export default LifeConversation;
