import mongoose, { Types } from "mongoose";

const savedPathSchema = new mongoose.Schema(
  {
    userId: { type: Types.ObjectId, required: true, index: true, ref: "user" },

    pathId: { type: Types.ObjectId, required: true, index: true, ref: "Path" },

    ownerId: { type: Types.ObjectId, required: true, index: true, ref: "user" },

    snapshotName: { type: String, default: "" },
    snapshotPath: { type: Array, default: [] },

    originDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

savedPathSchema.index({ userId: 1, pathId: 1 }, { unique: true });

export const SavedPath = mongoose.model("SavedPath", savedPathSchema);
