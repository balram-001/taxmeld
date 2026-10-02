import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';
import { TeamInvite } from '../models/TeamInvite';
import { User } from '../models/User';
import { sendOtpEmail, sendTeamInviteEmail } from '../utils/sendEmail';
import { isWorkspaceOwner } from '../utils/workspace';
import Task from '../models/Task';

const STAFF_SEAT_LIMIT = 5;

export const listTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  const ownerId = req.user?.id;
  if (!ownerId || !(await isWorkspaceOwner(ownerId))) { res.status(403).json({ message: 'Only the CA owner can manage the team.' }); return; }
  const members = await TeamInvite.find({ ownerId, status: { $ne: 'revoked' } }).select('-otp -inviteToken').sort({ createdAt: -1 });
  res.json({ members, seatLimit: STAFF_SEAT_LIMIT });
};

/** Full CA-only monitoring report for one staff member. */
export const getStaffWorkload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId || !(await isWorkspaceOwner(ownerId))) {
      res.status(403).json({ message: 'Only the CA owner can view staff work reports.' });
      return;
    }
    const invite = await TeamInvite.findOne({ _id: req.params.id, ownerId, status: 'active' }).select('-otp -inviteToken').lean();
    if (!invite) {
      res.status(404).json({ message: 'Active staff member not found.' });
      return;
    }
    const [staffUser, tasks] = await Promise.all([
      invite.staffUserId ? User.findById(invite.staffUserId).select('name email').lean() : null,
      Task.find({ assignedTo: invite._id }).populate('client', 'name panNumber phone whatsappNumber serviceType createdAt').sort({ createdAt: 1 }).lean(),
    ]);
    const now = Date.now();
    const ageInDays = (date: Date | string) => Math.max(0, Math.floor((now - new Date(date).getTime()) / 86_400_000));
    const detailedTasks = tasks.map((task: any) => ({
      ...task,
      assignedDaysAgo: ageInDays(task.createdAt),
      updatedDaysAgo: ageInDays(task.updatedAt),
      isOverdue: task.status !== 'Completed' && ageInDays(task.createdAt) >= 7,
    }));
    const open = detailedTasks.filter((task: any) => task.status !== 'Completed');
    const completed = detailedTasks.filter((task: any) => task.status === 'Completed');
    res.json({
      staff: { id: invite._id, email: invite.email, name: staffUser?.name || invite.email.split('@')[0], joinedAt: invite.createdAt },
      summary: {
        assignedClients: new Set(detailedTasks.map((task: any) => String(task.client?._id || task.client || ''))).size,
        totalTasks: detailedTasks.length,
        openTasks: open.length,
        completedTasks: completed.length,
        overdueTasks: open.filter((task: any) => task.isOverdue).length,
      },
      tasks: detailedTasks,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Could not load this staff work report.' });
  }
};

export const inviteStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!ownerId || !(await isWorkspaceOwner(ownerId))) { res.status(403).json({ message: 'Only the CA owner can invite staff.' }); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { res.status(400).json({ message: 'Enter a valid staff email address.' }); return; }
    const owner = await User.findById(ownerId).select('name subscriptionStatus planType');
    const teamPlanTypes = ['team_599_monthly', 'team_599_annual', 'professional_399']; // professional_399 supports existing paid users
    if (!owner || owner.subscriptionStatus !== 'active' || !teamPlanTypes.includes(owner.planType)) { res.status(403).json({ message: 'The ₹599 Team CA plan is required to add up to 5 staff members.' }); return; }
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
    // A previously removed staff account can be invited again by the same CA.
    // Restore it only after it proves access to the invited email through OTP.
    if (staff.isDeleted) {
      staff.isDeleted = false;
      staff.isVerified = true;
      staff.role = 'staff';
      staff.workspaceOwnerId = invite.ownerId;
      await staff.save();
    }
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
/** Cancel a pending invite or remove an activated staff member from this CA workspace. */
export const deleteTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId || !(await isWorkspaceOwner(ownerId))) {
      res.status(403).json({ message: 'Only the CA owner can manage the team.' });
      return;
    }

    // The frontend sends the TeamInvite id, not a User id. The old handler
    // searched the User collection, returned success, and left this invite visible.
    const invite = await TeamInvite.findOne({ _id: req.params.id, ownerId });
    if (!invite) {
      res.status(404).json({ message: 'This staff invitation no longer exists.' });
      return;
    }

    const wasActive = invite.status === 'active';
    if (invite.staffUserId) {
      await User.findByIdAndUpdate(invite.staffUserId, { $set: { isDeleted: true } });
    } else {
      await User.findOneAndUpdate(
        { email: invite.email, workspaceOwnerId: ownerId, role: 'staff' },
        { $set: { isDeleted: true } }
      );
    }

    invite.status = 'revoked';
    invite.otp = undefined;
    invite.otpExpiresAt = undefined;
    await invite.save();

    res.json({
      success: true,
      message: wasActive ? 'Staff member removed successfully.' : 'Invitation cancelled successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Could not update this team member.' });
  }
};
