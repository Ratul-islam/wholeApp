import mongoose, { HydratedDocument, Types } from 'mongoose'

export interface IUser {
  _id: Types.ObjectId
  firstName: string
  lastName: string
  email: string
  password: string
  isVerified: boolean
  refreshToken?: string
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String },
  },
  { timestamps: true }
)

export const UserModel = mongoose.model<IUser>('User', userSchema)

export type UserDoc = HydratedDocument<IUser>