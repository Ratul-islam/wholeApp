import mongoose, { Types } from "mongoose";
import { IUser, UserDoc, UserModel } from "./user.model.js";


export async function createUser(firstName:string , lastName:string, email:string, password: string, isVerified=false){
    const user = await UserModel.create({ firstName, lastName, email, password, isVerified })
    return user;
}

type Query = {
  id?: string;
  email?: string;
  refreshToken?: string;
};

export async function getUserBy(
  query: Query,
  config?: { safe?: boolean }
): Promise<UserDoc | null> {
  const safe = config?.safe !== false;

  let mongoQuery: any = {};

  if (query.id) {
    if (!mongoose.Types.ObjectId.isValid(query.id)) return null;
    mongoQuery._id = query.id;
  }

  if (query.email) {
    mongoQuery.email = query.email;
  }

  if (query.refreshToken) {
    mongoQuery.refreshToken = query.refreshToken;
  }

  if (Object.keys(mongoQuery).length === 0) {
    throw new Error("Provide at least one search field");
  }

  const q = UserModel.findOne(mongoQuery);

  // ✅ SAFE MODE: strip sensitive fields
  if (safe) {
    q.select("_id firstName lastName email isVerified createdAt updatedAt");
  }

  return q.exec();
}

export async function getUserByIdUpdateRefreshToken(userId: Types.ObjectId, token: string) {
    const status = await UserModel.findByIdAndUpdate(userId, { refreshToken: token })
    return status;
}