import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { connectedDevice } from "./device.services";
import { sendError, sendSuccess } from "../../utils/responses";
import { getSessionById } from "../sessions/sessions.services";
import { getPathById } from "../path/path.services";

export const getDeviceStatus=async(req:FastifyRequest, reply:FastifyReply)=>{

    const user = (req.user as any).id;
    const res= await connectedDevice(user)

    if(res){
        return sendSuccess(reply, {data: res})
    }
    return sendError(reply, {message: "not connected"})
}


export const loadPath=async(req:FastifyRequest, reply:FastifyReply, app:FastifyInstance)=>{

    const user = (req.user as any).id;

    const {pathId, deviceId, deviceSecret} = (req.body as any)
    const path= await getPathById(pathId);

    if(!path) return sendError(reply,{message:"no such path found"})

  const topic = `devices/${deviceId}/${deviceSecret}/cmd`;
  const cmd = {
    type: "preset",
    path: path.path,
    name: path.name,
    preset_size: JSON.stringify(path.path.length),
    ts: Date.now(),
  };


  app.mqtt.publish(topic, JSON.stringify(cmd), { qos: 1 });

    return sendSuccess(reply, {message: "path sent"})
}