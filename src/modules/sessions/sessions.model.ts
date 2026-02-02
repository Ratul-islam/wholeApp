import mongoose, { Types } from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Types.ObjectId, required: true, index: true },

    deviceId: { type: String, required: true, index: true },
    deviceSecret: { type: String, required: true },

    pathId: { type: Types.ObjectId,  ref:"path" },

    status: {
      type: String,
      enum: ["starting", "preset_loaded","in_game", "completed", "abandoned"],
      default: "starting",
      index: true,
    },

    score: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },

    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

SessionSchema.index({ status: 1, userId: 1 });
SessionSchema.index({ score: -1 });


export const Session = mongoose.model("Session", SessionSchema);
