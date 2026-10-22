ALTER TABLE "orders"
ADD COLUMN "customer_id" TEXT,
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "orders_customer_id_created_at_idx"
ON "orders"("customer_id", "created_at");
