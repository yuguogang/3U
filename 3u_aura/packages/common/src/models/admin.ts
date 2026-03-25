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
  totalUsers: number;
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
  createdAt: Date;
  decisionReason?: string;
  expiresAt?: Date;
  mintedAt?: Date;
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

export interface AdminOperationResultEnvelope<TResult> {
  action: string;
  dryRun: boolean;
  result: TResult;
}

export interface AdminUserListItemView extends ClientUser {
  isAdminAllowed: boolean;
  status: UserStatus;
}
