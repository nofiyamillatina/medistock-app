-- Multi-pharmacy ownership is nullable so existing production records remain
-- intact and unassigned until their actual owner has been confirmed.
ALTER TABLE "medicines" ADD COLUMN "pharmacy_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "pharmacy_id" TEXT;

CREATE INDEX "medicines_pharmacy_id_idx" ON "medicines"("pharmacy_id");
CREATE INDEX "orders_pharmacy_id_created_at_idx" ON "orders"("pharmacy_id", "created_at");

ALTER TABLE "medicines" ADD CONSTRAINT "medicines_pharmacy_id_fkey"
  FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacy_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_pharmacy_id_fkey"
  FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacy_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;
