import { OTPModel } from './otp.model.js';
import { AppError } from '../../utils/AppError.js';
export const createOTP = async (userId, type, length = 6, expiresInMinutes = 10) => {
    await OTPModel.deleteOne({ "userId": userId, "type": type });
    const otp = Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1))).toString();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    await OTPModel.create({ userId, otp, type, expiresAt });
    return otp;
};
export const verifyOTP = async (userId, otp, type) => {
    const otpRecord = await OTPModel.findOne({ userId, otp, type });
    if (!otpRecord)
        throw new AppError('Invalid OTP', 400);
    if (otpRecord.expiresAt < new Date())
        throw new AppError('OTP expired', 400);
    await OTPModel.deleteOne({ _id: otpRecord._id });
    return true;
};
