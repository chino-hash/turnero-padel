-- Create enums for recurring bookings
CREATE TYPE "public"."RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE "public"."ExceptionType" AS ENUM ('SKIP', 'OVERRIDE');

-- Create RecurringBooking table
CREATE TABLE "public"."RecurringBooking" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "courtId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "status" "public"."RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "RecurringBooking_pkey" PRIMARY KEY ("id")
);

-- FKs
ALTER TABLE "public"."RecurringBooking"
  ADD CONSTRAINT "RecurringBooking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON UPDATE CASCADE ON DELETE NO ACTION;
ALTER TABLE "public"."RecurringBooking"
  ADD CONSTRAINT "RecurringBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;

-- Indexes
CREATE INDEX "RecurringBooking_court_weekday_start_status_idx" ON "public"."RecurringBooking"("courtId", "weekday", "startTime", "status");

-- Create RecurringBookingException table
CREATE TABLE "public"."RecurringBookingException" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recurringId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "type" "public"."ExceptionType" NOT NULL,
  "reason" TEXT,
  "newPrice" DOUBLE PRECISION,
  CONSTRAINT "RecurringBookingException_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."RecurringBookingException"
  ADD CONSTRAINT "RecurringBookingException_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "public"."RecurringBooking"("id") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX "RecurringBookingException_recurringId_date_idx" ON "public"."RecurringBookingException"("recurringId", "date");

-- Alter Booking to add recurringId and FK
ALTER TABLE "public"."Booking" ADD COLUMN "recurringId" TEXT;
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "public"."RecurringBooking"("id") ON UPDATE CASCADE ON DELETE NO ACTION;
CREATE INDEX "Booking_recurringId_idx" ON "public"."Booking"("recurringId");