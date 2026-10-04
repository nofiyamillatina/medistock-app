import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

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

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured. Cannot issue token.');
      return res.status(500).json({ success: false, message: 'Konfigurasi server tidak lengkap. Hubungi administrator.' });
    }

    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
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

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        pharmacyId: user.pharmacy_id,
        pharmacy_id: user.pharmacy_id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        pharmacyId: user.pharmacy_id
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saat login.' });
  }
};

export const verifyAuth = async (req, res) => {
  res.json({ success: true, user: req.user });
};

