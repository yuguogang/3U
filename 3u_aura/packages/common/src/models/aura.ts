import {
    UserStatus,
    TeamPosition,
    CheckinStatus,
    PaymentStatus,
    LedgerAssetType,
    LedgerSourceType,
    LedgerStatus,
    EpochType,
    EpochStatus,
    RewardType,
    RewardStatus,
    ClaimType,
    ClaimStatus,
    NftType,
    NftStatus,
    NftEligibilityStatus
} from '../enums';

export interface ClientUser {
    id: string;
    walletAddress: string;
    inviteCode?: string;
    status: UserStatus;
    inviterId?: string;
    parentId?: string;
    teamPosition?: TeamPosition;
    placementKey?: string; // ${parentId}:${POSITION}
    referralNonce: number;
    createdAt: Date;
    updatedAt: Date;

    profile?: ClientUserProfile;
}

export interface ClientUserProfile {
    id: string;
    userId: string;
    totalCheckinDays: number;
    currentStreakDays: number;
    maxStreakDays: number;
    totalCheckinCount: number;
    totalCheckinUsdt: string; // Decimal as string
    totalAuraFromCheckin: string;
    totalAuraFromDirect: string;
    totalAuraFromIndirect: string;
    totalAuraFromConsolation: string;
    leftTeamVolume: string;
    rightTeamVolume: string;
    smallLegVolume: string;
    hasPurchasedNft: boolean;
    hasReferralNft: boolean;
    lastCheckinDate?: Date;
    tokenLaunchClaimed: boolean;
}

export interface ClientCheckin {
    id: string;
    userId: string;
    dateKey: string;
    checkinCountToday: number;
    payAmountUsdt: string;
    rewardAuraAmount: string;
    chainId: number;
    txHash?: string;
    txHashKey?: string;
    status: CheckinStatus;
    confirmedAt?: Date;
    createdAt: Date;
}

export interface ClientPaymentReceipt {
    id: string;
    userId: string;
    purpose: string;
    tokenSymbol: string;
    amount: string;
    payerAddress: string;
    chainId: number;
    txHash?: string;
    txHashKey?: string;
    status: PaymentStatus;
    confirmedAt?: Date;
}

export interface ClientAuraLedger {
    id: string;
    userId: string;
    assetType: LedgerAssetType;
    sourceType: LedgerSourceType;
    amount: string;
    status: LedgerStatus;
    createdAt: Date;
}

export interface ClientWeeklyEpoch {
    id: string;
    epochNo: number;
    epochType: EpochType;
    status: EpochStatus;
    startAt: Date;
    endAt: Date;
    merkleRoot?: string;
}

export interface ClientWeeklyReward {
    id: string;
    epochId: string;
    userId: string;
    rewardType: RewardType;
    status: RewardStatus;
    distributionKey: string;
    amountUsdt: string;
    amountAura: string;
}
