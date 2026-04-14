import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan: { type: String, enum: ['free', 'premium', 'family'], default: 'free' },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'trial'], default: 'active' },
  trialEndsAt: Date,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelledAt: Date,
  features: {
    aiInsights: { type: Boolean, default: false },
    unlimitedReports: { type: Boolean, default: false },
    exportPdf: { type: Boolean, default: false },
    familyMembers: { type: Number, default: 0 },
    prioritySupport: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false },
    aiChat: { type: Boolean, default: false },
    customReminders: { type: Boolean, default: false },
  },
}, { timestamps: true })

export default mongoose.model('Subscription', subscriptionSchema)
