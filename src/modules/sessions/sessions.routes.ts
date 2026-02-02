import type { FastifyInstance } from "fastify";
import { getAllCompletedSession, leaderboardController, startGameSession } from "./sessions.controller.js";

export default async function sessionsRoutes(app: FastifyInstance) {
  app.post("/start", { preHandler: [(app as any).verifyAccess] }, async (req, reply) => {
   await startGameSession(req, reply,app)
  });
  
  app.get("/", { preHandler: [(app as any).verifyAccess] }, async (req, reply) => {
   await getAllCompletedSession(req, reply)
  });
  app.get("/leaderboard", { preHandler: [(app as any).verifyAccess] }, async (req, reply) => {
   await leaderboardController(req, reply)
  });
}
