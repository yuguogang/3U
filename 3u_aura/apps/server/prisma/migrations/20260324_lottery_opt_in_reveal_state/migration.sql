-- AlterTable
ALTER TABLE "LotteryTicket"
ADD COLUMN "isParticipating" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "participatedAt" TIMESTAMP(3),
ADD COLUMN "isResultRevealed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "revealedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "LotteryTicket_epochId_isParticipating_idx" ON "LotteryTicket"("epochId", "isParticipating");
