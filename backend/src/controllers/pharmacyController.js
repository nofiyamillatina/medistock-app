import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

export const getPharmaciesForPlatformAdmin = async (req, res) => {
  try {
    const pharmacies = await prisma.pharmacy_info.findMany({
      select: { id: true, name: true, is_open: true },
      orderBy: { name: 'asc' }
    });
    return res.json({
      success: true,
      data: pharmacies.map(({ is_open, ...pharmacy }) => ({
        ...pharmacy,
        isOpen: Boolean(is_open)
      }))
    });
  } catch (error) {
    console.error('Error fetching platform pharmacy list.', error?.code || 'UNKNOWN');
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar apotek.' });
  }
};

export const createPharmacyWithStaff = async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.staffEmail === 'string' ? body.staffEmail.trim().toLowerCase() : '';
  const password = typeof body.staffPassword === 'string' ? body.staffPassword : '';
  const username = typeof body.staffUsername === 'string' ? body.staffUsername.trim() : '';

  if (Object.keys(body).length === 0) {
    return res.status(400).json({ success: false, message: 'Data apotek dan akun staf wajib diisi.' });
  }

  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ success: false, message: 'Nama apotek harus terdiri dari 2 sampai 120 karakter.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Email staf tidak valid.' });
  }
  if (password.length < 10 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password staf harus 10–128 karakter dan memuat huruf besar, huruf kecil, angka, serta simbol.' });
  }
  if (username && (username.length < 3 || username.length > 40 || !/^[a-zA-Z0-9._-]+$/.test(username))) {
    return res.status(400).json({ success: false, message: 'Username staf tidak valid.' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);
    const pharmacyId = `APT-${randomUUID()}`;
    const result = await prisma.$transaction(async (tx) => {
      const pharmacy = await tx.pharmacy_info.create({
        data: { id: pharmacyId, name, is_open: 1 }
      });
      const staff = await tx.users.create({
        data: {
          email,
          username: username || null,
          password_hash,
          role: 'pharmacy_staff',
          pharmacy_id: pharmacy.id
        },
        select: { id: true, email: true, username: true, role: true, pharmacy_id: true }
      });
      return { pharmacy, staff };
    });

    return res.status(201).json({
      success: true,
      message: 'Apotek dan akun staf berhasil dibuat.',
      data: {
        pharmacy: { id: result.pharmacy.id, name: result.pharmacy.name, isOpen: Boolean(result.pharmacy.is_open) },
        staff: { id: result.staff.id, email: result.staff.email, username: result.staff.username }
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email atau username sudah digunakan.' });
    }
    console.error('Error creating pharmacy and staff account.');
    return res.status(500).json({ success: false, message: 'Gagal membuat apotek dan akun staf.' });
  }
};

export const getPharmacies = async (req, res) => {
  try {
    const pharmacies = await prisma.pharmacy_info.findMany({
      select: { id: true, name: true, is_open: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: pharmacies.map((pharmacy) => ({ ...pharmacy, isOpen: Boolean(pharmacy.is_open) })) });
  } catch (error) {
    console.error('Pharmacy list query failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar apotek.' });
  }
};

export const getPharmacyInfo = async (req, res) => {
  try {
    const requestedId = req.user?.role === 'pharmacy_staff' ? req.user.pharmacyId : req.query.pharmacyId;
    if (!requestedId) return res.status(400).json({ success: false, message: 'Pilih apotek untuk melihat informasi.' });
    const info = await prisma.pharmacy_info.findUnique({ where: { id: requestedId } });
    if (!info) return res.status(404).json({ success: false, message: 'Apotek tidak ditemukan.' });
    res.json({
      success: true,
      data: {
        id: info.id,
        name: info.name,
        isOpen: Boolean(info.is_open)
      }
    });
  } catch (error) {
    console.error('Pharmacy info query failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal mengambil informasi apotek.' });
  }
};

export const toggleStoreStatus = async (req, res) => {
  try {
    const { isOpen } = req.body;
    if (typeof isOpen !== 'boolean') return res.status(400).json({ success: false, message: 'Status apotek tidak valid.' });
    const is_open = isOpen ? 1 : 0;

    await prisma.pharmacy_info.update({
      where: { id: req.user.pharmacyId },
      data: {
        is_open,
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      message: `Status toko berhasil diubah menjadi ${isOpen ? 'BUKA' : 'TUTUP'}.`,
      data: { isOpen: Boolean(isOpen) }
    });
  } catch (error) {
    console.error('Pharmacy status update failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal mengubah status toko.' });
  }
};
