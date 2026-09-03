import mongoose, { Schema, Document } from "mongoose";

export interface ILifeActivityLogDoc extends Document {
  actorEmail: string;
  actorName?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const LifeActivityLogSchema = new Schema<ILifeActivityLogDoc>(
  {
    actorEmail: { type: String, required: true, index: true },
    actorName: { type: String, default: "" },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, default: "" },
    resourceName: { type: String, default: "" },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LifeActivityLogSchema.index({ createdAt: -1 });

const LifeActivityLog =
  mongoose.models.LifeActivityLog ||
  mongoose.model<ILifeActivityLogDoc>(
    "LifeActivityLog",
    LifeActivityLogSchema
  );

export default LifeActivityLog;
