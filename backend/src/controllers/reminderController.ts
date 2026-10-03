import { Request, Response } from 'express';
import { Client } from '../models/Client';
import { DocumentTask } from '../models/DocumentTask';
import { sendClientDocumentReminderEmail } from '../utils/emailService';
import { notifyClientWorkspace } from '../utils/workflowNotifications';
import { sendWhatsAppDocumentReminder } from '../utils/whatsappService';

const REMINDER_GAP_MS = 3 * 24 * 60 * 60 * 1000;

/** Called by Vercel Cron once daily. Sends at most one reminder per client every 3 days. */
export const runDocumentReminders = async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) { res.status(401).json({ message: 'Unauthorized reminder job.' }); return; }
  try {
    const now = new Date();
    const candidates = await Client.find({ lastFinalDeliveryAt: { $exists: false } }).limit(500);
    let sent = 0;
    for (const client of candidates) {
      // A submitted upload means the CA is reviewing it. Stop client nudges.
      if (client.lastClientUploadAt) continue;
      const anchor = client.lastDocumentReminderAt || client.createdAt;
      if (now.getTime() - new Date(anchor).getTime() < REMINDER_GAP_MS) continue;
      const reuploadTask = await DocumentTask.findOne({ clientId: client._id, documentType: 'Client Document', reuploadRequestedAt: { $exists: true } }).sort({ reuploadRequestedAt: -1 });
      const reason = reuploadTask?.reuploadReason || undefined;
      const trackingUrl = `${process.env.CLIENT_BASE_URL || 'https://taxmeld.vercel.app'}/track/${client.trackingToken}`;
      let emailSent = false;
      if (client.email) {
        try { await sendClientDocumentReminderEmail(client.email, client.name, trackingUrl, undefined, reason); emailSent = true; }
        catch (error) { console.error(`Reminder email failed for ${client._id}:`, error); }
      }
      let whatsappSent = false;
      try { whatsappSent = await sendWhatsAppDocumentReminder(client.whatsappNumber || client.phone, trackingUrl); }
      catch (error) { console.error(`WhatsApp reminder failed for ${client._id}:`, error); }
      // Do not consume the retry window if no live delivery channel exists.
      if (!emailSent && !whatsappSent) continue;
      client.lastDocumentReminderAt = now;
      client.documentReminderCount = (client.documentReminderCount || 0) + 1;
      await client.save();
      const detail = reason ? `Re-upload reminder sent to ${client.name}: ${reason}` : `Document upload reminder sent to ${client.name}.`;
      await notifyClientWorkspace(client, 'document_reminder', 'Client document reminder sent', detail, { emailOwner: true, emailStaff: true });
      sent += 1;
    }
    res.json({ message: 'Document reminders processed.', sent });
  } catch (error: any) { res.status(500).json({ message: error.message || 'Could not process reminders.' }); }
};
