import { freeDevice } from "../device/device.services.js";
import { Session } from "../sessions/sessions.model.js";
import { Device } from "../device/device.model.js";
import { wsBroadcastToUser } from "../ws/ws.hub.js";
import { countSessionTowardLeaderboard } from "../path/pathStatus.service.js";
function parseDeviceIdFromTopic(topic) {
    const parts = String(topic).split("/");
    if (parts[0] !== "devices")
        return "";
    return parts[1] ?? "";
}
async function broadcastDeviceByDeviceId(deviceId) {
    if (!deviceId)
        return;
    const device = await Device.findOne({ deviceId }).populate("sessionId");
    if (!device)
        return;
    console.log(device);
    wsBroadcastToUser(String(device.userId), {
        type: "device_update",
        data: device,
        ts: Date.now(),
    });
}
export async function handleMqttMessage(topic, msg) {
    console.log("MQTT topic:", topic);
    console.log("MQTT msg:", msg);
    const deviceId = parseDeviceIdFromTopic(topic);
    if (msg.type === "timeout" && msg.session_id) {
        const upd = await Session.updateOne({ _id: msg.session_id }, { $set: { status: "abandoned" } });
        console.log("session timeout update:", upd);
        if (deviceId) {
            const res = await freeDevice(deviceId);
            // console.log("freeDevice:", res);
        }
        await broadcastDeviceByDeviceId(deviceId);
        return;
    }
    if (msg.type === "session_started" && msg.session_id) {
        const upd = await Session.updateOne({ _id: msg.session_id }, { $set: { status: "connected" } });
        await broadcastDeviceByDeviceId(deviceId);
        return;
    }
    if (msg.type === "pause_game" && msg.session_id) {
        const upd = await Session.updateOne({ _id: msg.session_id }, { $set: { status: "paused" } });
        await broadcastDeviceByDeviceId(deviceId);
        return;
    }
    if (msg.type === "resume_game" && msg.session_id) {
        const upd = await Session.updateOne({ _id: msg.session_id }, { $set: { status: "in_game" } });
        await broadcastDeviceByDeviceId(deviceId);
        return;
    }
    if (msg.type === "preset_loaded" && msg.session_id) {
        const upd = await Session.updateOne({ _id: msg.session_id }, { $set: { status: "preset_loaded" } });
        await broadcastDeviceByDeviceId(deviceId);
        return;
    }
    if (msg.type === "score_update" && msg.session_id) {
        const upd = await Session.updateOne({ _id: msg.session_id }, {
            $set: {
                status: "in_game",
                score: msg.score ?? 0,
                correct: msg.correct ?? 0,
                wrong: msg.wrong ?? 0,
            },
        });
        console.log("score_update update " + msg);
        await broadcastDeviceByDeviceId(deviceId);
        return;
    }
    if (msg.type === "board_mode" && msg.session_id) {
        const upd = await Session.updateOne({ _id: msg.session_id }, { $set: { control: msg.mode } });
        console.log("board_mode update msg:", msg);
        console.log("matched:", upd.matchedCount, "modified:", upd.modifiedCount);
        if (upd.matchedCount === 0) {
            console.warn("No session found for session_id:", msg.session_id);
        }
        await broadcastDeviceByDeviceId(deviceId);
        return;
    }
    if (msg.type === "session_end" && msg.session_id) {
        const upd = await Session.updateOne({ _id: msg.session_id }, {
            $set: {
                status: "completed",
                time: msg.time,
                score: msg.final_score ?? msg.score ?? 0,
                correct: msg.correct ?? 0,
                wrong: msg.wrong ?? 0,
                endedAt: new Date(),
            },
        });
        await countSessionTowardLeaderboard(msg.session_id);
        await broadcastDeviceByDeviceId(deviceId);
        if (deviceId) {
            const res = await freeDevice(deviceId);
        }
        return;
    }
}
