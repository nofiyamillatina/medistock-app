import { query, run, getOne } from '../config/database.js';

// Get all orders (Pharmacy Dashboard & Reports)
export const getOrders = async (req, res) => {
  try {
    const orders = await query(`SELECT * FROM orders ORDER BY rowid DESC`);

    // Attach items to each order
    for (const order of orders) {
      const items = await query(`SELECT name, qty, price FROM order_items WHERE order_id = ?`, [order.id]);
      order.items = items;
      order.customerName = order.customer_name;
      order.deliveryType = order.delivery_type;
      order.serviceFee = order.service_fee;
      order.totalAmount = order.total_amount;
      order.paymentStatus = order.payment_status;
      order.orderStatus = order.order_status;
    }

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

    await run(
      `INSERT INTO orders (id, customer_name, phone, address, delivery_type, subtotal, service_fee, total_amount, payment_status, order_status, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        customerName,
        phone,
        deliveryType === 'Pengantaran' ? address : '-',
        deliveryType,
        subtotal,
        serviceFee || 3000,
        totalAmount,
        'Lunas (QRIS)',
        'Menunggu Konfirmasi',
        timestamp
      ]
    );

    for (const item of items) {
      await run(
        `INSERT INTO order_items (order_id, name, qty, price) VALUES (?, ?, ?, ?)`,
        [orderId, item.name, item.qty, item.price]
      );
    }

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
    const order = await getOne(`SELECT * FROM orders WHERE id = ?`, [id]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const items = await query(`SELECT name, qty FROM order_items WHERE order_id = ?`, [id]);

    // Deduct stock for matching medicines
    const medicines = await query(`SELECT * FROM medicines`);
    for (const item of items) {
      const matchedMed = medicines.find(m => item.name.toLowerCase().startsWith(m.name.split(' ')[0].toLowerCase()));
      if (matchedMed) {
        const newStock = Math.max(0, matchedMed.stock - item.qty);
        const newStatus = newStock === 0 ? 'Habis' : matchedMed.status;
        await run(`UPDATE medicines SET stock = ?, status = ? WHERE id = ?`, [newStock, newStatus, matchedMed.id]);
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

    await run(`UPDATE orders SET order_status = ? WHERE id = ?`, [orderStatus, id]);

    res.json({ success: true, message: `Status pesanan ${id} berhasil diperbarui menjadi '${orderStatus}'.` });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan.' });
  }
};
