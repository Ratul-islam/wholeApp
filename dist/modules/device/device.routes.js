import { getDeviceStatus, loadPath, pauseGame, resumeGame, startGame, endGame } from "./device.controller.js";
import { wsAdd, wsRemove } from "../ws/ws.hub.js";
import { Device } from "./device.model.js";
export default async function deviceRoutes(app) {
    app.get("/connected", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        return getDeviceStatus(req, reply);
    });
    app.post("/load-path", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        return loadPath(req, reply, app);
    });
    app.post("/start-game", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        return startGame(req, reply, app);
    });
    app.post("/pause-game", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        return pauseGame(req, reply, app);
    });
    app.post("/resume-game", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        return resumeGame(req, reply, app);
    });
    app.post("/end-game", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        return endGame(req, reply, app);
    });
    app.get("/live", { websocket: true, preHandler: [app.verifyAccess] }, async (connection, req) => {
        const socket = connection?.socket ?? connection;
        if (!socket || typeof socket.on !== "function") {
            app.log.error({ connection }, "WS socket missing on connection");
            return;
        }
        const userId = String(req.user?._id ?? req.user?.id ?? "");
        if (!userId) {
            socket.close?.();
            return;
        }
        wsAdd(userId, socket);
        try {
            const device = await Device.findOne({ userId, isAvailable: false }).populate("sessionId");
            socket.send(JSON.stringify({
                type: "device_snapshot",
                data: device ?? null,
                ts: Date.now(),
            }));
        }
        catch (err) {
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
    });
}
