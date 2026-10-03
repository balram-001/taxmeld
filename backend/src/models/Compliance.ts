import mongoose, { Schema, Document } from 'mongoose';

export interface ICompliance extends Document {
  firmId: mongoose.Types.ObjectId;
  title: string;
  category: 'GST' | 'Income Tax' | 'TDS' | 'ROC' | 'Other';
  dueDate: Date;
  description?: string;
  status: 'Upcoming' | 'Completed' | 'Overdue';
  createdAt: Date;
}

const ComplianceSchema = new Schema<ICompliance>({
  firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true },
  title: { type: String, required: true },
  category: { type: String, enum: ['GST', 'Income Tax', 'TDS', 'ROC', 'Other'], required: true },
  dueDate: { type: Date, required: true },
  description: { type: String },
  status: { type: String, enum: ['Upcoming', 'Completed', 'Overdue'], default: 'Upcoming' }
}, { timestamps: true });

export default mongoose.model<ICompliance>('Compliance', ComplianceSchema);