import mongoose, { Schema } from 'mongoose';

const StoredFileSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'DocumentTask', required: true, index: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export const StoredFile = mongoose.model('StoredFile', StoredFileSchema);
