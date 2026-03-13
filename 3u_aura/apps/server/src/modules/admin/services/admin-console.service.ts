import { Injectable } from '@nestjs/common';
import {
  ClaimStatus as CommonClaimStatus,
  ClaimType as CommonClaimType,
  EpochStatus as CommonEpochStatus,
  NftEligibilityStatus as CommonNftEligibilityStatus,
} from '3u-aura-common';
import type {
  AdminAuditLogView,
  AdminCheckinIssueView,
  AdminClaimIssueView,
  AdminNftEligibilityListItemView,
  AdminOverviewView,
  AdminPendingPlacementItemView,
} from '3u-aura-common';
import type {
  AdminAuditLogListQuery,
  AdminCheckinIssueListQuery,
  AdminClaimIssueListQuery,
  AdminNftEligibilityListQuery,
  AdminPendingPlacementListQuery,
  PaginateData,
} from '3u-aura-common';
import { AdminConsoleRepository } from '../repositories/admin-console.repository';

type SubsidyClaimIssueRow = {
  amountUsdt: { toFixed: (digits?: number) => string };
  chainId: number;
  claimedAt: Date | null;
  contractAddress: string | null;
  createdAt: Date;
  epoch: { epochNo: number };
  epochId: string;
  id: string;
  nftHolding: { tokenId: bigint };
  status: string;
  txHash: string | null;
  user: {
    id: string;
    walletAddress: string;
  };
};

type MerkleClaimIssueRow = {
  amount: { toFixed: (digits?: number) => string };
  chainId: number;
  claimType: string;
  claimedAt: Date | null;
  contractAddress: string | null;
  createdAt: Date;
  epoch: { epochNo: number } | null;
  epochId: string | null;
  id: string;
  status: string;
  txHash: string | null;
  user: {
    id: string;
    walletAddress: string;
  };
};

function toCommonClaimStatus(status: string): CommonClaimStatus {
  return CommonClaimStatus[status as keyof typeof CommonClaimStatus];
}

function toCommonClaimType(type: string): CommonClaimType {
  return CommonClaimType[type as keyof typeof CommonClaimType];
}

function toCommonEpochStatus(status: string): CommonEpochStatus {
  return CommonEpochStatus[status as keyof typeof CommonEpochStatus];
}

function toCommonNftEligibilityStatus(
  status: string,
): CommonNftEligibilityStatus {
  if (status === 'ELIGIBLE') {
    return CommonNftEligibilityStatus.PENDING_APPROVAL;
  }

  return CommonNftEligibilityStatus[
    status as keyof typeof CommonNftEligibilityStatus
  ];
}

@Injectable()
export class AdminConsoleService {
  constructor(
    private readonly adminConsoleRepository: AdminConsoleRepository,
  ) {}

  async getOverview(): Promise<AdminOverviewView> {
    const overview = await this.adminConsoleRepository.countOverview();

    return {
      ...overview,
      latestEpoch: overview.latestEpoch
        ? {
            epochId: overview.latestEpoch.id,
            epochNo: overview.latestEpoch.epochNo,
            participantCount: overview.latestEpoch.participantCount,
            qualifiedTicketCount: overview.latestEpoch.qualifiedTicketCount,
            status: toCommonEpochStatus(overview.latestEpoch.status),
          }
        : undefined,
    };
  }

  async listPendingPlacements(
    query: AdminPendingPlacementListQuery,
  ): Promise<PaginateData<AdminPendingPlacementItemView>> {
    const page = await this.adminConsoleRepository.listPendingPlacements(query);

    return {
      ...page,
      items: page.items.map((item) => ({
        createdAt: item.createdAt,
        inviteCode: item.inviter?.inviteCode ?? undefined,
        inviterId: item.inviterId!,
        inviterWalletAddress: item.inviter?.walletAddress ?? '',
        userId: item.id,
        walletAddress: item.walletAddress,
      })),
    };
  }

  async listCheckinIssues(
    query: AdminCheckinIssueListQuery,
  ): Promise<PaginateData<AdminCheckinIssueView>> {
    const page = await this.adminConsoleRepository.listCheckinIssues(query);

    return {
      ...page,
      items: page.items.map((item) => ({
        amountAtomic: item.amount.toFixed(0),
        chainId: item.chainId,
        checkinId: item.checkin?.id,
        confirmedAt: item.confirmedAt ?? undefined,
        createdAt: item.createdAt,
        payerAddress: item.payerAddress,
        paymentReceiptId: item.id,
        paymentStatus: item.status,
        txHash: item.txHash ?? undefined,
        txHashKey: item.txHashKey ?? undefined,
        userId: item.user.id,
        walletAddress: item.user.walletAddress,
      })),
    };
  }

  async listClaimIssues(
    query: AdminClaimIssueListQuery,
  ): Promise<PaginateData<AdminClaimIssueView>> {
    const page = await this.adminConsoleRepository.listClaimIssues(query);
    const items =
      page.claimKind === 'NFT_SUBSIDY'
        ? (page.data.items as SubsidyClaimIssueRow[]).map((item) => ({
            amountAtomic: item.amountUsdt.toFixed(0),
            chainId: item.chainId,
            claimKind: 'NFT_SUBSIDY' as const,
            claimedAt: item.claimedAt ?? undefined,
            contractAddress: item.contractAddress ?? undefined,
            createdAt: item.createdAt,
            epochId: item.epochId,
            epochNo: item.epoch.epochNo,
            recordId: item.id,
            status: toCommonClaimStatus(item.status),
            subsidyClaimId: item.id,
            tokenId: item.nftHolding.tokenId.toString(),
            txHash: item.txHash ?? undefined,
            userId: item.user.id,
            walletAddress: item.user.walletAddress,
          }))
        : (page.data.items as MerkleClaimIssueRow[]).map((item) => ({
            amountAtomic: item.amount.toFixed(0),
            chainId: item.chainId,
            claimKind: 'MERKLE' as const,
            claimRecordId: item.id,
            claimType: toCommonClaimType(item.claimType),
            claimedAt: item.claimedAt ?? undefined,
            contractAddress: item.contractAddress ?? undefined,
            createdAt: item.createdAt,
            epochId: item.epochId ?? '',
            epochNo: item.epoch?.epochNo ?? 0,
            recordId: item.id,
            status: toCommonClaimStatus(item.status),
            txHash: item.txHash ?? undefined,
            userId: item.user.id,
            walletAddress: item.user.walletAddress,
          }));

    return {
      ...page.data,
      items,
    };
  }

  async listNftEligibility(
    query: AdminNftEligibilityListQuery,
  ): Promise<PaginateData<AdminNftEligibilityListItemView>> {
    const page = await this.adminConsoleRepository.listNftEligibility(query);

    return {
      ...page,
      items: page.items.map((item) => ({
        approvedAt: item.approvedAt ?? undefined,
        approvedByWallet: item.approvedByWallet ?? undefined,
        createdAt: item.createdAt,
        decisionReason: item.decisionReason ?? undefined,
        expiresAt: item.expiresAt ?? undefined,
        mintedAt: item.mintedAt ?? undefined,
        personalCheckinCount: item.personalCheckinCount,
        rejectedAt: item.rejectedAt ?? undefined,
        rejectedByWallet: item.rejectedByWallet ?? undefined,
        signedAt: item.signedAt ?? undefined,
        smallLegVolumeUsdt: item.smallLegVolumeUsdt.toFixed(0),
        status: toCommonNftEligibilityStatus(item.status),
        updatedAt: item.updatedAt,
        userId: item.user.id,
        walletAddress: item.user.walletAddress,
      })),
    };
  }

  async listAuditLogs(
    query: AdminAuditLogListQuery,
  ): Promise<PaginateData<AdminAuditLogView>> {
    const page = await this.adminConsoleRepository.listAuditLogs(query);

    return {
      ...page,
      items: page.items.map((item) => ({
        action: item.action,
        createdAt: item.createdAt,
        id: item.id,
        operatorWallet: item.operatorWallet ?? undefined,
        payload:
          item.payload && typeof item.payload === 'object'
            ? (item.payload as Record<string, unknown>)
            : undefined,
        targetId: item.targetId ?? undefined,
        targetType: item.targetType ?? undefined,
      })),
    };
  }
}
