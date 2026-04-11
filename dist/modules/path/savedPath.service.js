import { Types } from "mongoose";
import { SavedPath } from "./savedPath.model.js";
import { Path } from "./path.model.js";
function toObjectId(id) {
    if (!Types.ObjectId.isValid(id))
        throw new Error("Invalid id");
    return new Types.ObjectId(id);
}
export const savedPathService = {
    async savePath(params) {
        const userId = toObjectId(params.userId);
        const pathId = toObjectId(params.pathId);
        const original = await Path.findById(pathId).lean();
        if (!original)
            throw new Error("Path not found");
        const ownerId = original.userId;
        const snapshotName = String(original.name ?? "");
        const snapshotPath = Array.isArray(original.path) ? original.path : [];
        const doc = await SavedPath.findOneAndUpdate({ userId, pathId }, {
            $setOnInsert: {
                userId,
                pathId,
                ownerId,
                snapshotName,
                snapshotPath,
                originDeleted: false,
            },
        }, { new: true, upsert: true }).lean();
        return doc;
    },
    async unsavePath(params) {
        const userId = toObjectId(params.userId);
        const pathId = toObjectId(params.pathId);
        await SavedPath.deleteOne({ userId, _id: pathId });
        return { ok: true };
    },
    async listSaved(params) {
        const userId = toObjectId(params.userId);
        const page = Math.max(1, Number(params.page ?? 1));
        const limit = Math.min(50, Math.max(1, Number(params.limit ?? 10)));
        const skip = (page - 1) * limit;
        const q = String(params.q ?? "").trim();
        const regexQuery = q
            ? { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
            : null;
        // Grab boardConf from params if the frontend sends it
        const exactBoardConf = String(params.boardConf ?? "").trim();
        // 1. Build the Aggregation Pipeline
        const pipeline = [
            { $match: { userId } },
            {
                $lookup: {
                    from: "paths",
                    localField: "pathId",
                    foreignField: "_id",
                    as: "pathDoc",
                },
            },
            {
                $unwind: {
                    path: "$pathDoc",
                    preserveNullAndEmptyArrays: true,
                },
            },
        ];
        // 2. Add Search Filter (Searching snapshotName OR populated boardConf)
        if (regexQuery) {
            pipeline.push({
                $match: {
                    $or: [
                        { snapshotName: regexQuery },
                        { "pathDoc.boardConf": regexQuery }
                    ]
                }
            });
        }
        // 3. Add Exact BoardConf match (if device is connected and frontend passes it)
        if (exactBoardConf) {
            pipeline.push({
                $match: {
                    "pathDoc.boardConf": exactBoardConf
                }
            });
        }
        // 4. Execute Count and Pagination Concurrently
        const [totalResult, rows] = await Promise.all([
            SavedPath.aggregate([...pipeline, { $count: "total" }]),
            SavedPath.aggregate([
                ...pipeline,
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit }
            ])
        ]);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;
        // 5. Map the Data to your DTO
        const data = rows.map((r) => {
            const live = r.pathDoc;
            const useLive = !!live;
            return {
                _id: String(r._id),
                pathId: String(r.pathId),
                ownerId: String(r.ownerId),
                userId: String(r.userId),
                name: useLive ? String(live.name ?? "") : String(r.snapshotName ?? ""),
                path: useLive
                    ? (Array.isArray(live.path) ? live.path : [])
                    : (Array.isArray(r.snapshotPath) ? r.snapshotPath : []),
                // --- THIS WAS MISSING ---
                boardConf: useLive ? String(live.boardConf ?? "") : "",
                // ------------------------
                originDeleted: !useLive,
                createdAt: String(r.createdAt ?? ""),
                updatedAt: String(r.updatedAt ?? ""),
            };
        });
        return {
            data,
            meta: {
                page,
                limit,
                total,
                hasMore: skip + data.length < total,
            },
        };
    },
    async isSaved(params) {
        const userId = toObjectId(params.userId);
        const pathId = toObjectId(params.pathId);
        const found = await SavedPath.findOne({ userId, pathId }).lean();
        return { isSaved: !!found };
    },
};
