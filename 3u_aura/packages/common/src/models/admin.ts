import type {
  ClaimStatus,
  ClaimType,
  EpochStatus,
  NftEligibilityStatus,
  UserStatus,
} from '../enums';
import type { ClientUser } from './aura';
import type { WeeklyEpochBoundaryView } from './promotion';

export type AdminClaimKind = 'MERKLE' | 'NFT_SUBSIDY';
export type AdminOperatorStatus = 'BLOCKED' | 'COMPLETED' | 'FAILED' | 'READY';
export type AdminPromotionRoleKey =
  | 'CHECKIN_RECEIVER'
  | 'FINANCE_WALLET'
  | 'OPERATOR'
  | 'OWNER'
  | 'REWARD_FUNDER'
  | 'ROOT_PUBLISHER'
  | 'SETTLEMENT_PUBLISHER';
export type AdminWeeklySettlementStepKey =
  | 'EPOCH_SYNC'
  | 'GENERATE_DRAFT'
  | 'PUBLISH_DRAFT'
  | 'FUND_DISTRIBUTOR'
  | 'PUBLISH_ROOT'
  | 'ACTIVATE_CLAIMS';

export interface AdminSessionView {
  isAdmin: boolean;
  user: ClientUser;
}

export interface AdminOverviewLatestEpochView {
  epochId: string;
  epochNo: number;
  participantCount: number;
  qualifiedTicketCount: number;
  status: EpochStatus;
}

export interface AdminWeeklyLotteryWinnerView {
  userId: string;
  walletAddress: string;
  prizeLabel: 'FIRST' | 'SECOND' | 'THIRD' | 'LUCKY';
  amountUsdt: string;
}

export interface AdminWeeklyRankingEntryView {
  userId: string;
  walletAddress: string;
  rank: number;
  amountUsdt: string;
}

export interface AdminWeeklyPromotionResultsView {
  epochId: string;
  epochNo: number;
  participantCount: number;
  qualifiedTicketCount: number;
  status: EpochStatus;
  publishedAt?: Date;
  merkleRoot?: string;
  lotteryWinners: AdminWeeklyLotteryWinnerView[];
  rankingEntries: AdminWeeklyRankingEntryView[];
}

export interface AdminOverviewView {
  activeUsers: number;
  approvedReferralNftCount: number;
  claimableMerkleClaimCount: number;
  latestEpoch?: AdminOverviewLatestEpochView;
  latestWeeklyResults?: AdminWeeklyPromotionResultsView;
  mintedReferralNftCount: number;
  pendingPlacementCount: number;
  pendingReferralNftApprovalCount: number;
  pendingSubsidyClaimCount: number;
  rejectedReferralNftCount: number;
  recentUsers24h: number;
  signedReferralNftCount: number;
  teamLeaderCount?: number;
  teamLeaderTotalPerformanceUsdt?: string;
  totalUsers: number;
}

export interface AdminPromotionRoleView {
  address?: string;
  key: AdminPromotionRoleKey;
  label: string;
  matchesOperator: boolean;
}

export interface AdminOperatorCheckView {
  blockers: string[];
  description: string;
  key: string;
  label: string;
  status: AdminOperatorStatus;
  value?: string;
}

export interface AdminWalletActionView {
  args: string[];
  blockers: string[];
  contractAddress?: string;
  enabled: boolean;
  functionName: string;
  label: string;
}

export interface AdminWeeklySettlementEpochView {
  endAt: Date;
  epochId: string;
  epochNo: number;
  lotteryPoolUsdt: string;
  lotteryRolloverUsdt?: string;
  lotteryStatus?: EpochStatus;
  merkleRoot?: string;
  participantCount: number;
  qualifiedTicketCount: number;
  rankingPoolUsdt: string;
  rankingRolloverUsdt?: string;
  rankingStatus?: EpochStatus;
  rewardJsonUri?: string;
  rolloverUsdt: string;
  snapshotAt?: Date;
  startAt: Date;
  status: EpochStatus;
}

export interface AdminWeeklySettlementCenterView {
  chainId: number;
  checks: AdminOperatorCheckView[];
  currentBoundary: WeeklyEpochBoundaryView;
  distributorBalanceAtomic: string;
  draftMerkleRoot: string;
  fundingShortfallAtomic: string;
  latestEpochs: AdminOverviewLatestEpochView[];
  merkleDistributorAddress?: string;
  onChainMerkleRoot?: string;
  operatorWallet: string;
  paymentTokenAddress?: string;
  rewardFunderAddress?: string;
  rewardFunderAllowanceAtomic: string;
  rewardFunderBalanceAtomic: string;
  roles: AdminPromotionRoleView[];
  selectedEpoch?: AdminWeeklySettlementEpochView;
  steps: Array<
    AdminOperatorCheckView & {
      action?: AdminWalletActionView;
      key: AdminWeeklySettlementStepKey;
    }
  >;
  totalRewardAmountAtomic: string;
  totalRewardAmountUsdt: string;
}

export interface AdminPurchasedNftSubsidyEpochView {
  chainId: number;
  claimDeadline: Date;
  contractAddress: string;
  eligiblePurchasedSupply: number;
  epochNo: number;
  maxEligibleTokenId: string;
  projectedClaimCount?: number;
  projectionGapCount?: number;
  publishedAt: Date;
  publishedFundingAmountAtomic: string;
  remainingBudgetAtomic: string;
  claimedPurchasedSupply: number;
  subsidyAmountAtomic: string;
  subsidyAmountUsdt: string;
}

export interface AdminPurchasedNftSubsidyCenterView {
  chainId: number;
  chainPurchasedSupply: number;
  currentChainTime: Date;
  dbActivePurchasedSupply: number;
  dbProjectionGapCount: number;
  operatorWallet: string;
  paymentTokenAddress?: string;
  publishedEpochs: AdminPurchasedNftSubsidyEpochView[];
  roles: AdminPromotionRoleView[];
  settlementAddress?: string;
}

export interface AdminSubsidyPublicationPreviewView {
  blockers: string[];
  canPublish: boolean;
  chainId: number;
  chainPurchasedSupply: number;
  claimDeadline: Date;
  currentChainTime: Date;
  dbActivePurchasedSupply: number;
  dbProjectionGapCount: number;
  estimatedFundingAmountAtomic: string;
  financeWalletAddress?: string;
  operatorAllowanceAtomic: string;
  operatorBalanceAtomic: string;
  operatorMatchesOwner: boolean;
  operatorMatchesSettlementPublisher: boolean;
  operatorWallet: string;
  paymentTokenAddress?: string;
  roles: AdminPromotionRoleView[];
  settlementAddress?: string;
  settlementPublisherAddress?: string;
  subsidyAmountAtomic: string;
  subsidyAmountUsdt: string;
  walletAction?: AdminWalletActionView;
  epochNo: number;
}

export interface AdminSubsidyPublicationExecuteView
  extends AdminSubsidyPublicationPreviewView {
  expectedEpochView: AdminPurchasedNftSubsidyEpochView;
  published: boolean;
}

export interface AdminPendingPlacementItemView {
  createdAt: Date;
  inviteCode?: string;
  inviterId: string;
  inviterWalletAddress: string;
  userId: string;
  walletAddress: string;
}

export interface AdminCheckinIssueView {
  amountAtomic: string;
  chainId: number;
  checkinId?: string;
  confirmedAt?: Date;
  createdAt: Date;
  payerAddress: string;
  paymentReceiptId: string;
  paymentStatus: string;
  txHash?: string;
  txHashKey?: string;
  userId: string;
  walletAddress: string;
}

export interface AdminClaimIssueView {
  amountAtomic: string;
  chainId: number;
  claimKind: AdminClaimKind;
  claimRecordId?: string;
  claimType?: ClaimType;
  claimedAt?: Date;
  contractAddress?: string;
  createdAt: Date;
  epochId: string;
  epochNo: number;
  recordId: string;
  status: ClaimStatus;
  subsidyClaimId?: string;
  tokenId?: string;
  txHash?: string;
  userId: string;
  walletAddress: string;
}

export interface AdminNftEligibilityListItemView {
  approvedAt?: Date;
  approvedByWallet?: string;
  claimableMintCount?: number;
  createdAt: Date;
  decisionReason?: string;
  expiresAt?: Date;
  mintedAt?: Date;
  mintedReferralCount?: number;
  personalCheckinCount: number;
  rejectedAt?: Date;
  rejectedByWallet?: string;
  signedAt?: Date;
  smallLegVolumeUsdt: string;
  status: NftEligibilityStatus;
  updatedAt: Date;
  userId: string;
  walletAddress: string;
}

export interface AdminAuditLogView {
  action: string;
  createdAt: Date;
  id: string;
  operatorWallet?: string;
  payload?: Record<string, unknown>;
  targetId?: string;
  targetType?: string;
}

export interface AdminCheckinRepairPreviewView {
  canExecute: boolean;
  existingCheckinId?: string;
  existingPaymentReceiptId?: string;
  reason?: string;
  txHashKey: string;
  userId: string;
  walletAddress: string;
}

export interface AdminClaimSyncPreviewView {
  canExecute: boolean;
  claimKind: AdminClaimKind;
  claimRecordId?: string;
  currentStatus: ClaimStatus;
  reason?: string;
  subsidyClaimId?: string;
  txHash: string;
  userId: string;
  walletAddress: string;
}

export interface AdminEpochSyncPreviewView {
  currentBoundary: WeeklyEpochBoundaryView;
  latestEpochs: AdminOverviewLatestEpochView[];
  referenceAt: string;
}

export interface AdminRewardPublicationPreviewView {
  allowanceSatisfied: boolean;
  balanceSatisfied: boolean;
  blockers: string[];
  canActivate: boolean;
  claimCount: number;
  dbActivated: boolean;
  distributorBalanceAtomic: string;
  draftMerkleRoot: string;
  epochId: string;
  epochNo: number;
  epochStatus: EpochStatus;
  expectedRewardFunderAddress?: string;
  fundingSatisfied: boolean;
  fundingSourceKind: 'CHECKIN_RECEIVER';
  onChainMerkleRoot?: string;
  rewardFunderAddress?: string;
  rewardFunderAllowanceAtomic: string;
  rewardFunderBalanceAtomic: string;
  rootPublished: boolean;
  totalRewardAmountAtomic: string;
  totalRewardAmountUsdt: string;
}

export interface AdminRewardPublicationExecuteView
  extends AdminRewardPublicationPreviewView {
  activated: boolean;
  rewardJsonUri?: string;
}

export interface AdminOperationResultEnvelope<TResult> {
  action: string;
  dryRun: boolean;
  result: TResult;
}

export interface AdminUserListItemView extends ClientUser {
  isAdminAllowed: boolean;
  status: UserStatus;
}
