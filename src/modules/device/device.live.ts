import { Device } from "../device/device.model";
import { wsBroadcastToUser } from "../ws/ws.hub";

export async function pushDeviceSnapshotToUser(userId: string) {
  const device = await Device.findOne({ userId, isAvailable: false }).populate("sessionId");
  wsBroadcastToUser(userId, {
    type: "device_snapshot",
    data: device ?? null,
    ts: Date.now(),
  });
}

export async function pushDeviceSnapshotByDeviceId(deviceId: string) {
  const device = await Device.findOne({ deviceId }).populate("sessionId");
  if (!device) return;

  wsBroadcastToUser(String(device.userId), {
    type: "device_update",
    data: device,
    ts: Date.now(),
  });
}
