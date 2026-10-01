import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  firmId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId; // Team member / staff ID
  client?: mongoose.Types.ObjectId;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate?: Date;
}

const TaskSchema: Schema = new Schema({
  firmId: { type: Schema.Types.ObjectId, ref: 'CA', required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'TeamInvite', required: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);