import { Schema, model } from 'mongoose';

const teamInviteSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    inviteToken: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    staffUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

teamInviteSchema.index({ ownerId: 1, email: 1 }, { unique: true });

export const TeamInvite = model('TeamInvite', teamInviteSchema);
