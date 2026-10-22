ALTER TABLE "orders"
ADD COLUMN "payment_proof" TEXT,
ADD COLUMN "estimated_arrival" TIMESTAMP(3),
ADD COLUMN "review_rating" INTEGER,
ADD COLUMN "review_comment" TEXT;

ALTER TABLE "orders"
ALTER COLUMN "payment_status" SET DEFAULT 'Menunggu Pembayaran',
ALTER COLUMN "order_status" SET DEFAULT 'Menunggu Pembayaran';
