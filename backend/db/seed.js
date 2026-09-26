import prisma from '../src/config/database.js';

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
  // Check Pharmacy Info
  const pharmacy = await prisma.pharmacy_info.findUnique({ where: { id: 'APOTEK-1' } });
  if (!pharmacy) {
    await prisma.pharmacy_info.create({
      data: {
        id: 'APOTEK-1',
        name: 'Apotek Sehat',
        is_open: 1
      }
    });
    console.log('🌱 Seeded Pharmacy Info');
  }

  // Seed Medicines
  const existingMedsCount = await prisma.medicines.count();
  if (existingMedsCount === 0) {
    await prisma.medicines.createMany({
      data: INITIAL_MEDICINES.map(m => ({
        id: m.id,
        name: m.name,
        desc: m.desc,
        price: m.price,
        stock: m.stock,
        status: m.status
      }))
    });
    console.log('🌱 Seeded Initial Medicines catalog');
  }

  // Seed Orders
  const existingOrdersCount = await prisma.orders.count();
  if (existingOrdersCount === 0) {
    for (const order of INITIAL_ORDERS) {
      await prisma.orders.create({
        data: {
          id: order.id,
          customer_name: order.customerName,
          phone: order.phone,
          address: order.address,
          delivery_type: order.deliveryType,
          subtotal: order.subtotal,
          service_fee: order.serviceFee,
          total_amount: order.totalAmount,
          payment_status: order.paymentStatus,
          order_status: order.orderStatus,
          timestamp: order.timestamp,
          items: {
            create: order.items.map(i => ({
              name: i.name,
              qty: i.qty,
              price: i.price
            }))
          }
        }
      });
    }
    console.log('🌱 Seeded Initial Orders & Order Items');
  }
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(async () => {
    console.log('✅ Database seeding complete.');
    await prisma.$disconnect();
    process.exit(0);
  }).catch(async (err) => {
    console.error('❌ Seeding error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
}

