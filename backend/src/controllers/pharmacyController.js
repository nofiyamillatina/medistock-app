import { getOne, run } from '../config/database.js';

export const getPharmacyInfo = async (req, res) => {
  try {
    const info = await getOne(`SELECT * FROM pharmacy_info WHERE id = 'APOTEK-1'`);
    res.json({
      success: true,
      data: {
        id: info.id,
        name: info.name,
        isOpen: Boolean(info.is_open)
      }
    });
  } catch (error) {
    console.error('Error fetching pharmacy info:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil informasi apotek.' });
  }
};

export const toggleStoreStatus = async (req, res) => {
  try {
    const { isOpen } = req.body;
    const is_open = isOpen ? 1 : 0;

    await run(`UPDATE pharmacy_info SET is_open = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 'APOTEK-1'`, [is_open]);

    res.json({
      success: true,
      message: `Status toko berhasil diubah menjadi ${isOpen ? 'BUKA' : 'TUTUP'}.`,
      data: { isOpen: Boolean(isOpen) }
    });
  } catch (error) {
    console.error('Error toggling store status:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status toko.' });
  }
};
