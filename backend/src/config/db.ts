import mongoose from 'mongoose';

let pendingConnection: Promise<typeof mongoose> | null = null;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || '';
  if (!uri) throw new Error('MONGO_URI is not defined in .env');

  // Reuse the socket in warm Vercel functions. Reconnecting on every upload
  // request adds avoidable Atlas handshake time.
  if (mongoose.connection.readyState === 1) return;
  if (!pendingConnection) {
    pendingConnection = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    const conn = await pendingConnection;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } finally {
    pendingConnection = null;
  }
};
