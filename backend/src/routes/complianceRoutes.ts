import { Router } from 'express';
import { getCompliances, createCompliance, updateComplianceStatus, deleteCompliance } from '../controllers/complianceController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getCompliances);
router.post('/', protect, createCompliance);
router.post('/create', protect, createCompliance);
router.patch('/:id/status', protect, updateComplianceStatus);
router.delete('/:id', protect, deleteCompliance);

export default router;
