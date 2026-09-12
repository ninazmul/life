import { Schema } from "mongoose";

export interface ISoftDelete {
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export function softDeletePlugin(schema: Schema) {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: String,
      default: null,
    },
  });
}
