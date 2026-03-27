import fp from "fastify-plugin";
import { createMqttClient } from "./mqttClient.js";
import { handleMqttMessage } from "./mqtt.handler.js";
export default fp(async function mqttPlugin(app) {
    const url = process.env.MQTT_URL ?? "mqtt://127.0.0.1:1883";
    const client = createMqttClient({ url });
    app.decorate("mqtt", client);
    // client.on("")
    client.on("message", async (topic, payload) => {
        const raw = payload.toString("utf8");
        // console.log("got the event")
        let msg;
        try {
            msg = JSON.parse(raw);
            // console.log(raw)
        }
        catch {
            app.log.warn({ topic, payload: raw }, "Bad MQTT JSON");
            return;
        }
        try {
            await handleMqttMessage(topic, msg);
        }
        catch (err) {
            app.log.error({ err, topic, msg }, "MQTT handler failed");
        }
    });
    app.addHook("onClose", async () => {
        await new Promise((resolve) => client.end(false, {}, () => resolve()));
    });
});
