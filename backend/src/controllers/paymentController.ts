import { Request, Response } from 'express';
import { User } from '../models/User';

export const handleMacrodroidWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const secretHeader = req.headers['x-webhook-secret'];
    const expectedSecret = process.env.MACRODROID_SECRET || 'AapkaSecretPassword123';

    if (secretHeader !== expectedSecret) {
      res.status(403).json({ message: 'Unauthorized webhook request.' });
      return;
    }

    const { smsText, userEmail } = req.body; 

    if (!smsText || !userEmail) {
      res.status(400).json({ message: 'SMS text or user email missing.' });
      return;
    }

    const lowerSms = smsText.toLowerCase();

    const isCredited = lowerSms.includes('credited') || lowerSms.includes('received');
    const containsAmount = lowerSms.includes('399') || lowerSms.includes('299'); 

    if (isCredited && containsAmount) {
      const user = await User.findOne({ email: userEmail.toLowerCase() });

      if (!user) {
        res.status(404).json({ message: 'User not found for this payment.' });
        return;
      }

      user.subscriptionStatus = 'active';
      user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Days active
      await user.save();

      res.status(200).json({ message: 'Payment verified and subscription activated successfully!' });
    } else {
      res.status(400).json({ message: 'SMS does not match valid credit criteria.' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Webhook error', error: error.message });
  }
};