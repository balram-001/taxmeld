import { Router } from 'express';
import { createInvoice, deleteInvoice, getInvoices, updateInvoiceStatus } from '../controllers/billingController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/:firmId', protect, getInvoices);
router.post('/', protect, createInvoice);
router.put('/:id', protect, updateInvoiceStatus);
router.delete('/:id', protect, deleteInvoice);

export default router;