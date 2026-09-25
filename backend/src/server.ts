import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import { isEmailConfigured } from './utils/sendEmail';

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import taskRoutes from './routes/taskRoutes';
import demoLeadRoutes from './routes/demoLeadRoutes';
import paymentRoutes from './routes/paymentRoutes'; // ✅ Payment & Webhook Routes Added
import rateLimit from 'express-rate-limit';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured before starting the server.');
}

const app = express();
app.set('trust proxy', 1);

// 🛡️ SECURITY LAYER 1: Helmet (Protects against well-known web vulnerabilities)
app.use(helmet());

const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'https://taxmeld.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// 🛡️ SECURITY LAYER 2: Strict CORS Protection
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed by CORS.'));
  },
}));

app.use(express.json());

// 🛡️ SECURITY LAYER 3: Custom NoSQL Injection Protection (Blocks database manipulation attacks)
app.use((req, res, next) => {
  const sanitizeValue = (value: any): any => {
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete value[key]; // Removes malicious MongoDB operators
        } else {
          sanitizeValue(value[key]);
        }
      }
    }
    return value;
  };

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
});

// ==========================================
// 🛡️ SECURITY LAYER 4: RATE LIMITING (DDoS & Brute-Force Protection)
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP in 15 mins
  message: { 
    success: false,
    message: "Bohot saari requests aa rahi hain. Kripya 15 minute baad try karein." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Applied globally to all /api routes
app.use('/api', apiLimiter);
// ==========================================

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

connectDB();
console.log(isEmailConfigured() ? 'Brevo email API configured.' : 'Brevo email API is not configured.');

// 🚀 API Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/demo-leads', demoLeadRoutes);
app.use('/api/payment', paymentRoutes); // 🔒 Webhook & Payment endpoints secured under /api/payment

// Root route
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