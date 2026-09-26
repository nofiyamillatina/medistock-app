import { run } from '../src/config/database.js';

export async function initTables() {
  console.log('🔄 Initializing database tables...');

  // 1. Pharmacy Info Table
  await run(`
    CREATE TABLE IF NOT EXISTS pharmacy_info (
      id TEXT PRIMARY KEY DEFAULT 'APOTEK-1',
      name TEXT NOT NULL,
      is_open INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Medicines Table
  await run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT,
      price INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Tersedia',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Orders Table
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT DEFAULT '-',
      delivery_type TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      service_fee INTEGER NOT NULL DEFAULT 3000,
      total_amount INTEGER NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'Lunas (QRIS)',
      order_status TEXT NOT NULL DEFAULT 'Menunggu Konfirmasi',
      timestamp TEXT NOT NULL
    )
  `);

  // 4. Order Items Table
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database tables initialized successfully.');
}
