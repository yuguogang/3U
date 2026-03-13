import { ClaimStatus, type User } from '@/db';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ClaimStatus as CommonClaimStatus,
  type AdminApproveReferralNftRequest,
  type AdminCheckinRepairPreviewView,
  type AdminCheckinRepairRequest,
  type AdminClaimSyncPreviewView,
  type AdminClaimSyncRequest,
  type AdminEpochSyncPreviewView,
  type AdminEpochSyncRequest,
  type AdminOperationResultEnvelope,
  type AdminRejectReferralNftRequest,
  EpochStatus,
  EpochType as CommonEpochType,
} from '3u-aura-common';
import { CheckinApplicationService } from '../../checkin';
import { ClaimSyncService } from '../../claims';
import { NftEligibilityApplicationService } from '../../nft-eligibility';
import {
  WeeklyEpochApplicationService,
  WeeklyEpochPolicyEngine,
} from '../../epoch';
import { LotteryTicketService } from '../../lottery';
import { AuditTrailService } from '../../audit';
import { AdminConsoleRepository } from '../repositories/admin-console.repository';

type AdminOperator = Pick<User, 'id' | 'walletAddress'>;

function toCommonClaimStatus(status: string): CommonClaimStatus {
  return CommonClaimStatus[status as keyof typeof CommonClaimStatus];
}

function toCommonEpochStatus(status: string): EpochStatus {
  return EpochStatus[status as keyof typeof EpochStatus];
}

@Injectable()
export class AdminOpsService {
  constructor(
    private readonly adminConsoleRepository: AdminConsoleRepository,
    private readonly auditTrailService: AuditTrailService,
    private readonly checkinApplicationService: CheckinApplicationService,
    private readonly claimSyncService: ClaimSyncService,
    private readonly lotteryTicketService: LotteryTicketService,
    private readonly nftEligibilityApplicationService: NftEligibilityApplicationService,
    private readonly weeklyEpochApplicationService: WeeklyEpochApplicationService,
    private readonly weeklyEpochPolicyEngine: WeeklyEpochPolicyEngine,
  ) {}

  async previewCheckinRepair(
    command: AdminCheckinRepairRequest,
  ): Promise<AdminOperationResultEnvelope<AdminCheckinRepairPreviewView>> {
    const user = await this.adminConsoleRepository.findUserById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const txHashKey = `${command.chainId}:${command.txHash.toLowerCase()}`;
    const existingReceipt =
      await this.adminConsoleRepository.findCheckinReceiptByTxHashKey(
        txHashKey,
      );

    return {
      action: 'admin.ops.checkin-repair.preview',
      dryRun: true,
      result: {
        canExecute:
          !existingReceipt ||
          (existingReceipt.user.id === user.id && !existingReceipt.checkin),
        existingCheckinId: existingReceipt?.checkin?.id,
        existingPaymentReceiptId: existingReceipt?.id,
        reason:
          existingReceipt && existingReceipt.user.id !== user.id
            ? 'txHash is already bound to another user'
            : undefined,
        txHashKey,
        userId: user.id,
        walletAddress: user.walletAddress,
      },
    };
  }

  async executeCheckinRepair(
    operator: AdminOperator,
    command: AdminCheckinRepairRequest,
  ) {
    const user = await this.adminConsoleRepository.findUserById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.checkinApplicationService.submitCheckinForUser(
      user,
      {
        amountAtomic: command.amountAtomic,
        chainId: command.chainId,
        payerAddress: command.payerAddress,
        tokenSymbol: 'USDT',
        txHash: command.txHash,
      },
    );

    await this.auditTrailService.record({
      action: 'admin.ops.checkin-repair.execute',
      operatorWallet: operator.walletAddress,
      payload: {
        amountAtomic: command.amountAtomic,
        chainId: command.chainId,
        payerAddress: command.payerAddress,
        txHash: command.txHash,
        userId: command.userId,
      },
      targetId: result.checkinId,
      targetType: 'Checkin',
    });

    return {
      action: 'admin.ops.checkin-repair.execute',
      dryRun: false,
      result,
    };
  }

  async previewClaimSync(
    command: AdminClaimSyncRequest,
  ): Promise<AdminOperationResultEnvelope<AdminClaimSyncPreviewView>> {
    if (command.claimRecordId) {
      const claim = await this.adminConsoleRepository.findMerkleClaimById(
        command.claimRecordId,
      );
      if (!claim) {
        throw new NotFoundException('Merkle claim not found');
      }

      return {
        action: 'admin.ops.claim-sync.preview',
        dryRun: true,
        result: {
          canExecute:
            claim.status !== ClaimStatus.CLAIMED ||
            claim.txHash?.toLowerCase() === command.txHash.toLowerCase(),
          claimKind: 'MERKLE',
          claimRecordId: claim.id,
          currentStatus: toCommonClaimStatus(claim.status),
          reason:
            claim.status === ClaimStatus.CLAIMED &&
            claim.txHash &&
            claim.txHash.toLowerCase() !== command.txHash.toLowerCase()
              ? 'Claim is already synced with a different txHash'
              : undefined,
          txHash: command.txHash,
          userId: claim.user.id,
          walletAddress: claim.user.walletAddress,
        },
      };
    }

    const claim = await this.adminConsoleRepository.findSubsidyClaimById(
      command.subsidyClaimId!,
    );
    if (!claim) {
      throw new NotFoundException('NFT subsidy claim not found');
    }

    return {
      action: 'admin.ops.claim-sync.preview',
      dryRun: true,
      result: {
        canExecute:
          claim.status !== ClaimStatus.CLAIMED ||
          claim.txHash?.toLowerCase() === command.txHash.toLowerCase(),
        claimKind: 'NFT_SUBSIDY',
        currentStatus: toCommonClaimStatus(claim.status),
        reason:
          claim.status === ClaimStatus.CLAIMED &&
          claim.txHash &&
          claim.txHash.toLowerCase() !== command.txHash.toLowerCase()
            ? 'Claim is already synced with a different txHash'
            : undefined,
        subsidyClaimId: claim.id,
        txHash: command.txHash,
        userId: claim.user.id,
        walletAddress: claim.user.walletAddress,
      },
    };
  }

  async executeClaimSync(
    operator: AdminOperator,
    command: AdminClaimSyncRequest,
  ) {
    const preview = await this.previewClaimSync(command);
    if (!preview.result.canExecute) {
      throw new ConflictException(
        preview.result.reason ?? 'Claim sync is blocked',
      );
    }

    const actor = {
      id: preview.result.userId,
      walletAddress: preview.result.walletAddress,
    };
    const result = await this.claimSyncService.syncClaimForUser(actor, command);

    await this.auditTrailService.record({
      action: 'admin.ops.claim-sync.execute',
      operatorWallet: operator.walletAddress,
      payload: command,
      targetId:
        result.claimRecordId ?? result.subsidyClaimId ?? preview.result.userId,
      targetType: 'Claim',
    });

    return {
      action: 'admin.ops.claim-sync.execute',
      dryRun: false,
      result,
    };
  }

  async previewEpochSync(
    command: AdminEpochSyncRequest,
  ): Promise<AdminOperationResultEnvelope<AdminEpochSyncPreviewView>> {
    const projection = this.weeklyEpochPolicyEngine.projectBoundary({
      epochType: CommonEpochType.WEEKLY_PROMOTION,
      referenceAt: command.referenceAt,
    });
    const latestEpochs =
      await this.adminConsoleRepository.listLatestPromotionEpochs(5);

    return {
      action: 'admin.ops.epoch-sync.preview',
      dryRun: true,
      result: {
        currentBoundary: {
          endAt: projection.endAt,
          epochNo: projection.epochNo,
          epochType: CommonEpochType.WEEKLY_PROMOTION,
          startAt: projection.startAt,
          status: projection.status,
        },
        latestEpochs: latestEpochs.map((epoch) => ({
          epochId: epoch.id,
          epochNo: epoch.epochNo,
          participantCount: epoch.participantCount,
          qualifiedTicketCount: epoch.qualifiedTicketCount,
          status: toCommonEpochStatus(epoch.status),
        })),
        referenceAt: projection.referenceAt.toISOString(),
      },
    };
  }

  async executeEpochSync(
    operator: AdminOperator,
    command: AdminEpochSyncRequest,
  ) {
    const lifecycle =
      await this.weeklyEpochApplicationService.syncEpochLifecycle(
        command.referenceAt,
      );
    const processedEpochs: Array<{
      epochId: string;
      rollover: Awaited<
        ReturnType<WeeklyEpochApplicationService['prepareRolloverForEpoch']>
      >;
      ticketRefresh: Awaited<
        ReturnType<LotteryTicketService['refreshEligibilityForEpoch']>
      >;
    }> = [];

    for (const epochId of lifecycle.epochsReadyForQualification) {
      const ticketRefresh =
        await this.lotteryTicketService.refreshEligibilityForEpoch(epochId);
      const rollover =
        await this.weeklyEpochApplicationService.prepareRolloverForEpoch(
          epochId,
        );
      processedEpochs.push({
        epochId,
        rollover,
        ticketRefresh,
      });
    }

    await this.auditTrailService.record({
      action: 'admin.ops.epoch-sync.execute',
      operatorWallet: operator.walletAddress,
      payload: {
        processedEpochIds: lifecycle.epochsReadyForQualification,
        referenceAt: command.referenceAt,
      },
      targetId: lifecycle.currentEpoch.epochId,
      targetType: 'WeeklyEpoch',
    });

    return {
      action: 'admin.ops.epoch-sync.execute',
      dryRun: false,
      result: {
        currentEpoch: lifecycle.currentEpoch,
        processedEpochs,
      },
    };
  }

  async approveReferralNft(
    operator: AdminOperator,
    command: AdminApproveReferralNftRequest,
  ) {
    const result =
      await this.nftEligibilityApplicationService.approveReferralMintEligibility(
        {
          decisionReason: command.decisionReason,
          operatorWallet: operator.walletAddress,
          userId: command.userId,
        },
      );

    await this.auditTrailService.record({
      action: 'admin.ops.nft-eligibility.approve',
      operatorWallet: operator.walletAddress,
      payload: command,
      targetId: command.userId,
      targetType: 'NftReferralEligibility',
    });

    return {
      action: 'admin.ops.nft-eligibility.approve',
      dryRun: false,
      result,
    };
  }

  async rejectReferralNft(
    operator: AdminOperator,
    command: AdminRejectReferralNftRequest,
  ) {
    const result =
      await this.nftEligibilityApplicationService.rejectReferralMintEligibility(
        {
          decisionReason: command.decisionReason,
          operatorWallet: operator.walletAddress,
          userId: command.userId,
        },
      );

    await this.auditTrailService.record({
      action: 'admin.ops.nft-eligibility.reject',
      operatorWallet: operator.walletAddress,
      payload: command,
      targetId: command.userId,
      targetType: 'NftReferralEligibility',
    });

    return {
      action: 'admin.ops.nft-eligibility.reject',
      dryRun: false,
      result,
    };
  }
}
