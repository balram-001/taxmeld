import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { getWorkspaceOwnerId } from '../utils/workspace';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const [ownerId, user] = await Promise.all([getWorkspaceOwnerId(userId), User.findById(userId).select('role').lean()]);
    if (!ownerId) { res.status(403).json({ message: 'Workspace unavailable.' }); return; }
    const query = user?.role === 'staff' ? { ownerId, recipientUserId: userId } : { ownerId, recipientUserId: { $exists: false } };
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100).lean();
    res.json(notifications);
  } catch (error: any) { res.status(500).json({ message: error.message || 'Could not load notifications.' }); }
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const ownerId = await getWorkspaceOwnerId(userId);
    await Notification.findOneAndUpdate({ _id: req.params.id, ownerId }, { readAt: new Date() });
    res.json({ message: 'Notification marked as read.' });
  } catch (error: any) { res.status(500).json({ message: error.message || 'Could not update notification.' }); }
};
