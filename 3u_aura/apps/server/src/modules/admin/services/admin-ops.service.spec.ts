import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClaimStatus, EpochStatus, EpochType } from '3u-aura-common';
import type { User } from '@/db';
import { AdminOpsService } from './admin-ops.service';

describe('AdminOpsService', () => {
  const operator: Pick<User, 'id' | 'walletAddress'> = {
    id: 'admin_1',
    walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };

  const createService = () => {
    const adminConsoleRepository = {
      findCheckinReceiptByTxHashKey: jest.fn(),
      findMerkleClaimById: jest.fn(),
      findSubsidyClaimById: jest.fn(),
      findUserById: jest.fn(),
      listLatestPromotionEpochs: jest.fn(),
    };
    const auditTrailService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const checkinApplicationService = {
      submitCheckinForUser: jest.fn(),
    };
    const claimSyncService = {
      syncClaimForUser: jest.fn(),
    };
    const lotteryTicketService = {
      refreshEligibilityForEpoch: jest.fn(),
    };
    const nftEligibilityApplicationService = {
      approveReferralMintEligibility: jest.fn(),
      rejectReferralMintEligibility: jest.fn(),
    };
    const rewardPublicationService = {
      activateEpochRewardPublication: jest.fn(),
      previewEpochRewardPublication: jest.fn(),
    };
    const weeklyEpochApplicationService = {
      prepareRolloverForEpoch: jest.fn(),
      syncEpochLifecycle: jest.fn(),
    };
    const weeklyEpochPolicyEngine = {
      projectBoundary: jest.fn(),
    };

    const service = new AdminOpsService(
      adminConsoleRepository as never,
      auditTrailService as never,
      checkinApplicationService as never,
      claimSyncService as never,
      lotteryTicketService as never,
      nftEligibilityApplicationService as never,
      rewardPublicationService as never,
      weeklyEpochApplicationService as never,
      weeklyEpochPolicyEngine as never,
    );

    return {
      adminConsoleRepository,
      auditTrailService,
      checkinApplicationService,
      claimSyncService,
      lotteryTicketService,
      nftEligibilityApplicationService,
      rewardPublicationService,
      service,
      weeklyEpochApplicationService,
      weeklyEpochPolicyEngine,
    };
  };

  it('blocks preview check-in repair when the txHash already belongs to another user', async () => {
    const { adminConsoleRepository, service } = createService();
    adminConsoleRepository.findUserById.mockResolvedValue({
      id: 'user_1',
      walletAddress: '0x1111111111111111111111111111111111111111',
    });
    adminConsoleRepository.findCheckinReceiptByTxHashKey.mockResolvedValue({
      checkin: null,
      id: 'receipt_1',
      user: {
        id: 'user_2',
      },
    });

    await expect(
      service.previewCheckinRepair({
        amountAtomic: '3000000',
        chainId: 97,
        payerAddress: '0x1111111111111111111111111111111111111111',
        txHash:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        userId: 'user_1',
      }),
    ).resolves.toEqual({
      action: 'admin.ops.checkin-repair.preview',
      dryRun: true,
      result: {
        canExecute: false,
        existingCheckinId: undefined,
        existingPaymentReceiptId: 'receipt_1',
        reason: 'txHash is already bound to another user',
        txHashKey:
          '97:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        userId: 'user_1',
        walletAddress: '0x1111111111111111111111111111111111111111',
      },
    });
  });

  it('surfaces claimed claim previews as non-executable when txHash differs', async () => {
    const { adminConsoleRepository, service } = createService();
    adminConsoleRepository.findMerkleClaimById.mockResolvedValue({
      id: 'claim_1',
      status: 'CLAIMED',
      txHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      user: {
        id: 'user_1',
        walletAddress: '0x1111111111111111111111111111111111111111',
      },
    });

    const result = await service.previewClaimSync({
      claimRecordId: 'claim_1',
      txHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });

    expect(result).toEqual({
      action: 'admin.ops.claim-sync.preview',
      dryRun: true,
      result: {
        canExecute: false,
        claimKind: 'MERKLE',
        claimRecordId: 'claim_1',
        currentStatus: ClaimStatus.CLAIMED,
        reason: 'Claim is already synced with a different txHash',
        txHash:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        userId: 'user_1',
        walletAddress: '0x1111111111111111111111111111111111111111',
      },
    });
  });

  it('maps preview epoch sync into shared epoch statuses', async () => {
    const { adminConsoleRepository, service, weeklyEpochPolicyEngine } =
      createService();
    weeklyEpochPolicyEngine.projectBoundary.mockReturnValue({
      endAt: new Date('2026-03-16T00:00:00.000Z'),
      epochNo: 5,
      referenceAt: new Date('2026-03-12T00:00:00.000Z'),
      startAt: new Date('2026-03-09T00:00:00.000Z'),
      status: EpochStatus.OPEN,
    });
    adminConsoleRepository.listLatestPromotionEpochs.mockResolvedValue([
      {
        epochNo: 4,
        id: 'epoch_4',
        participantCount: 18,
        qualifiedTicketCount: 18,
        status: 'CALCULATING',
      },
    ]);

    const result = await service.previewEpochSync({
      referenceAt: '2026-03-12T00:00:00.000Z',
    });

    expect(result).toEqual({
      action: 'admin.ops.epoch-sync.preview',
      dryRun: true,
      result: {
        currentBoundary: {
          endAt: new Date('2026-03-16T00:00:00.000Z'),
          epochNo: 5,
          epochType: EpochType.WEEKLY_PROMOTION,
          startAt: new Date('2026-03-09T00:00:00.000Z'),
          status: EpochStatus.OPEN,
        },
        latestEpochs: [
          {
            epochId: 'epoch_4',
            epochNo: 4,
            participantCount: 18,
            qualifiedTicketCount: 18,
            status: EpochStatus.CALCULATING,
          },
        ],
        referenceAt: '2026-03-12T00:00:00.000Z',
      },
    });
  });

  it('throws conflict on executeClaimSync when preview says execution is blocked', async () => {
    const { adminConsoleRepository, service } = createService();
    adminConsoleRepository.findMerkleClaimById.mockResolvedValue({
      id: 'claim_1',
      status: 'CLAIMED',
      txHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      user: {
        id: 'user_1',
        walletAddress: '0x1111111111111111111111111111111111111111',
      },
    });

    await expect(
      service.executeClaimSync(operator, {
        claimRecordId: 'claim_1',
        txHash:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('previews reward publication through the reward publication service', async () => {
    const { rewardPublicationService, service } = createService();
    rewardPublicationService.previewEpochRewardPublication.mockResolvedValue({
      allowanceSatisfied: true,
      balanceSatisfied: true,
      blockers: [],
      canActivate: true,
      claimCount: 2,
      dbActivated: false,
      distributorBalanceAtomic: '32750000',
      draftMerkleRoot:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      epochId: 'epoch_3',
      epochNo: 3,
      epochStatus: EpochStatus.CALCULATING,
      expectedRewardFunderAddress:
        '0x1111111111111111111111111111111111111111',
      fundingSatisfied: true,
      fundingSourceKind: 'CHECKIN_RECEIVER',
      onChainMerkleRoot:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      rewardFunderAddress: '0x1111111111111111111111111111111111111111',
      rewardFunderAllowanceAtomic: '32750000',
      rewardFunderBalanceAtomic: '50000000',
      rootPublished: true,
      totalRewardAmountAtomic: '32750000',
      totalRewardAmountUsdt: '32.75',
    });

    const result = await service.previewRewardPublication({ epochNo: 3 });

    expect(result.action).toBe('admin.ops.rewards.publish.preview');
    expect(result.dryRun).toBe(true);
    expect(result.result.epochNo).toBe(3);
  });

  it('records audit when activating reward publication', async () => {
    const { auditTrailService, rewardPublicationService, service } =
      createService();
    rewardPublicationService.activateEpochRewardPublication.mockResolvedValue({
      activated: true,
      allowanceSatisfied: true,
      balanceSatisfied: true,
      blockers: [],
      canActivate: true,
      claimCount: 2,
      dbActivated: false,
      distributorBalanceAtomic: '32750000',
      draftMerkleRoot:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      epochId: 'epoch_3',
      epochNo: 3,
      epochStatus: EpochStatus.CALCULATING,
      expectedRewardFunderAddress:
        '0x1111111111111111111111111111111111111111',
      fundingSatisfied: true,
      fundingSourceKind: 'CHECKIN_RECEIVER',
      onChainMerkleRoot:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      rewardFunderAddress: '0x1111111111111111111111111111111111111111',
      rewardFunderAllowanceAtomic: '32750000',
      rewardFunderBalanceAtomic: '50000000',
      rewardJsonUri: 'ipfs://weekly-root.json',
      rootPublished: true,
      totalRewardAmountAtomic: '32750000',
      totalRewardAmountUsdt: '32.75',
    });

    const result = await service.executeRewardPublication(operator, {
      epochNo: 3,
      rewardJsonUri: 'ipfs://weekly-root.json',
    });

    expect(result.action).toBe('admin.ops.rewards.publish.execute');
    expect(auditTrailService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.ops.rewards.publish.execute',
        operatorWallet: operator.walletAddress,
        targetId: 'epoch_3',
      }),
    );
  });

  it('throws not found for previewCheckinRepair when the target user does not exist', async () => {
    const { adminConsoleRepository, service } = createService();
    adminConsoleRepository.findUserById.mockResolvedValue(null);

    await expect(
      service.previewCheckinRepair({
        amountAtomic: '3000000',
        chainId: 97,
        payerAddress: '0x1111111111111111111111111111111111111111',
        txHash:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        userId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records audit and returns the updated view when approving referral eligibility', async () => {
    const { auditTrailService, nftEligibilityApplicationService, service } =
      createService();
    nftEligibilityApplicationService.approveReferralMintEligibility.mockResolvedValue(
      {
        approvedAt: new Date('2026-03-12T12:00:00.000Z'),
        personalCheckinCount: 30,
        requiredCheckinCount: 30,
        requiredSmallLegUsdt: '6000000000',
        smallLegVolumeUsdt: '7000000000',
        status: 'APPROVED',
        userId: 'user_1',
      },
    );

    const result = await service.approveReferralNft(operator, {
      decisionReason: 'looks good',
      userId: 'user_1',
    });

    expect(result.action).toBe('admin.ops.nft-eligibility.approve');
    expect(auditTrailService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.ops.nft-eligibility.approve',
        operatorWallet: operator.walletAddress,
        targetId: 'user_1',
      }),
    );
  });

  it('records audit and returns the updated view when rejecting referral eligibility', async () => {
    const { auditTrailService, nftEligibilityApplicationService, service } =
      createService();
    nftEligibilityApplicationService.rejectReferralMintEligibility.mockResolvedValue(
      {
        decisionReason: 'manual review failed',
        personalCheckinCount: 30,
        rejectedAt: new Date('2026-03-12T12:00:00.000Z'),
        requiredCheckinCount: 30,
        requiredSmallLegUsdt: '6000000000',
        smallLegVolumeUsdt: '7000000000',
        status: 'REJECTED',
        userId: 'user_1',
      },
    );

    const result = await service.rejectReferralNft(operator, {
      decisionReason: 'manual review failed',
      userId: 'user_1',
    });

    expect(result.action).toBe('admin.ops.nft-eligibility.reject');
    expect(auditTrailService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.ops.nft-eligibility.reject',
        operatorWallet: operator.walletAddress,
        targetId: 'user_1',
      }),
    );
  });
});
