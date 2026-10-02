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
    const normalizedSms = lowerSms.replace(/,/g, '');
    const isCredited = lowerSms.includes('credited') || lowerSms.includes('received');
    // Largest amounts first: a loose `includes('399')` would incorrectly
    // classify ₹3,999 as a ₹399 plan.
    const plans = [
      { amount: '5999', planType: 'team_599_annual', durationDays: 365 },
      { amount: '3999', planType: 'solo_399_annual', durationDays: 365 },
      { amount: '599', planType: 'team_599_monthly', durationDays: 30 },
      { amount: '399', planType: 'solo_399_monthly', durationDays: 30 },
    ];
    const matchedPlan = plans.find((plan) => new RegExp(`(^|\\D)${plan.amount}(?=\\D|$)`).test(normalizedSms));

    if (isCredited && matchedPlan) {
      const user = await User.findOne({ email: userEmail.toLowerCase() });

      if (!user) {
        res.status(404).json({ message: 'User not found for this payment.' });
        return;
      }

      user.subscriptionStatus = 'active';
      user.planType = matchedPlan.planType;
      user.subscriptionExpiresAt = new Date(Date.now() + matchedPlan.durationDays * 24 * 60 * 60 * 1000);
      await user.save();

      res.status(200).json({ message: 'Payment verified and subscription activated successfully!' });
    } else {
      res.status(400).json({ message: 'SMS does not match valid credit criteria.' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Webhook error', error: error.message });
  }
};
