import mongoose, { Schema, Document } from "mongoose";
import { NoteType, NoteStatus, INoteHistoryEntry, INoteUserResponse } from "@/types";

export interface ILifeNoteDoc extends Document {
  title: string;
  content: string;
  noteType: NoteType;
  assignedPersonId: mongoose.Types.ObjectId;
  assignedPersonName?: string;
  createdBy: string;
  createdByName?: string;
  lastEditedBy?: string;
  priority: "low" | "medium" | "high" | "critical";
  category?: string;
  tags?: string[];
  isPinned: boolean;
  attachments?: string[];
  isArchived: boolean;
  status: NoteStatus;
  waitingPeriodHours: number;
  unlockRequestedAt?: Date;
  unlockRequestedBy?: string;
  unlockDeadline?: Date;
  scheduledReleaseDate?: Date;
  isReleased: boolean;
  releasedAt?: Date;
  releasedBy?: string;
  relockedAt?: Date;
  relockedBy?: string;
  userActions?: {
    readAt?: Date;
    acknowledgedAt?: Date;
    followUpRequired?: boolean;
    completedAt?: Date;
    responses?: INoteUserResponse[];
  };
  history?: INoteHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const LifeNoteSchema = new Schema<ILifeNoteDoc>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    noteType: {
      type: String,
      enum: [
        "internal_admin",
        "always_visible",
        "manual_release",
        "scheduled_release",
        "secret_emergency",
      ],
      default: "always_visible",
      index: true,
    },
    assignedPersonId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      index: true,
    },
    assignedPersonName: { type: String, default: "" },
    createdBy: { type: String, required: true },
    createdByName: { type: String, default: "" },
    lastEditedBy: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    category: { type: String, default: "General", trim: true },
    tags: [{ type: String, trim: true }],
    isPinned: { type: Boolean, default: false, index: true },
    attachments: [{ type: String }],
    isArchived: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: [
        "locked",
        "unlock_requested",
        "countdown_active",
        "approved",
        "request_cancelled",
        "request_rejected",
        "released",
        "relocked",
        "archived",
      ],
      default: "released",
      index: true,
    },
    waitingPeriodHours: { type: Number, default: 48 },
    unlockRequestedAt: { type: Date },
    unlockRequestedBy: { type: String, default: "" },
    unlockDeadline: { type: Date, index: true },
    scheduledReleaseDate: { type: Date },
    isReleased: { type: Boolean, default: true, index: true },
    releasedAt: { type: Date },
    releasedBy: { type: String, default: "" },
    relockedAt: { type: Date },
    relockedBy: { type: String, default: "" },
    userActions: {
      readAt: { type: Date },
      acknowledgedAt: { type: Date },
      followUpRequired: { type: Boolean, default: false },
      completedAt: { type: Date },
      responses: [
        {
          respondedAt: { type: Date, default: Date.now },
          respondedBy: { type: String, default: "" },
          message: { type: String, required: true },
        },
      ],
    },
    history: [
      {
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, required: true },
        action: { type: String, required: true },
        previousContent: { type: String },
        newContent: { type: String },
        previousNoteType: { type: String },
        newNoteType: { type: String },
        previousWaitingPeriod: { type: Number },
        newWaitingPeriod: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

LifeNoteSchema.index({ assignedPersonId: 1, isPinned: -1, createdAt: -1 });
LifeNoteSchema.index({ noteType: 1, status: 1 });

const LifeNote =
  mongoose.models.LifeNote ||
  mongoose.model<ILifeNoteDoc>("LifeNote", LifeNoteSchema);

export default LifeNote;
