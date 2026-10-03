import { Router } from 'express';
import { runDocumentReminders } from '../controllers/reminderController';

const router = Router();
router.get('/run', runDocumentReminders);
export default router;
