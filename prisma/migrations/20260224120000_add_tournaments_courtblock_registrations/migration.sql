-- CreateEnum
CREATE TYPE "public"."TournamentStatus" AS ENUM ('DRAFT', 'OPEN_REGISTRATION', 'CLOSED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
CREATE TYPE "public"."RegistrationType" AS ENUM ('SINGLE', 'PAIR');
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable Tournament
CREATE TABLE "public"."Tournament" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "prizeFirst" INTEGER NOT NULL,
    "prizeSecond" INTEGER NOT NULL,
    "minPairs" INTEGER NOT NULL,
    "maxPairs" INTEGER NOT NULL,
    "status" "public"."TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable TournamentSchedule
CREATE TABLE "public"."TournamentSchedule" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "TournamentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable CourtBlock
CREATE TABLE "public"."CourtBlock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourtBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable TournamentRegistration
CREATE TABLE "public"."TournamentRegistration" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "type" "public"."RegistrationType" NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerEmail" TEXT,
    "playerPhone" TEXT,
    "partnerName" TEXT,
    "partnerEmail" TEXT,
    "partnerPhone" TEXT,
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentRegistration_pkey" PRIMARY KEY ("id")
);

-- Tournament FKs and indexes
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Tournament_tenantId_idx" ON "public"."Tournament"("tenantId");
CREATE INDEX "Tournament_tenantId_status_idx" ON "public"."Tournament"("tenantId", "status");
CREATE INDEX "Tournament_status_idx" ON "public"."Tournament"("status");

-- TournamentSchedule FKs and indexes
ALTER TABLE "public"."TournamentSchedule" ADD CONSTRAINT "TournamentSchedule_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "TournamentSchedule_tournamentId_idx" ON "public"."TournamentSchedule"("tournamentId");
CREATE INDEX "TournamentSchedule_tournamentId_date_idx" ON "public"."TournamentSchedule"("tournamentId", "date");

-- CourtBlock FKs and indexes
ALTER TABLE "public"."CourtBlock" ADD CONSTRAINT "CourtBlock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CourtBlock" ADD CONSTRAINT "CourtBlock_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CourtBlock" ADD CONSTRAINT "CourtBlock_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "CourtBlock_courtId_idx" ON "public"."CourtBlock"("courtId");
CREATE INDEX "CourtBlock_courtId_date_idx" ON "public"."CourtBlock"("courtId", "date");
CREATE INDEX "CourtBlock_tournamentId_idx" ON "public"."CourtBlock"("tournamentId");
CREATE INDEX "CourtBlock_tenantId_idx" ON "public"."CourtBlock"("tenantId");

-- TournamentRegistration FKs and indexes
ALTER TABLE "public"."TournamentRegistration" ADD CONSTRAINT "TournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "TournamentRegistration_tournamentId_idx" ON "public"."TournamentRegistration"("tournamentId");
CREATE INDEX "TournamentRegistration_tournamentId_status_idx" ON "public"."TournamentRegistration"("tournamentId", "status");
