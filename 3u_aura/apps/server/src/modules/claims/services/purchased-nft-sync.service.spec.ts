import { ClaimStatus, EpochType } from '@/db';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { WeeklyEpochPolicyEngine } from '../../epoch/engines/weekly-epoch-policy.engine';
import { WeeklyEpochRepository } from '../../epoch/repositories/weekly-epoch.repository';
import { StatsRepository } from '../../stats';
import { NftHoldingRepository } from '../repositories/nft-holding.repository';
import { NftSubsidyClaimRepository } from '../repositories/nft-subsidy-claim.repository';
import { PurchasedNftChainRepository } from '../repositories/purchased-nft-chain.repository';
import { PurchasedNftSyncService } from './purchased-nft-sync.service';

describe('PurchasedNftSyncService', () => {
  const user = {
    id: 'user_1',
    walletAddress: '0x1111111111111111111111111111111111111111',
  };

  const createService = () => {
    const auditSeam = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const transactionOrchestrator = {
      run: jest.fn(async (operation) => operation({} as never)),
    };
    const purchasedNftChainRepository = {
      getPurchasedMintByTxHash: jest.fn(),
      listPublishedSubsidyEpochs: jest.fn(),
      listPurchasedMintsForOwner: jest.fn(),
    };
    const nftHoldingRepository = {
      upsertPurchasedHolding: jest.fn(),
    };
    const nftSubsidyClaimRepository = {
      upsertProjectedClaim: jest.fn(),
    };
    const weeklyEpochPolicyEngine = {
      projectEpochByNo: jest.fn(),
    };
    const weeklyEpochRepository = {
      ensureEpoch: jest.fn(),
      findByEpochNo: jest.fn(),
    };
    const statsRepository = {
      ensureUserProfile: jest.fn().mockResolvedValue(undefined),
      setPurchasedNftFlag: jest.fn().mockResolvedValue(undefined),
    };

    return {
      auditSeam,
      nftHoldingRepository,
      nftSubsidyClaimRepository,
      purchasedNftChainRepository,
      service: new PurchasedNftSyncService(
        auditSeam as unknown as AuditSeamService,
        transactionOrchestrator as unknown as TransactionOrchestratorService,
        purchasedNftChainRepository as unknown as PurchasedNftChainRepository,
        nftHoldingRepository as unknown as NftHoldingRepository,
        nftSubsidyClaimRepository as unknown as NftSubsidyClaimRepository,
        weeklyEpochPolicyEngine as unknown as WeeklyEpochPolicyEngine,
        weeklyEpochRepository as unknown as WeeklyEpochRepository,
        statsRepository as unknown as StatsRepository,
      ),
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
    };
  };

  it('syncs a purchased nft from an explicit txHash command', async () => {
    const {
      auditSeam,
      nftHoldingRepository,
      nftSubsidyClaimRepository,
      purchasedNftChainRepository,
      service,
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
    } = createService();
    const mintedAt = new Date('2026-03-15T10:00:00.000Z');

    purchasedNftChainRepository.getPurchasedMintByTxHash.mockResolvedValue({
      chainId: 97,
      contractAddress: '0x2222222222222222222222222222222222222222',
      mintTxHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      mintedAt,
      purchasedPriceUsdt: '1000000000',
      tokenId: 8n,
    });
    purchasedNftChainRepository.listPublishedSubsidyEpochs.mockResolvedValue([
      {
        chainId: 97,
        claimDeadline: new Date('2099-03-22T00:00:00.000Z'),
        contractAddress: '0x3333333333333333333333333333333333333333',
        epochNo: 1,
        maxEligibleTokenId: 10n,
        publishedAt: new Date('2026-03-18T00:00:00.000Z'),
        subsidyAmountUsdt: '30000000',
      },
    ]);
    nftHoldingRepository.upsertPurchasedHolding.mockResolvedValue({
      created: true,
      holding: {
        id: 'holding_1',
        tokenId: 8n,
      },
    });
    weeklyEpochRepository.findByEpochNo.mockResolvedValue(null);
    weeklyEpochPolicyEngine.projectEpochByNo.mockReturnValue({
      endAt: new Date('2026-03-25T00:00:00.000Z'),
      epochNo: 1,
      epochType: 'NFT_SUBSIDY',
      referenceAt: new Date('2026-03-18T00:00:00.000Z'),
      startAt: new Date('2026-03-18T00:00:00.000Z'),
      status: 'OPEN',
    });
    weeklyEpochRepository.ensureEpoch.mockResolvedValue({
      id: 'epoch_1',
      epochNo: 1,
      epochType: EpochType.NFT_SUBSIDY,
    });
    nftSubsidyClaimRepository.upsertProjectedClaim.mockResolvedValue({
      claim: { id: 'claim_1' },
      created: true,
      updated: false,
    });

    const result = await service.syncPurchaseForUser(
      user as never,
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    );

    expect(
      purchasedNftChainRepository.getPurchasedMintByTxHash,
    ).toHaveBeenCalledWith({
      buyer: user.walletAddress,
      txHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
    expect(statsRepository.setPurchasedNftFlag).toHaveBeenCalledWith(
      {
        hasPurchasedNft: true,
        userId: user.id,
      },
      expect.any(Object),
    );
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'claims.purchased-nft.sync' }),
    );
    expect(result).toMatchObject({
      chainId: 97,
      claimsCreated: 1,
      claimsUpdated: 0,
      hasPurchasedNft: true,
      holdingsCreated: 1,
      publishedSubsidyEpochs: 1,
      tokenId: '8',
      txHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
    expect(result.mintedAt).toEqual(mintedAt);
  });

  it('projects purchased holdings and pending subsidy claims for published epochs', async () => {
    const {
      auditSeam,
      nftHoldingRepository,
      nftSubsidyClaimRepository,
      purchasedNftChainRepository,
      service,
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
    } = createService();
    const mintedAt = new Date('2026-03-15T09:00:00.000Z');
    const claimDeadline = new Date('2099-03-22T00:00:00.000Z');

    purchasedNftChainRepository.listPurchasedMintsForOwner.mockResolvedValue([
      {
        chainId: 97,
        contractAddress: '0x2222222222222222222222222222222222222222',
        mintTxHash:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        mintedAt,
        purchasedPriceUsdt: '1000000000',
        tokenId: 7n,
      },
    ]);
    purchasedNftChainRepository.listPublishedSubsidyEpochs.mockResolvedValue([
      {
        chainId: 97,
        claimDeadline,
        contractAddress: '0x3333333333333333333333333333333333333333',
        epochNo: 1,
        maxEligibleTokenId: 9n,
        publishedAt: new Date('2026-03-18T00:00:00.000Z'),
        subsidyAmountUsdt: '30000000',
      },
    ]);
    nftHoldingRepository.upsertPurchasedHolding.mockResolvedValue({
      created: true,
      holding: {
        id: 'holding_1',
        tokenId: 7n,
      },
    });
    weeklyEpochRepository.findByEpochNo.mockResolvedValue(null);
    weeklyEpochPolicyEngine.projectEpochByNo.mockReturnValue({
      endAt: new Date('2026-03-25T00:00:00.000Z'),
      epochNo: 1,
      epochType: 'NFT_SUBSIDY',
      referenceAt: new Date('2026-03-18T00:00:00.000Z'),
      startAt: new Date('2026-03-18T00:00:00.000Z'),
      status: 'OPEN',
    });
    weeklyEpochRepository.ensureEpoch.mockResolvedValue({
      id: 'epoch_1',
      epochNo: 1,
      epochType: EpochType.NFT_SUBSIDY,
    });
    nftSubsidyClaimRepository.upsertProjectedClaim.mockResolvedValue({
      claim: { id: 'claim_1' },
      created: true,
      updated: false,
    });

    const result = await service.syncStateForUser(user as never);

    expect(statsRepository.setPurchasedNftFlag).toHaveBeenCalledWith(
      {
        hasPurchasedNft: true,
        userId: user.id,
      },
      expect.any(Object),
    );
    expect(weeklyEpochRepository.findByEpochNo).toHaveBeenCalledWith(
      EpochType.NFT_SUBSIDY,
      1,
      expect.any(Object),
    );
    expect(nftSubsidyClaimRepository.upsertProjectedClaim).toHaveBeenCalledWith(
      expect.objectContaining({
        contractAddress: '0x3333333333333333333333333333333333333333',
        epochId: 'epoch_1',
        nftHoldingId: 'holding_1',
        status: ClaimStatus.PENDING,
        userId: user.id,
      }),
      expect.any(Object),
    );
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'claims.purchased-nft.sync' }),
    );
    expect(result).toMatchObject({
      claimsCreated: 1,
      claimsUpdated: 0,
      hasPurchasedNft: true,
      holdingsCreated: 1,
      publishedSubsidyEpochs: 1,
    });
    expect(result.activePurchasedTokenIds).toEqual([7n]);
  });

  it('marks the profile as not holding purchased nft when chain state is empty', async () => {
    const { auditSeam, purchasedNftChainRepository, service, statsRepository } =
      createService();

    purchasedNftChainRepository.listPurchasedMintsForOwner.mockResolvedValue([]);
    purchasedNftChainRepository.listPublishedSubsidyEpochs.mockResolvedValue([]);

    const result = await service.syncStateForUser(user as never);

    expect(statsRepository.setPurchasedNftFlag).toHaveBeenCalledWith(
      {
        hasPurchasedNft: false,
        userId: user.id,
      },
      expect.any(Object),
    );
    expect(auditSeam.record).not.toHaveBeenCalled();
    expect(result).toEqual({
      activePurchasedTokenIds: [],
      claimsCreated: 0,
      claimsUpdated: 0,
      hasPurchasedNft: false,
      holdingsCreated: 0,
      publishedSubsidyEpochs: 0,
    });
  });

  it('voids expired subsidy rows instead of exposing them as claimable', async () => {
    const {
      nftHoldingRepository,
      nftSubsidyClaimRepository,
      purchasedNftChainRepository,
      service,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
    } = createService();

    purchasedNftChainRepository.listPurchasedMintsForOwner.mockResolvedValue([
      {
        chainId: 97,
        contractAddress: '0x2222222222222222222222222222222222222222',
        mintTxHash:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        mintedAt: new Date('2026-03-15T09:00:00.000Z'),
        purchasedPriceUsdt: '1000000000',
        tokenId: 4n,
      },
    ]);
    purchasedNftChainRepository.listPublishedSubsidyEpochs.mockResolvedValue([
      {
        chainId: 97,
        claimDeadline: new Date('2026-03-01T00:00:00.000Z'),
        contractAddress: '0x3333333333333333333333333333333333333333',
        epochNo: 1,
        maxEligibleTokenId: 4n,
        publishedAt: new Date('2026-02-20T00:00:00.000Z'),
        subsidyAmountUsdt: '30000000',
      },
    ]);
    nftHoldingRepository.upsertPurchasedHolding.mockResolvedValue({
      created: false,
      holding: {
        id: 'holding_1',
        tokenId: 4n,
      },
    });
    weeklyEpochRepository.findByEpochNo.mockResolvedValue(null);
    weeklyEpochPolicyEngine.projectEpochByNo.mockReturnValue({
      endAt: new Date('2026-03-11T00:00:00.000Z'),
      epochNo: 1,
      epochType: 'NFT_SUBSIDY',
      referenceAt: new Date('2026-02-20T00:00:00.000Z'),
      startAt: new Date('2026-03-04T00:00:00.000Z'),
      status: 'CALCULATING',
    });
    weeklyEpochRepository.ensureEpoch.mockResolvedValue({
      id: 'epoch_1',
      epochNo: 1,
      epochType: EpochType.NFT_SUBSIDY,
    });
    nftSubsidyClaimRepository.upsertProjectedClaim.mockResolvedValue({
      claim: { id: 'claim_1' },
      created: true,
      updated: false,
    });

    await service.syncStateForUser(user as never);

    expect(nftSubsidyClaimRepository.upsertProjectedClaim).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ClaimStatus.VOIDED,
      }),
      expect.any(Object),
    );
  });
});
