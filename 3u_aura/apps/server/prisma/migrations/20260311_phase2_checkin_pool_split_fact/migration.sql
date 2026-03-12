-- CreateTable
CREATE TABLE "PoolSplitFact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkinId" TEXT NOT NULL,
    "paymentReceiptId" TEXT NOT NULL,
    "dateKey" VARCHAR(16) NOT NULL,
    "totalAmountUsdt" DECIMAL(78,0) NOT NULL,
    "lotteryAmountUsdt" DECIMAL(78,0) NOT NULL,
    "treasuryAmountUsdt" DECIMAL(78,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolSplitFact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PoolSplitFact_checkinId_key" ON "PoolSplitFact"("checkinId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolSplitFact_paymentReceiptId_key" ON "PoolSplitFact"("paymentReceiptId");

-- CreateIndex
CREATE INDEX "PoolSplitFact_userId_dateKey_idx" ON "PoolSplitFact"("userId", "dateKey");

-- CreateIndex
CREATE INDEX "PoolSplitFact_dateKey_idx" ON "PoolSplitFact"("dateKey");

-- AddForeignKey
ALTER TABLE "PoolSplitFact" ADD CONSTRAINT "PoolSplitFact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolSplitFact" ADD CONSTRAINT "PoolSplitFact_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "Checkin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolSplitFact" ADD CONSTRAINT "PoolSplitFact_paymentReceiptId_fkey" FOREIGN KEY ("paymentReceiptId") REFERENCES "PaymentReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
