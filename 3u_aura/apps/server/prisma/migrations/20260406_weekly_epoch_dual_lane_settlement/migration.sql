ALTER TABLE "WeeklyEpoch"
ADD COLUMN "lotteryStatus" "EpochStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "rankingStatus" "EpochStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "lotteryRolloverUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
ADD COLUMN "rankingRolloverUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0;

UPDATE "WeeklyEpoch"
SET
  "lotteryStatus" = "status",
  "rankingStatus" = "status";
