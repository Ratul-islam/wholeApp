import { sendError, sendSuccess } from "../../utils/responses.js";
import { createSession, getAllSessionService, getLeaderboardByTotalScore, updateSessionDoc } from "./sessions.services.js";
import { connectDevice, freeDevice, isDeviceAvailable } from "../device/device.services.js";
import { getPathLeaderboard } from "../path/pathStatus.service.js";
import { waitForMqttResponse } from "../../utils/mqttResponse.js";
export const startGameSession = async (req, reply, app) => {
    const { deviceId, deviceSecret, boardConf, path } = req.body;
    if (!deviceId || !deviceSecret) {
        return reply
            .code(400)
            .send({ ok: false, error: "deviceId, deviceSecret, path are required" });
    }
    const userId = req.user?.id ?? req.user?._id ?? "unknown";
    const deviceStatus = await isDeviceAvailable(userId);
    if (deviceStatus?.isAvailable === false) {
        return String(deviceStatus.userId) !== String(userId)
            ? sendError(reply, { message: "device is busy" })
            : sendSuccess(reply, { message: "already connected" });
    }
    const sessionDoc = await createSession({
        userId,
        deviceId,
        deviceSecret,
        control: "online",
        status: "connecting",
    });
    await connectDevice(deviceId, boardConf, deviceSecret, userId, sessionDoc._id);
    const topic = `devices/${deviceId}/${deviceSecret}/cmd`;
    const responseTopic = `devices/${deviceId}/${deviceSecret}/status`;
    const cmd = { type: "start_session", session_id: sessionDoc._id, ts: Date.now() };
    app.mqtt.publish(topic, JSON.stringify(cmd), { qos: 1 });
    try {
        const deviceResp = await waitForMqttResponse(app.mqtt, responseTopic, sessionDoc._id, 15000);
        await updateSessionDoc(sessionDoc, { status: "starting" });
        return sendSuccess(reply, { message: "connected", data: { deviceResp } });
    }
    catch (err) {
        console.log(err);
        await updateSessionDoc(sessionDoc, { status: "abandoned" });
        await freeDevice(deviceId);
        return sendError(reply, { message: "Unable to connect to device." });
    }
};
export const getAllCompletedSession = async (req, reply) => {
    const limit = req.query.limit;
    try {
        const data = await getAllSessionService(req.user.id, limit);
        return sendSuccess(reply, { data: data });
    }
    catch (err) {
        console.log(err);
        return sendError(reply, { message: err.message });
    }
};
export const leaderboardController = async (req, reply) => {
    const page = Math.max(1, Number(req.query?.page ?? 1));
    const limit = Math.max(1, Number(req.query?.limit ?? 10));
    const type = String(req.query?.type ?? "games").toLowerCase();
    const boardConf = req.query.boardConf;
    let result;
    if (type === "games") {
        result = await getLeaderboardByTotalScore({ page, limit });
    }
    else {
        result = await getPathLeaderboard({ page, limit, boardConf });
    }
    return sendSuccess(reply, { data: result });
};
