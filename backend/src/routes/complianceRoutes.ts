import { Router } from 'express';
import { getCompliances, createCompliance, updateComplianceStatus, deleteCompliance } from '../controllers/complianceController';

const router = Router();

router.get('/', getCompliances);
router.post('/create', createCompliance);
router.patch('/:id/status', updateComplianceStatus);
router.delete('/:id', deleteCompliance);

export default router;