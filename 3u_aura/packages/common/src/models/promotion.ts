import {
  ClaimStatus,
  ClaimType,
  CheckinStatus,
  EpochStatus,
  EpochType,
  NftEligibilityStatus,
  RewardStatus,
  RewardType,
  TeamPosition,
} from '../enums';

export interface PromotionCheckinResult {
  checkinId: string;
  paymentReceiptId?: string;
  dateKey: string;
  checkinCountToday: number;
  rewardAuraAmount: string; // atomic units as string
  status: CheckinStatus;
}

export interface ReferralPlacementView {
  userId: string;
  inviterId?: string;
  parentId: string;
  teamPosition: TeamPosition;
  placementKey: string;
}

export interface ReferralInviterBindingView {
  userId: string;
  inviterId: string;
  inviterInviteCode?: string;
  isPlacementPending: boolean;
}

export interface ReferralPendingPlacementView {
  userId: string;
  inviterId: string;
  isPlacementPending: boolean;
  registeredAt: Date;
  walletAddress: string;
}

export interface ReferralPlacementSlotView {
  depth: number;
  parentId: string;
  parentWalletAddress: string;
  placementKey: string;
  teamPosition: TeamPosition;
}

export interface TeamTreeNodeView {
  userId: string;
  walletAddress: string;
  inviteCode?: string;
  inviterId?: string;
  parentId?: string;
  placementKey?: string;
  teamPosition?: TeamPosition;
  depth: number;
  isRoot: boolean;
  hasPurchasedNft: boolean;
  hasReferralNft: boolean;
  totalAuraAtomic: string;
  leftTeamVolume: string;
  rightTeamVolume: string;
  smallLegVolume: string;
  openChildPositions: TeamPosition[];
}

export interface TeamTreeSnapshotView {
  rootUserId: string;
  requestedDepth?: number;
  nodes: TeamTreeNodeView[];
}

export interface NftEligibilityView {
  userId: string;
  status: NftEligibilityStatus;
  personalCheckinCount: number;
  smallLegVolumeUsdt: string; // atomic units as string
  requiredCheckinCount: number;
  requiredSmallLegUsdt: string; // atomic units as string
  approvedAt?: Date;
  approvedByWallet?: string;
  decisionReason?: string;
  expiresAt?: Date;
  mintedTokenId?: string;
  rejectedAt?: Date;
  rejectedByWallet?: string;
  signedAt?: Date;
}

export interface ReferralMintPayloadBase {
  recipient: string;
  chainId: number;
  contractAddress: string;
  nonce: number;
  expiry: number;
  expiresAt: string;
}

export interface ReferralSignaturePreview extends ReferralMintPayloadBase {}

export interface ReferralMintSignaturePayload
  extends ReferralMintPayloadBase {
  digest: string;
  issuedAt: string;
  signature: string;
}

export interface PromotionClaimSyncResult {
  chainId: number;
  claimedAt: Date;
  claimRecordId?: string;
  status: ClaimStatus;
  subsidyClaimId?: string;
  txHash: string;
}

export interface PromotionPurchasedNftSyncResult {
  chainId: number;
  claimsCreated: number;
  claimsUpdated: number;
  hasPurchasedNft: boolean;
  holdingsCreated: number;
  mintedAt: Date;
  publishedSubsidyEpochs: number;
  tokenId: string;
  txHash: string;
}

export interface PromotionReferralNftSyncResult {
  chainId: number;
  hasReferralNft: boolean;
  holdingsCreated: number;
  mintedAt: Date;
  status: NftEligibilityStatus;
  tokenId: string;
  txHash: string;
}

export interface WeeklyEpochBoundaryView {
  epochId?: string;
  epochNo?: number;
  epochType: EpochType;
  status?: EpochStatus;
  startAt?: Date;
  endAt?: Date;
  snapshotAt?: Date;
}

export interface PromotionRewardView {
  rewardId: string;
  epochId: string;
  epochNo: number;
  epochType: EpochType;
  rewardType: RewardType;
  status: RewardStatus;
  distributionKey: string;
  rank?: number;
  amountUsdt: string; // atomic units as string
  amountAura: string; // atomic units as string
  createdAt: Date;
  claimRecordId?: string;
  claimType?: ClaimType;
  claimStatus?: ClaimStatus;
}

export interface PromotionCurrentLotteryParticipationView {
  epochId: string;
  epochNo: number;
  epochStatus: EpochStatus;
  startAt: Date;
  endAt: Date;
  currentStreakDays: number;
  daysUntilTicket: number;
  isCurrentlyQualified: boolean;
  isParticipating: boolean;
  participatedAt?: Date;
  canParticipate: boolean;
}

export type PromotionLotteryResultStatus =
  | 'PENDING'
  | 'WON'
  | 'LOST'
  | 'ROLLED_OVER'
  | 'NOT_QUALIFIED'
  | 'NOT_PARTICIPATING';

export interface PromotionLotteryOutcomeView {
  epochId: string;
  epochNo: number;
  epochStatus: EpochStatus;
  isParticipating: boolean;
  isEligible: boolean;
  isRevealed: boolean;
  canReveal: boolean;
  participatedAt?: Date;
  revealedAt?: Date;
  resultStatus: PromotionLotteryResultStatus;
  prizeLabel?: 'FIRST' | 'SECOND' | 'THIRD' | 'LUCKY';
  amountUsdt?: string;
  amountAura?: string;
  claimRecordId?: string;
  claimStatus?: ClaimStatus;
}

export interface PromotionWeeklyLotteryWinnerView {
  userId: string;
  walletAddress: string;
  prizeLabel: 'FIRST' | 'SECOND' | 'THIRD' | 'LUCKY';
  amountUsdt: string;
}

export interface PromotionWeeklyRankingEntryView {
  userId: string;
  walletAddress: string;
  rank: number;
  amountUsdt: string;
  isCurrentUser: boolean;
  claimRecordId?: string;
  claimStatus?: ClaimStatus;
}

export interface PromotionWeeklyResultsView {
  epochId: string;
  epochNo: number;
  epochStatus: EpochStatus;
  startAt: Date;
  endAt: Date;
  publishedAt?: Date;
  participantCount: number;
  qualifiedTicketCount: number;
  lotteryWinners: PromotionWeeklyLotteryWinnerView[];
  rankingEntries: PromotionWeeklyRankingEntryView[];
  myLottery: PromotionLotteryOutcomeView;
}

export interface PromotionMerkleClaimView {
  claimRecordId: string;
  epochId: string;
  epochNo: number;
  claimType: ClaimType;
  status: ClaimStatus;
  tokenSymbol: string;
  amount: string; // atomic units as string
  chainId: number;
  contractAddress?: string;
  merkleIndex?: number;
  merkleProof: string[];
  root?: string;
  txHash?: string;
  claimedAt?: Date;
}

export interface PromotionNftSubsidyClaimView {
  subsidyClaimId: string;
  epochId: string;
  epochNo: number;
  status: ClaimStatus;
  amountUsdt: string; // atomic units as string
  chainId: number;
  contractAddress?: string;
  tokenId: string;
  txHash?: string;
  claimedAt?: Date;
}

export interface PromotionClaimsView {
  merkleClaims: PromotionMerkleClaimView[];
  nftSubsidyClaims: PromotionNftSubsidyClaimView[];
}
