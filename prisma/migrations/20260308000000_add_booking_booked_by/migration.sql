-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bookedById" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_bookedById_idx" ON "Booking"("bookedById");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Booking_bookedById_fkey'
  ) THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
