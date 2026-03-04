-- CreateEnum (MatchBracketType se usa cuando exista la tabla TournamentMatch)
CREATE TYPE "public"."TournamentFormat" AS ENUM ('DIRECT_ELIMINATION', 'GROUPS_DOUBLE_ELIMINATION');
CREATE TYPE "public"."MatchBracketType" AS ENUM ('GROUP', 'ORO', 'PLATA');

-- AlterTable Tournament: format, prize type, descriptions, groups, league prizes
ALTER TABLE "public"."Tournament" ADD COLUMN "tournamentFormat" "public"."TournamentFormat" NOT NULL DEFAULT 'DIRECT_ELIMINATION';
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeIsMonetary" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeFirstDescription" TEXT;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeSecondDescription" TEXT;
ALTER TABLE "public"."Tournament" ADD COLUMN "numberOfGroups" INTEGER;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeGoldFirst" INTEGER;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeGoldSecond" INTEGER;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeSilverFirst" INTEGER;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeSilverSecond" INTEGER;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeGoldFirstDescription" TEXT;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeGoldSecondDescription" TEXT;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeSilverFirstDescription" TEXT;
ALTER TABLE "public"."Tournament" ADD COLUMN "prizeSilverSecondDescription" TEXT;
