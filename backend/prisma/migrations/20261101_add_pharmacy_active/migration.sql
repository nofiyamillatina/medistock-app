-- Add an independent platform activation flag. Existing pharmacies remain active.
ALTER TABLE "pharmacy_info"
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT TRUE;
