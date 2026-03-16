import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getPathById } from "../path/path.services.js";
import { sendError, sendSuccess } from "../../utils/responses.js";
import { createSession, getAllSessionService, getLeaderboardByTotalScore } from "./sessions.services.js";
import { Types } from "mongoose";
import { connectDevice, isDeviceAvailable } from "../device/device.services.js";
import { getPathLeaderboard } from "../path/pathStatus.service.js";

export const startGameSession = async (
  req: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance
) => {
  const body = req.body as {
    deviceId: string;
    deviceSecret: string;
    boardConf:string,
    path: Types.ObjectId;
  };

  const { deviceId, deviceSecret, path , boardConf} = body;

  if (!deviceId || !deviceSecret) {
    return reply
      .code(400)
      .send({ ok: false, error: "deviceId, deviceSecret, path are required" });
  }

  const userId =
    (req as any).user?.id ?? (req as any).user?._id ?? "unknown";

  const deviceStatus = await isDeviceAvailable(userId);

  if (deviceStatus?.isAvailable === false) {
    if (String(deviceStatus.userId) !== String(userId)) {
      return sendError(reply, { message: "device is busy" });
    } else {
      return sendSuccess(reply, { message: "already connected" });
    }
  }
  
  const sessionId = `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  
  
  
  const sessionDoc = await createSession({
    sessionId,
    userId,
    deviceId,
    deviceSecret,
    control: "online",
    status: "starting",
  });
  await connectDevice(deviceId,boardConf, deviceSecret, userId, sessionDoc._id);

  const topic = `devices/${deviceId}/${deviceSecret}/cmd`;
  const cmd = {
    type: "start_session",
    session_id: sessionDoc._id,
    ts: Date.now(),
  };


  app.mqtt.publish(topic, JSON.stringify(cmd), { qos: 1 });

  return sendSuccess(reply, { message: "connected", data: { sessionId } });
};

export const getAllCompletedSession=async(req:FastifyRequest, reply:FastifyReply)=>{
  const limit = (req.query as any).limit
    try{
        const data= await getAllSessionService((req.user as any).id,limit);
        return sendSuccess(reply, {data:data})
    }catch(err:any){
        console.log(err)
        return sendError(reply, {message:err.message})
    }
}

export const leaderboardController = async (req: any, reply: any) => {
  const page = Math.max(1, Number(req.query?.page ?? 1));
  const limit = Math.max(1, Number(req.query?.limit ?? 10));
  const type = String(req.query?.type ?? "games").toLowerCase();
  const boardConf = req.query.boardConf;

  console.log(boardConf)

  let result;
  if (type === "games") {
    result = await getLeaderboardByTotalScore({ page, limit });
  } else {
    result = await getPathLeaderboard({ page, limit , boardConf});
  }
  
  return sendSuccess(reply ,{data: result});
};