-- Add optional public profile fields without changing existing pharmacy records.
ALTER TABLE "pharmacy_info"
ADD COLUMN "address" TEXT,
ADD COLUMN "maps_url" TEXT,
ADD COLUMN "image_url" TEXT;
