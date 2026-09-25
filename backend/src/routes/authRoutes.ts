import { Router } from 'express';
import {
  register,
  verifyOtp,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
  deleteAccount, // <-- Ise import kar lo
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);

// <-- Yeh raha naya delete account route:
router.delete('/account', protect, deleteAccount);

export default router;