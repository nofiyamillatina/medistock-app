import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

const createAuthToken = (user, secret) => jwt.sign(
  {
    id: user.id,
    role: user.role,
    pharmacyId: user.pharmacy_id,
    pharmacy_id: user.pharmacy_id,
    email: user.email
  },
  secret,
  { expiresIn: '24h' }
);

const getJwtSecret = (res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ JWT_SECRET is not configured. Cannot issue token.');
    res.status(500).json({ success: false, message: 'Konfigurasi server tidak lengkap. Hubungi administrator.' });
    return null;
  }
  return secret;
};

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  pharmacyId: user.pharmacy_id
});

export const loginPharmacy = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email;

    if (!identifier || !password) {
      return res.status(401).json({
        success: false,
        message: 'Username/email dan password wajib diisi.'
      });
    }

    const JWT_SECRET = getJwtSecret(res);
    if (!JWT_SECRET) return;

    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user || user.role !== 'pharmacy_staff') {
      return res.status(401).json({
        success: false,
        message: 'Username/email atau password tidak valid.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username/email atau password tidak valid.'
      });
    }

    const token = createAuthToken(user, JWT_SECRET);

    return res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saat login.' });
  }
};

export const registerCustomer = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter.' });
    }

    const JWT_SECRET = getJwtSecret(res);
    if (!JWT_SECRET) return;

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: { email, password_hash, role: 'customer' }
    });

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil.',
      token: createAuthToken(user, JWT_SECRET),
      user: toPublicUser(user)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar. Silakan masuk.' });
    }
    console.error('Customer registration error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error saat mendaftar.' });
  }
};

export const loginCustomer = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const JWT_SECRET = getJwtSecret(res);
    if (!JWT_SECRET) return;

    const user = await prisma.users.findUnique({ where: { email } });
    const isMatch = user?.role === 'customer' && await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password tidak valid.' });
    }

    return res.json({
      success: true,
      message: 'Login berhasil.',
      token: createAuthToken(user, JWT_SECRET),
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('Customer login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error saat login.' });
  }
};

export const verifyAuth = async (req, res) => {
  res.json({ success: true, user: req.user });
};
