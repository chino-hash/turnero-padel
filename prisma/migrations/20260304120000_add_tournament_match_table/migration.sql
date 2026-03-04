-- CreateEnum
CREATE TYPE "public"."MatchRound" AS ENUM ('ROUND_1', 'ROUND_2', 'QUARTERFINAL', 'SEMIFINAL', 'FINAL');
CREATE TYPE "public"."MatchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable TournamentMatch
CREATE TABLE "public"."TournamentMatch" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "round" "public"."MatchRound" NOT NULL,
    "positionInRound" INTEGER NOT NULL,
    "groupId" TEXT,
    "bracketType" "public"."MatchBracketType",
    "registration1Id" TEXT,
    "registration2Id" TEXT,
    "winnerRegistrationId" TEXT,
    "score" TEXT,
    "courtId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "public"."MatchStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_registration1Id_fkey" FOREIGN KEY ("registration1Id") REFERENCES "public"."TournamentRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_registration2Id_fkey" FOREIGN KEY ("registration2Id") REFERENCES "public"."TournamentRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_winnerRegistrationId_fkey" FOREIGN KEY ("winnerRegistrationId") REFERENCES "public"."TournamentRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "TournamentMatch_tournamentId_idx" ON "public"."TournamentMatch"("tournamentId");
CREATE INDEX "TournamentMatch_tournamentId_round_idx" ON "public"."TournamentMatch"("tournamentId", "round");
CREATE INDEX "TournamentMatch_tournamentId_groupId_idx" ON "public"."TournamentMatch"("tournamentId", "groupId");
CREATE INDEX "TournamentMatch_registration1Id_idx" ON "public"."TournamentMatch"("registration1Id");
CREATE INDEX "TournamentMatch_registration2Id_idx" ON "public"."TournamentMatch"("registration2Id");
