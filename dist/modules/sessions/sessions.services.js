import { Types } from "mongoose";
import { Session } from "./sessions.model.js";
export const createSession = async (payload) => {
    const session = await Session.create(payload);
    console.log(session);
    return session;
};
export const getAllSessionService = async (userId, limit) => {
    const games = await Session.find({ userId, status: "completed" })
        .sort({ endedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean();
    return games;
};
export const getSessionById = async (id) => {
    const data = await Session.findOne({ _id: id, status: "starting" }).populate("pathId");
    return data;
};
const ALLOWED_UPDATES = new Set([
    "status",
    "score",
    "correct",
    "wrong",
    "startedAt",
    "endedAt",
    "pathId",
    "time",
]);
export const updateSessionDoc = async (session, updates) => {
    if (!session)
        throw new Error("Session doc is required");
    if (!updates || typeof updates !== "object")
        throw new Error("updates must be an object");
    for (const [key, val] of Object.entries(updates)) {
        if (!ALLOWED_UPDATES.has(key))
            continue;
        if (val === undefined)
            continue;
        session[key] = val;
    }
    await session.save();
    return session;
};
export const getLeaderboardByTotalScore = async ({ page = 1, limit = 10, type }) => {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;
    const pipeline = [
        {
            $match: { status: "completed" },
        },
        {
            $group: {
                _id: "$userId",
                totalScore: { $sum: "$score" },
                gamesPlayed: { $sum: 1 },
                totalCorrect: { $sum: "$correct" },
                totalWrong: { $sum: "$wrong" },
                lastPlayedAt: { $max: "$endedAt" },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
            },
        },
        {
            $unwind: {
                path: "$user",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $sort: { totalScore: -1, lastPlayedAt: -1 },
        },
        {
            $facet: {
                data: [{ $skip: skip }, { $limit: safeLimit }],
                totalCount: [{ $count: "count" }],
            },
        },
    ];
    const [result] = await Session.aggregate(pipeline);
    const total = result?.totalCount?.[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
        data: (result?.data ?? []).map((row, index) => ({
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
export const getUserStatsService = async (userId) => {
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
    return (row || {
        gamesPlayed: 0,
        totalScore: 0,
        totalCorrect: 0,
        totalWrong: 0,
        bestScore: 0,
        lastPlayedAt: null,
    });
};
export const getSessionsByPathPaginated = async (pathId, opts) => {
    const { skip, limit } = opts;
    return Session.find({ pathId, status: "completed" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId")
        .lean();
};
export const countSessionsByPath = async (pathId) => {
    return Session.countDocuments({ pathId });
};
