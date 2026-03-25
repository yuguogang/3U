import { ConflictException, NotFoundException } from '@nestjs/common';
import { EpochStatus as CommonEpochStatus } from '3u-aura-common';
import { EpochStatus as DbEpochStatus } from '@/db';
import { RewardPublicationService } from './reward-publication.service';

describe('RewardPublicationService', () => {
  const createService = () => {
    const merkleDraftService = {
      inspectDraftForEpoch: jest.fn(),
    };
    const publicClient = {
      readContract: jest.fn(),
    };
    const promotionChainClientService = {
      getPublicClient: jest.fn().mockReturnValue(publicClient),
      getRuntimeConfig: jest.fn().mockReturnValue({
        checkinReceiverAddress: '0x1111111111111111111111111111111111111111',
        merkleDistributorAddress: '0x2222222222222222222222222222222222222222',
        paymentTokenAddress: '0x3333333333333333333333333333333333333333',
        rewardFunderAddress: '0x1111111111111111111111111111111111111111',
        rpcUrl: 'http://127.0.0.1:18545',
        startAt: '2026-03-11T00:00:00+08:00',
        chainId: 97,
      }),
    };
    const rewardsService = {
      activateEpochRewards: jest.fn().mockResolvedValue({
        epochId: 'epoch_3',
        merkle: {
          claimCount: 3,
          merkleRoot:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
        mode: 'activate',
      }),
    };
    const transactionOrchestrator = {
      run: jest.fn(async (operation: (tx: object) => Promise<unknown>) =>
        operation({}),
      ),
    };
    const weeklyEpochRepository = {
      findByEpochNo: jest.fn(),
    };
    const weeklyRewardRepository = {
      listRewardsByTypes: jest.fn(),
    };

    const service = new RewardPublicationService(
      merkleDraftService as never,
      promotionChainClientService as never,
      rewardsService as never,
      transactionOrchestrator as never,
      weeklyEpochRepository as never,
      weeklyRewardRepository as never,
    );

    return {
      merkleDraftService,
      promotionChainClientService,
      publicClient,
      rewardsService,
      service,
      weeklyEpochRepository,
      weeklyRewardRepository,
    };
  };

  it('builds a ready-to-activate preview when root and funding are on-chain', async () => {
    const {
      merkleDraftService,
      publicClient,
      service,
      weeklyEpochRepository,
      weeklyRewardRepository,
    } = createService();
    weeklyEpochRepository.findByEpochNo.mockResolvedValue({
      epochNo: 3,
      id: 'epoch_3',
      status: DbEpochStatus.CALCULATING,
    });
    weeklyRewardRepository.listRewardsByTypes.mockResolvedValue([
      { amountUsdt: { toFixed: () => '18750000' } },
      { amountUsdt: { toFixed: () => '14000000' } },
    ]);
    merkleDraftService.inspectDraftForEpoch.mockResolvedValue({
      claimCount: 2,
      merkleRoot:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    publicClient.readContract
      .mockResolvedValueOnce('0x1111111111111111111111111111111111111111')
      .mockResolvedValueOnce(
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      )
      .mockResolvedValueOnce(32750000n)
      .mockResolvedValueOnce(50000000n)
      .mockResolvedValueOnce(32750000n);

    const result = await service.previewEpochRewardPublication(3);

    expect(result.canActivate).toBe(true);
    expect(result.rootPublished).toBe(true);
    expect(result.fundingSatisfied).toBe(true);
    expect(result.totalRewardAmountAtomic).toBe('32750000');
    expect(result.totalRewardAmountUsdt).toBe('32.75');
  });

  it('surfaces blockers when on-chain root or funding is missing', async () => {
    const {
      merkleDraftService,
      publicClient,
      service,
      weeklyEpochRepository,
      weeklyRewardRepository,
    } = createService();
    weeklyEpochRepository.findByEpochNo.mockResolvedValue({
      epochNo: 3,
      id: 'epoch_3',
      status: DbEpochStatus.CALCULATING,
    });
    weeklyRewardRepository.listRewardsByTypes.mockResolvedValue([
      { amountUsdt: { toFixed: () => '18750000' } },
    ]);
    merkleDraftService.inspectDraftForEpoch.mockResolvedValue({
      claimCount: 1,
      merkleRoot:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    publicClient.readContract
      .mockResolvedValueOnce('0x1111111111111111111111111111111111111111')
      .mockResolvedValueOnce(
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      )
      .mockResolvedValueOnce(1000000n)
      .mockResolvedValueOnce(1000000n)
      .mockResolvedValueOnce(1000000n);

    const result = await service.previewEpochRewardPublication(3);

    expect(result.canActivate).toBe(false);
    expect(result.blockers).toContain(
      'weekly root is not published on-chain with the draft merkle root',
    );
    expect(result.blockers).toContain(
      'merkle distributor balance is lower than the total weekly reward amount',
    );
  });

  it('throws when the epoch cannot be found', async () => {
    const { service, weeklyEpochRepository } = createService();
    weeklyEpochRepository.findByEpochNo.mockResolvedValue(null);

    await expect(service.previewEpochRewardPublication(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('activates the epoch only after a ready preview', async () => {
    const { service, rewardsService } = createService();
    jest
      .spyOn(service, 'previewEpochRewardPublication')
      .mockResolvedValueOnce({
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
        epochStatus: CommonEpochStatus.CALCULATING,
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

    const result = await service.activateEpochRewardPublication(
      3,
      'ipfs://weekly-root.json',
    );

    expect(rewardsService.activateEpochRewards).toHaveBeenCalledWith(
      'epoch_3',
      'ipfs://weekly-root.json',
    );
    expect(result.activated).toBe(true);
  });

  it('blocks activation when preview still has blockers', async () => {
    const { service } = createService();
    jest
      .spyOn(service, 'previewEpochRewardPublication')
      .mockResolvedValueOnce({
        allowanceSatisfied: false,
        balanceSatisfied: false,
        blockers: ['weekly root is not published on-chain with the draft merkle root'],
        canActivate: false,
        claimCount: 1,
        dbActivated: false,
        distributorBalanceAtomic: '0',
        draftMerkleRoot:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        epochId: 'epoch_3',
        epochNo: 3,
        epochStatus: CommonEpochStatus.CALCULATING,
        expectedRewardFunderAddress:
          '0x1111111111111111111111111111111111111111',
        fundingSatisfied: false,
        fundingSourceKind: 'CHECKIN_RECEIVER',
        onChainMerkleRoot:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        rewardFunderAddress: '0x1111111111111111111111111111111111111111',
        rewardFunderAllowanceAtomic: '0',
        rewardFunderBalanceAtomic: '0',
        rootPublished: false,
        totalRewardAmountAtomic: '18750000',
        totalRewardAmountUsdt: '18.75',
      });

    await expect(service.activateEpochRewardPublication(3)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
