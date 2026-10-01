import { Router } from 'express';
import { 
  inviteStaff, 
  listTeam, 
  requestStaffLoginOtp, 
  requestStaffOtp, 
  verifyStaffLoginOtp, 
  verifyStaffOtp, 
  getStaffWorkload,
  deleteTeamMember // <-- Isko import karo
} from '../controllers/teamController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, listTeam);
router.post('/invite', protect, inviteStaff);
router.get('/:id/workload', protect, getStaffWorkload);
router.delete('/:id', protect, deleteTeamMember); // <-- Yeh route add karo

router.post('/access/:token/request-otp', requestStaffOtp);
router.post('/access/:token/verify-otp', verifyStaffOtp);
router.post('/login/request-otp', requestStaffLoginOtp);
router.post('/login/verify-otp', verifyStaffLoginOtp);

export default router;
