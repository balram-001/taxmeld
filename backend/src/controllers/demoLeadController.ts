import { Request, Response } from 'express';
import { DemoLead } from '../models/DemoLead';

export const captureDemoLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const marketingConsent = req.body.marketingConsent === true;

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ message: 'Please enter a valid email address.' });
      return;
    }

    const lead = await DemoLead.findOneAndUpdate(
      { email },
      { $set: { marketingConsent, source: 'website-free-demo' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Demo access created.', id: lead._id });
  } catch (error: any) {
    res.status(500).json({ message: 'Unable to start the demo. Please try again.', error: error.message });
  }
};
