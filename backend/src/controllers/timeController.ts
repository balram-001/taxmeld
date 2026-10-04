import { Response } from 'express';
import TimeTracking from '../models/TimeTracking';
import Client from '../models/Client';
import { AuthRequest } from '../middleware/authMiddleware';
import { getWorkspaceOwnerId, isWorkspaceOwner } from '../utils/workspace';

// Get all time logs for the firm
export const getTimeLogs = async (req: AuthRequest, res: Response) => {
  try {
    const firmId = req.user?.id ? await getWorkspaceOwnerId(req.user.id) : null;
    if (!firmId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const timeLogs = await TimeTracking.find({ firmId }).sort({ date: -1, createdAt: -1 });
    return res.json({ success: true, timeLogs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new Time Log (Default status: Pending)
export const createTimeLog = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId, taskName, hoursSpent, date, notes } = req.body;
    const firmId = req.user?.id ? await getWorkspaceOwnerId(req.user.id) : null;
    if (!firmId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const client = await Client.findOne({ _id: clientId, userId: firmId });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const newLog = await TimeTracking.create({
      firmId,
      clientId,
      clientName: client.name,
      staffName: req.user?.email || 'CA Team',
      taskName,
      hoursSpent: Number(hoursSpent),
      date: date || Date.now(),
      notes,
      status: 'Pending'
    });

    return res.status(201).json({ success: true, timeLog: newLog });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Approve Time Log by CA/Partner
export const approveTimeLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user?.id || !(await isWorkspaceOwner(req.user.id))) return res.status(403).json({ success: false, message: 'Only the CA owner can approve time logs.' });
    const timeLog = await TimeTracking.findOne({ _id: id, firmId: req.user.id });
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Time log not found' });
    }

    timeLog.status = 'Approved';
    await timeLog.save();

    return res.json({ success: true, timeLog });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Time Log
export const deleteTimeLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user?.id || !(await isWorkspaceOwner(req.user.id))) return res.status(403).json({ success: false, message: 'Only the CA owner can delete time logs.' });
    await TimeTracking.findOneAndDelete({ _id: id, firmId: req.user.id });
    return res.json({ success: true, message: 'Time log deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
