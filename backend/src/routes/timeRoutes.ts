import { Router } from 'express';
import { getTimeLogs, createTimeLog, deleteTimeLog } from '../controllers/timeController';

const router = Router();

router.get('/', getTimeLogs);
router.post('/create', createTimeLog);
router.delete('/:id', deleteTimeLog);

export default router;