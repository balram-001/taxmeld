import { Response } from 'express';
import crypto from 'crypto';
import { Client } from '../models/Client';
import { DocumentTask } from '../models/DocumentTask';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendClientWelcomeEmail } from '../utils/emailService';

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, panNumber, email, phone, serviceType, customRequirements } = req.body;

    if (!name || !panNumber) {
      res.status(400).json({ message: 'Name and PAN Number are required.' });
      return;
    }

    // Auth user ID safely assign karein
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // --- TRIAL & 20-CLIENT LIMIT VALIDATION ---
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const now = new Date();

    // Check if 14-day trial has expired
    if (user.subscriptionStatus === 'trial' && user.trialEndsAt && now > new Date(user.trialEndsAt)) {
      user.subscriptionStatus = 'expired';
      await user.save();
    }

    if (user.subscriptionStatus === 'expired') {
      res.status(403).json({ 
        message: 'Your 14-day free trial has ended. Please upgrade to the ₹299/mo plan to add more clients.' 
      });
      return;
    }

    // Check if client count has reached the 20 limit during trial
    if (user.subscriptionStatus === 'trial') {
      const currentClientCount = await Client.countDocuments({ userId });
      if (currentClientCount >= 20) {
        res.status(403).json({ 
          message: 'Trial limit reached! You can add up to 20 clients during your 14-day free trial. Please upgrade to add more.' 
        });
        return;
      }
    }
    // ------------------------------------------

    const trackingToken = crypto.randomBytes(16).toString('hex');

    const client = await Client.create({
      name,
      panNumber: panNumber.toUpperCase().trim(),
      email,
      phone,
      whatsappNumber: phone,
      serviceType: serviceType !== undefined ? serviceType : '',
      customRequirements: Array.isArray(customRequirements) ? customRequirements : [],
      userId: userId,
      trackingToken,
    });

    // Send the client their upload and tracking link after the client record is saved.
    if (email) {
      const frontendBaseUrl = process.env.CLIENT_BASE_URL || 'https://taxmeld.vercel.app';
      const trackingUrl = `${frontendBaseUrl}/track/${trackingToken}`;
      const requirements = [
        ...(serviceType ? serviceType.split(', ').filter(Boolean) : []),
        ...(Array.isArray(customRequirements) ? customRequirements.map((requirement: any) => requirement.name) : []),
      ];
      const ca = await User.findById(userId).select('name').lean();

      void sendClientWelcomeEmail(
        email,
        name,
        panNumber.toUpperCase().trim(),
        trackingUrl,
        requirements,
        ca?.name
      ).catch((err) => console.error('Background welcome email error:', err));
    }

    res.status(201).json(client);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating client' });
  }
};

export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized access' });
      return;
    }

    const clients = await Client.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch clients', error: error.message });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clientId = req.params.id;
    const userId = req.user?.id || req.user?._id;

    const client = await Client.findOne({ _id: clientId, userId: userId });
    if (!client) {
      res.status(404).json({ message: 'Client not found or unauthorized' });
      return;
    }

    await DocumentTask.deleteMany({ clientId });
    await Client.findByIdAndDelete(clientId);

    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete client', error: error.message });
  }
};