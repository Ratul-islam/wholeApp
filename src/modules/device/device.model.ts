import mongoose, { Types } from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    deviceId:{type: String},
    deviceSecret: {type:String},
    userId: { type: Types.ObjectId }, 
    sessionId:{type:Types.ObjectId, ref: "Session"},
    isAvailable:{type: Boolean }
  },
  { timestamps: true }
);

export const Device= mongoose.model("Device", deviceSchema);
