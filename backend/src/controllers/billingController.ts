import { Response } from 'express';
import { Billing } from '../models/Billing';

export const getInvoices = async (req: any, res: Response) => {
  try {
    const { firmId } = req.params;
    const invoices = await Billing.find({ firmId }).populate('clientId', 'name panNumber phone whatsappNumber');
    res.status(200).json({ success: true, invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createInvoice = async (req: any, res: Response) => {
  try {
    const { firmId, clientId, title, amount, dueDate } = req.body;
    const newInvoice = new Billing({ firmId, clientId, title, amount, dueDate });
    await newInvoice.save();
    res.status(201).json({ success: true, message: 'Invoice created successfully.', invoice: newInvoice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateInvoiceStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Billing.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json({ success: true, message: 'Invoice status updated.', invoice: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteInvoice = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await Billing.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};