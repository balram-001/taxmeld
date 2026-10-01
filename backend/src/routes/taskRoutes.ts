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
  submitClientDocuments,
  verifyClientPortal,
  createTask,
  getTasksByFirm,
  getStaffAssignedTasks,
  getStaffDashboard,
  updateStaffTaskStatus
} from '../controllers/taskController';
import { protect, protectClientPortal } from '../middleware/authMiddleware';

const router = express.Router();

// A link opens a details-verification screen; all portal data requires the
// short-lived session issued by this endpoint.
router.post('/access/:token/verify', verifyClientPortal);
router.get('/public/:token', protectClientPortal, getPublicTasks);
router.post('/upload-signature/:token', protectClientPortal, createClientUploadSignature);
router.post('/upload/:token', protectClientPortal, uploadClientDocument);
router.post('/submit/:token', protectClientPortal, submitClientDocuments);
router.delete('/upload/:token/file/:taskId/:fileIndex', protectClientPortal, deleteClientDocumentFile);
router.get('/download/:token/:taskId/:fileIndex', protectClientPortal, downloadClientFile);
router.get('/file/:token/:taskId/:fileId', protectClientPortal, getStoredFile);

// CA Dashboard Routes
router.post('/ca-upload-signature/:clientId', protect, createCAUploadSignature);
router.post('/ca-upload-ack/:clientId', protect, uploadFinalAcknowledgement);
router.put('/:id', protect, updateTaskStatus);

// --- Naye Team Task Management Routes ---
router.post('/team-task/add', protect, createTask);
router.get('/team-tasks/:firmId', protect, getTasksByFirm);
router.get('/staff-tasks', protect, getStaffAssignedTasks);
router.get('/staff-dashboard', protect, getStaffDashboard);
router.put('/staff-tasks/:id/status', protect, updateStaffTaskStatus);

export default router;
