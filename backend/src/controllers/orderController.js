import prisma from '../config/database.js';

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
      include: {
        items: true
      },
      orderBy: { id: 'desc' }
    });

    // Attach items to each order and format to match frontend expectation
    const orders = rawOrders.map(order => ({
      ...order,
      customerName: order.customer_name,
      deliveryType: order.delivery_type,
      serviceFee: order.service_fee,
      totalAmount: order.total_amount,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      items: order.items.map(item => ({
        medicineId: item.medicine_id,
        name: item.name,
        qty: item.qty,
        price: item.price
      }))
    }));

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pesanan.' });
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
      orderStatus: order.order_status,
      timestamp: order.timestamp,
      totalAmount: order.total_amount,
      items: order.items.map((item) => ({ medicineId: item.medicine_id, name: item.name, qty: item.qty, price: item.price }))
    } });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat status pesanan.' });
  }
};

// Customer confirms receipt of a delivery order using the order's phone number.
export const completeDeliveryOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const phone = String(req.body.phone || '').trim();
    if (!phone) return res.status(400).json({ success: false, message: 'Nomor telepon wajib diisi.' });

    const order = await prisma.orders.findFirst({ where: { id, phone } });
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    if (order.delivery_type !== 'Pengantaran') return res.status(400).json({ success: false, message: 'Konfirmasi selesai untuk pesanan ini dilakukan oleh apotek.' });
    if (order.order_status !== 'Dalam Pengantaran') return res.status(409).json({ success: false, message: 'Pesanan hanya dapat ditandai selesai saat dalam pengantaran.' });

    const updatedOrder = await prisma.orders.update({ where: { id }, data: { order_status: 'Selesai' } });
    res.json({ success: true, message: 'Pesanan berhasil ditandai selesai.', data: { id: updatedOrder.id, orderStatus: updatedOrder.order_status } });
  } catch (error) {
    console.error('Error completing delivery order:', error);
    res.status(500).json({ success: false, message: 'Gagal menyelesaikan pesanan.' });
  }
};

// Create new Order (Customer Checkout)
export const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, deliveryType, items, subtotal, serviceFee, totalAmount } = req.body;

    if (!customerName || !phone || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Data pesanan tidak lengkap.' });
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

    const orderId = `MDS-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const medicines = await prisma.medicines.findMany();
    const orderItems = items.map((item) => {
      const medicine = matchMedicineForOrderItem(item.name, medicines, item.medicineId || item.id);
      return medicine ? { ...item, medicineId: medicine.id, name: medicine.name } : null;
    });
    if (orderItems.some((item) => !item)) {
      return res.status(400).json({ success: false, message: 'Salah satu obat tidak ditemukan di katalog. Muat ulang katalog lalu coba lagi.' });
    }

    await prisma.orders.create({
      data: {
        id: orderId,
        customer_name: customerName,
        phone,
        address: deliveryType === 'Pengantaran' ? address : '-',
        delivery_type: deliveryType,
        subtotal,
        service_fee: serviceFee || 3000,
        total_amount: totalAmount,
        payment_status: 'Lunas (QRIS)',
        order_status: 'Menunggu Konfirmasi',
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

    const createdOrder = {
      id: orderId,
      customerName,
      phone,
      address: deliveryType === 'Pengantaran' ? address : '-',
      deliveryType,
      items: orderItems,
      subtotal,
      serviceFee: serviceFee || 3000,
      totalAmount,
      paymentStatus: 'Lunas (QRIS)',
      orderStatus: 'Menunggu Konfirmasi',
      timestamp
    };

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat.',
      data: createdOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat pesanan.' });
  }
};

// Confirm Payment & Automatically Deduct Stock (Customer QRIS Screen)
export const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.orders.findUnique({ where: { id }, include: { items: true } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    // Validate the full order before deducting any stock.
    const medicines = await prisma.medicines.findMany();
    const deductions = [];
    for (const item of order.items) {
      const matchedMed = matchMedicineForOrderItem(item.name, medicines, item.medicine_id);
      if (!matchedMed) {
        return res.status(409).json({ success: false, message: `Obat ${item.name} tidak lagi tersedia di katalog; stok tidak diubah.` });
      }
      if (matchedMed) {
        const pendingQty = deductions
          .filter(deduction => deduction.medicineId === matchedMed.id)
          .reduce((sum, deduction) => sum + deduction.qty, 0);
        if (!Number.isInteger(item.qty) || item.qty <= 0 || matchedMed.stock - pendingQty < item.qty) {
          return res.status(409).json({
            success: false,
            message: `Stok ${matchedMed.name} tidak mencukupi. Stok tersedia hanya ${Math.max(0, matchedMed.stock - pendingQty)}.`
          });
        }
        deductions.push({ medicineId: matchedMed.id, qty: item.qty });
      }
    }

    for (const deduction of deductions) {
      const matchedMed = medicines.find(m => m.id === deduction.medicineId);
      if (matchedMed) {
        const totalQty = deductions
          .filter(item => item.medicineId === matchedMed.id)
          .reduce((sum, item) => sum + item.qty, 0);
        const newStock = matchedMed.stock - totalQty;
        const newStatus = newStock === 0 ? 'Habis' : matchedMed.status;
        await prisma.medicines.update({
          where: { id: matchedMed.id },
          data: { stock: newStock, status: newStatus }
        });
        matchedMed.stock = newStock;
      }
    }

    res.json({ success: true, message: 'Pembayaran berhasil dikonfirmasi & stok telah diperbarui.' });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses konfirmasi pembayaran.' });
  }
};

// Update Order Status (Pharmacy Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = ['Diproses', 'Dalam Pengantaran', 'Siap Diambil', 'Selesai', 'Dibatalkan'];
    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Status pesanan tidak valid.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({ where: { id }, include: { items: true } });
      if (!order) return { status: 404, message: 'Pesanan tidak ditemukan.' };
      if (order.order_status === 'Selesai' || order.order_status === 'Dibatalkan') {
        return { status: 409, message: 'Pesanan ini sudah berakhir.' };
      }
      const previousStatus = order.order_status;
      const validNext = orderStatus === 'Dibatalkan'
        || (previousStatus === 'Menunggu Konfirmasi' && orderStatus === 'Diproses')
        || (previousStatus === 'Diproses' && orderStatus === (order.delivery_type === 'Pengantaran' ? 'Dalam Pengantaran' : 'Siap Diambil'))
        || (order.delivery_type === 'Ambil Sendiri' && previousStatus === 'Siap Diambil' && orderStatus === 'Selesai');
      if (!validNext) return { status: 400, message: 'Perubahan status pesanan tidak sesuai urutan.' };

      let restoredQuantities = new Map();
      if (orderStatus === 'Dibatalkan') {
        const medicines = await tx.medicines.findMany();
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
        where: { id, order_status: previousStatus },
        data: { order_status: orderStatus }
      });
      if (transition.count !== 1) return { status: 409, message: 'Status pesanan berubah. Muat ulang daftar pesanan.' };

      if (orderStatus === 'Dibatalkan') {
        const medicines = await tx.medicines.findMany();
        for (const [medicineId, quantity] of restoredQuantities) {
          const medicine = medicines.find((entry) => entry.id === medicineId);
          const stock = medicine.stock + quantity;
          await tx.medicines.update({
            where: { id: medicineId },
            data: { stock, status: stock > 0 ? 'Tersedia' : medicine.status }
          });
        }
      }
      return { status: 200 };
    });

    if (result.status !== 200) return res.status(result.status).json({ success: false, message: result.message });

    res.json({ success: true, message: orderStatus === 'Dibatalkan'
      ? `Pesanan ${id} berhasil dibatalkan dan stok obat dikembalikan.`
      : `Status pesanan ${id} berhasil diperbarui menjadi '${orderStatus}'.` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan.' });
  }
};
