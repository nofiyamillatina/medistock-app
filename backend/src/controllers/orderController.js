import prisma from '../config/database.js';

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
      items: order.items.map((item) => ({ name: item.name, qty: item.qty, price: item.price }))
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
          create: items.map(item => ({
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
      items,
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
      const matchedMed = medicines.find(m => item.name.toLowerCase().startsWith(m.name.split(' ')[0].toLowerCase()));
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

    const order = await prisma.orders.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    if (order.order_status === 'Selesai' || order.order_status === 'Dibatalkan') {
      return res.status(409).json({ success: false, message: 'Pesanan ini sudah berakhir.' });
    }
    const validNext = orderStatus === 'Dibatalkan'
      || (order.order_status === 'Menunggu Konfirmasi' && orderStatus === 'Diproses')
      || (order.order_status === 'Diproses' && orderStatus === (order.delivery_type === 'Pengantaran' ? 'Dalam Pengantaran' : 'Siap Diambil'))
      || (order.delivery_type === 'Ambil Sendiri' && order.order_status === 'Siap Diambil' && orderStatus === 'Selesai');
    if (!validNext) return res.status(400).json({ success: false, message: 'Perubahan status pesanan tidak sesuai urutan.' });

    await prisma.orders.update({
      where: { id },
      data: { order_status: orderStatus }
    });

    res.json({ success: true, message: `Status pesanan ${id} berhasil diperbarui menjadi '${orderStatus}'.` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan.' });
  }
};
