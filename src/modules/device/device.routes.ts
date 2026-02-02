import { FastifyInstance } from "fastify";
import { getDeviceStatus, loadPath } from "./device.controller";
import { wsAdd, wsRemove } from "../ws/ws.hub";
import { Device } from "./device.model";

export default async function deviceRoutes(app: FastifyInstance) {
  app.get(
    "/connected",
    { preHandler: [(app as any).verifyAccess] },
    async (req, reply) => {
      return getDeviceStatus(req, reply);
    }
  );
app.post(
    "/load-path",
    { preHandler: [(app as any).verifyAccess] },
    async (req, reply) => {
      return loadPath(req, reply, app);
    }
  );

  app.get(
    "/live",
    { websocket: true, preHandler: [(app as any).verifyAccess] },
    async (connection: any, req) => {
      const socket = connection?.socket ?? connection;

      if (!socket || typeof socket.on !== "function") {
        app.log.error({ connection }, "WS socket missing on connection");
        return;
      }

      const userId = String(
        (req as any).user?._id ?? (req as any).user?.id ?? ""
      );
      if (!userId) {
        socket.close?.();
        return;
      }

      wsAdd(userId, socket);

      try {
        const device = await Device.findOne({ userId, isAvailable: false }).populate("sessionId");

        socket.send(
          JSON.stringify({
            type: "device_snapshot",
            data: device ?? null,
            ts: Date.now(),
          })
        );
      } catch (err) {
        app.log.error({ err }, "Failed to send initial device snapshot");
      }

      const t = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: "ping", ts: Date.now() }));
        }
      }, 25000);

      socket.on("close", () => {
        clearInterval(t);
        wsRemove(userId, socket);
      });

      socket.on("error", () => {
        clearInterval(t);
        wsRemove(userId, socket);
      });
    }
  );
}
