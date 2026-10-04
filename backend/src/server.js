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
  console.warn('⚠️  WARNING: JWT_SECRET is not set. Using a default value is INSECURE in production.');
  console.warn('   Set JWT_SECRET in your .env file. See backend/.env.example for reference.');
}

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- CORS Configuration ---
// In development, allow the Vite dev server (localhost:3000).
// In production, set ALLOWED_ORIGIN env var to your actual frontend domain.
const allowedOrigins = NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : [])
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, mobile apps, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, be permissive to avoid friction
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
  app.listen(PORT, () => {
    console.log(`🚀 MEDISTOCK Backend Server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${NODE_ENV}`);
    console.log(`   CORS origin : ${allowedOrigins.join(', ') || '(all — non-production fallback)'}`);
  });
}).catch(err => {
  console.error('❌ Failed to start server due to DB initialization error:', err);
  process.exit(1);
});
