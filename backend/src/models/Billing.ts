import mongoose, { Schema, Document } from 'mongoose';

export interface IBilling extends Document {
  firmId: string;
  clientId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  dueDate?: Date;
  createdAt: Date;
}

const billingSchema = new Schema<IBilling>({
  firmId: { type: String, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' },
  dueDate: { type: Date }
}, { timestamps: true });

export const Billing = mongoose.model<IBilling>('Billing', billingSchema);