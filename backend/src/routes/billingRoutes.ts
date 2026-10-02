import { Router } from 'express';
import { getInvoices, createInvoice, markPaid, deleteInvoice } from '../controllers/billingController';

const router = Router();

router.get('/', getInvoices);
router.post('/create', createInvoice);
router.patch('/:id/pay', markPaid);
router.delete('/:id', deleteInvoice);

export default router;