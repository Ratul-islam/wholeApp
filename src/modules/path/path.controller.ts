import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createPath, deletePathService, getAllPath } from "./path.services";
import { sendError, sendSuccess } from "../../utils/responses";
import { getUserBy } from "../user/user.service";

export const savePath = async (
    request: FastifyRequest,
    reply: FastifyReply,
    app: FastifyInstance
) => {

    const { name, path } = request.body as {
      name: string,
      path: any
    }
    await createPath((request as any).user.id, name , path)
    sendSuccess(reply, {message: "path created successfully"})
}


export const getPath = async (
    request: FastifyRequest,
    reply: FastifyReply,
) => {
    const user= await getUserBy({id:(request as any).user.id})
    if(!user) sendError(reply,{message:"No user found"})
    const data = await getAllPath((request as any).user.id);
    sendSuccess(reply, {message: "path created successfully", data:data})
}

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
