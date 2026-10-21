import mongoose, { Schema, Document } from "mongoose";
import { softDeletePlugin } from "../plugins/softDelete";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface ILifeInvitationDoc extends Document {
  personId: mongoose.Types.ObjectId;
  ownerEmail: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedByClerkUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LifeInvitationSchema = new Schema<ILifeInvitationDoc>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      ref: "LifePerson",
      required: true,
      index: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
    acceptedByClerkUserId: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

LifeInvitationSchema.plugin(softDeletePlugin);

const LifeInvitation =
  mongoose.models.LifeInvitation ||
  mongoose.model<ILifeInvitationDoc>("LifeInvitation", LifeInvitationSchema);

export default LifeInvitation;
