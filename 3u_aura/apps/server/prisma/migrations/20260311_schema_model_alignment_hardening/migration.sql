-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TeamPosition" AS ENUM ('LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CheckinStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'MISMATCHED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('CHECKIN', 'NFT_PURCHASE', 'MANUAL');

-- CreateEnum
CREATE TYPE "LedgerSourceType" AS ENUM ('CHECKIN', 'DIRECT_REFERRAL', 'INDIRECT_REFERRAL', 'CONSOLATION', 'MANUAL_ADJUSTMENT', 'TOKEN_GENESIS_CLAIM');

-- CreateEnum
CREATE TYPE "LedgerAssetType" AS ENUM ('AURA', 'USDT');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CLAIMABLE', 'CLAIMED', 'VOIDED');

-- CreateEnum
CREATE TYPE "EpochType" AS ENUM ('WEEKLY_PROMOTION', 'NFT_SUBSIDY', 'TOKEN_DIVIDEND');

-- CreateEnum
CREATE TYPE "EpochStatus" AS ENUM ('PENDING', 'OPEN', 'CALCULATING', 'ROOT_POSTED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('LOTTERY_USDT', 'RANKING_USDT', 'CONSOLATION_AURA', 'NFT_WEEKLY_USDT', 'TOKEN_DIVIDEND_USDT', 'MANUAL');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'CLAIMABLE', 'CLAIMED', 'EXPIRED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('MERKLE_LOTTERY', 'MERKLE_RANKING', 'NFT_SUBSIDY', 'TOKEN_DIVIDEND', 'TOKEN_GENESIS');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'CLAIMABLE', 'CLAIMED', 'FAILED', 'VOIDED');

-- CreateEnum
CREATE TYPE "NftType" AS ENUM ('PURCHASED', 'REFERRAL');

-- CreateEnum
CREATE TYPE "NftStatus" AS ENUM ('ACTIVE', 'BURNED', 'LOCKED');

-- CreateEnum
CREATE TYPE "NftEligibilityStatus" AS ENUM ('INELIGIBLE', 'ELIGIBLE', 'SIGNED', 'MINTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" VARCHAR(64) NOT NULL,
    "inviteCode" VARCHAR(32),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "inviterId" TEXT,
    "parentId" TEXT,
    "teamPosition" "TeamPosition",
    "placementKey" VARCHAR(128),
    "referralNonce" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalCheckinDays" INTEGER NOT NULL DEFAULT 0,
    "currentStreakDays" INTEGER NOT NULL DEFAULT 0,
    "maxStreakDays" INTEGER NOT NULL DEFAULT 0,
    "totalCheckinCount" INTEGER NOT NULL DEFAULT 0,
    "totalCheckinUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalAuraFromCheckin" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalAuraFromDirect" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalAuraFromIndirect" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "totalAuraFromConsolation" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "leftTeamVolume" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "rightTeamVolume" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "smallLegVolume" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "hasPurchasedNft" BOOLEAN NOT NULL DEFAULT false,
    "hasReferralNft" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckinDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamClosure" (
    "id" TEXT NOT NULL,
    "ancestorId" TEXT NOT NULL,
    "descendantId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" VARCHAR(16) NOT NULL,
    "checkinCountToday" INTEGER NOT NULL DEFAULT 1,
    "isCountedForStreak" BOOLEAN NOT NULL DEFAULT true,
    "payToken" VARCHAR(16) NOT NULL DEFAULT 'USDT',
    "payAmountUsdt" DECIMAL(78,0) NOT NULL,
    "rewardAuraAmount" DECIMAL(78,0) NOT NULL,
    "chainId" INTEGER NOT NULL,
    "txHash" VARCHAR(128),
    "txHashKey" VARCHAR(160),
    "blockNumber" BIGINT,
    "status" "CheckinStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkinId" TEXT,
    "purpose" "PaymentPurpose" NOT NULL,
    "tokenSymbol" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "payerAddress" VARCHAR(64) NOT NULL,
    "receiverAddress" VARCHAR(64),
    "chainId" INTEGER NOT NULL,
    "txHash" VARCHAR(128),
    "txHashKey" VARCHAR(160),
    "blockNumber" BIGINT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDailyStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" VARCHAR(16) NOT NULL,
    "checkinTimes" INTEGER NOT NULL DEFAULT 0,
    "countedCheckinDays" INTEGER NOT NULL DEFAULT 0,
    "selfVolumeUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "selfAuraReward" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "leftVolumeUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "rightVolumeUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "smallLegVolumeUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "directReferralAura" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "indirectReferralAura" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "consolationAura" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetType" "LedgerAssetType" NOT NULL DEFAULT 'AURA',
    "sourceType" "LedgerSourceType" NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "sourceRefId" TEXT,
    "sourceRefType" VARCHAR(64),
    "epochId" TEXT,
    "status" "LedgerStatus" NOT NULL DEFAULT 'CONFIRMED',
    "claimRecordId" TEXT,
    "checkinId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyEpoch" (
    "id" TEXT NOT NULL,
    "epochNo" INTEGER NOT NULL,
    "epochType" "EpochType" NOT NULL DEFAULT 'WEEKLY_PROMOTION',
    "status" "EpochStatus" NOT NULL DEFAULT 'PENDING',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "snapshotAt" TIMESTAMP(3),
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "qualifiedTicketCount" INTEGER NOT NULL DEFAULT 0,
    "lotteryPoolUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "rankingPoolUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "consolationPoolAura" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "nftSubsidyPoolUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "dividendPoolUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "rolloverUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "merkleRoot" VARCHAR(128),
    "merkleTreeUri" TEXT,
    "rewardJsonUri" TEXT,
    "calculationRemark" TEXT,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyEpoch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryTicket" (
    "id" TEXT NOT NULL,
    "epochId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "isEligible" BOOLEAN NOT NULL DEFAULT false,
    "ticketCount" INTEGER NOT NULL DEFAULT 0,
    "qualifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotteryTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReward" (
    "id" TEXT NOT NULL,
    "epochId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "distributionKey" VARCHAR(64) NOT NULL DEFAULT 'DEFAULT',
    "rank" INTEGER,
    "amountUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "amountAura" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "merkleIndex" INTEGER,
    "merkleLeafHash" VARCHAR(128),
    "proofJsonUri" TEXT,
    "sourceNote" TEXT,
    "claimTxHash" VARCHAR(128),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "epochId" TEXT,
    "rewardId" TEXT,
    "claimType" "ClaimType" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "tokenSymbol" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "merkleIndex" INTEGER,
    "merkleProofJson" JSONB,
    "root" VARCHAR(128),
    "contractAddress" VARCHAR(64),
    "chainId" INTEGER NOT NULL,
    "txHash" VARCHAR(128),
    "txHashKey" VARCHAR(160),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "ClaimRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftHolding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" VARCHAR(64) NOT NULL,
    "tokenId" BIGINT NOT NULL,
    "nftType" "NftType" NOT NULL,
    "status" "NftStatus" NOT NULL DEFAULT 'ACTIVE',
    "mintTxHash" VARCHAR(128),
    "mintTxHashKey" VARCHAR(160),
    "purchasedPriceUsdt" DECIMAL(78,0),
    "mintedAt" TIMESTAMP(3) NOT NULL,
    "burnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NftHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftReferralEligibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snapshotEpochId" TEXT,
    "personalCheckinCount" INTEGER NOT NULL DEFAULT 0,
    "smallLegVolumeUsdt" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "requiredCheckinCount" INTEGER NOT NULL DEFAULT 30,
    "requiredSmallLegUsdt" DECIMAL(78,0) NOT NULL DEFAULT 6000000000,
    "status" "NftEligibilityStatus" NOT NULL DEFAULT 'INELIGIBLE',
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

    CONSTRAINT "NftReferralEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerkleLeaf" (
    "id" TEXT NOT NULL,
    "epochId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "tokenSymbol" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "leafIndex" INTEGER NOT NULL,
    "leafHash" VARCHAR(128) NOT NULL,
    "proofJson" JSONB,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerkleLeaf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NftSubsidyClaim" (
    "id" TEXT NOT NULL,
    "nftHoldingId" TEXT NOT NULL,
    "epochId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountUsdt" DECIMAL(78,0) NOT NULL DEFAULT 30000000,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "contractAddress" VARCHAR(64),
    "chainId" INTEGER NOT NULL,
    "txHash" VARCHAR(128),
    "txHashKey" VARCHAR(160),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NftSubsidyClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenGenesisRoot" (
    "id" TEXT NOT NULL,
    "epochId" TEXT,
    "root" VARCHAR(128) NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalAuraAmount" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "rewardJsonUri" TEXT,
    "merkleTreeUri" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenGenesisRoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenGenesisLeaf" (
    "id" TEXT NOT NULL,
    "tokenGenesisRootId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAuraAmount" DECIMAL(78,0) NOT NULL,
    "leafIndex" INTEGER NOT NULL,
    "leafHash" VARCHAR(128) NOT NULL,
    "proofJson" JSONB,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenGenesisLeaf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "configKey" VARCHAR(64) NOT NULL,
    "configValue" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "operatorWallet" VARCHAR(64),
    "action" VARCHAR(128) NOT NULL,
    "targetType" VARCHAR(64),
    "targetId" VARCHAR(64),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_placementKey_key" ON "User"("placementKey");

-- CreateIndex
CREATE INDEX "User_inviterId_idx" ON "User"("inviterId");

-- CreateIndex
CREATE INDEX "User_parentId_idx" ON "User"("parentId");

-- CreateIndex
CREATE INDEX "User_teamPosition_idx" ON "User"("teamPosition");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "TeamClosure_ancestorId_depth_idx" ON "TeamClosure"("ancestorId", "depth");

-- CreateIndex
CREATE INDEX "TeamClosure_descendantId_depth_idx" ON "TeamClosure"("descendantId", "depth");

-- CreateIndex
CREATE UNIQUE INDEX "TeamClosure_ancestorId_descendantId_key" ON "TeamClosure"("ancestorId", "descendantId");

-- CreateIndex
CREATE UNIQUE INDEX "Checkin_txHashKey_key" ON "Checkin"("txHashKey");

-- CreateIndex
CREATE INDEX "Checkin_userId_dateKey_idx" ON "Checkin"("userId", "dateKey");

-- CreateIndex
CREATE INDEX "Checkin_status_idx" ON "Checkin"("status");

-- CreateIndex
CREATE INDEX "Checkin_createdAt_idx" ON "Checkin"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Checkin_userId_dateKey_checkinCountToday_key" ON "Checkin"("userId", "dateKey", "checkinCountToday");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_checkinId_key" ON "PaymentReceipt"("checkinId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_txHashKey_key" ON "PaymentReceipt"("txHashKey");

-- CreateIndex
CREATE INDEX "PaymentReceipt_userId_purpose_idx" ON "PaymentReceipt"("userId", "purpose");

-- CreateIndex
CREATE INDEX "PaymentReceipt_status_idx" ON "PaymentReceipt"("status");

-- CreateIndex
CREATE INDEX "UserDailyStat_dateKey_idx" ON "UserDailyStat"("dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyStat_userId_dateKey_key" ON "UserDailyStat"("userId", "dateKey");

-- CreateIndex
CREATE INDEX "AuraLedger_userId_sourceType_idx" ON "AuraLedger"("userId", "sourceType");

-- CreateIndex
CREATE INDEX "AuraLedger_epochId_idx" ON "AuraLedger"("epochId");

-- CreateIndex
CREATE INDEX "AuraLedger_status_idx" ON "AuraLedger"("status");

-- CreateIndex
CREATE INDEX "AuraLedger_sourceRefId_sourceRefType_idx" ON "AuraLedger"("sourceRefId", "sourceRefType");

-- CreateIndex
CREATE INDEX "WeeklyEpoch_epochType_status_idx" ON "WeeklyEpoch"("epochType", "status");

-- CreateIndex
CREATE INDEX "WeeklyEpoch_startAt_endAt_idx" ON "WeeklyEpoch"("startAt", "endAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyEpoch_epochType_epochNo_key" ON "WeeklyEpoch"("epochType", "epochNo");

-- CreateIndex
CREATE INDEX "LotteryTicket_userId_idx" ON "LotteryTicket"("userId");

-- CreateIndex
CREATE INDEX "LotteryTicket_isEligible_idx" ON "LotteryTicket"("isEligible");

-- CreateIndex
CREATE UNIQUE INDEX "LotteryTicket_epochId_userId_key" ON "LotteryTicket"("epochId", "userId");

-- CreateIndex
CREATE INDEX "WeeklyReward_epochId_rewardType_idx" ON "WeeklyReward"("epochId", "rewardType");

-- CreateIndex
CREATE INDEX "WeeklyReward_userId_rewardType_idx" ON "WeeklyReward"("userId", "rewardType");

-- CreateIndex
CREATE INDEX "WeeklyReward_status_idx" ON "WeeklyReward"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReward_epochId_userId_rewardType_distributionKey_key" ON "WeeklyReward"("epochId", "userId", "rewardType", "distributionKey");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimRecord_txHashKey_key" ON "ClaimRecord"("txHashKey");

-- CreateIndex
CREATE INDEX "ClaimRecord_userId_claimType_status_idx" ON "ClaimRecord"("userId", "claimType", "status");

-- CreateIndex
CREATE INDEX "ClaimRecord_epochId_idx" ON "ClaimRecord"("epochId");

-- CreateIndex
CREATE INDEX "ClaimRecord_rewardId_idx" ON "ClaimRecord"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "NftHolding_mintTxHashKey_key" ON "NftHolding"("mintTxHashKey");

-- CreateIndex
CREATE INDEX "NftHolding_userId_nftType_idx" ON "NftHolding"("userId", "nftType");

-- CreateIndex
CREATE INDEX "NftHolding_status_idx" ON "NftHolding"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NftHolding_chainId_contractAddress_tokenId_key" ON "NftHolding"("chainId", "contractAddress", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "NftReferralEligibility_mintedTxHashKey_key" ON "NftReferralEligibility"("mintedTxHashKey");

-- CreateIndex
CREATE INDEX "NftReferralEligibility_userId_status_idx" ON "NftReferralEligibility"("userId", "status");

-- CreateIndex
CREATE INDEX "NftReferralEligibility_snapshotEpochId_idx" ON "NftReferralEligibility"("snapshotEpochId");

-- CreateIndex
CREATE UNIQUE INDEX "NftReferralEligibility_userId_key" ON "NftReferralEligibility"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MerkleLeaf_rewardId_key" ON "MerkleLeaf"("rewardId");

-- CreateIndex
CREATE INDEX "MerkleLeaf_userId_rewardType_idx" ON "MerkleLeaf"("userId", "rewardType");

-- CreateIndex
CREATE INDEX "MerkleLeaf_epochId_rewardType_idx" ON "MerkleLeaf"("epochId", "rewardType");

-- CreateIndex
CREATE UNIQUE INDEX "MerkleLeaf_epochId_leafIndex_key" ON "MerkleLeaf"("epochId", "leafIndex");

-- CreateIndex
CREATE UNIQUE INDEX "NftSubsidyClaim_txHashKey_key" ON "NftSubsidyClaim"("txHashKey");

-- CreateIndex
CREATE INDEX "NftSubsidyClaim_userId_epochId_idx" ON "NftSubsidyClaim"("userId", "epochId");

-- CreateIndex
CREATE INDEX "NftSubsidyClaim_status_idx" ON "NftSubsidyClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NftSubsidyClaim_nftHoldingId_epochId_key" ON "NftSubsidyClaim"("nftHoldingId", "epochId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenGenesisRoot_root_key" ON "TokenGenesisRoot"("root");

-- CreateIndex
CREATE INDEX "TokenGenesisLeaf_userId_idx" ON "TokenGenesisLeaf"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenGenesisLeaf_tokenGenesisRootId_userId_key" ON "TokenGenesisLeaf"("tokenGenesisRootId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenGenesisLeaf_tokenGenesisRootId_leafIndex_key" ON "TokenGenesisLeaf"("tokenGenesisRootId", "leafIndex");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_configKey_key" ON "SystemConfig"("configKey");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamClosure" ADD CONSTRAINT "TeamClosure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamClosure" ADD CONSTRAINT "TeamClosure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "Checkin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyStat" ADD CONSTRAINT "UserDailyStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraLedger" ADD CONSTRAINT "AuraLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraLedger" ADD CONSTRAINT "AuraLedger_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "WeeklyEpoch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraLedger" ADD CONSTRAINT "AuraLedger_claimRecordId_fkey" FOREIGN KEY ("claimRecordId") REFERENCES "ClaimRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraLedger" ADD CONSTRAINT "AuraLedger_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "Checkin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryTicket" ADD CONSTRAINT "LotteryTicket_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "WeeklyEpoch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryTicket" ADD CONSTRAINT "LotteryTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReward" ADD CONSTRAINT "WeeklyReward_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "WeeklyEpoch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReward" ADD CONSTRAINT "WeeklyReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRecord" ADD CONSTRAINT "ClaimRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRecord" ADD CONSTRAINT "ClaimRecord_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "WeeklyEpoch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRecord" ADD CONSTRAINT "ClaimRecord_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "WeeklyReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftHolding" ADD CONSTRAINT "NftHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftReferralEligibility" ADD CONSTRAINT "NftReferralEligibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftReferralEligibility" ADD CONSTRAINT "NftReferralEligibility_snapshotEpochId_fkey" FOREIGN KEY ("snapshotEpochId") REFERENCES "WeeklyEpoch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerkleLeaf" ADD CONSTRAINT "MerkleLeaf_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "WeeklyEpoch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerkleLeaf" ADD CONSTRAINT "MerkleLeaf_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerkleLeaf" ADD CONSTRAINT "MerkleLeaf_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "WeeklyReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftSubsidyClaim" ADD CONSTRAINT "NftSubsidyClaim_nftHoldingId_fkey" FOREIGN KEY ("nftHoldingId") REFERENCES "NftHolding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftSubsidyClaim" ADD CONSTRAINT "NftSubsidyClaim_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "WeeklyEpoch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NftSubsidyClaim" ADD CONSTRAINT "NftSubsidyClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenGenesisRoot" ADD CONSTRAINT "TokenGenesisRoot_epochId_fkey" FOREIGN KEY ("epochId") REFERENCES "WeeklyEpoch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenGenesisLeaf" ADD CONSTRAINT "TokenGenesisLeaf_tokenGenesisRootId_fkey" FOREIGN KEY ("tokenGenesisRootId") REFERENCES "TokenGenesisRoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenGenesisLeaf" ADD CONSTRAINT "TokenGenesisLeaf_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
