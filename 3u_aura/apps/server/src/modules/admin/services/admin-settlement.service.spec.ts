import { EpochStatus } from '3u-aura-common';
import type { User } from '@/db';
import { AdminSettlementService } from './admin-settlement.service';

describe('AdminSettlementService', () => {
  const operator: Pick<User, 'id' | 'walletAddress'> = {
    id: 'admin_1',
    walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };

  const createDecimal = (value: string) => ({
    toFixed: jest.fn().mockReturnValue(value),
  });

  const createService = () => {
    const adminConsoleRepository = {
      listLatestPromotionEpochs: jest.fn(),
    };
    const auditTrailService = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const publicClient = {
      readContract: jest.fn(),
    };
    const promotionChainClientService = {
      getPublicClient: jest.fn().mockReturnValue(publicClient),
      getRuntimeConfig: jest.fn(),
    };
    const purchasedNftChainRepository = {
      getCurrentChainTimestamp: jest.fn(),
      listPublishedSubsidyEpochs: jest.fn(),
      previewSubsidyEpochPublication: jest.fn(),
    };
    const nftHoldingRepository = {
      countActivePurchasedHoldings: jest.fn(),
    };
    const nftSubsidyClaimRepository = {
      countProjectedClaimsForEpoch: jest.fn(),
    };
    const rewardPublicationService = {
      previewEpochRewardPublication: jest.fn(),
    };
    const rewardsService = {
      materializeEpochRewards: jest.fn(),
      publishEpochRewards: jest.fn(),
    };
    const weeklyEpochApplicationService = {
      getBoundary: jest.fn(),
    };
    const weeklyEpochPolicyEngine = {
      getSettings: jest.fn(),
    };
    const weeklyEpochRepository = {
      findByEpochNo: jest.fn(),
    };

    const service = new AdminSettlementService(
      adminConsoleRepository as never,
      auditTrailService as never,
      promotionChainClientService as never,
      purchasedNftChainRepository as never,
      nftHoldingRepository as never,
      nftSubsidyClaimRepository as never,
      rewardPublicationService as never,
      rewardsService as never,
      weeklyEpochApplicationService as never,
      weeklyEpochPolicyEngine as never,
      weeklyEpochRepository as never,
    );

    return {
      adminConsoleRepository,
      nftHoldingRepository,
      nftSubsidyClaimRepository,
      publicClient,
      promotionChainClientService,
      purchasedNftChainRepository,
      rewardPublicationService,
      service,
      weeklyEpochApplicationService,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
    };
  };

  it('builds weekly settlement overview with operator roles and wallet actions', async () => {
    const {
      adminConsoleRepository,
      promotionChainClientService,
      rewardPublicationService,
      service,
      weeklyEpochApplicationService,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
    } = createService();

    promotionChainClientService.getRuntimeConfig.mockReturnValue({
      adminAllowlistWallets: [operator.walletAddress],
      chainId: 97,
      checkinReceiverAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
      merkleDistributorAddress: '0xdddddddddddddddddddddddddddddddddddddddd',
      ownerAddress: operator.walletAddress,
      paymentTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      rewardFunderAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      rootPublisherAddress: operator.walletAddress,
      rpcUrl: 'http://127.0.0.1:8545',
      settlementAddress: '0xffffffffffffffffffffffffffffffffffffffff',
      settlementPublisherAddress: '0x9999999999999999999999999999999999999999',
      startAt: '2026-03-27T00:00:00.000Z',
    });
    weeklyEpochPolicyEngine.getSettings.mockReturnValue({
      epochLengthDays: 7,
      minimumParticipants: 12,
      ticketStreakDays: 7,
      timezone: 'Asia/Shanghai',
    });
    weeklyEpochApplicationService.getBoundary.mockResolvedValue({
      endAt: new Date('2026-04-10T00:00:00.000Z'),
      epochId: 'epoch_2',
      epochNo: 2,
      epochType: 'WEEKLY_PROMOTION',
      startAt: new Date('2026-04-03T00:00:00.000Z'),
      status: EpochStatus.OPEN,
    });
    adminConsoleRepository.listLatestPromotionEpochs.mockResolvedValue([
      {
        epochNo: 1,
        id: 'epoch_1',
        participantCount: 18,
        qualifiedTicketCount: 20,
        status: 'CALCULATING',
      },
    ]);
    weeklyEpochRepository.findByEpochNo.mockResolvedValue({
      endAt: new Date('2026-04-03T00:00:00.000Z'),
      epochNo: 1,
      id: 'epoch_1',
      lotteryPoolUsdt: createDecimal('21000000'),
      merkleRoot: null,
      participantCount: 18,
      qualifiedTicketCount: 20,
      rankingPoolUsdt: createDecimal('9000000'),
      rewardJsonUri: null,
      rolloverUsdt: createDecimal('0'),
      snapshotAt: null,
      startAt: new Date('2026-03-27T00:00:00.000Z'),
      status: 'CALCULATING',
    });
    rewardPublicationService.previewEpochRewardPublication.mockResolvedValue({
      allowanceSatisfied: true,
      balanceSatisfied: false,
      blockers: [
        'weekly root is not published on-chain with the draft merkle root',
        'merkle distributor balance is lower than the total weekly reward amount',
      ],
      canActivate: false,
      claimCount: 2,
      dbActivated: false,
      distributorBalanceAtomic: '1000000',
      draftMerkleRoot:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      epochId: 'epoch_1',
      epochNo: 1,
      epochStatus: EpochStatus.CALCULATING,
      expectedRewardFunderAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      fundingSatisfied: false,
      fundingSourceKind: 'CHECKIN_RECEIVER',
      onChainMerkleRoot:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      rewardFunderAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      rewardFunderAllowanceAtomic: '32750000',
      rewardFunderBalanceAtomic: '50000000',
      rootPublished: false,
      totalRewardAmountAtomic: '32750000',
      totalRewardAmountUsdt: '32.75',
    });

    const result = await service.getWeeklySettlement(operator, { epochNo: 1 });

    expect(result.chainId).toBe(97);
    expect(result.operatorWallet).toBe(operator.walletAddress);
    expect(
      result.roles.find((role) => role.key === 'ROOT_PUBLISHER')
        ?.matchesOperator,
    ).toBe(true);
    expect(
      result.steps.find((step) => step.key === 'FUND_DISTRIBUTOR'),
    ).toMatchObject({
      action: {
        args: ['32750000'],
        contractAddress: '0xdddddddddddddddddddddddddddddddddddddddd',
        enabled: true,
        functionName: 'depositRewardsFromFunder',
      },
      status: 'READY',
    });
    expect(
      result.steps.find((step) => step.key === 'PUBLISH_ROOT'),
    ).toMatchObject({
      status: 'BLOCKED',
    });
    expect(result.totalRewardAmountUsdt).toBe('32.75');
  });

  it('previews subsidy publication with chain action args when operator is eligible', async () => {
    const {
      nftHoldingRepository,
      publicClient,
      promotionChainClientService,
      purchasedNftChainRepository,
      service,
    } = createService();

    promotionChainClientService.getRuntimeConfig.mockReturnValue({
      adminAllowlistWallets: [operator.walletAddress],
      chainId: 97,
      financeWalletAddress: '0x1212121212121212121212121212121212121212',
      ownerAddress: operator.walletAddress,
      paymentTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      rewardFunderAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      rootPublisherAddress: '0x1313131313131313131313131313131313131313',
      rpcUrl: 'http://127.0.0.1:8545',
      settlementAddress: '0xffffffffffffffffffffffffffffffffffffffff',
      settlementPublisherAddress: '0x1414141414141414141414141414141414141414',
      startAt: '2026-03-27T00:00:00.000Z',
    });
    purchasedNftChainRepository.getCurrentChainTimestamp.mockResolvedValue(
      new Date('2026-04-02T00:00:00.000Z'),
    );
    nftHoldingRepository.countActivePurchasedHoldings.mockResolvedValue(3);
    purchasedNftChainRepository.previewSubsidyEpochPublication.mockResolvedValue(
      {
        contractAddress: '0xffffffffffffffffffffffffffffffffffffffff',
        founderNftAddress: '0x1515151515151515151515151515151515151515',
        maxSubsidyEpochs: 24,
        purchasedSupply: 3,
      },
    );
    publicClient.readContract
      .mockResolvedValueOnce(90_000_000n)
      .mockResolvedValueOnce(90_000_000n);

    const result = await service.previewSubsidyPublication(operator, {
      claimDeadline: '2026-04-10T00:00:00.000Z',
      epochNo: 2,
      subsidyAmountAtomic: '30000000',
    });

    expect(result.action).toBe('admin.ops.subsidy.publish.preview');
    expect(result.dryRun).toBe(true);
    expect(result.result.canPublish).toBe(true);
    expect(result.result.chainPurchasedSupply).toBe(3);
    expect(result.result.dbActivePurchasedSupply).toBe(3);
    expect(result.result.dbProjectionGapCount).toBe(0);
    expect(result.result.estimatedFundingAmountAtomic).toBe('90000000');
    expect(result.result.walletAction).toMatchObject({
      args: ['2', '30000000', '1775779200'],
      contractAddress: '0xffffffffffffffffffffffffffffffffffffffff',
      enabled: true,
      functionName: 'publishSubsidyEpoch',
    });
    expect(result.result.roles.find((role) => role.key === 'OWNER')).toEqual(
      expect.objectContaining({
        matchesOperator: true,
      }),
    );
  });

  it('blocks subsidy publication when db purchased holdings lag behind chain supply', async () => {
    const {
      nftHoldingRepository,
      publicClient,
      promotionChainClientService,
      purchasedNftChainRepository,
      service,
    } = createService();

    promotionChainClientService.getRuntimeConfig.mockReturnValue({
      adminAllowlistWallets: [operator.walletAddress],
      chainId: 97,
      financeWalletAddress: '0x1212121212121212121212121212121212121212',
      ownerAddress: operator.walletAddress,
      paymentTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      rewardFunderAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      rootPublisherAddress: '0x1313131313131313131313131313131313131313',
      rpcUrl: 'http://127.0.0.1:8545',
      settlementAddress: '0xffffffffffffffffffffffffffffffffffffffff',
      settlementPublisherAddress: '0x1414141414141414141414141414141414141414',
      startAt: '2026-03-27T00:00:00.000Z',
    });
    purchasedNftChainRepository.getCurrentChainTimestamp.mockResolvedValue(
      new Date('2026-04-02T00:00:00.000Z'),
    );
    purchasedNftChainRepository.previewSubsidyEpochPublication.mockResolvedValue(
      {
        contractAddress: '0xffffffffffffffffffffffffffffffffffffffff',
        founderNftAddress: '0x1515151515151515151515151515151515151515',
        maxSubsidyEpochs: 24,
        purchasedSupply: 12,
      },
    );
    nftHoldingRepository.countActivePurchasedHoldings.mockResolvedValue(8);
    publicClient.readContract
      .mockResolvedValueOnce(360_000_000n)
      .mockResolvedValueOnce(360_000_000n);

    const result = await service.previewSubsidyPublication(operator, {
      claimDeadline: '2026-04-10T00:00:00.000Z',
      epochNo: 2,
      subsidyAmountAtomic: '30000000',
    });

    expect(result.result.canPublish).toBe(false);
    expect(result.result.dbProjectionGapCount).toBe(4);
    expect(result.result.blockers).toContain(
      'DB purchased NFT projection is behind chain supply (8/12)',
    );
  });
});
