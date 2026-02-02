import mongoose, { Types } from "mongoose";

const pathSchema = new mongoose.Schema(
 {
    userId: { type: Types.ObjectId, required: true, index: true, ref: "user" },
    name: { type: String, default: "Untitled Route" },
    path: { type: Array, default: [] },

    isPublic: { type: Boolean, default: false, index: true },
    savesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Path = mongoose.model("Path", pathSchema);
