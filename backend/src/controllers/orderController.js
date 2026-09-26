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

// Create new Order (Customer Checkout)
export const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, deliveryType, items, subtotal, serviceFee, totalAmount } = req.body;

    if (!customerName || !phone || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Data pesanan tidak lengkap.' });
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

    // Deduct stock for matching medicines
    const medicines = await prisma.medicines.findMany();
    for (const item of order.items) {
      const matchedMed = medicines.find(m => item.name.toLowerCase().startsWith(m.name.split(' ')[0].toLowerCase()));
      if (matchedMed) {
        const newStock = Math.max(0, matchedMed.stock - item.qty);
        const newStatus = newStock === 0 ? 'Habis' : matchedMed.status;
        await prisma.medicines.update({
          where: { id: matchedMed.id },
          data: { stock: newStock, status: newStatus }
        });
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

    if (!orderStatus) {
      return res.status(400).json({ success: false, message: 'Status baru wajib diisi.' });
    }

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
