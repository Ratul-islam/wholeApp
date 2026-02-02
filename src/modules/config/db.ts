import mongoose from 'mongoose'
import 'dotenv/config' 
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/mydb'

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URL)
    console.log('MongoDB connected via Mongoose!')
  } catch (err) {
    console.error('MongoDB connection failed:', err)
    process.exit(1) 
  }
}
