import { Types } from "mongoose";
import { getPathAllByUserId } from "../path/path.services";
import { getAllSessionService, getUserStatsService } from "../sessions/sessions.services";
import { getUserBy } from "./user.service";
import { sendError } from "../../utils/responses";


export const getUserProfile = async (req: any, reply: any) => {
  try {
    const userId =
      req?.params?.userId ||
      req?.query?.userId ||
      req?.body?.userId;

    if (!userId) return sendError(reply, {message: "Invalid user id"})

    const user = await getUserBy({ id: userId }, {safe: true});
    if (!user) return sendError(reply, {statusCode: 404, message: "No user found"})
      
    const [paths, recentGames, stats] = await Promise.all([
      getPathAllByUserId(userId),
      getAllSessionService(userId,10),
      getUserStatsService(userId),
    ]);

    return reply.send({
      status: "success",
      message: "Success",
      data: {
        user,
        stats,
        paths: paths ?? [],
        recentGames: recentGames ?? [],
      },
    });
  } catch (err: any) {
    return reply.code(500).send({
      status: "error",
      message: err?.message || "Failed to load user profile",
    });
  }
};