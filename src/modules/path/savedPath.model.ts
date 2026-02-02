import mongoose, { Types } from "mongoose";

const savedPathSchema = new mongoose.Schema(
  {
    // who saved it
    userId: { type: Types.ObjectId, required: true, index: true, ref: "user" },

    // original path reference
    pathId: { type: Types.ObjectId, required: true, index: true, ref: "Path" },

    // original owner/creator of the path (IMPORTANT: what you asked for)
    ownerId: { type: Types.ObjectId, required: true, index: true, ref: "user" },

    // snapshot so saved still works if original gets deleted
    snapshotName: { type: String, default: "" },
    snapshotPath: { type: Array, default: [] },

    // optional flag if you later want to mark original deleted
    originDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// one save per user per path
savedPathSchema.index({ userId: 1, pathId: 1 }, { unique: true });

export const SavedPath = mongoose.model("SavedPath", savedPathSchema);
