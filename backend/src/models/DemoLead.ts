import { Schema, model } from 'mongoose';

const demoLeadSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    marketingConsent: { type: Boolean, default: false },
    source: { type: String, default: 'website-free-demo' },
  },
  { timestamps: true }
);

export const DemoLead = model('DemoLead', demoLeadSchema);
