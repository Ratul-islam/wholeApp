import { PipelineStage } from "mongoose";
import { Types } from "mongoose";
import { Session } from "./sessions.model";
type sessionData={
      sessionId:string,
      userId:string,
      deviceId:string,
      deviceSecret:string,
      pathId?:Types.ObjectId,
      status: string,
}
export const createSession=async(payload:sessionData)=>{
    const session =await Session.create(payload);
    return session;
}


export const getAllSessionService = async (userId: Types.ObjectId, limit:number) => {

  const games = await Session.find({ userId, status: "completed" })
    .sort({ endedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return games;
};

export const getSessionById= async(id: Types.ObjectId)=>{
    const data= await Session.find({_id:id, status: "starting"}).populate("pathId");
    return data;
}



type LeaderboardParams = {
  page?: number;
  limit?: number;
};

export const getLeaderboardByTotalScore = async ({
  page = 1,
  limit = 10,
}: LeaderboardParams) => {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  const pipeline: PipelineStage[] = [
    {
      $match: { status: "completed" },
    } as PipelineStage.Match,

    {
      $group: {
        _id: "$userId",
        totalScore: { $sum: "$score" },
        gamesPlayed: { $sum: 1 },
        totalCorrect: { $sum: "$correct" },
        totalWrong: { $sum: "$wrong" },
        lastPlayedAt: { $max: "$endedAt" },
      },
    } as PipelineStage.Group,

    {
      $lookup: {
        from: "users", 
        localField: "_id",  
        foreignField: "_id",
        as: "user",
      },
    } as PipelineStage.Lookup,

    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    } as PipelineStage.Unwind,

    {
      $sort: { totalScore: -1, lastPlayedAt: -1 },
    } as PipelineStage.Sort,

    {
      $facet: {
        data: [{ $skip: skip }, { $limit: safeLimit }],
        totalCount: [{ $count: "count" }],
      },
    } as PipelineStage.Facet,
  ];

  const [result] = await Session.aggregate(pipeline);

  const total = result?.totalCount?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    status: "success" as const,
    message: "Leaderboard loaded",
    data: (result?.data ?? []).map((row: any, index: number) => ({
      userId: row._id,
      username: row.user?.firstName,
      totalScore: row.totalScore ?? 0,
      gamesPlayed: row.gamesPlayed ?? 0,
      totalCorrect: row.totalCorrect ?? 0,
      totalWrong: row.totalWrong ?? 0,
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


export const getUserStatsService = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    return {
      gamesPlayed: 0,
      totalScore: 0,
      totalCorrect: 0,
      totalWrong: 0,
      bestScore: 0,
      lastPlayedAt: null,
    };
  }

  const [row] = await Session.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: "completed",
      },
    },
    {
      $group: {
        _id: "$userId",
        gamesPlayed: { $sum: 1 },
        totalScore: { $sum: "$score" },
        totalCorrect: { $sum: "$correct" },
        totalWrong: { $sum: "$wrong" },
        bestScore: { $max: "$score" },
        lastPlayedAt: { $max: "$endedAt" },
      },
    },
    {
      $project: {
        _id: 0,
        gamesPlayed: 1,
        totalScore: 1,
        totalCorrect: 1,
        totalWrong: 1,
        bestScore: 1,
        lastPlayedAt: 1,
      },
    },
  ]);

  return (
    row || {
      gamesPlayed: 0,
      totalScore: 0,
      totalCorrect: 0,
      totalWrong: 0,
      bestScore: 0,
      lastPlayedAt: null,
    }
  );
};
