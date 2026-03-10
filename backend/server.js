import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import ownerRoutes from './routes/owners.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import authRoutes from './routes/auth.js';
import actionRoutes from './routes/actions.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded bills

// Global is used here to maintain a cached connection across hot reloads in development
// and across serverless function invocations in production
let cachedDb = global.mongoose;

if (!cachedDb) {
  cachedDb = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cachedDb.conn) {
    return cachedDb.conn;
  }

  if (!cachedDb.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose buffering
    };
    cachedDb.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    });
  }

  try {
    cachedDb.conn = await cachedDb.promise;
  } catch (e) {
    cachedDb.promise = null;
    throw e;
  }

  return cachedDb.conn;
}

// Ensure DB is connected before processing API requests (crucial for Serverless Vercel)
app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Failed to connect to database in middleware:', error);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/owners', ownerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Tridev Apartment Maintenance API is running.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
