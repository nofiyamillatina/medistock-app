import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import { seedDatabase } from '../db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MEDISTOCK API', timestamp: new Date() });
});

// Auto initialize and seed DB on start
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 MEDISTOCK Backend Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to start server due to DB initialization error:', err);
});
