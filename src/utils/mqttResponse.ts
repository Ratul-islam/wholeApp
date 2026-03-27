import { Types } from "mongoose";

export const waitForMqttResponse = (
  mqttClient: any,
  responseTopic: string,
  sessionId: Types.ObjectId,
  timeout = 10000
) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      mqttClient.removeListener("message", onMessage);
      reject(new Error("MQTT response timeout"));
    }, timeout);

    const onMessage = (topic: string, message: Buffer) => {
        
      if (topic !== responseTopic) return;

      try {
        const payload = JSON.parse(message.toString());
        if (payload.session_id ==sessionId) {
          clearTimeout(timer);
          mqttClient.removeListener("message", onMessage);
          resolve(payload);
        }
        console.log(payload.session_id == sessionId)
      } catch {
        // 
      }
    };

    mqttClient.on("message", onMessage);
  });