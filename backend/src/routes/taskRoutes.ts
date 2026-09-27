import express from 'express';
import {
  getPublicTasks,
  uploadClientDocument,
  deleteClientDocumentFile,
  uploadFinalAcknowledgement,
  updateTaskStatus,
  downloadClientFile,
  getStoredFile,
  createClientUploadSignature,
  createCAUploadSignature,
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public Tracking & Client File Upload Routes
router.get('/public/:token', getPublicTasks);
router.post('/upload-signature/:token', createClientUploadSignature);
router.post('/upload/:token', uploadClientDocument);
router.delete('/upload/:token/file/:taskId/:fileIndex', deleteClientDocumentFile);
router.get('/download/:token/:taskId/:fileIndex', downloadClientFile);
router.get('/file/:token/:taskId/:fileId', getStoredFile);

// CA Dashboard Routes
router.post('/ca-upload-signature/:clientId', protect, createCAUploadSignature);
router.post('/ca-upload-ack/:clientId', protect, uploadFinalAcknowledgement);
router.put('/:id', protect, updateTaskStatus);

export default router;
