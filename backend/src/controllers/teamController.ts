import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';
import { TeamInvite } from '../models/TeamInvite';
import { User } from '../models/User';
import { sendOtpEmail, sendTeamInviteEmail } from '../utils/sendEmail';
import { isWorkspaceOwner } from '../utils/workspace';

const STAFF_SEAT_LIMIT = 5;

export const listTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  const ownerId = req.user?.id;
  if (!ownerId || !(await isWorkspaceOwner(ownerId))) { res.status(403).json({ message: 'Only the CA owner can manage the team.' }); return; }
  const members = await TeamInvite.find({ ownerId, status: { $ne: 'revoked' } }).select('-otp -inviteToken').sort({ createdAt: -1 });
  res.json({ members, seatLimit: STAFF_SEAT_LIMIT });
};

export const inviteStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!ownerId || !(await isWorkspaceOwner(ownerId))) { res.status(403).json({ message: 'Only the CA owner can invite staff.' }); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { res.status(400).json({ message: 'Enter a valid staff email address.' }); return; }
    const owner = await User.findById(ownerId).select('name subscriptionStatus planType');
    if (!owner || owner.subscriptionStatus !== 'active' || owner.planType !== 'professional_399') { res.status(403).json({ message: 'The ₹399 CA Professional plan is required to add up to 5 staff members.' }); return; }
    const linkedElsewhere = await User.findOne({ email }).select('workspaceOwnerId role');
    if (linkedElsewhere && (linkedElsewhere.role !== 'staff' || String(linkedElsewhere.workspaceOwnerId || '') !== String(ownerId))) {
      res.status(400).json({ message: 'This email is already linked to another TaxMeld account.' });
      return;
    }
    const existing = await TeamInvite.findOne({ ownerId, email });
    // Re-sending an invitation to an existing member must not consume a new seat.
    const seatCount = await TeamInvite.countDocuments({
      ownerId,
      status: { $in: ['pending', 'active'] },
      ...(existing ? { _id: { $ne: existing._id } } : {})
    });
    if (seatCount >= STAFF_SEAT_LIMIT) { res.status(403).json({ message: 'All 5 included staff seats are in use. Add an extra ₹99 seat after payment is enabled.' }); return; }
    const inviteToken = crypto.randomBytes(24).toString('hex');
    const invite = existing || new TeamInvite({ ownerId, email, inviteToken });
    invite.inviteToken = inviteToken;
    invite.status = 'pending';
    invite.otp = undefined;
    invite.otpExpiresAt = undefined;
    await invite.save();
    const frontendUrl = process.env.CLIENT_BASE_URL || 'https://taxmeld.vercel.app';
    await sendTeamInviteEmail(email, owner.name, `${frontendUrl}/team-access?token=${inviteToken}`);
    res.status(201).json({ message: 'Secure staff invitation sent.', member: { id: invite._id, email: invite.email, status: invite.status } });
  } catch (error: any) { res.status(500).json({ message: error.message || 'Could not send staff invitation.' }); }
};

export const requestStaffOtp = async (req: Request, res: Response): Promise<void> => {
  const invite = await TeamInvite.findOne({ inviteToken: req.params.token, status: { $in: ['pending', 'active'] } });
  if (!invite) { res.status(404).json({ message: 'This staff invitation is invalid or no longer available.' }); return; }
  const otp = crypto.randomInt(100000, 1_000_000).toString();
  invite.otp = otp;
  invite.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await invite.save();
  await sendOtpEmail(invite.email, otp);
  res.json({ message: `OTP sent to ${invite.email}.`, email: invite.email });
};

export const verifyStaffOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { otp } = req.body;
    const invite = await TeamInvite.findOne({ inviteToken: req.params.token, status: { $in: ['pending', 'active'] } });
    if (!invite || !otp || invite.otp !== otp || !invite.otpExpiresAt || invite.otpExpiresAt < new Date()) { res.status(400).json({ message: 'Invalid or expired OTP.' }); return; }
    let staff = await User.findOne({ email: invite.email });
    if (staff && String(staff.workspaceOwnerId || '') !== String(invite.ownerId)) { res.status(400).json({ message: 'This email is already used by another TaxMeld account.' }); return; }
    if (!staff) staff = await User.create({ name: invite.email.split('@')[0], email: invite.email, password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10), isVerified: true, role: 'staff', workspaceOwnerId: invite.ownerId, subscriptionStatus: 'active', planType: 'team_staff' });
    invite.status = 'active'; invite.staffUserId = staff._id; invite.otp = undefined; invite.otpExpiresAt = undefined; await invite.save();
    const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.json({ message: 'Team access verified.', token, user: { id: staff._id, name: staff.name, email: staff.email, role: 'staff' } });
  } catch (error: any) { res.status(500).json({ message: error.message || 'Could not verify team access.' }); }
};

/** Passwordless return sign-in for an already activated team member. */
export const requestStaffLoginOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const invite = await TeamInvite.findOne({ email, status: 'active' });
    if (!invite) { res.status(404).json({ message: 'No active team workspace was found for this email.' }); return; }
    const otp = crypto.randomInt(100000, 1_000_000).toString();
    invite.otp = otp;
    invite.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await invite.save();
    await sendOtpEmail(email, otp);
    res.json({ message: 'A secure OTP has been sent to your staff email.' });
  } catch (error: any) { res.status(500).json({ message: error.message || 'Could not send the staff sign-in OTP.' }); }
};

export const verifyStaffLoginOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '');
    const invite = await TeamInvite.findOne({ email, status: 'active' });
    if (!invite || !otp || invite.otp !== otp || !invite.otpExpiresAt || invite.otpExpiresAt < new Date()) { res.status(400).json({ message: 'Invalid or expired OTP.' }); return; }
    const staff = invite.staffUserId ? await User.findById(invite.staffUserId) : await User.findOne({ email, workspaceOwnerId: invite.ownerId, role: 'staff' });
    if (!staff) { res.status(404).json({ message: 'Your staff workspace is no longer available. Ask the CA owner to send a new invitation.' }); return; }
    invite.otp = undefined;
    invite.otpExpiresAt = undefined;
    await invite.save();
    const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.json({ message: 'Team workspace access verified.', token, user: { id: staff._id, name: staff.name, email: staff.email, role: 'staff' } });
  } catch (error: any) { res.status(500).json({ message: error.message || 'Could not verify the staff sign-in OTP.' }); }
};
export const deleteTeamMember = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try finding and deleting the user/team member
    const deletedStaff = await User.findByIdAndDelete(id);
    if (!deletedStaff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    res.status(200).json({ success: true, message: 'Staff member / invitation cancelled successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};