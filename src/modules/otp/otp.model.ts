import mongoose, { Types } from 'mongoose'

export interface IOTP {
  userId: Types.ObjectId
  otp: string
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FA'
  expiresAt: Date
}

const otpSchema = new mongoose.Schema<IOTP>({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  otp: { type: String, required: true },
  type: { type: String, enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'TWO_FA'], required: true },
  expiresAt: { type: Date, required: true },
})

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const OTPModel = mongoose.model<IOTP>('OTP', otpSchema)
