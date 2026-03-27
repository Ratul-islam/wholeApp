import { savedPathService } from "./savedPath.service.js";
import { sendError, sendSuccess } from "../../utils/responses.js";
export const savedPathController = {
    async save(req, res) {
        try {
            const userId = req.user.id;
            const pathId = req.body.pathId;
            if (!userId)
                return sendError(res, { statusCode: 400, message: "Unauthorized" });
            if (!pathId)
                return sendError(res, { statusCode: 400, message: "pathId is required" });
            const doc = await savedPathService.savePath({ userId, pathId });
            console.log(doc);
            return sendSuccess(res, { message: "Saved", data: doc });
        }
        catch (e) {
            return sendError(res, { statusCode: 500, message: e?.message || "Failed to save" });
        }
    },
    async unsave(req, res) {
        try {
            const userId = req.user.id;
            const pathId = req.params?.pathId;
            if (!userId)
                return sendError(res, { statusCode: 400, message: "Unauthorized" });
            if (!pathId)
                return sendError(res, { statusCode: 400, message: "pathId is required" });
            const out = await savedPathService.unsavePath({ userId, pathId });
            return sendSuccess(res, { message: "Removed", data: out });
        }
        catch (e) {
            return sendError(res, { statusCode: 500, message: e?.message || "Failed to remove" });
        }
    },
    async list(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return sendError(res, { statusCode: 400, message: "Unauthorized" });
            const qObj = (req.query ?? {});
            const page = qObj.page ? Number(qObj.page) : 1;
            const limit = qObj.limit ? Number(qObj.limit) : 10;
            const q = qObj.q ? String(qObj.q) : "";
            const out = await savedPathService.listSaved({ userId, page, limit, q });
            return sendSuccess(res, { message: "OK", data: { list: out.data, meta: out.meta }, });
        }
        catch (e) {
            return sendError(res, { statusCode: 500, message: e?.message || "Failed to load saved" });
        }
    },
    async check(req, res) {
        try {
            const userId = req.user?.id;
            const pathId = req.params?.pathId;
            if (!userId)
                return sendError(res, { statusCode: 400, message: "Unauthorized" });
            if (!pathId)
                return sendError(res, { statusCode: 400, message: "pathId is required" });
            const out = await savedPathService.isSaved({ userId, pathId });
            return sendSuccess(res, { message: "OK", data: out });
        }
        catch (e) {
            return sendError(res, { statusCode: 500, message: e?.message || "Failed to check" });
        }
    },
};
