import { getAllCompletedSession, leaderboardController, startGameSession } from "./sessions.controller.js";
export default async function sessionsRoutes(app) {
    app.post("/start", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        await startGameSession(req, reply, app);
    });
    app.get("/", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        await getAllCompletedSession(req, reply);
    });
    app.get("/leaderboard", { preHandler: [app.verifyAccess] }, async (req, reply) => {
        await leaderboardController(req, reply);
    });
}
