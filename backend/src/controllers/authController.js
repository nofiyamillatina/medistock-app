import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medistock_super_secret_key_2026';

export const loginPharmacy = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Default prototype credentials
    if ((username === 'apotek@medistock.id' || username === 'admin') && password === 'password123') {
      const token = jwt.sign(
        { pharmacyId: 'APOTEK-1', role: 'pharmacy_staff' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Login berhasil',
        token,
        user: {
          id: 'APOTEK-1',
          name: 'Apotek Sehat',
          email: 'apotek@medistock.id'
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Username atau password tidak valid.'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error saat login.' });
  }
};

export const verifyAuth = async (req, res) => {
  res.json({ success: true, user: req.user });
};
