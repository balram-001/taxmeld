import { Request, Response } from 'express';
import Compliance from '../models/Compliance';

// Get all compliances for the firm
export const getCompliances = async (req: Request, res: Response) => {
  try {
    const firmId = req.query.firmId as string;
    const compliances = await Compliance.find({ firmId }).sort({ dueDate: 1 });
    return res.json({ success: true, compliances });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new Compliance Deadline
export const createCompliance = async (req: Request, res: Response) => {
  try {
    const { firmId, title, category, dueDate, description } = req.body;

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
export const updateComplianceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Upcoming' | 'Completed' | 'Overdue'

    const compliance = await Compliance.findById(id);
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
export const deleteCompliance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Compliance.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Compliance task deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};