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

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kadaluwarsa.' });
  }
  if (!user || typeof user !== 'object' || !user.id || !user.role) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kadaluwarsa.' });
  }

  if (user.role === 'platform_admin') {
    let account;
    try {
      account = await prisma.users.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, email: true, pharmacy_id: true }
      });
    } catch (error) {
      console.error('Platform admin account lookup failed.', error?.code || 'UNKNOWN');
      return res.status(503).json({ success: false, message: 'Layanan autentikasi sementara tidak tersedia.' });
    }
    if (!account || account.role !== 'platform_admin') {
      return res.status(403).json({ success: false, message: 'Akses admin platform tidak diizinkan.' });
    }
    req.user = { ...user, id: account.id, role: account.role, email: account.email, pharmacyId: account.pharmacy_id };
  } else if (user.role === 'pharmacy_staff') {
    let account;
    try {
      account = await prisma.users.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, pharmacy_id: true, email: true, updated_at: true, pharmacy: { select: { is_active: true } } }
      });
    } catch (error) {
      console.error('Pharmacy staff account lookup failed.', error?.code || 'UNKNOWN');
      return res.status(503).json({ success: false, message: 'Layanan autentikasi sementara tidak tersedia.' });
    }
    if (!account || account.role !== 'pharmacy_staff' || !account.pharmacy_id) {
      return res.status(403).json({ success: false, message: 'Akun staf belum terhubung ke apotek.' });
    }
    if (!account.pharmacy?.is_active) {
      return res.status(403).json({ success: false, message: 'Apotek staf ini sedang dinonaktifkan.' });
    }
    if (account.updated_at && Number.isInteger(user.iat) && user.iat * 1000 < account.updated_at.getTime()) {
      return res.status(401).json({ success: false, message: 'Sesi staf telah berakhir. Silakan login kembali.' });
    }
    req.user = { ...user, id: account.id, role: account.role, pharmacyId: account.pharmacy_id, email: account.email };
  } else {
    req.user = user;
  }
  return next();
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

