import { getPathAllByUserId } from "../path/path.services.js";
import { getAllSessionService, getUserStatsService } from "../sessions/sessions.services.js";
import { getUserBy } from "./user.service.js";
import { sendError } from "../../utils/responses.js";
export const getUserProfile = async (req, reply) => {
    try {
        const userId = req?.params?.userId ||
            req?.query?.userId ||
            req?.body?.userId;
        if (!userId)
            return sendError(reply, { message: "Invalid user id" });
        const user = await getUserBy({ id: userId }, { safe: true });
        if (!user)
            return sendError(reply, { statusCode: 404, message: "No user found" });
        const sameUser = userId == req.user.id;
        console.log(req.user.id);
        const [paths, recentGames, stats] = await Promise.all([
            getPathAllByUserId(userId, sameUser),
            getAllSessionService(userId, 10),
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
    }
    catch (err) {
        return reply.code(500).send({
            status: "error",
            message: err?.message || "Failed to load user profile",
        });
    }
};
