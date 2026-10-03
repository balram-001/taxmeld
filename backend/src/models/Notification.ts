import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  ownerId: mongoose.Types.ObjectId;
  recipientUserId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  type: 'client_upload' | 'document_reminder' | 'reupload_request' | 'final_delivery';
  title: string;
  message: string;
  link?: string;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
  type: { type: String, enum: ['client_upload', 'document_reminder', 'reupload_request', 'final_delivery'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  readAt: { type: Date },
}, { timestamps: true });

notificationSchema.index({ ownerId: 1, createdAt: -1 });
notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
