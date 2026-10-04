import { Router } from 'express';
import { getTimeLogs, createTimeLog, approveTimeLog, deleteTimeLog } from '../controllers/timeController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getTimeLogs);
router.post('/create', protect, createTimeLog);
router.patch('/:id/approve', protect, approveTimeLog);
router.delete('/:id', protect, deleteTimeLog);

export default router;
