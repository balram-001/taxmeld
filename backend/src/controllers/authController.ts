import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { sendOtpEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middleware/authMiddleware';

// ================= REGISTER =================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ message: 'All fields are required and must be valid text.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isVerified) {
      res.status(400).json({ message: 'Email already registered. Please login.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 1_000_000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let user = existingUser;
    if (user && !user.isVerified) {
      user.name = name;
      user.password = hashedPassword;
      user.verificationOtp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        isVerified: false,
        verificationOtp: otp,
        otpExpiresAt,
      });
    }

    await sendOtpEmail(user.email, otp);
    res.status(200).json({ message: 'OTP sent successfully to your email.', email: user.email });
  } catch (error: any) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ================= VERIFY REGISTRATION OTP =================
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || typeof email !== 'string' || !otp || typeof otp !== 'string') {
      res.status(400).json({ message: 'Invalid email or OTP format.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (user.verificationOtp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP.' });
      return;
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.status(200).json({
      message: 'Account verified successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Verification error', error: error.message });
  }
};

// ================= LOGIN =================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 🛡️ Safe check against NoSQL sanitization objects
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ message: 'Invalid email or password format.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: 'Please verify your email before logging in.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
};

// ================= FORGOT PASSWORD (STEP 1: SEND RESET OTP) =================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ message: 'Valid email is required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ message: 'User with this email does not exist.' });
      return;
    }

    const otp = crypto.randomInt(100000, 1_000_000).toString();
    user.verificationOtp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp);

    res.status(200).json({ message: 'Password reset OTP sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error in sending reset code', error: error.message });
  }
};

// ================= VERIFY RESET OTP (STEP 2: VERIFY CODE) =================
export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || typeof email !== 'string' || !otp || typeof otp !== 'string') {
      res.status(400).json({ message: 'Valid email and OTP are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (user.verificationOtp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP.' });
      return;
    }

    user.isVerified = true;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    res.status(200).json({
      message: 'OTP verified successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// ================= RESET PASSWORD (STEP 3: SAVE NEW PASSWORD) =================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || typeof email !== 'string' || !otp || typeof otp !== 'string' || !newPassword || typeof newPassword !== 'string') {
      res.status(400).json({ message: 'All fields must be valid text.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (user.verificationOtp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP.' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.verificationOtp = undefined;
    user.otpExpiresAt = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// ================= CURRENT USER PROFILE / TRIAL STATUS =================
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Not authorized.' });
      return;
    }

    const user = await User.findById(userId).select(
      'name email trialEndsAt subscriptionStatus planType isVerified createdAt'
    );

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Keep the stored status in sync even if the user has not attempted to add a client.
    if (
      user.subscriptionStatus === 'trial' &&
      user.trialEndsAt &&
      new Date() > user.trialEndsAt
    ) {
      user.subscriptionStatus = 'expired';
      await user.save();
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus,
      planType: user.planType,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Unable to load profile.', error: error.message });
  }
};
