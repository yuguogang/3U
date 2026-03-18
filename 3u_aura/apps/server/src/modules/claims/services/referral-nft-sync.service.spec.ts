import { NftEligibilityStatus } from '3u-aura-common';
import { NftEligibilityRepository } from '../../nft-eligibility';
import { StatsRepository } from '../../stats';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { NftHoldingRepository } from '../repositories/nft-holding.repository';
import { ReferralNftChainRepository } from '../repositories/referral-nft-chain.repository';
import { ReferralNftSyncService } from './referral-nft-sync.service';

describe('ReferralNftSyncService', () => {
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
    const referralNftChainRepository = {
      getReferralMintByTxHash: jest.fn(),
    };
    const nftHoldingRepository = {
      upsertReferralHolding: jest.fn(),
    };
    const nftEligibilityRepository = {
      markMinted: jest.fn(),
    };
    const statsRepository = {
      ensureUserProfile: jest.fn().mockResolvedValue(undefined),
      setReferralNftFlag: jest.fn().mockResolvedValue(undefined),
    };

    return {
      auditSeam,
      nftEligibilityRepository,
      nftHoldingRepository,
      referralNftChainRepository,
      service: new ReferralNftSyncService(
        auditSeam as unknown as AuditSeamService,
        transactionOrchestrator as unknown as TransactionOrchestratorService,
        referralNftChainRepository as unknown as ReferralNftChainRepository,
        nftHoldingRepository as unknown as NftHoldingRepository,
        nftEligibilityRepository as unknown as NftEligibilityRepository,
        statsRepository as unknown as StatsRepository,
      ),
      statsRepository,
    };
  };

  it('syncs a referral nft mint from an explicit txHash command', async () => {
    const {
      auditSeam,
      nftEligibilityRepository,
      nftHoldingRepository,
      referralNftChainRepository,
      service,
      statsRepository,
    } = createService();
    const mintedAt = new Date('2026-03-18T06:43:56.000Z');

    referralNftChainRepository.getReferralMintByTxHash.mockResolvedValue({
      chainId: 97,
      contractAddress: '0x2222222222222222222222222222222222222222',
      mintTxHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      mintedAt,
      tokenId: 5n,
    });
    nftHoldingRepository.upsertReferralHolding.mockResolvedValue({
      created: true,
      holding: {
        id: 'holding_1',
        tokenId: 5n,
      },
    });
    nftEligibilityRepository.markMinted.mockResolvedValue({
      changed: true,
      eligibility: {
        id: 'eligibility_1',
      },
    });

    const result = await service.syncMintForUser(
      user as never,
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    );

    expect(
      referralNftChainRepository.getReferralMintByTxHash,
    ).toHaveBeenCalledWith({
      recipient: user.walletAddress,
      txHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
    expect(statsRepository.setReferralNftFlag).toHaveBeenCalledWith(
      {
        hasReferralNft: true,
        userId: user.id,
      },
      expect.any(Object),
    );
    expect(nftEligibilityRepository.markMinted).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: 97,
        mintedTokenId: 5n,
        userId: user.id,
      }),
      expect.any(Object),
    );
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'claims.referral-nft.sync' }),
    );
    expect(result).toMatchObject({
      chainId: 97,
      hasReferralNft: true,
      holdingsCreated: 1,
      status: NftEligibilityStatus.MINTED,
      tokenId: '5',
      txHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
    expect(result.mintedAt).toEqual(mintedAt);
  });

  it('returns idempotently for a duplicate referral nft sync', async () => {
    const {
      auditSeam,
      nftEligibilityRepository,
      nftHoldingRepository,
      referralNftChainRepository,
      service,
      statsRepository,
    } = createService();
    const mintedAt = new Date('2026-03-18T06:43:56.000Z');

    referralNftChainRepository.getReferralMintByTxHash.mockResolvedValue({
      chainId: 97,
      contractAddress: '0x2222222222222222222222222222222222222222',
      mintTxHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      mintedAt,
      tokenId: 9n,
    });
    nftHoldingRepository.upsertReferralHolding.mockResolvedValue({
      created: false,
      holding: {
        id: 'holding_1',
        tokenId: 9n,
      },
    });
    nftEligibilityRepository.markMinted.mockResolvedValue({
      changed: false,
      eligibility: {
        id: 'eligibility_1',
      },
    });

    const result = await service.syncMintForUser(
      user as never,
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );

    expect(statsRepository.setReferralNftFlag).toHaveBeenCalledWith(
      {
        hasReferralNft: true,
        userId: user.id,
      },
      expect.any(Object),
    );
    expect(auditSeam.record).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      chainId: 97,
      hasReferralNft: true,
      holdingsCreated: 0,
      status: NftEligibilityStatus.MINTED,
      tokenId: '9',
      txHash:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    expect(result.mintedAt).toEqual(mintedAt);
  });
});
