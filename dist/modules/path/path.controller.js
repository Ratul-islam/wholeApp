import { createPath, deletePathService, getAllPath, getPathById, updatePathService } from "./path.services.js";
import { sendError, sendSuccess } from "../../utils/responses.js";
import { getUserBy } from "../user/user.service.js";
import mongoose from "mongoose";
import { countSessionsByPath, getSessionsByPathPaginated } from "../sessions/sessions.services.js";
export const savePath = async (request, reply, app) => {
    const { name, path, boardConf, isPublic } = request.body;
    await createPath(request.user.id, name, path, boardConf, isPublic);
    sendSuccess(reply, { message: "path created successfully" });
};
export const getPathDetails = async (request, reply) => {
    const userId = request.user?.id;
    const pathId = request.params.pathId;
    const query = request.query ?? {};
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const path = await getPathById(pathId);
    if (!path) {
        return sendError(reply, {
            message: "No such path exists",
            statusCode: 404,
        });
    }
    if (path.isPublic === false && String(path.userId._id) !== String(userId)) {
        return sendError(reply, {
            message: "path isnt public to view",
            statusCode: 403,
        });
    }
    const [matches, total] = await Promise.all([
        getSessionsByPathPaginated(path._id, { skip, limit }),
        countSessionsByPath(path._id),
    ]);
    const totalPages = Math.ceil(total / limit);
    return sendSuccess(reply, {
        data: {
            path,
            matches,
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        }
    });
};
export const getPath = async (request, reply) => {
    const userId = request.user?.id;
    const user = await getUserBy({ id: userId });
    if (!user)
        return sendError(reply, { message: "No user found" });
    const { page, limit, boardConf } = request.query || {};
    const result = await getAllPath(userId, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        q: typeof boardConf === "string" ? boardConf : undefined,
    });
    return sendSuccess(reply, {
        message: "paths fetched successfully",
        data: {
            list: result.data,
            meta: result.meta,
        },
    });
};
export const deletePath = async (request, reply) => {
    const user = request.user.id;
    const pathId = request.body.pathId;
    if (!user)
        sendError(reply, { message: "No user found" });
    const data = await deletePathService(user, pathId);
    if (!data)
        return sendError(reply, { message: "no such path found" });
    sendSuccess(reply, { message: "path deleted successfully" });
};
export const updatePath = async (request, reply) => {
    try {
        const userId = request.user?.id;
        const { pathId, name, path, isPublic } = request.body;
        if (!pathId)
            return sendError(reply, { message: "pathId is required" });
        if (!mongoose.Types.ObjectId.isValid(pathId))
            return sendError(reply, { message: "Invalid pathId" });
        const ops = {};
        if (typeof name === "string") {
            const trimmed = name.trim();
            if (!trimmed)
                return sendError(reply, { message: "Name cannot be empty" });
            ops.$set = { ...(ops.$set ?? {}), name: trimmed };
        }
        if (Array.isArray(path)) {
            ops.$set = { ...(ops.$set ?? {}), path };
        }
        if (typeof isPublic === "boolean") {
            ops.$set = { ...(ops.$set ?? {}), isPublic };
        }
        const hasSet = ops.$set && Object.keys(ops.$set).length > 0;
        if (!hasSet)
            return sendError(reply, { message: "No valid fields to update" });
        const updated = await updatePathService(userId, pathId, ops);
        if (!updated)
            return sendError(reply, { message: "No such path found" });
        return sendSuccess(reply, {
            message: "path updated successfully",
            data: updated,
        });
    }
    catch (err) {
        request.log?.error(err);
        return sendError(reply, { message: "Internal server error" });
    }
};
