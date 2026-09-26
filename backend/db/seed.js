import { run, query, getOne } from '../src/config/database.js';
import { initTables } from './init.js';

const INITIAL_MEDICINES = [
  { id: 'MED-1', name: 'Paracetamol 500mg', desc: 'Pereda demam & nyeri ringan hingga sedang', price: 12500, stock: 45, status: 'Tersedia' },
  { id: 'MED-2', name: 'Amoxicillin 500mg', desc: 'Antibiotik penanganan infeksi bakteri', price: 28000, stock: 20, status: 'Tersedia' },
  { id: 'MED-3', name: 'Vitamin C 1000mg', desc: 'Suplemen daya tahan tubuh tablet kunyah', price: 35000, stock: 15, status: 'Tersedia' },
  { id: 'MED-4', name: 'Antasida Doen Tablet', desc: 'Obat maag & asam lambung berlebih', price: 8500, stock: 30, status: 'Tersedia' },
  { id: 'MED-5', name: 'Mefenamic Acid 500mg', desc: 'Pereda nyeri sakit gigi & nyeri haid', price: 18000, stock: 0, status: 'Habis' }
];

const INITIAL_ORDERS = [
  {
    id: 'MDS-9824',
    customerName: 'Budi Santoso',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 12, Kel. Menteng',
    deliveryType: 'Pengantaran',
    items: [
      { name: 'Paracetamol 500mg', qty: 2, price: 12500 },
      { name: 'Vitamin C 1000mg', qty: 1, price: 35000 }
    ],
    subtotal: 60000,
    serviceFee: 3000,
    totalAmount: 63000,
    paymentStatus: 'Lunas (QRIS)',
    orderStatus: 'Menunggu Konfirmasi',
    timestamp: '2026-09-20 20:45'
  },
  {
    id: 'MDS-9823',
    customerName: 'Siti Rahma',
    phone: '085711223344',
    address: '-',
    deliveryType: 'Ambil Sendiri',
    items: [
      { name: 'Amoxicillin 500mg', qty: 1, price: 28000 }
    ],
    subtotal: 28000,
    serviceFee: 3000,
    totalAmount: 31000,
    paymentStatus: 'Lunas (QRIS)',
    orderStatus: 'Selesai',
    timestamp: '2026-09-20 19:15'
  },
  {
    id: 'MDS-9822',
    customerName: 'Deni Kurniawan',
    phone: '081988776655',
    address: 'Jl. Sudirman No. 45',
    deliveryType: 'Pengantaran',
    items: [
      { name: 'Paracetamol 500mg', qty: 1, price: 12500 },
      { name: 'Antasida Doen Tablet', qty: 2, price: 8500 }
    ],
    subtotal: 29500,
    serviceFee: 3000,
    totalAmount: 32500,
    paymentStatus: 'Lunas (QRIS)',
    orderStatus: 'Selesai',
    timestamp: '2026-09-20 18:30'
  }
];

export async function seedDatabase() {
  await initTables();

  // Check Pharmacy Info
  const pharmacy = await getOne(`SELECT * FROM pharmacy_info WHERE id = 'APOTEK-1'`);
  if (!pharmacy) {
    await run(
      `INSERT INTO pharmacy_info (id, name, is_open) VALUES (?, ?, ?)`,
      ['APOTEK-1', 'Apotek Sehat', 1]
    );
    console.log('🌱 Seeded Pharmacy Info');
  }

  // Seed Medicines
  const existingMeds = await query(`SELECT COUNT(*) as count FROM medicines`);
  if (existingMeds[0].count === 0) {
    for (const med of INITIAL_MEDICINES) {
      await run(
        `INSERT INTO medicines (id, name, desc, price, stock, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [med.id, med.name, med.desc, med.price, med.stock, med.status]
      );
    }
    console.log('🌱 Seeded Initial Medicines catalog');
  }

  // Seed Orders
  const existingOrders = await query(`SELECT COUNT(*) as count FROM orders`);
  if (existingOrders[0].count === 0) {
    for (const order of INITIAL_ORDERS) {
      await run(
        `INSERT INTO orders (id, customer_name, phone, address, delivery_type, subtotal, service_fee, total_amount, payment_status, order_status, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.customerName,
          order.phone,
          order.address,
          order.deliveryType,
          order.subtotal,
          order.serviceFee,
          order.totalAmount,
          order.paymentStatus,
          order.orderStatus,
          order.timestamp
        ]
      );

      for (const item of order.items) {
        await run(
          `INSERT INTO order_items (order_id, name, qty, price) VALUES (?, ?, ?, ?)`,
          [order.id, item.name, item.qty, item.price]
        );
      }
    }
    console.log('🌱 Seeded Initial Orders & Order Items');
  }
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    console.log('✅ Database seeding complete.');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  });
}
