import mongoose, { Types } from "mongoose"
import { Path } from "./path.model.js"

export const createPath = async (userId: Types.ObjectId,name:string, path: any, isPublic?:boolean) => {

  await Path.create({ userId, name, path , isPublic})
}

type GetAllPathOptions = {
  page?: number;
  limit?: number;
  q?: string;
};

export const getAllPath = async (
  userId: Types.ObjectId,
  options: GetAllPathOptions = {}
) => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(options.limit) || 10)); 
  const skip = (page - 1) * limit;

  const query: any = { userId };

  if (options.q && options.q.trim()) {
    query.name = { $regex: options.q.trim(), $options: "i" };
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
export const getPathById = async (id: Types.ObjectId) => {
    const allPath = await Path.findOne({_id: id})
    console.log(allPath)
     return allPath
}


export const getPathAllByUserId = async (id: Types.ObjectId, sameUser?:boolean) => {
    const allPath = await (sameUser ? Path.find({userId: id}): Path.find({userId: id, isPublic: true}))
    return allPath
}

export const deletePathService = async (userId: Types.ObjectId,pathId:Types.ObjectId) => {
    const allPath = await Path.findOneAndDelete({userId, _id:pathId})
    return allPath
}


type UpdatePathOps = {
  $set?: {
    name?: string;
    path?: any[];
    isPublic?: boolean;
  };
  $inc?: {
    savesCount?: number;
  };
};

export const updatePathService = async (
  userId: string,
  pathId: string,
  ops: UpdatePathOps
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  if (!mongoose.Types.ObjectId.isValid(pathId)) return null;

  const hasSet = ops.$set && Object.keys(ops.$set).length > 0;
  if (!hasSet) return null;

  return Path.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(pathId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    {
      ...(hasSet ? { $set: ops.$set } : {}),
    },
    { new: true }
  ).lean();
};