import express from 'express';
import multer from 'multer';
import {
  getPublicTasks,
  uploadClientDocument,
  deleteClientDocumentFile,
  uploadFinalAcknowledgement,
  updateTaskStatus,
  downloadClientFile,
  getStoredFile,
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 10 },
});

// Public Tracking & Client File Upload Routes
router.get('/public/:token', getPublicTasks);
router.post('/upload/:token', upload.array('files', 10), uploadClientDocument);
router.delete('/upload/:token/file/:taskId/:fileIndex', deleteClientDocumentFile);
router.get('/download/:token/:taskId/:fileIndex', downloadClientFile);
router.get('/file/:token/:taskId/:fileId', getStoredFile);

// CA Dashboard Routes
router.post('/ca-upload-ack/:clientId', protect, upload.array('files', 10), uploadFinalAcknowledgement);
router.put('/:id', protect, updateTaskStatus);

export default router;
