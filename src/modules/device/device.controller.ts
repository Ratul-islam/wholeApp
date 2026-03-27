import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { connectedDevice, getDevicebyID } from "./device.services.js";
import { sendError, sendSuccess } from "../../utils/responses.js";
import { getPathById } from "../path/path.services.js";
import { getSessionById, updateSessionDoc,  } from "../sessions/sessions.services.js";
import { Types } from "mongoose";

export const getDeviceStatus=async(req:FastifyRequest, reply:FastifyReply)=>{

    const user = (req.user as any).id;
    const res= await connectedDevice(user)
    console.log("res")
    console.log(res)

    if(res){
        return sendSuccess(reply, {data: res})
    }
    return sendError(reply, {message: "not connected"})
}


export const loadPath= async(req:FastifyRequest, reply:FastifyReply, app:FastifyInstance)=>{

    const {pathId, id} = (req.body as any)
    const path= await getPathById(pathId);
    const session =await getSessionById(id);
    console.log(session)
    


    if(!path) return sendError(reply,{message:"no such path found"})

      if(!session) return sendError(reply,{message:"no such game found"})
        console.log("gg")
    if(session.control=="manual") return sendError(reply,{message: "device is in manual mode"});
    const topic = `devices/${session?.deviceId}/${session?.deviceSecret}/cmd`;
    const cmd = {
      type: "preset",
      path: path.path,
      name: path.name,
      preset_size: JSON.stringify(path.path.length),
      ts: Date.now(),
    };

    
 await updateSessionDoc(session, {
        pathId: new Types.ObjectId(pathId),
        status: "preset_loaded",
      });


  app.mqtt.publish(topic, JSON.stringify(cmd), { qos: 1 });

  return sendSuccess(reply, {message: "path sent"})
}

export const startGame= async(req:FastifyRequest, reply:FastifyReply, app:FastifyInstance)=>{

  const {pathId, deviceId, deviceSecret} = (req.body as any)

  const topic = `devices/${deviceId}/${deviceSecret}/cmd`;
  const cmd = {
    type: "start_game",
    ts: Date.now(),
  };


  app.mqtt.publish(topic, JSON.stringify(cmd), { qos: 1 });

  return sendSuccess(reply, {message: "start game"})
}
export const pauseGame= async(req:FastifyRequest, reply:FastifyReply, app:FastifyInstance)=>{

  const {deviceId, deviceSecret} = (req.body as any)

  const topic = `devices/${deviceId}/${deviceSecret}/cmd`;
  const cmd = {
    type: "pause_game",
    ts: Date.now(),
  };

  app.mqtt.publish(topic, JSON.stringify(cmd), { qos: 1 });

  return sendSuccess(reply, {message: "pause game"})
}
export const resumeGame= async(req:FastifyRequest, reply:FastifyReply, app:FastifyInstance)=>{

  const {deviceId, deviceSecret} = (req.body as any)

  const topic = `devices/${deviceId}/${deviceSecret}/cmd`;
  const cmd = {
    type: "resume_game",
    ts: Date.now(),
  };

  app.mqtt.publish(topic, JSON.stringify(cmd), { qos: 1 });

  return sendSuccess(reply, {message: "Resume game"})
}
export const endGame = async(req:FastifyRequest, reply:FastifyReply, app:FastifyInstance)=>{

  const {deviceId, deviceSecret} = (req.body as any)

  const topic = `devices/${deviceId}/${deviceSecret}/cmd`;
  const cmd = {
    type: "end_game",
    ts: Date.now(),
  };

  app.mqtt.publish(topic, JSON.stringify(cmd), { qos: 1 });

  return sendSuccess(reply, {message: "Resume game"})
}