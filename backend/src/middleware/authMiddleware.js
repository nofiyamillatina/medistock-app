import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
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

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kadaluwarsa.' });
    }
    req.user = user;
    next();
  });
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

