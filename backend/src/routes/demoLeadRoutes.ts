import { Router } from 'express';
import { captureDemoLead } from '../controllers/demoLeadController';

const router = Router();

router.post('/', captureDemoLead);

export default router;
