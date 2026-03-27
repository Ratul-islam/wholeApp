import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
}, { timestamps: true });
export const UserModel = mongoose.model('User', userSchema);
