import mongoose, { Schema, Document } from 'mongoose';

export interface ILineItem {
  description: string;
  amount: number;
}

export interface IBilling extends Document {
  firmId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientPan?: string;
  invoiceNumber: string;
  lineItems: ILineItem[];
  totalAmount: number;
  status: 'Pending' | 'Paid';
  dueDate?: Date;
  createdAt: Date;
}

const LineItemSchema = new Schema<ILineItem>({
  description: { type: String, required: true },
  amount: { type: Number, required: true }
});

const BillingSchema = new Schema<IBilling>({
  firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  clientPhone: { type: String },
  clientPan: { type: String },
  invoiceNumber: { type: String, required: true },
  lineItems: [LineItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.model<IBilling>('Billing', BillingSchema);