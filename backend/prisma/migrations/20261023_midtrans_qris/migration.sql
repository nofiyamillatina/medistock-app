ALTER TABLE "orders"
ADD COLUMN "midtrans_transaction_id" TEXT,
ADD COLUMN "payment_qr_url" TEXT,
ADD COLUMN "payment_expires_at" TIMESTAMP(3);
