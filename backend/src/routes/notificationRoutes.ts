import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();
router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markNotificationRead);
export default router;
