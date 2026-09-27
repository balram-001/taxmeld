import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomRequirement {
  name: string;
  hint: string;
}

export interface IClient extends Document {
  name: string;
  panNumber: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  trackingToken: string;
  userId: mongoose.Types.ObjectId;
  serviceType: string;
  customRequirements?: ICustomRequirement[];
  lastClientUploadAt?: Date;
  lastFinalDeliveryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    panNumber: { type: String, required: true, uppercase: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    trackingToken: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, default: 'ITR Filing' },
    customRequirements: [
      {
        name: { type: String, required: true },
        hint: { type: String, default: '' },
      },
    ],
    lastClientUploadAt: { type: Date },
    lastFinalDeliveryAt: { type: Date },
  },
  { timestamps: true }
);

export const Client = mongoose.model<IClient>('Client', ClientSchema);
export default Client;
