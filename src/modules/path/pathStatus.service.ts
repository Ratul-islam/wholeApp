import mongoose, { Types } from "mongoose";
import { Session } from "../sessions/sessions.model.js";
import { PathStats } from "./pathStatus.model.js";
import { PipelineStage } from "mongoose";


export async function countSessionTowardLeaderboard(sessionId: Types.ObjectId) {
  const dbSession = await mongoose.startSession();

  try {
    await dbSession.withTransaction(async () => {
      const s = await Session.findOneAndUpdate(
        {
          _id: sessionId,
          pathId: { $exists: true, $ne: null },
          $or: [
            { countedInLeaderboard: false },
            { countedInLeaderboard: { $exists: false } },
          ],
        },
        { $set: { countedInLeaderboard: true } },
        { new: true, session: dbSession }
      );

      if (!s) {
        const exists = await Session.findById(sessionId).lean();
        console.log("Leaderboard count skipped. Session exists?", !!exists, {
          sessionId: String(sessionId),
          hasPathId: !!exists?.pathId,
          countedInLeaderboard: (exists as any)?.countedInLeaderboard,
          status: exists?.status,
        });
        return;
      }

      const status = String(s.status);
      const inc: any = { plays: 1 };
      if (status === "completed") inc.completed = 1;
      if (status === "abandoned") inc.abandoned = 1;

      await PathStats.updateOne(
        { pathId: s.pathId },
        { $inc: inc, $set: { lastPlayedAt: new Date() } },
        { upsert: true, session: dbSession }
      );

      console.log("Leaderboard counted for session:", String(s._id), "path:", String(s.pathId));
    });
  } catch (err) {
    console.log("countSessionTowardLeaderboard error:", err);
  } finally {
    dbSession.endSession();
  }
}


type LeaderboardParams = {
  page?: number;
  limit?: number;
  type?: string;
  boardConf: String;
};

export const getPathLeaderboard = async ({
  page = 1,
  limit = 10,
  boardConf,
}: LeaderboardParams) => {


  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  const [result] = await PathStats.aggregate([
    {
      $match: {
        pathId: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "paths",
        localField: "pathId",
        foreignField: "_id",
        as: "path",
      },
    },
    {
      $unwind: "$path",
    },
    {
      $match: {
        "path.isPublic": true,
        "path.boardConf": boardConf,
      },
    },
    {
      $sort: {
        plays: -1,
        lastPlayedAt: -1,
      },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: safeLimit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);
  const total = result?.totalCount?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    data: (result?.data ?? []).map((row: any, index: number) => ({
      pathId: row.path,
      plays: row.plays ?? 0,
      completed: row.completed ?? 0,
      abandoned: row.abandoned ?? 0,
      lastPlayedAt: row.lastPlayedAt ?? null,
      rank: skip + index + 1,
    })),
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
};