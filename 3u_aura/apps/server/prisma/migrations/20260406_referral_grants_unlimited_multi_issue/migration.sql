-- CreateEnum
CREATE TYPE "NftReferralGrantSource" AS ENUM ('QUALIFIED_APPROVAL', 'MANUAL_GIFT');

-- CreateEnum
CREATE TYPE "NftReferralGrantStatus" AS ENUM ('APPROVED', 'SIGNED', 'MINTED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "NftReferralGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eligibilityId" TEXT,
    "source" "NftReferralGrantSource" NOT NULL,
    "status" "NftReferralGrantStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByWallet" VARCHAR(64),
    "decisionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedByWallet" VARCHAR(64),
    "signedNonce" INTEGER,
    "signedPayloadHash" VARCHAR(128),
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "mintedTokenId" BIGINT,
    "mintedTxHash" VARCHAR(128),
    "mintedTxHashKey" VARCHAR(160),
    "mintedAt" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NftReferralGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NftReferralGrant_mintedTxHashKey_key" ON "NftReferralGrant"("mintedTxHashKey");

-- CreateIndex
CREATE INDEX "NftReferralGrant_userId_status_idx" ON "NftReferralGrant"("userId", "status");

-- CreateIndex
CREATE INDEX "NftReferralGrant_eligibilityId_idx" ON "NftReferralGrant"("eligibilityId");

-- CreateIndex
CREATE INDEX "NftReferralGrant_signedNonce_idx" ON "NftReferralGrant"("signedNonce");

-- CreateIndex
CREATE INDEX "NftReferralGrant_signedPayloadHash_idx" ON "NftReferralGrant"("signedPayloadHash");

-- CreateIndex
CREATE INDEX "NftReferralGrant_createdAt_idx" ON "NftReferralGrant"("createdAt");

-- AddForeignKey
ALTER TABLE "NftReferralGrant" ADD CONSTRAINT "NftReferralGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftReferralGrant" ADD CONSTRAINT "NftReferralGrant_eligibilityId_fkey" FOREIGN KEY ("eligibilityId") REFERENCES "NftReferralEligibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
