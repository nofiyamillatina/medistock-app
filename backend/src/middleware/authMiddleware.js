import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET is not configured. Cannot authenticate token.');
    return res.status(500).json({ success: false, message: 'Konfigurasi server tidak lengkap. Hubungi administrator.' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (!user || typeof user !== 'object' || !user.id || !user.role) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kadaluwarsa.' });
    }
    if (user.role === 'pharmacy_staff') {
      const account = await prisma.users.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, pharmacy_id: true, email: true }
      });
      if (!account || account.role !== 'pharmacy_staff' || !account.pharmacy_id) {
        return res.status(403).json({ success: false, message: 'Akun staf belum terhubung ke apotek.' });
      }
      req.user = { ...user, id: account.id, role: account.role, pharmacyId: account.pharmacy_id, email: account.email };
    } else {
      req.user = user;
    }
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kadaluwarsa.' });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki hak akses yang cukup.'
      });
    }
    next();
  };
};

export const optionalAuthenticateToken = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authenticateToken(req, res, next);
};

