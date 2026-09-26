-- CreateTable
CREATE TABLE "pharmacy_info" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_open" INTEGER NOT NULL DEFAULT 1,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Tersedia',
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT DEFAULT '-',
    "delivery_type" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "service_fee" INTEGER NOT NULL DEFAULT 3000,
    "total_amount" INTEGER NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'Lunas (QRIS)',
    "order_status" TEXT NOT NULL DEFAULT 'Menunggu Konfirmasi',
    "timestamp" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

