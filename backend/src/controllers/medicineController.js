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

// Batch Update Inventory (Pharmacy Admin)
export const updateInventory = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Format data inventaris tidak valid.' });
    }

    for (const item of items) {
      const stockNum = Math.max(0, Number(item.stock) || 0);
      const newStatus = stockNum === 0 ? 'Habis' : (item.status || 'Tersedia');

      await prisma.medicines.update({
        where: { id: item.id },
        data: {
          price: Number(item.price) || 0,
          stock: stockNum,
          status: newStatus
        }
      });
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
