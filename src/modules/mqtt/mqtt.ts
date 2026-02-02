import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { MqttClient } from "mqtt";
import { createMqttClient } from "./mqttClient.js";
import { handleMqttMessage } from "./mqtt.handler.js";

export default fp(async function mqttPlugin(app: FastifyInstance) {
  const url = process.env.MQTT_URL ?? "mqtt://127.0.0.1:1883";

  const client: MqttClient = createMqttClient({ url });

  app.decorate("mqtt", client);

  // client.on("")

  client.on("message", async (topic: string, payload: Buffer) => {
    const raw = payload.toString("utf8");
    // console.log("got the event")
    let msg: any;
    try {
      msg = JSON.parse(raw);
      // console.log(raw)
    } catch {
      app.log.warn({ topic, payload: raw }, "Bad MQTT JSON");
      return;
    }

    try {
      await handleMqttMessage(topic, msg);
    } catch (err) {
      app.log.error({ err, topic, msg }, "MQTT handler failed");
    }
  });

  app.addHook("onClose", async () => {
    await new Promise<void>((resolve) => client.end(false, {}, () => resolve()));
  });
});
