import { Response } from 'express';
import Compliance from '../models/Compliance';
import { AuthRequest } from '../middleware/authMiddleware';
import { getWorkspaceOwnerId, isWorkspaceOwner } from '../utils/workspace';

// Get all compliances for the firm
export const getCompliances = async (req: AuthRequest, res: Response) => {
  try {
    const firmId = req.user?.id ? await getWorkspaceOwnerId(req.user.id) : null;
    if (!firmId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const compliances = await Compliance.find({ firmId }).sort({ dueDate: 1 });
    return res.json({ success: true, compliances });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new Compliance Deadline
export const createCompliance = async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, dueDate, description } = req.body;
    if (!req.user?.id || !(await isWorkspaceOwner(req.user.id))) return res.status(403).json({ success: false, message: 'Only the CA owner can manage compliance deadlines.' });
    const firmId = req.user.id;

    const newCompliance = await Compliance.create({
      firmId,
      title,
      category,
      dueDate,
      description,
      status: 'Upcoming'
    });

    return res.status(201).json({ success: true, compliance: newCompliance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Compliance Status (e.g. Mark Completed)
export const updateComplianceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Upcoming' | 'Completed' | 'Overdue'

    const firmId = req.user?.id ? await getWorkspaceOwnerId(req.user.id) : null;
    const compliance = firmId ? await Compliance.findOne({ _id: id, firmId }) : null;
    if (!compliance) {
      return res.status(404).json({ success: false, message: 'Compliance task not found' });
    }

    compliance.status = status || 'Completed';
    await compliance.save();

    return res.json({ success: true, compliance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Compliance Deadline
export const deleteCompliance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user?.id || !(await isWorkspaceOwner(req.user.id))) return res.status(403).json({ success: false, message: 'Only the CA owner can delete compliance deadlines.' });
    await Compliance.findOneAndDelete({ _id: id, firmId: req.user.id });
    return res.json({ success: true, message: 'Compliance task deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
