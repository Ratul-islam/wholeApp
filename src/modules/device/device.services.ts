import { Types } from "mongoose"
import { Device } from "./device.model.js"

export const isDeviceAvailable= async (userId:Types.ObjectId)=>{
    const data = await Device.findOne({userId})
    return data
}

export const connectDevice = async (
  deviceId: string,
  deviceSecret: string,
  userId: Types.ObjectId,
  sessionId: Types.ObjectId
) => {
  const existing = await Device.findOne({ deviceId });

  if (!existing) {
    await Device.create({
      deviceId,
      deviceSecret,
      userId,
      sessionId,
      isAvailable: false,
    });
    return;
  }

  await Device.updateOne(
    { deviceId },
    { $set: { userId,sessionId, deviceSecret, isAvailable: false } }
  );
};

export const freeDevice = async (deviceId: string) => {
  await Device.updateOne(
    { deviceId },
    {
      $set: { isAvailable: true },
      $unset: { userId: 1,sessionId:1 },
    }
  );
};

export const connectedDevice=async(userId:Types.ObjectId)=>{
  const res= await Device.findOne({userId}).populate("sessionId");
  return res;
}
