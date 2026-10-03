import { Router } from 'express';
import { getTimeLogs, createTimeLog, approveTimeLog, deleteTimeLog } from '../controllers/timeController';

const router = Router();

router.get('/', getTimeLogs);
router.post('/create', createTimeLog);
router.patch('/:id/approve', approveTimeLog);
router.delete('/:id', deleteTimeLog);

export default router;