import { Request, Response } from 'express';
import TimeTracking from '../models/TimeTracking';
import Client from '../models/Client';

// Get all time logs for the firm
export const getTimeLogs = async (req: Request, res: Response) => {
  try {
    const firmId = req.query.firmId as string;
    const timeLogs = await TimeTracking.find({ firmId }).sort({ date: -1, createdAt: -1 });
    return res.json({ success: true, timeLogs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new Time Log
export const createTimeLog = async (req: Request, res: Response) => {
  try {
    const { firmId, clientId, taskName, hoursSpent, date, notes } = req.body;
    
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const newLog = await TimeTracking.create({
      firmId,
      clientId,
      clientName: client.name,
      taskName,
      hoursSpent: Number(hoursSpent),
      date: date || Date.now(),
      notes
    });

    return res.status(201).json({ success: true, timeLog: newLog });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Time Log
export const deleteTimeLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await TimeTracking.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Time log deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};