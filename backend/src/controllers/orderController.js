import prisma from '../config/database.js';
import { randomUUID } from 'node:crypto';

function matchMedicineForOrderItem(itemName, medicines, medicineId = null) {
  if (medicineId) {
    const idMatch = medicines.find((medicine) => medicine.id === medicineId);
    if (idMatch) return idMatch;
  }
  const normalizedItemName = String(itemName || '').trim().toLocaleLowerCase('id');
  const exactMatches = medicines.filter((medicine) => medicine.name.trim().toLocaleLowerCase('id') === normalizedItemName);
  if (exactMatches.length === 1) return exactMatches[0];
  if (exactMatches.length > 1) return null;

  // Legacy order items may not exactly match catalog names. Only use the old
  // first-word fallback when it identifies one medicine unambiguously.
  const fallbackMatches = medicines.filter((medicine) =>
    normalizedItemName.startsWith(medicine.name.trim().split(/\s+/)[0].toLocaleLowerCase('id'))
  );
  return fallbackMatches.length === 1 ? fallbackMatches[0] : null;
}

// Get all orders (Pharmacy Dashboard & Reports)
export const getOrders = async (req, res) => {
  try {
    const rawOrders = await prisma.orders.findMany({
      where: { pharmacy_id: req.user.pharmacyId },
      select: {
        id: true,
        customer_name: true,
        phone: true,
        address: true,
        delivery_type: true,
        payment_method: true,
        subtotal: true,
        service_fee: true,
        total_amount: true,
        payment_status: true,
        order_status: true,
        timestamp: true,
        estimated_arrival: true,
        review_rating: true,
        review_comment: true,
        pharmacy_id: true,
        items: true
      },
      orderBy: { id: 'desc' }
    });

    // Attach items to each order and format to match frontend expectation
    const orders = rawOrders.map(order => {
      return {
        ...order,
        customerName: order.customer_name,
        deliveryType: order.delivery_type,
        paymentMethod: order.payment_method,
        serviceFee: order.service_fee,
        totalAmount: order.total_amount,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        estimatedArrival: order.estimated_arrival,
        reviewRating: order.review_rating,
        reviewComment: order.review_comment,
        pharmacyId: order.pharmacy_id,
        items: order.items.map(item => ({
          medicineId: item.medicine_id,
          name: item.name,
          qty: item.qty,
          price: item.price
        }))
      };
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Order list query failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan.' });
  }
};

// Pharmacy-only cleanup actions. Child order items are removed by the FK cascade.
export const resetOrders = async (req, res) => {
  const { scope, confirm } = req.body || {};
  if (!['all', 'completed'].includes(scope) || confirm !== 'RESET_ORDERS') {
    return res.status(400).json({ success: false, message: 'Validasi reset tidak cocok. Muat ulang halaman lalu konfirmasi kembali.' });
  }

  try {
    const where = { pharmacy_id: req.user.pharmacyId, ...(scope === 'completed' ? { order_status: 'Selesai' } : {}) };
    const result = await prisma.orders.deleteMany({ where });
    return res.json({ success: true, deletedCount: result.count, message: `${result.count} data pesanan berhasil direset.` });
  } catch (error) {
    console.error('Order reset failed.', error?.code || 'UNKNOWN');
    return res.status(500).json({ success: false, message: 'Gagal mereset data pesanan.' });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const rawOrders = await prisma.orders.findMany({
      where: { customer_id: req.user.id },
      include: { items: true, pharmacy: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    });

    const orders = rawOrders.map((order) => ({
      id: order.id,
      customerName: order.customer_name,
      deliveryType: order.delivery_type,
      paymentMethod: order.payment_method,
      subtotal: order.subtotal,
      serviceFee: order.service_fee,
      totalAmount: order.total_amount,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      timestamp: order.timestamp,
      estimatedArrival: order.estimated_arrival,
      reviewRating: order.review_rating,
      reviewComment: order.review_comment,
      pharmacyId: order.pharmacy_id,
      pharmacyName: order.pharmacy?.name || null,
      items: order.items.map((item) => ({
        medicineId: item.medicine_id,
        name: item.name,
        qty: item.qty,
        price: item.price
      }))
    }));

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Customer order history query failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pemesanan.' });
  }
};

// Public customer tracking, scoped to the order ID and phone number.
export const trackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const phone = String(req.query.phone || '').trim();
    if (!phone) return res.status(400).json({ success: false, message: 'Nomor telepon wajib diisi.' });

    const order = await prisma.orders.findFirst({ where: { id, phone }, include: { items: true } });
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan. Periksa kembali ID pesanan dan nomor telepon.' });

    res.json({ success: true, data: {
      id: order.id,
      customerName: order.customer_name,
      deliveryType: order.delivery_type,
      paymentMethod: order.payment_method,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      estimatedArrival: order.estimated_arrival,
      timestamp: order.timestamp,
      totalAmount: order.total_amount,
      items: order.items.map((item) => ({ medicineId: item.medicine_id, name: item.name, qty: item.qty, price: item.price }))
    } });
  } catch (error) {
    console.error('Order tracking query failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal memuat status pesanan.' });
  }
};

// Customer confirms receipt of a delivery order using the order's phone number.
export const completeDeliveryOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.orders.findFirst({ where: { id, customer_id: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    if (order.delivery_type !== 'Pengantaran') return res.status(400).json({ success: false, message: 'Konfirmasi selesai untuk pesanan ini dilakukan oleh apotek.' });
    if (order.order_status !== 'Dalam Pengantaran') return res.status(409).json({ success: false, message: 'Pesanan hanya dapat ditandai selesai saat dalam pengantaran.' });

    const transition = await prisma.orders.updateMany({
      where: { id, customer_id: req.user.id, order_status: 'Dalam Pengantaran' },
      data: { order_status: 'Selesai' }
    });
    if (transition.count !== 1) return res.status(409).json({ success: false, message: 'Status pesanan berubah. Muat ulang riwayat pesanan.' });
    const updatedOrder = await prisma.orders.findUnique({ where: { id } });
    res.json({ success: true, message: 'Pesanan berhasil ditandai selesai.', data: { id: updatedOrder.id, orderStatus: updatedOrder.order_status } });
  } catch (error) {
    console.error('Delivery completion failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal menyelesaikan pesanan.' });
  }
};

export const submitOrderReview = async (req, res) => {
  try {
    const { id } = req.params;
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Pilih rating bintang 1 sampai 5.' });
    }
    if (!comment || comment.length > 1000) {
      return res.status(400).json({ success: false, message: 'Komentar wajib diisi dan maksimal 1000 karakter.' });
    }

    const order = await prisma.orders.findFirst({ where: { id, customer_id: req.user.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    if (order.order_status !== 'Selesai') return res.status(409).json({ success: false, message: 'Ulasan hanya dapat diberikan setelah pesanan diterima.' });
    if (order.review_rating !== null) return res.status(409).json({ success: false, message: 'Ulasan untuk pesanan ini sudah dikirim.' });

    const result = await prisma.orders.updateMany({
      where: { id, customer_id: req.user.id, order_status: 'Selesai', review_rating: null },
      data: { review_rating: rating, review_comment: comment }
    });
    if (result.count !== 1) return res.status(409).json({ success: false, message: 'Ulasan untuk pesanan ini sudah dikirim.' });
    res.json({ success: true, message: 'Terima kasih, ulasan Anda berhasil dikirim.', data: { reviewRating: rating, reviewComment: comment } });
  } catch (error) {
    console.error('Order review submission failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal menyimpan ulasan.' });
  }
};

// Create new Order (Customer Checkout)
export const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, deliveryType, paymentMethod = 'QRIS', items, pharmacyId } = req.body;

    if (!customerName?.trim() || !phone || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ success: false, message: 'Data pesanan tidak lengkap.' });
    }
    if (!['Pengantaran', 'Ambil Sendiri'].includes(deliveryType)) {
      return res.status(400).json({ success: false, message: 'Metode pengambilan pesanan tidak valid.' });
    }
    if (!['QRIS', 'Tunai di Apotek'].includes(paymentMethod)
      || (paymentMethod === 'Tunai di Apotek' && deliveryType !== 'Ambil Sendiri')) {
      return res.status(400).json({ success: false, message: 'Metode pembayaran tidak sesuai dengan metode pengiriman.' });
    }

    // Validasi nomor telepon
    if (!/^\d+$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon hanya boleh berisi angka.'
      });
    }

    if (!/^08\d{8,11}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon tidak valid.'
      });
    }

    if (typeof pharmacyId !== 'string' || !pharmacyId.trim()) return res.status(400).json({ success: false, message: 'Pilih apotek tujuan pesanan.' });
    const orderId = `MDS-${randomUUID()}`;
    const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const serviceFee = 3000;
    const creation = await prisma.$transaction(async (tx) => {
      const pharmacy = await tx.pharmacy_info.findFirst({ where: { id: pharmacyId, is_active: true } });
      if (!pharmacy) return { notFound: true };
      const medicines = await tx.medicines.findMany({ where: { pharmacy_id: pharmacy.id } });
      const orderItems = items.map((item) => {
        const medicine = matchMedicineForOrderItem(item.name, medicines, item.medicineId || item.id);
        if (!medicine || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > medicine.stock) return null;
        return { medicineId: medicine.id, name: medicine.name, qty: item.qty, price: medicine.price };
      });
      if (orderItems.some((item) => !item)) return { invalidItems: true };
      const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      const totalAmount = subtotal + serviceFee;
      if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0) return { invalidTotal: true };

      await tx.orders.create({
        data: {
          id: orderId,
          customer_id: req.user.id,
          pharmacy_id: pharmacy.id,
          customer_name: customerName,
          phone,
          address: deliveryType === 'Pengantaran' ? address : '-',
          delivery_type: deliveryType,
          payment_method: paymentMethod,
          subtotal,
          service_fee: serviceFee,
          total_amount: totalAmount,
          payment_status: paymentMethod === 'QRIS' ? 'Menunggu Pembayaran' : 'Bayar di Apotek',
          order_status: paymentMethod === 'QRIS' ? 'Menunggu Pembayaran' : 'Menunggu Konfirmasi',
          timestamp,
          items: {
            create: orderItems.map(item => ({
              medicine_id: item.medicineId,
              name: item.name,
              qty: item.qty,
              price: item.price
            }))
          }
        }
      });
      return { pharmacy, orderItems, subtotal, totalAmount };
    }, { isolationLevel: 'Serializable' });

    if (creation.notFound) return res.status(404).json({ success: false, message: 'Apotek tujuan tidak ditemukan atau sedang dinonaktifkan.' });
    if (creation.invalidItems) {
      return res.status(400).json({ success: false, message: 'Obat tidak tersedia, jumlahnya melebihi stok, atau data tidak valid. Muat ulang katalog lalu coba lagi.' });
    }
    if (creation.invalidTotal) {
      return res.status(400).json({ success: false, message: 'Total pembayaran tidak valid.' });
    }
    const { pharmacy, orderItems, subtotal, totalAmount } = creation;

    const createdOrder = {
      id: orderId,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      customerName: customerName.trim(),
      phone,
      address: deliveryType === 'Pengantaran' ? address : '-',
      deliveryType,
      paymentMethod,
      items: orderItems,
      subtotal,
      serviceFee: serviceFee || 3000,
      totalAmount,
      paymentStatus: paymentMethod === 'QRIS' ? 'Menunggu Pembayaran' : 'Bayar di Apotek',
      orderStatus: paymentMethod === 'QRIS' ? 'Menunggu Pembayaran' : 'Menunggu Konfirmasi',
      timestamp
    };

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat.',
      data: createdOrder
    });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Order creation failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal membuat pesanan.' });
  }
};

export const getCustomerPaymentStatus = async (req, res) => {
  try {
    const order = await prisma.orders.findFirst({
      where: { id: req.params.id, customer_id: req.user.id },
      select: { id: true, payment_status: true, order_status: true }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    res.json({ success: true, data: {
      id: order.id,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status
    } });
  } catch (error) {
    console.error('Customer payment status query failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal memeriksa status pembayaran.' });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const order = await prisma.orders.findFirst({
      where: { id: req.params.id, customer_id: req.user.id },
      select: { id: true, payment_status: true }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    if (order.payment_status !== 'Lunas (QRIS)') {
      return res.status(409).json({ success: false, message: 'Pembayaran belum diverifikasi oleh apotek.' });
    }
    return res.json({ success: true, message: 'Pembayaran telah diverifikasi oleh apotek.' });
  } catch (error) {
    console.error('Customer payment confirmation failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal memeriksa konfirmasi pembayaran.' });
  }
};

export const verifyCustomerPayment = async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findFirst({
        where: { id: req.params.id, pharmacy_id: req.user.pharmacyId },
        include: { items: true }
      });
      if (!order) return { status: 404, message: 'Pesanan tidak ditemukan.' };
      if (order.payment_status === 'Lunas (QRIS)') {
        return { status: 200, message: 'Pembayaran pesanan ini sudah diverifikasi.' };
      }
      if (order.payment_status !== 'Menunggu Pembayaran' || order.order_status !== 'Menunggu Pembayaran') {
        return { status: 409, message: 'Pesanan ini tidak lagi menunggu verifikasi pembayaran.' };
      }

      const medicines = await tx.medicines.findMany({ where: { pharmacy_id: req.user.pharmacyId } });
      const deductions = new Map();
      for (const item of order.items) {
        const medicine = matchMedicineForOrderItem(item.name, medicines, item.medicine_id);
        if (!medicine || !Number.isInteger(item.qty) || item.qty <= 0) {
          return { status: 409, message: `Item ${item.name} tidak valid; stok tidak diubah.` };
        }
        const current = deductions.get(medicine.id) || { medicine, qty: 0 };
        current.qty += item.qty;
        deductions.set(medicine.id, current);
      }

      const transition = await tx.orders.updateMany({
        where: {
          id: order.id,
          pharmacy_id: req.user.pharmacyId,
          payment_status: 'Menunggu Pembayaran',
          order_status: 'Menunggu Pembayaran'
        },
        data: { payment_status: 'Lunas (QRIS)', order_status: 'Menunggu Konfirmasi' }
      });
      if (transition.count !== 1) {
        const latest = await tx.orders.findFirst({
          where: { id: order.id, pharmacy_id: req.user.pharmacyId },
          select: { payment_status: true }
        });
        return latest?.payment_status === 'Lunas (QRIS)'
          ? { status: 200, message: 'Pembayaran pesanan ini sudah diverifikasi.' }
          : { status: 409, message: 'Status pesanan berubah. Muat ulang daftar pesanan.' };
      }

      for (const { medicine, qty } of deductions.values()) {
        let updated = await tx.medicines.updateMany({
          where: { id: medicine.id, pharmacy_id: req.user.pharmacyId, stock: qty },
          data: { stock: { decrement: qty }, status: 'Habis' }
        });
        if (updated.count === 0) {
          updated = await tx.medicines.updateMany({
            where: { id: medicine.id, pharmacy_id: req.user.pharmacyId, stock: { gt: qty } },
            data: { stock: { decrement: qty } }
          });
        }
        if (updated.count !== 1) {
          throw Object.assign(new Error(`Stok ${medicine.name} tidak mencukupi. Verifikasi belum disimpan.`), { statusCode: 409 });
        }
      }
      return { status: 200, message: 'Pembayaran diverifikasi. Pelanggan sekarang dapat mengonfirmasi pembayaran.' };
    });

    if (result.status !== 200) return res.status(result.status).json({ success: false, message: result.message });
    return res.json({ success: true, message: result.message });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Customer payment verification failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal memverifikasi pembayaran.' });
  }
};

// Update Order Status (Pharmacy Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, estimatedArrivalMinutes } = req.body;

    const allowedStatuses = ['Diproses', 'Dalam Pengantaran', 'Siap Diambil', 'Selesai', 'Dibatalkan'];
    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Status pesanan tidak valid.' });
    }
    const isHandoff = orderStatus === 'Dalam Pengantaran';
    if (isHandoff && (!Number.isInteger(estimatedArrivalMinutes) || estimatedArrivalMinutes < 1 || estimatedArrivalMinutes > 1440)) {
      return res.status(400).json({ success: false, message: 'Masukkan estimasi tiba antara 1 sampai 1440 menit.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findFirst({
        where: { id, pharmacy_id: req.user.pharmacyId },
        include: { items: true }
      });
      if (!order) return { status: 404, message: 'Pesanan tidak ditemukan.' };
      if (order.order_status === 'Selesai' || order.order_status === 'Dibatalkan') {
        return { status: 409, message: 'Pesanan ini sudah berakhir.' };
      }
      const isCashAtPharmacy = order.payment_method === 'Tunai di Apotek';
      if (order.payment_status !== 'Lunas (QRIS)' && !isCashAtPharmacy) return { status: 409, message: 'Pembayaran harus diverifikasi sebelum pesanan diproses.' };
      const previousStatus = order.order_status;
      const validNext = orderStatus === 'Dibatalkan'
        || (previousStatus === 'Menunggu Konfirmasi' && orderStatus === 'Diproses')
        || (previousStatus === 'Diproses' && orderStatus === (order.delivery_type === 'Pengantaran' ? 'Dalam Pengantaran' : 'Siap Diambil'))
        || (order.delivery_type === 'Ambil Sendiri' && previousStatus === 'Siap Diambil' && orderStatus === 'Selesai');
      if (!validNext) return { status: 400, message: 'Perubahan status pesanan tidak sesuai urutan.' };

      let restoredQuantities = new Map();
      const cashStockReserved = isCashAtPharmacy && ['Diproses', 'Siap Diambil'].includes(previousStatus);
      if (orderStatus === 'Dibatalkan' && (order.payment_status === 'Lunas (QRIS)' || cashStockReserved)) {
        const medicines = await tx.medicines.findMany({ where: { pharmacy_id: req.user.pharmacyId } });
        for (const item of order.items) {
          const matchedMed = matchMedicineForOrderItem(item.name, medicines, item.medicine_id);
          if (!matchedMed) {
            return { status: 409, message: `Obat ${item.name} tidak dapat dicocokkan ke katalog; pembatalan belum dilakukan.` };
          }
          if (!Number.isInteger(item.qty) || item.qty <= 0) {
            return { status: 409, message: `Jumlah obat ${item.name} tidak valid; pembatalan belum dilakukan.` };
          }
          restoredQuantities.set(matchedMed.id, (restoredQuantities.get(matchedMed.id) || 0) + item.qty);
        }
      }

      // Claim the status transition before restoring inventory so concurrent
      // duplicate requests cannot return the same items to stock twice.
      const transition = await tx.orders.updateMany({
        where: { id, pharmacy_id: req.user.pharmacyId, order_status: previousStatus },
        data: {
          order_status: orderStatus,
          ...(orderStatus === 'Selesai' && isCashAtPharmacy ? { payment_status: 'Lunas (Tunai)' } : {}),
          ...(isHandoff ? { estimated_arrival: new Date(Date.now() + estimatedArrivalMinutes * 60_000) } : {})
        }
      });
      if (transition.count !== 1) return { status: 409, message: 'Status pesanan berubah. Muat ulang daftar pesanan.' };

      if (orderStatus === 'Diproses' && isCashAtPharmacy) {
        const medicines = await tx.medicines.findMany({ where: { pharmacy_id: req.user.pharmacyId } });
        const deductions = new Map();
        for (const item of order.items) {
          const medicine = matchMedicineForOrderItem(item.name, medicines, item.medicine_id);
          if (!medicine || !Number.isInteger(item.qty) || item.qty <= 0) {
            throw Object.assign(new Error(`Item ${item.name} tidak valid; stok tidak diubah.`), { statusCode: 409 });
          }
          deductions.set(medicine.id, (deductions.get(medicine.id) || 0) + item.qty);
        }
        for (const [medicineId, qty] of deductions) {
          const medicine = medicines.find((entry) => entry.id === medicineId);
          const changed = await tx.medicines.updateMany({
            where: { id: medicineId, pharmacy_id: req.user.pharmacyId, stock: { gte: qty } },
            data: { stock: { decrement: qty }, ...(medicine.stock === qty ? { status: 'Habis' } : {}) }
          });
          if (changed.count !== 1) throw Object.assign(new Error(`Stok ${medicine.name} tidak mencukupi.`), { statusCode: 409 });
        }
      }

      if (orderStatus === 'Dibatalkan' && (order.payment_status === 'Lunas (QRIS)' || cashStockReserved)) {
        const medicines = await tx.medicines.findMany({ where: { pharmacy_id: req.user.pharmacyId } });
        for (const [medicineId, quantity] of restoredQuantities) {
          const medicine = medicines.find((entry) => entry.id === medicineId);
          const stock = medicine.stock + quantity;
          const restored = await tx.medicines.updateMany({
            where: { id: medicineId, pharmacy_id: req.user.pharmacyId },
            data: { stock, status: stock > 0 ? 'Tersedia' : medicine.status }
          });
          if (restored.count !== 1) {
            throw Object.assign(new Error(`Stok ${medicine.name} tidak dapat dipulihkan.`), { statusCode: 409 });
          }
        }
      }
      return { status: 200 };
    });

    if (result.status !== 200) return res.status(result.status).json({ success: false, message: result.message });

    res.json({ success: true, message: orderStatus === 'Dibatalkan'
      ? `Pesanan ${id} berhasil dibatalkan dan stok obat dikembalikan.`
      : `Status pesanan ${id} berhasil diperbarui menjadi '${orderStatus}'.` });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Order status update failed.', error?.code || 'UNKNOWN');
    res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan.' });
  }
};
