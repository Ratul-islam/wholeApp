import mongoose, { Types } from "mongoose";
import { Session } from "../sessions/sessions.model";
import { PathStats } from "./pathStatus.model";
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
        // helpful debug: show why it didn't match
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
};

export const getPathLeaderboard = async ({
  page = 1,
  limit = 10,
}: LeaderboardParams) => {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  const pipeline: PipelineStage[] = [
    // Ensure pathId exists
    { $match: { pathId: { $ne: null } } } as PipelineStage.Match,

    // Sort first (optional — see note below)
    { $sort: { plays: -1, lastPlayedAt: -1 } } as PipelineStage.Sort,

    // Populate path
    {
      $lookup: {
        from: "paths",
        localField: "pathId",
        foreignField: "_id",
        as: "path",
      },
    } as PipelineStage.Lookup,

    {
      $unwind: {
        path: "$path",
        preserveNullAndEmptyArrays: false, // IMPORTANT
      },
    } as PipelineStage.Unwind,

    // ✅ Only include public paths
    {
      $match: {
        "path.isPublic": true,
      },
    } as PipelineStage.Match,

    {
      $facet: {
        data: [{ $skip: skip }, { $limit: safeLimit }],
        totalCount: [{ $count: "count" }],
      },
    } as PipelineStage.Facet,
  ];

  const [result] = await PathStats.aggregate(pipeline);

  const total = result?.totalCount?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    data: (result?.data ?? []).map((row: any, index: number) => ({
      pathId: row.path, // fully populated public path
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