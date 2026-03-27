import { Device } from "./device.model.js";
export const isDeviceAvailable = async (userId) => {
    const data = await Device.findOne({ userId });
    return data;
};
export const connectDevice = async (deviceId, boardConf, deviceSecret, userId, sessionId) => {
    const existing = await Device.findOne({ deviceId });
    if (!existing) {
        await Device.create({
            deviceId,
            deviceSecret,
            boardConf,
            userId,
            sessionId,
            isAvailable: false,
        });
        return;
    }
    await Device.updateOne({ deviceId }, { $set: { userId, sessionId, deviceSecret, isAvailable: false } });
};
export const freeDevice = async (deviceId) => {
    await Device.updateOne({ deviceId }, {
        $set: { isAvailable: true },
        $unset: { userId: 1, sessionId: 1 },
    });
};
export const connectedDevice = async (userId) => {
    const res = await Device.findOne({ userId }).populate("sessionId boardConf");
    return res;
};
export const getDevicebyID = async (deviceId) => {
    const res = await Device.findOne({ deviceId }).populate("sessionId");
    return res;
};
