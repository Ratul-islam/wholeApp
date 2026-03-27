import mongoose, { Types } from "mongoose";
const PathStatsSchema = new mongoose.Schema({
    pathId: { type: Types.ObjectId, ref: "path", unique: true, index: true, required: true },
    plays: { type: Number, default: 0, index: true },
    completed: { type: Number, default: 0 },
    abandoned: { type: Number, default: 0 },
    lastPlayedAt: { type: Date },
}, { timestamps: true });
PathStatsSchema.index({ plays: -1 });
export const PathStats = mongoose.model("PathStats", PathStatsSchema);
