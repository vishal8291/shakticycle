import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  plan: { type: String, enum: ['premium', 'family'] },
  amount: Number,
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
}, { timestamps: true })

export default mongoose.model('Payment', paymentSchema)
