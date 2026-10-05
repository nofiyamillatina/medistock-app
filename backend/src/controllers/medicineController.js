import prisma from '../config/database.js';

// Get all medicines catalog (Customer & Admin)
export const getMedicines = async (req, res) => {
  try {
    const { search } = req.query;
    
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { desc: { contains: search } }
      ]
    } : {};

    const medicines = await prisma.medicines.findMany({
      where,
      orderBy: { created_at: 'asc' }
    });

    res.json({ success: true, data: medicines });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data obat.' });
  }
};

const validateMedicineFields = (body, { partial = false } = {}) => {
  const errors = {};
  const isNumericValue = (value) => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value));
  if (!partial || Object.hasOwn(body, 'name')) {
    if (typeof body.name !== 'string' || !body.name.trim()) errors.name = 'Nama obat wajib diisi.';
  }
  if (!partial || Object.hasOwn(body, 'price')) {
    if (!isNumericValue(body.price) || Number(body.price) < 0) {
      errors.price = 'Harga harus berupa angka minimal 0.';
    }
  }
  if (!partial || Object.hasOwn(body, 'stock')) {
    if (!isNumericValue(body.stock) || !Number.isInteger(Number(body.stock)) || Number(body.stock) < 0) {
      errors.stock = 'Stok harus berupa bilangan bulat minimal 0.';
    }
  }
  if (Object.hasOwn(body, 'desc') && body.desc !== null && typeof body.desc !== 'string') {
    errors.desc = 'Deskripsi harus berupa teks.';
  }
  return errors;
};

const nextMedicineId = async () => {
  const medicines = await prisma.medicines.findMany({
    where: { id: { startsWith: 'MED-' } },
    select: { id: true }
  });
  const usedIds = new Set(medicines.map(({ id }) => id));
  let nextNumber = 1;
  for (const { id } of medicines) {
    const match = /^MED-(\d+)$/.exec(id);
    if (match) nextNumber = Math.max(nextNumber, Number(match[1]) + 1);
  }
  while (usedIds.has(`MED-${nextNumber}`)) nextNumber += 1;
  return `MED-${nextNumber}`;
};

export const createMedicine = async (req, res) => {
  const errors = validateMedicineFields(req.body || {});
  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
  }
  try {
    const stock = Number(req.body.stock);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const medicine = await prisma.medicines.create({
          data: {
            id: await nextMedicineId(),
            name: req.body.name.trim(),
            desc: typeof req.body.desc === 'string' ? req.body.desc.trim() : null,
            price: Number(req.body.price),
            stock,
            status: stock === 0 ? 'Habis' : 'Tersedia'
          }
        });
        return res.status(201).json({ success: true, data: medicine });
      } catch (error) {
        if (error.code !== 'P2002' || attempt === 2) throw error;
      }
    }
  } catch (error) {
    console.error('Error creating medicine:', error);
    return res.status(error.code === 'P2002' ? 409 : 500).json({
      success: false,
      message: error.code === 'P2002' ? 'ID obat bentrok. Silakan coba lagi.' : 'Gagal menambahkan obat.'
    });
  }
};

// Batch Update Inventory (Pharmacy Admin)
export const updateInventory = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Format data inventaris tidak valid.' });
    }

    for (const item of items) {
      if (!item || typeof item.id !== 'string' || !item.id.trim()) {
        return res.status(400).json({ success: false, message: 'ID obat tidak valid.' });
      }
      const errors = validateMedicineFields(item, { partial: true });
      if (Object.keys(errors).length) {
        return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
      }
    }

    try {
      await prisma.$transaction(items.map((item) => {
        const data = {};
        if (Object.hasOwn(item, 'name')) data.name = item.name.trim();
        if (Object.hasOwn(item, 'desc')) data.desc = item.desc?.trim() || null;
        if (Object.hasOwn(item, 'price')) data.price = Number(item.price);
        if (Object.hasOwn(item, 'stock')) data.stock = Number(item.stock);
        if (Object.hasOwn(item, 'stock')) data.status = Number(item.stock) === 0 ? 'Habis' : 'Tersedia';
        return prisma.medicines.update({ where: { id: item.id }, data });
      }));
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Obat tidak ditemukan.' });
      }
      throw error;
    }

    const updatedMedicines = await prisma.medicines.findMany({
      orderBy: { created_at: 'asc' }
    });
    
    res.json({
      success: true,
      message: 'Perubahan stok & harga berhasil disimpan!',
      data: updatedMedicines
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui inventaris.' });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    await prisma.medicines.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Obat berhasil dihapus.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Obat tidak ditemukan.' });
    }
    console.error('Error deleting medicine:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus obat.' });
  }
};
