-- Add court type enum and column for indoor/outdoor classification
DO $$
BEGIN
  CREATE TYPE "public"."CourtType" AS ENUM ('OUTDOOR', 'INDOOR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "public"."Court"
ADD COLUMN IF NOT EXISTS "courtType" "public"."CourtType";

UPDATE "public"."Court"
SET "courtType" = 'OUTDOOR'
WHERE "courtType" IS NULL;

ALTER TABLE "public"."Court"
ALTER COLUMN "courtType" SET DEFAULT 'OUTDOOR',
ALTER COLUMN "courtType" SET NOT NULL;
