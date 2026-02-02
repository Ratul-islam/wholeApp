import type { FastifyInstance } from "fastify";
import { getUserProfile } from "./user.controller";

export default async function userRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [(app as any).verifyAccess] }, async (req, reply) => {
   await getUserProfile(req, reply)
  });
}
