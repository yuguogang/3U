export enum TeamPosition {
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED',
}

export enum CheckinStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    MISMATCHED = 'MISMATCHED',
    REFUNDED = 'REFUNDED',
}

export enum PaymentPurpose {
    CHECKIN = 'CHECKIN',
    NFT_PURCHASE = 'NFT_PURCHASE',
    MANUAL = 'MANUAL',
}

export enum LedgerSourceType {
    CHECKIN = 'CHECKIN',
    DIRECT_REFERRAL = 'DIRECT_REFERRAL',
    INDIRECT_REFERRAL = 'INDIRECT_REFERRAL',
    CONSOLATION = 'CONSOLATION',
    MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
    TOKEN_GENESIS_CLAIM = 'TOKEN_GENESIS_CLAIM',
}

export enum LedgerAssetType {
    AURA = 'AURA',
    USDT = 'USDT',
}

export enum LedgerStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CLAIMABLE = 'CLAIMABLE',
    CLAIMED = 'CLAIMED',
    VOIDED = 'VOIDED',
}

export enum EpochType {
    WEEKLY_PROMOTION = 'WEEKLY_PROMOTION',
    NFT_SUBSIDY = 'NFT_SUBSIDY',
    TOKEN_DIVIDEND = 'TOKEN_DIVIDEND',
}

export enum EpochStatus {
    PENDING = 'PENDING',
    OPEN = 'OPEN',
    CALCULATING = 'CALCULATING',
    ROOT_POSTED = 'ROOT_POSTED',
    SETTLED = 'SETTLED',
    CANCELLED = 'CANCELLED',
}

export enum RewardType {
    LOTTERY_USDT = 'LOTTERY_USDT',
    RANKING_USDT = 'RANKING_USDT',
    CONSOLATION_AURA = 'CONSOLATION_AURA',
    NFT_WEEKLY_USDT = 'NFT_WEEKLY_USDT',
    TOKEN_DIVIDEND_USDT = 'TOKEN_DIVIDEND_USDT',
    MANUAL = 'MANUAL',
}

export enum RewardStatus {
    PENDING = 'PENDING',
    CLAIMABLE = 'CLAIMABLE',
    CLAIMED = 'CLAIMED',
    EXPIRED = 'EXPIRED',
    VOIDED = 'VOIDED',
}

export enum ClaimType {
    MERKLE_LOTTERY = 'MERKLE_LOTTERY',
    MERKLE_RANKING = 'MERKLE_RANKING',
    NFT_SUBSIDY = 'NFT_SUBSIDY',
    TOKEN_DIVIDEND = 'TOKEN_DIVIDEND',
    TOKEN_GENESIS = 'TOKEN_GENESIS',
}

export enum ClaimStatus {
    PENDING = 'PENDING',
    CLAIMABLE = 'CLAIMABLE',
    CLAIMED = 'CLAIMED',
    FAILED = 'FAILED',
    VOIDED = 'VOIDED',
}

export enum NftType {
    PURCHASED = 'PURCHASED',
    REFERRAL = 'REFERRAL',
}

export enum NftStatus {
    ACTIVE = 'ACTIVE',
    BURNED = 'BURNED',
    LOCKED = 'LOCKED',
}

export enum NftEligibilityStatus {
    INELIGIBLE = 'INELIGIBLE',
    ELIGIBLE = 'ELIGIBLE',
    SIGNED = 'SIGNED',
    MINTED = 'MINTED',
    EXPIRED = 'EXPIRED',
    REVOKED = 'REVOKED',
}

export enum SignatureScenarios {
    SIGNIN = 'SIGNIN',
    BIND_INVITER = 'BIND_INVITER',
    MINT_NFT = 'MINT_NFT',
    CLAIM_REWARD = 'CLAIM_REWARD',
}

export enum DEVICES {
    BROWSER = 'BROWSER',
    MOBILE = 'MOBILE',
    OTHER = 'OTHER',
}
