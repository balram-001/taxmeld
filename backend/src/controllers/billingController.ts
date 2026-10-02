import { Request, Response } from 'express';
import Billing from '../models/Billing';
import Client from '../models/Client';
import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Get all invoices for the firm
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const firmId = req.query.firmId as string;
    const invoices = await Billing.find({ firmId }).sort({ createdAt: -1 });
    return res.json({ success: true, invoices });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Detailed Invoice with Line Items
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { firmId, clientId, lineItems, dueDate } = req.body;
    
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const totalAmount = lineItems.reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const newInvoice = await Billing.create({
      firmId,
      clientId,
      clientName: client.name,
      clientEmail: client.email || '',
      clientPhone: client.phone || client.whatsappNumber,
      clientPan: client.panNumber,
      invoiceNumber,
      lineItems,
      totalAmount,
      status: 'Pending',
      dueDate
    });

    return res.status(201).json({ success: true, invoice: newInvoice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mark Paid and Send Email Notification to Client
export const markPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await Billing.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = 'Paid';
    await invoice.save();

    // Trigger Email Dispatch
    if (invoice.clientEmail) {
      const lineItemsHtml = invoice.lineItems
        .map((item: any) => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.amount}</td></tr>`)
        .join('');

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"TaxMeld CA Practice" <no-reply@taxmeld.app>',
        to: invoice.clientEmail,
        subject: `Payment Receipt - Invoice #${invoice.invoiceNumber} (Paid)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #059669; margin-bottom: 5px;">TaxMeld CA Practice</h2>
            <p style="color: #64748b; font-size: 14px;">Professional Tax & Financial Services</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
            
            <p>Dear <strong>${invoice.clientName}</strong>,</p>
            <p>We have successfully received your payment of <strong style="color: #059669;">₹${invoice.totalAmount}</strong> for Invoice <strong>#${invoice.invoiceNumber}</strong>.</p>
            
            <h3 style="margin-top: 20px; font-size: 16px; color: #1e293b;">Invoice Summary:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Service Description</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #cbd5e1;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${lineItemsHtml}
              </tbody>
            </table>
            
            <p style="text-align: right; font-size: 16px; margin-top: 15px;"><strong>Total Paid: ₹${invoice.totalAmount}</strong></p>
            
            <div style="margin-top: 30px; padding: 12px; background-color: #ecfdf5; border-radius: 6px; color: #065f46; text-align: center; font-weight: bold;">
              Status: PAID ✓
            </div>
            
            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">This is a computer-generated invoice receipt from TaxMeld.</p>
          </div>
        `
      };

      transporter.sendMail(mailOptions).catch(err => console.error("Email sending failed:", err));
    }

    return res.json({ success: true, invoice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Invoice
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Billing.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};