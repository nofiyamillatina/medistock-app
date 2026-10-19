ALTER TABLE "order_items" ADD COLUMN "medicine_id" TEXT;

UPDATE "order_items" AS item
SET "medicine_id" = medicine."id"
FROM "medicines" AS medicine
WHERE item."medicine_id" IS NULL
  AND lower(trim(item."name")) = lower(trim(medicine."name"))
  AND (
    SELECT count(*)
    FROM "medicines" AS exact_medicine
    WHERE lower(trim(exact_medicine."name")) = lower(trim(item."name"))
  ) = 1;
