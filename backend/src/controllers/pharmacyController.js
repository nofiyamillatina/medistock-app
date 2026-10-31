import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

export const getPharmaciesForPlatformAdmin = async (req, res) => {
  try {
    const pharmacies = await prisma.pharmacy_info.findMany({
      select: {
        id: true, name: true, is_open: true, is_active: true,
        users: { where: { role: 'pharmacy_staff' }, select: { email: true, username: true }, orderBy: { email: 'asc' } },
        _count: { select: { orders: true } }
      },
      orderBy: { name: 'asc' }
    });
    return res.json({
      success: true,
      data: pharmacies.map(({ is_open, is_active, _count, users, ...pharmacy }) => ({
        ...pharmacy,
        isOpen: Boolean(is_open),
        isActive: is_active,
        orderCount: _count.orders,
        staff: users
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
        data: { id: pharmacyId, name, is_open: 1, is_active: true }
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

export const getPlatformPharmacyDetail = async (req, res) => {
  try {
    const pharmacy = await prisma.pharmacy_info.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        is_open: true,
        is_active: true,
        users: {
          where: { role: 'pharmacy_staff' },
          select: { id: true, email: true, username: true, created_at: true },
          orderBy: { email: 'asc' }
        },
        _count: { select: { medicines: true, orders: true } }
      }
    });
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Apotek tidak ditemukan.' });
    return res.json({
      success: true,
      data: {
        id: pharmacy.id,
        name: pharmacy.name,
        isOpen: Boolean(pharmacy.is_open),
        isActive: pharmacy.is_active,
        staff: pharmacy.users,
        medicineCount: pharmacy._count.medicines,
        orderCount: pharmacy._count.orders
      }
    });
  } catch (error) {
    console.error('Platform pharmacy detail query failed.', error?.code || 'UNKNOWN');
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail apotek.' });
  }
};

export const updatePlatformPharmacy = async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ success: false, message: 'Nama apotek harus terdiri dari 2 sampai 120 karakter.' });
  }
  try {
    const updated = await prisma.pharmacy_info.updateMany({
      where: { id: req.params.id },
      data: { name, updated_at: new Date() }
    });
    if (updated.count !== 1) return res.status(404).json({ success: false, message: 'Apotek tidak ditemukan.' });
    return res.json({ success: true, message: 'Informasi apotek berhasil diperbarui.', data: { id: req.params.id, name } });
  } catch (error) {
    console.error('Platform pharmacy update failed.', error?.code || 'UNKNOWN');
    return res.status(500).json({ success: false, message: 'Gagal memperbarui informasi apotek.' });
  }
};

export const updatePlatformStaff = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Email staf tidak valid.' });
  }
  if (username && (username.length < 3 || username.length > 40 || !/^[a-zA-Z0-9._-]+$/.test(username))) {
    return res.status(400).json({ success: false, message: 'Username staf tidak valid.' });
  }
  try {
    const updated = await prisma.users.updateMany({
      where: { id: req.params.staffId, pharmacy_id: req.params.id, role: 'pharmacy_staff' },
      data: { email, username: username || null, updated_at: new Date() }
    });
    if (updated.count !== 1) return res.status(404).json({ success: false, message: 'Akun staf tidak ditemukan pada apotek ini.' });
    return res.json({ success: true, message: 'Akun staf berhasil diperbarui.', data: { id: req.params.staffId, email, username: username || null } });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Email atau username sudah digunakan.' });
    console.error('Platform pharmacy staff update failed.', error?.code || 'UNKNOWN');
    return res.status(500).json({ success: false, message: 'Gagal memperbarui akun staf.' });
  }
};

export const resetPlatformStaffPassword = async (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password.length < 10 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password harus 10–128 karakter dan memuat huruf besar, huruf kecil, angka, serta simbol.' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 12);
    const updated = await prisma.users.updateMany({
      where: { id: req.params.staffId, pharmacy_id: req.params.id, role: 'pharmacy_staff' },
      data: { password_hash, updated_at: new Date() }
    });
    if (updated.count !== 1) return res.status(404).json({ success: false, message: 'Akun staf tidak ditemukan pada apotek ini.' });
    return res.json({ success: true, message: 'Password staf berhasil direset.' });
  } catch (error) {
    console.error('Platform pharmacy staff password reset failed.', error?.code || 'UNKNOWN');
    return res.status(500).json({ success: false, message: 'Gagal mereset password staf.' });
  }
};

export const setPlatformPharmacyActive = async (req, res) => {
  const isActive = req.body?.isActive;
  if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'Status aktif apotek tidak valid.' });
  try {
    const updatedCount = await prisma.$transaction(async (tx) => {
      const updated = await tx.pharmacy_info.updateMany({
        where: { id: req.params.id },
        data: { is_active: isActive, updated_at: new Date() }
      });
      if (updated.count === 1 && !isActive) {
        await tx.users.updateMany({
          where: { pharmacy_id: req.params.id, role: 'pharmacy_staff' },
          data: { updated_at: new Date() }
        });
      }
      return updated.count;
    });
    if (updatedCount !== 1) return res.status(404).json({ success: false, message: 'Apotek tidak ditemukan.' });
    return res.json({ success: true, message: `Apotek berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`, data: { id: req.params.id, isActive } });
  } catch (error) {
    console.error('Platform pharmacy status update failed.', error?.code || 'UNKNOWN');
    return res.status(500).json({ success: false, message: 'Gagal mengubah status aktif apotek.' });
  }
};

export const deleteEmptyPlatformPharmacy = async (req, res) => {
  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const pharmacy = await tx.pharmacy_info.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!pharmacy) return { status: 404 };
      const [staffCount, medicineCount, orderCount] = await Promise.all([
        tx.users.count({ where: { pharmacy_id: pharmacy.id } }),
        tx.medicines.count({ where: { pharmacy_id: pharmacy.id } }),
        tx.orders.count({ where: { pharmacy_id: pharmacy.id } })
      ]);
      if (staffCount || medicineCount || orderCount) return { status: 409 };
      await tx.pharmacy_info.delete({ where: { id: pharmacy.id } });
      return { status: 204 };
    }, { isolationLevel: 'Serializable' });
    if (deleted.status === 404) return res.status(404).json({ success: false, message: 'Apotek tidak ditemukan.' });
    if (deleted.status === 409) return res.status(409).json({ success: false, message: 'Apotek memiliki akun atau data terkait dan tidak dapat dihapus. Nonaktifkan apotek untuk mempertahankan riwayat.' });
    return res.status(204).end();
  } catch (error) {
    console.error('Platform pharmacy deletion failed.', error?.code || 'UNKNOWN');
    if (error.code === 'P2034') return res.status(409).json({ success: false, message: 'Data apotek berubah selama penghapusan. Muat ulang detail dan coba lagi.' });
    return res.status(500).json({ success: false, message: 'Gagal menghapus apotek.' });
  }
};

export const getPharmacies = async (req, res) => {
  try {
    const pharmacies = await prisma.pharmacy_info.findMany({
      where: { is_active: true },
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
    const info = await prisma.pharmacy_info.findFirst({ where: { id: requestedId, is_active: true } });
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
