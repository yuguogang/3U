// 3U AURA DApp Type Definitions

// Team Position
export const TeamPosition = {
  LEFT: 1,
  RIGHT: 2,
} as const;
export type TeamPositionType = typeof TeamPosition[keyof typeof TeamPosition];

// Reward Type
export const RewardType = {
  LOTTERY: 1,
  RANKING: 2,
} as const;
export type RewardTypeType = typeof RewardType[keyof typeof RewardType];

// Signature Scenario
export const SignatureScenario = {
  SIGNIN: 'signin',
  ADMIN: 'admin',
} as const;
export type SignatureScenarioType = typeof SignatureScenario[keyof typeof SignatureScenario];

// Device Type
export const DeviceType = {
  MOBILE: 'mobile',
  DESKTOP: 'desktop',
} as const;
export type DeviceTypeType = typeof DeviceType[keyof typeof DeviceType];

// NFT Rarity
export const NFTRarity = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;
export type NFTRarityType = typeof NFTRarity[keyof typeof NFTRarity];

// NFT Status
export const NFTStatus = {
  AVAILABLE: 'available',
  OWNED: 'owned',
  LOCKED: 'locked',
  CLAIMABLE: 'claimable',
} as const;
export type NFTStatusType = typeof NFTStatus[keyof typeof NFTStatus];

// NFT Type
export const NFTType = {
  PURCHASED: 'purchased',
  REFERRAL: 'referral',
} as const;
export type NFTTypeType = typeof NFTType[keyof typeof NFTType];

// Claim Status
export const ClaimStatus = {
  AVAILABLE: 'available',
  CLAIMED: 'claimed',
  EXPIRED: 'expired',
  PENDING: 'pending',
} as const;
export type ClaimStatusType = typeof ClaimStatus[keyof typeof ClaimStatus];

// Claim Type
export const ClaimType = {
  REWARD: 'reward',
  NFT_SUBSIDY: 'nft_subsidy',
  REFERRAL: 'referral',
  LOTTERY: 'lottery',
  RANKING: 'ranking',
} as const;
export type ClaimTypeType = typeof ClaimType[keyof typeof ClaimType];

// Transaction Status
export const TransactionStatus = {
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;
export type TransactionStatusType = typeof TransactionStatus[keyof typeof TransactionStatus];

// NFT Item
export interface NFTItem {
  tokenId: number;
  name: string;
  image: string;
  type: NFTTypeType;
  status: NFTStatusType;
  price?: string;
  rarity: NFTRarityType;
  weeklySubsidy?: string;
}

// Claim Item
export interface ClaimItem {
  id: string;
  type: ClaimTypeType;
  amount: string;
  currency: string;
  availableAt: number;
  expiresAt?: number;
  status: ClaimStatusType;
  merkleProof?: string[];
  epochId?: number;
  description?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Auth Types
export interface SignatureMessageRequest {
  address: string;
  scenario: SignatureScenarioType;
}

export interface SigninRequest {
  address: string;
  signature: string;
  device: DeviceTypeType | string;
  name?: string;
  chain?: number;
}

export interface SigninResponse {
  token: string;
  user: {
    address: string;
    inviteCode: string;
    createdAt: string;
  };
}

// Referral Types
export interface BindInviterRequest {
  inviteCode: string;
}

export interface BindPlacementRequest {
  placementUserId: string;
  parentId: string;
  teamPosition: TeamPositionType;
}

// Check-in Types
export interface CheckinRequest {
  chainId: number;
  txHash: string;
  payerAddress: string;
  tokenSymbol: string;
  amountAtomic: string;
}

export interface CheckinResponse {
  checkinId: string;
  auraReward: string;
  consecutiveDays: number;
  totalCheckins: number;
}

// NFT Types
export interface ReferralSignatureRequest {
  recipient: string;
  chainId: number;
  contractAddress?: string;
  expiresAt?: string;
}

export interface ReferralSignatureResponse {
  signature: string;
  nonce: number;
  expiry: number;
  recipient: string;
}

// Claim Types
export interface SyncClaimRequest {
  claimRecordId?: string;
  subsidyClaimId?: string;
  txHash: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalAuraEarned: string;
  totalUsdValue: string;
  currentEpoch: number;
  epochProgress: number;
  teamSize: number;
  directReferrals: number;
  indirectReferrals: number;
  lotteryTickets: number;
  nextLotteryTime: number;
}

// Team Tree Types
export interface TeamTreeNode {
  id: string;
  address: string;
  ensName?: string;
  avatar?: string;
  checkinCount: number;
  nftType?: NFTTypeType;
  leftVolume: string;
  rightVolume: string;
  leftChild?: TeamTreeNode;
  rightChild?: TeamTreeNode;
  depth: number;
}

// Lottery Types
export interface LotteryInfo {
  round: number;
  poolAmount: string;
  participantCount: number;
  userTickets: number;
  timeUntilDraw: number;
  prizes: {
    first: string;
    second: string;
    third: string;
    lucky: string;
  };
}

export interface LotteryResult {
  round: number;
  hasWon: boolean;
  rank?: number;
  amount?: string;
  consolationPrize?: string;
}

// Ranking Types
export interface RankingInfo {
  rank: number;
  address: string;
  smallLegVolume: string;
  reward: string;
}

export interface WeeklyRanking {
  epoch: number;
  rankings: RankingInfo[];
  userRank?: RankingInfo;
  totalPool: string;
}
