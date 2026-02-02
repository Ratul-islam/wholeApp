import mqtt from "mqtt";

export function createMqttClient({ url }: { url: string }) {
  const client = mqtt.connect(url, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    keepalive: 30,
    reconnectPeriod: 2000,
  });

  client.on("connect", (a) => {
    client.subscribe("devices/+/+/events", { qos: 1 });
    client.subscribe("devices/+/+/status", { qos: 1 });
  });


  client.on("error", (err) => {
    console.error("[MQTT] error", err);
  });

  return client;
}
