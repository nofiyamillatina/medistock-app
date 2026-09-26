import { query, run, getOne } from '../config/database.js';

// Get all medicines catalog (Customer & Admin)
export const getMedicines = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `SELECT * FROM medicines`;
    let params = [];

    if (search) {
      sql += ` WHERE LOWER(name) LIKE ? OR LOWER(desc) LIKE ?`;
      const term = `%${search.toLowerCase()}%`;
      params = [term, term];
    }

    sql += ` ORDER BY created_at ASC`;

    const medicines = await query(sql, params);
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

      await run(
        `UPDATE medicines SET price = ?, stock = ?, status = ? WHERE id = ?`,
        [Number(item.price) || 0, stockNum, newStatus, item.id]
      );
    }

    const updatedMedicines = await query(`SELECT * FROM medicines ORDER BY created_at ASC`);
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
