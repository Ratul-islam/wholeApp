import { Types } from "mongoose";
import { SavedPath } from "./savedPath.model";
import { Path } from "./path.model";

function toObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid id");
  return new Types.ObjectId(id);
}

export type SavedPathDTO = {
  _id: string;
  pathId: string;
  ownerId: string;
  userId: string;
  name: string;
  path: any[];
  originDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export const savedPathService = {
  async savePath(params: { userId: string; pathId: string }) {
    const userId = toObjectId(params.userId);
    const pathId = toObjectId(params.pathId);

    // fetch original path to store snapshot + ownerId
    const original = await Path.findById(pathId).lean();
    if (!original) throw new Error("Path not found");

    const ownerId = original.userId;
    const snapshotName = String(original.name ?? "");
    const snapshotPath = Array.isArray(original.path) ? original.path : [];

    // upsert so calling save twice doesn't crash
    const doc = await SavedPath.findOneAndUpdate(
      { userId, pathId },
      {
        $setOnInsert: {
          userId,
          pathId,
          ownerId,
          snapshotName,
          snapshotPath,
          originDeleted: false,
        },
      },
      { new: true, upsert: true }
    ).lean();

    return doc;
  },

  async unsavePath(params: { userId: string; pathId: string }) {
    const userId = toObjectId(params.userId);
    const pathId = toObjectId(params.pathId);

    await SavedPath.deleteOne({ userId, pathId });
    return { ok: true };
  },

  async listSaved(params: { userId: string; page?: number; limit?: number; q?: string }) {
    const userId = toObjectId(params.userId);

    const page = Math.max(1, Number(params.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(params.limit ?? 10)));
    const skip = (page - 1) * limit;

    const q = String(params.q ?? "").trim().toLowerCase();
    const nameFilter = q
      ? { snapshotName: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
      : {};

    const [total, rows] = await Promise.all([
      SavedPath.countDocuments({ userId, ...nameFilter }),
      SavedPath.find({ userId, ...nameFilter })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Try to rehydrate from the original Path if it still exists,
    // otherwise use snapshot.
    const pathIds = rows.map((r) => r.pathId);
    const originals = await Path.find({ _id: { $in: pathIds } }).lean();
    const originalMap = new Map<string, any>(originals.map((p) => [String(p._id), p]));

    const data: SavedPathDTO[] = rows.map((r) => {
      const live = originalMap.get(String(r.pathId));
      const useLive = !!live;

      return {
        _id: String(r._id),
        pathId: String(r.pathId),
        ownerId: String(r.ownerId),
        userId: String(r.userId),
        name: useLive ? String(live.name ?? "") : String(r.snapshotName ?? ""),
        path: useLive ? (Array.isArray(live.path) ? live.path : []) : (Array.isArray(r.snapshotPath) ? r.snapshotPath : []),
        originDeleted: !useLive, // true means original missing now
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

  async isSaved(params: { userId: string; pathId: string }) {
    const userId = toObjectId(params.userId);
    const pathId = toObjectId(params.pathId);

    const found = await SavedPath.findOne({ userId, pathId }).lean();
    return { isSaved: !!found };
  },
};
