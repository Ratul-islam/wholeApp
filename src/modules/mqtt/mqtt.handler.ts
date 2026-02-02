import { freeDevice } from "../device/device.services.js";
import { Session } from "../sessions/sessions.model.js";
import { Device } from "../device/device.model.js"; // adjust path
import { wsBroadcastToUser } from "../ws/ws.hub.js"; // adjust path

function parseDeviceIdFromTopic(topic: string) {
  // devices/{deviceId}/{secret}/status OR devices/{deviceId}/{secret}/events
  const parts = String(topic).split("/");
  if (parts[0] !== "devices") return "";
  return parts[1] ?? "";
}

async function broadcastDeviceByDeviceId(deviceId: string) {
  if (!deviceId) return;

  const device = await Device.findOne({ deviceId }).populate("sessionId");
  if (!device) return;
  console.log(device)
  wsBroadcastToUser(String(device.userId), {
    type: "device_update",
    data: device,
    ts: Date.now(),
  });
}

export async function handleMqttMessage(topic: string, msg: any) {

  console.log("MQTT topic:", topic);
  console.log("MQTT msg:", msg);
  const deviceId =parseDeviceIdFromTopic(topic);

  if (msg.type === "timeout" && msg.session_id) {
    const upd = await Session.updateOne(
      { sessionId: msg.session_id },
      { $set: { status: "abandoned" } }
    );
    console.log("session timeout update:", upd);

    if (deviceId) {
      const res = await freeDevice(deviceId);
      // console.log("freeDevice:", res);
    }

    
    await broadcastDeviceByDeviceId(deviceId);
    return;
  }
  
  if (msg.type === "session_started" && msg.session_id) {
    const upd = await Session.updateOne(
      { sessionId: msg.session_id },
      { $set: { status: "in_game" } }
    );

    await broadcastDeviceByDeviceId(deviceId);
    return;
  }

  if (msg.type === "score_update" && msg.session_id) {

    const upd = await Session.updateOne(
      { sessionId: msg.session_id },
      {
        $set: {
          status: "in_game",
          score: msg.score ?? 0,
          correct: msg.correct ?? 0,
          wrong: msg.wrong ?? 0,
        },
      }
    );
    console.log("score_update update " + msg);

    await broadcastDeviceByDeviceId(deviceId);
    return;
  }

  if (msg.type === "session_end" && msg.session_id) {
    const upd = await Session.updateOne(
      { sessionId: msg.session_id },
      {
        $set: {
          status: "completed",
          score: msg.final_score ?? msg.score ?? 0,
          correct: msg.correct ?? 0,
          wrong: msg.wrong ?? 0,
          endedAt: new Date(),
        },
      }
    );

    if (deviceId) {
      const res = await freeDevice(deviceId);
      console.log("freeDevice:", res);
    }

    await broadcastDeviceByDeviceId(deviceId);
    return;
  }
}
