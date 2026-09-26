import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationOtp: { type: String },
    otpExpiresAt: { type: Date },
    trialEndsAt: { 
      type: Date, 
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 Days from registration
    },
    subscriptionStatus: { 
      type: String, 
      enum: ['trial', 'pending', 'active', 'expired'], // 'pending' added for MacroDroid verification
      default: 'trial' 
    },
    planType: { type: String, default: 'free_trial' },
    
    // New Fields for MacroDroid Payment Tracking
    utrNumber: { type: String, default: null },
    subscriptionExpiresAt: { type: Date, default: null },

    // Naye fields 15-day account soft delete ke liye:
    isDeleted: { type: Boolean, default: false },
    deletionRequestedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
