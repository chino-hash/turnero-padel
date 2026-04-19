-- Create enums for notification logs
DO $$
BEGIN
  CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Deduplicate CourtBlock windows before enforcing uniqueness
DELETE FROM "public"."CourtBlock" a
USING "public"."CourtBlock" b
WHERE a.id > b.id
  AND a."tenantId" = b."tenantId"
  AND a."courtId" = b."courtId"
  AND a."tournamentId" = b."tournamentId"
  AND a."date" = b."date"
  AND a."startTime" = b."startTime"
  AND a."endTime" = b."endTime";

DO $$
BEGIN
  ALTER TABLE "public"."CourtBlock"
  ADD CONSTRAINT "CourtBlock_unique_window"
  UNIQUE ("tenantId", "courtId", "tournamentId", "date", "startTime", "endTime");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "public"."NotificationStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create table for idempotent notification tracking and retries
CREATE TABLE IF NOT EXISTS "public"."NotificationLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "bookingId" TEXT,
  "recurringId" TEXT,
  "tournamentId" TEXT,
  "date" TIMESTAMP(3),
  "type" TEXT NOT NULL,
  "channel" "public"."NotificationChannel" NOT NULL DEFAULT 'EMAIL',
  "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "recipientEmail" TEXT,
  "subject" TEXT,
  "payload" TEXT,
  "error" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "notificationKey" TEXT NOT NULL,

  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationLog_notificationKey_key" ON "public"."NotificationLog"("notificationKey");
CREATE INDEX IF NOT EXISTS "NotificationLog_tenantId_idx" ON "public"."NotificationLog"("tenantId");
CREATE INDEX IF NOT EXISTS "NotificationLog_status_createdAt_idx" ON "public"."NotificationLog"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationLog_tournamentId_idx" ON "public"."NotificationLog"("tournamentId");
CREATE INDEX IF NOT EXISTS "NotificationLog_bookingId_idx" ON "public"."NotificationLog"("bookingId");
CREATE INDEX IF NOT EXISTS "NotificationLog_recurringId_date_idx" ON "public"."NotificationLog"("recurringId", "date");

-- Deduplicate historical recurring exceptions before adding uniqueness
DELETE FROM "public"."RecurringBookingException" a
USING "public"."RecurringBookingException" b
WHERE a.id > b.id
  AND a."recurringId" = b."recurringId"
  AND a."date" = b."date";

DO $$
BEGIN
  ALTER TABLE "public"."RecurringBookingException"
  ADD CONSTRAINT "RecurringBookingException_recurringId_date_key"
  UNIQUE ("recurringId", "date");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
