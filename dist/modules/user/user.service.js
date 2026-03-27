import mongoose from "mongoose";
import { UserModel } from "./user.model.js";
export async function createUser(firstName, lastName, email, password, isVerified = false) {
    const user = await UserModel.create({ firstName, lastName, email, password, isVerified });
    return user;
}
export async function getUserBy(query, config) {
    const safe = config?.safe !== false;
    let mongoQuery = {};
    if (query.id) {
        if (!mongoose.Types.ObjectId.isValid(query.id))
            return null;
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
export async function getUserByIdUpdateRefreshToken(userId, token) {
    const status = await UserModel.findByIdAndUpdate(userId, { refreshToken: token });
    return status;
}
