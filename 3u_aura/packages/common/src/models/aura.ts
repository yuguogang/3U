import {
    UserStatus,
    TeamPosition,
    CheckinStatus,
    PaymentStatus,
    PaymentPurpose,
    LedgerAssetType,
    LedgerSourceType,
    LedgerStatus,
    EpochType,
    EpochStatus,
    RewardType,
    RewardStatus,
    DEVICES
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
    recentPurchasedNftActivity?: ClientPurchasedNftActivity[];
}

export interface ClientPurchasedNftActivity {
    paymentReceiptId: string;
    amount: string; // atomic units as string
    tokenId?: string;
    txHash?: string;
    status: PaymentStatus;
    confirmedAt?: Date;
    mintedAt?: Date;
}

export interface ClientUserProfile {
    id: string;
    userId: string;
    totalCheckinDays: number;
    currentStreakDays: number;
    maxStreakDays: number;
    totalCheckinCount: number;
    totalCheckinUsdt: string; // atomic units as string
    totalAuraFromCheckin: string; // atomic units as string
    totalAuraFromDirect: string; // atomic units as string
    totalAuraFromIndirect: string; // atomic units as string
    totalAuraFromConsolation: string; // atomic units as string
    leftTeamVolume: string; // atomic units as string
    rightTeamVolume: string; // atomic units as string
    smallLegVolume: string; // atomic units as string
    hasPurchasedNft: boolean;
    hasReferralNft: boolean;
    lastCheckinDate?: Date;
}

export interface ClientCheckin {
    id: string;
    userId: string;
    dateKey: string;
    checkinCountToday: number;
    payAmountUsdt: string; // atomic units as string
    rewardAuraAmount: string; // atomic units as string
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
    purpose: PaymentPurpose;
    tokenSymbol: string;
    amount: string; // atomic units as string
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
    amount: string; // atomic units as string
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
    amountUsdt: string; // atomic units as string
    amountAura: string; // atomic units as string
}

export interface AuthSignatureSigninInput {
    address: string;
    message?: string;
    signature: string;
    device: DEVICES | string;
    name?: string;
    chain?: number;
    referralCode?: string;
}
