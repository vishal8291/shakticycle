import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobileNumber: { type: String, unique: true, sparse: true, trim: true },
    googleId: { type: String, unique: true, sparse: true, trim: true },
    avatarUrl: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    passwordResetCodeHash: { type: String, default: '' },
    passwordResetExpiresAt: { type: Date, default: null },
    loginOtpCodeHash: { type: String, default: '' },
    loginOtpExpiresAt: { type: Date, default: null },
    role: { type: String, default: 'patient' },
    pushTokens: {
      type: [
        new mongoose.Schema(
          {
            token: { type: String, required: true },
            platform: { type: String, default: '' },
            registeredAt: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
)

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export default mongoose.models.User || mongoose.model('User', userSchema)
