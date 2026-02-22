import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createPath, deletePathService, getAllPath, updatePathService } from "./path.services.js";
import { sendError, sendSuccess } from "../../utils/responses.js";
import { getUserBy } from "../user/user.service.js";
import mongoose from "mongoose";

export const savePath = async (
    request: FastifyRequest,
    reply: FastifyReply,
    app: FastifyInstance
) => {

    const { name, path, isPublic } = request.body as {
      name: string,
      path: any,
      isPublic?: boolean
    }
    await createPath((request as any).user.id, name , path, isPublic)
    sendSuccess(reply, {message: "path created successfully"})
}


export const getPath = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request as any).user?.id;

  const user = await getUserBy({ id: userId });
  if (!user) return sendError(reply, { message: "No user found" });

  const { page, limit, q } = (request.query as any) || {};

  const result = await getAllPath(userId, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    q: typeof q === "string" ? q : undefined,
  });

  return sendSuccess(reply, {
    message: "paths fetched successfully",
    data: {
        list: result.data,
        meta: result.meta,
    },
  });
};

export const deletePath = async (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    const user = (request.user as any).id
    const pathId = (request.body as any).pathId
    if(!user) sendError(reply,{message:"No user found"})
    const data = await deletePathService(user, pathId);
    if(!data) return sendError(reply,{message:"no such path found"})
    sendSuccess(reply, {message: "path deleted successfully"})
}



export const updatePath = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (request as any).user?.id;

    const { pathId, name, path, isPublic } = request.body as {
      pathId: string;
      name?: string;
      path?: any[];
      isPublic?: boolean;
    };

    if (!pathId) return sendError(reply, { message: "pathId is required" });
    if (!mongoose.Types.ObjectId.isValid(pathId))
      return sendError(reply, { message: "Invalid pathId" });

    const ops: {
      $set?: { name?: string; path?: any[]; isPublic?: boolean };
    } = {};

    if (typeof name === "string") {
      const trimmed = name.trim();
      if (!trimmed) return sendError(reply, { message: "Name cannot be empty" });
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
  } catch (err) {
    request.log?.error(err);
    return sendError(reply, { message: "Internal server error" });
  }
};