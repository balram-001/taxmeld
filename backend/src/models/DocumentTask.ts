import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadedFile {
  fileUrl: string;
  originalFileName: string;
  uploadedAt: Date;
  storageId?: mongoose.Types.ObjectId;
  cloudinaryPublicId?: string;
  mimeType?: string;
}

export interface IDocumentTask extends Document {
  title?: string;
  documentType: string;
  serviceCategory?: string; // e.g. 'ITR Filing', 'GST Return', etc.
  clientId: mongoose.Types.ObjectId;
  caId: mongoose.Types.ObjectId;
  token?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Uploaded';
  remarks?: string;
  files: IUploadedFile[]; // Multiple files array
  finalDeliveryVersion?: number;
  reuploadReason?: string;
  reuploadRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentTaskSchema: Schema = new Schema(
  {
    title: { type: String, trim: true },
    documentType: { type: String, required: true },
    serviceCategory: { type: String, default: 'General' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    caId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, index: true },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Uploaded'],
      default: 'Pending',
    },
    remarks: { type: String, default: '' },
    // Counts final-document deliveries. This persists across Render restarts,
    // so the first delivery is always normal and later ones are always updates.
    finalDeliveryVersion: { type: Number, default: 0 },
    reuploadReason: { type: String, default: '' },
    reuploadRequestedAt: { type: Date },
    files: [
      {
        fileUrl: { type: String, required: true },
        originalFileName: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        storageId: { type: Schema.Types.ObjectId, ref: 'StoredFile' },
        cloudinaryPublicId: { type: String },
        mimeType: { type: String, default: 'application/octet-stream' },
      },
    ],
  },
  { timestamps: true }
);

export const DocumentTask = mongoose.model<IDocumentTask>('DocumentTask', DocumentTaskSchema);

// Safely drop legacy unique index if it exists
DocumentTask.collection.dropIndex('token_1').catch(() => {});

export default DocumentTask;
