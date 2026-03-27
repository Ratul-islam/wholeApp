import mongoose from "mongoose";
import { Path } from "./path.model.js";
export const createPath = async (userId, name, path, boardConf, isPublic) => {
    await Path.create({ userId, name, path, boardConf, isPublic });
};
export const getAllPath = async (userId, options = {}) => {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(options.limit) || 10));
    const skip = (page - 1) * limit;
    const query = { userId };
    if (options.q?.trim()) {
        query.boardConf = options.q.trim();
    }
    const [data, total] = await Promise.all([
        Path.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Path.countDocuments(query),
    ]);
    return {
        data,
        meta: {
            page,
            limit,
            total,
            hasMore: skip + data.length < total,
        },
    };
};
export const getPathById = async (id) => {
    const allPath = await Path.findOne({ _id: id });
    return allPath;
};
export const getPathAllByUserId = async (id, sameUser) => {
    const allPath = await (sameUser ? Path.find({ userId: id }) : Path.find({ userId: id, isPublic: true }));
    return allPath;
};
export const deletePathService = async (userId, pathId) => {
    const allPath = await Path.findOneAndDelete({ userId, _id: pathId });
    return allPath;
};
export const updatePathService = async (userId, pathId, ops) => {
    if (!mongoose.Types.ObjectId.isValid(userId))
        return null;
    if (!mongoose.Types.ObjectId.isValid(pathId))
        return null;
    const hasSet = ops.$set && Object.keys(ops.$set).length > 0;
    if (!hasSet)
        return null;
    return Path.findOneAndUpdate({
        _id: new mongoose.Types.ObjectId(pathId),
        userId: new mongoose.Types.ObjectId(userId),
    }, {
        ...(hasSet ? { $set: ops.$set } : {}),
    }, { new: true }).lean();
};
