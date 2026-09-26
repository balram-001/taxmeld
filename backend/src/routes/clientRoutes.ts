import { Router } from 'express';
import { createClient, getClients, getClientById, deleteClient } from '../controllers/clientController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, createClient);
router.get('/', protect, getClients);
router.get('/:id', protect, getClientById);
router.delete('/:id', protect, deleteClient);

export default router;
