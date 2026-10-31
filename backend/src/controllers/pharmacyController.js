import prisma from '../config/database.js';

export const getPharmacies = async (req, res) => {
  try {
    const pharmacies = await prisma.pharmacy_info.findMany({
      select: { id: true, name: true, is_open: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: pharmacies.map((pharmacy) => ({ ...pharmacy, isOpen: Boolean(pharmacy.is_open) })) });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
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
    console.error('Error fetching pharmacy info:', error);
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
    console.error('Error toggling store status:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status toko.' });
  }
};
