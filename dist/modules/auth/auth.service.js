import bcrypt from "bcrypt";
import { AppError } from "../../utils/AppError.js";
import { createOTP, verifyOTP } from "../otp/otp.sevice.js";
import { createUser, getUserBy, getUserByIdUpdateRefreshToken, } from "../user/user.service.js";
import { sendOTPEmail } from "../notification/notification.service.js";
/** -----------------------
 * Password helpers
 * ---------------------- */
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};
export const verifyPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
/** -----------------------
 * Register / Login
 * ---------------------- */
export const registerUser = async (firstName, lastName, email, password) => {
    const exists = await getUserBy({ email });
    if (exists) {
        if (exists.isVerified) {
            throw new AppError("User already exists", 400);
        }
        // user exists but not verified -> return so client can re-verify
        return {
            id: exists._id,
            firstName: exists.firstName,
            lastName: exists.lastName,
            email: exists.email,
            isVerified: exists.isVerified,
        };
    }
    const hashed = await hashPassword(password);
    const user = await createUser(firstName, lastName, email, hashed, false);
    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
    };
};
export const loginUser = async (email, password) => {
    const user = await getUserBy({ email }, { safe: false });
    if (!user)
        throw new AppError("Invalid credentials", 401);
    const valid = await verifyPassword(password, user.password);
    if (!valid)
        throw new AppError("Invalid credentials", 401);
    return user;
};
/** -----------------------
 * OTP Verify (existing)
 * Keep this if you also use it for email verification
 * ---------------------- */
export async function verifyUserOTP(email, code, type) {
    const user = await getUserBy({ email });
    if (!user)
        throw new AppError("User not found", 404);
    const valid = await verifyOTP(user._id, code, type);
    if (!valid)
        throw new AppError("Invalid or expired OTP", 400);
    if (type === "EMAIL_VERIFICATION") {
        user.isVerified = true;
        await user.save();
        return { message: "Email verified successfully" };
    }
    // For PASSWORD_RESET, use the new flow functions below.
    if (type === "PASSWORD_RESET") {
        return { message: "OTP verified", userId: user._id };
    }
    throw new AppError("Unknown OTP type", 400);
}
/** -----------------------
 * Refresh token helpers
 * ---------------------- */
export const saveRefreshToken = async (userId, token) => {
    await getUserByIdUpdateRefreshToken(userId, token);
};
export const verifyRefreshToken = async (token) => {
    const user = await getUserBy({ refreshToken: token });
    if (!user)
        throw new AppError("Invalid refresh token", 401);
    return user;
};
export async function revokeRefreshToken(userId) {
    // ✅ Fix: mongo uses _id
    const user = await getUserBy({ id: userId });
    if (!user)
        return false;
    user.refreshToken = undefined;
    await user.save();
    return true;
}
/** -----------------------
 * PASSWORD RESET (Option B)
 * Step 1: request OTP
 * Step 2: verify OTP -> controller returns resetToken
 * Step 3: confirm resetToken + new password (by userId)
 * ---------------------- */
/**
 * Step 1: Request password reset OTP.
 * - Do NOT reveal whether the account exists.
 */
export const requestPasswordReset = async (fastify, email) => {
    const user = await getUserBy({ email });
    if (!user)
        return;
    const otp = await createOTP(user._id, "PASSWORD_RESET", 6, 10);
    await sendOTPEmail(fastify, email, otp, "PASSWORD_RESET", 10);
};
/**
 * Step 2: Verify password reset OTP.
 * - Returns minimal identity needed for resetToken signing.
 * - Controller will sign resetToken using fastify-jwt namespace "reset".
 */
export const verifyPasswordResetOtp = async (email, code) => {
    const user = await getUserBy({ email });
    // Keep it generic to avoid user enumeration
    if (!user)
        throw new AppError("Invalid or expired OTP", 400);
    const valid = await verifyOTP(user._id, code, "PASSWORD_RESET");
    if (!valid)
        throw new AppError("Invalid or expired OTP", 400);
    return { id: String(user._id), email: user.email };
};
/**
 * Step 3: Reset password using userId extracted from resetToken.
 * - Updates password
 * - Revokes refresh token so old sessions die (recommended)
 */
export const resetPasswordByUserId = async (userId, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
        throw new AppError("Password must be at least 6 characters", 400);
    }
    const user = await getUserBy({ id: userId });
    if (!user)
        throw new AppError("User not found", 404);
    user.password = await hashPassword(newPassword);
    // ✅ recommended: invalidate existing refresh token
    user.refreshToken = undefined;
    await user.save();
};
/**
 * (Old one-step reset) keep only if you still want it.
 * If you fully switch to Option B, you can delete this.
 */
export const resetPassword = async (email, code, newPassword) => {
    const user = await getUserBy({ email });
    if (!user)
        throw new AppError("User not found", 404);
    const valid = await verifyOTP(user._id, code, "PASSWORD_RESET");
    if (!valid)
        throw new AppError("Invalid or expired OTP", 400);
    user.password = await hashPassword(newPassword);
    user.refreshToken = undefined; // ✅ also revoke refresh tokens here
    await user.save();
};
export const resendOtp = async (fastify, email, type = "EMAIL_VERIFICATION") => {
    const user = await getUserBy({ email });
    if (!user)
        return;
    if (type === "EMAIL_VERIFICATION") {
        if (user.isVerified)
            return;
        const otp = await createOTP(user._id ?? user.id, "EMAIL_VERIFICATION");
        await sendOTPEmail(fastify, user.email, otp, "EMAIL_VERIFICATION", 2);
        return;
    }
    if (type === "PASSWORD_RESET") {
        const otp = await createOTP(user._id ?? user.id, "PASSWORD_RESET", 6, 10);
        await sendOTPEmail(fastify, user.email, otp, "PASSWORD_RESET", 10);
        return;
    }
    throw new AppError("Invalid OTP type", 400);
};
