import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeTracking extends Document {
  firmId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  taskName: string;
  hoursSpent: number;
  date: Date;
  notes?: string;
  createdAt: Date;
}

const TimeTrackingSchema = new Schema<ITimeTracking>({
  firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  clientName: { type: String, required: true },
  taskName: { type: String, required: true },
  hoursSpent: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model<ITimeTracking>('TimeTracking', TimeTrackingSchema);