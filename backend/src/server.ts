import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import { isEmailConfigured } from './utils/sendEmail';

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import taskRoutes from './routes/taskRoutes';
import demoLeadRoutes from './routes/demoLeadRoutes';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured before starting the server.');
}

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'https://taxfollow.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header include health checks and server-to-server calls.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS.'));
  },
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

connectDB();
console.log(isEmailConfigured() ? 'Brevo email API configured.' : 'Brevo email API is not configured.');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/demo-leads', demoLeadRoutes);

// Root route (Fixes UptimeRobot 404)
app.get('/', (_req, res) => {
  res.status(200).send('TaxMeld Backend is Live & Running! 🚀');
});

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'TaxMeld Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 TaxMeld Server running on port ${PORT}`);
});
