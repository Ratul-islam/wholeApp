import mongoose from 'mongoose';
const otpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    otp: { type: String, required: true },
    type: { type: String, enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'TWO_FA'], required: true },
    expiresAt: { type: Date, required: true },
});
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const OTPModel = mongoose.model('OTP', otpSchema);
