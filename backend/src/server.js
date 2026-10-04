import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import { seedDatabase } from '../db/seed.js';
import prisma from './config/database.js';

dotenv.config();

// --- Startup validation ---
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  CRITICAL WARNING: JWT_SECRET is not set in environment variables!');
  } else {
    console.warn('⚠️  WARNING: JWT_SECRET is not set. Set JWT_SECRET in your .env file. See backend/.env.example for reference.');
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- CORS Configuration ---
// In development, allow the Vite dev server (localhost:3000).
// In production, set ALLOWED_ORIGIN env var to your actual frontend domain(s) or wildcard '*'.
const rawAllowedOrigin = process.env.ALLOWED_ORIGIN || process.env.CORS_ORIGIN;
const allowedOrigins = rawAllowedOrigin
  ? rawAllowedOrigin.split(',').map(s => s.trim())
  : (NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, mobile apps, same-origin, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error(`CORS policy: origin '${origin}' not allowed.`));
  },
  credentials: true
}));

app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

// --- Health check endpoint ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MEDISTOCK API',
    environment: NODE_ENV,
    timestamp: new Date()
  });
});

// --- 404 Handler (catch unmatched routes) ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route '${req.method} ${req.path}' tidak ditemukan.` });
});

// --- Global Error Handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Unhandled server error:', err.stack || err.message);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
});

// --- Graceful Shutdown ---
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected.');
  } catch (e) {
    console.error('Error disconnecting Prisma:', e);
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// --- Start Server ---
seedDatabase().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 MEDISTOCK Backend Server running on http://${HOST}:${PORT}`);
    console.log(`   Environment : ${NODE_ENV}`);
    console.log(`   CORS origin : ${allowedOrigins.join(', ') || '(permissive fallback)'}`);
  });
}).catch(err => {
  console.error('❌ Failed to start server due to DB initialization error:', err);
  process.exit(1);
});
