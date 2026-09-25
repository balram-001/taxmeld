import { Router } from 'express';
import { handleMacrodroidWebhook } from '../controllers/paymentController';

const router = Router();

// MacroDroid Webhook Endpoint
router.post('/webhook/macrodroid-payment', handleMacrodroidWebhook);

export default router;