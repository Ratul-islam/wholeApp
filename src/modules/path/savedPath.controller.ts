import { FastifyReply, FastifyRequest } from "fastify";
import { savedPathService } from "./savedPath.service.js";
import { sendError, sendSuccess } from "../../utils/responses.js";

export const savedPathController = {
  async save(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req.user as any).id;
      const pathId = (req.body as any).pathId as string;

      if (!userId) return sendError(res, { statusCode: 400, message: "Unauthorized" });
      if (!pathId) return sendError(res, { statusCode: 400, message: "pathId is required" });

      const doc = await savedPathService.savePath({ userId, pathId });
      console.log(doc)
      return sendSuccess(res, { message: "Saved", data: doc });
    } catch (e: any) {
      return sendError(res, { statusCode: 500, message: e?.message || "Failed to save" });
    }
  },

  async unsave(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req.user as any).id;
      const pathId = (req.params as any)?.pathId as string;

      if (!userId) return sendError(res, { statusCode: 400, message: "Unauthorized" });
      if (!pathId) return sendError(res, { statusCode: 400, message: "pathId is required" });

      const out = await savedPathService.unsavePath({ userId, pathId });
      return sendSuccess(res, { message: "Removed", data: out });
    } catch (e: any) {
      return sendError(res, { statusCode: 500, message: e?.message || "Failed to remove" });
    }
  },
  async list(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return sendError(res, { statusCode: 400, message: "Unauthorized" });

      const qObj = (req.query ?? {}) as any;

      const page = qObj.page ? Number(qObj.page) : 1;
      const limit = qObj.limit ? Number(qObj.limit) : 10;
      const q = qObj.q ? String(qObj.q) : "";

      const out = await savedPathService.listSaved({ userId, page, limit, q });
      return sendSuccess(res, { message: "OK", data: {list:out.data, meta: out.meta }, });
    } catch (e: any) {
      return sendError(res, { statusCode: 500, message: e?.message || "Failed to load saved" });
    }
  },

  async check(req: FastifyRequest, res: FastifyReply) {
    try {
      const userId = (req.user as any)?.id;
      const pathId = (req.params as any)?.pathId as string;

      if (!userId) return sendError(res, { statusCode: 400, message: "Unauthorized" });
      if (!pathId) return sendError(res, { statusCode: 400, message: "pathId is required" });

      const out = await savedPathService.isSaved({ userId, pathId });

      return sendSuccess(res, { message: "OK", data: out });
    } catch (e: any) {
      return sendError(res, { statusCode: 500, message: e?.message || "Failed to check" });
    }
  },
};
