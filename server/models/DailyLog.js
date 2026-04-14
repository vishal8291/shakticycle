import mongoose from 'mongoose'
const dailyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  water: { type: Number, default: 0 }, // glasses
  sleep: { type: Number, default: 0 }, // hours
  exercise: { type: Number, default: 0 }, // minutes
  mood: { type: String, enum: ['great', 'good', 'okay', 'bad', 'terrible', ''], default: '' },
  steps: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true })
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true })
export default mongoose.model('DailyLog', dailyLogSchema)
