import { ClaimStatus, ClaimType } from '@/db';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WeeklyRewardRepository } from '../../rewards/repositories/weekly-reward.repository';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { ClaimSyncChainRepository } from '../repositories/claim-sync-chain.repository';
import { ClaimRecordRepository } from '../repositories/claim-record.repository';
import { NftSubsidyClaimRepository } from '../repositories/nft-subsidy-claim.repository';
import { ClaimSyncService } from './claim-sync.service';
import { PromotionChainClientService } from '../../shared';

describe('ClaimSyncService', () => {
  const user = {
    id: 'user_1',
    walletAddress: '0x1111111111111111111111111111111111111111',
  };
  const merkleTxHash =
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const subsidyTxHash =
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  const createService = () => {
    const auditSeam = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const transactionOrchestrator = {
      run: jest.fn(async (operation) => operation({} as never)),
    };
    const claimSyncChainRepository = {
      verifyMerkleClaim: jest.fn(),
      verifySubsidyClaim: jest.fn(),
    };
    const claimRecordRepository = {
      findMerkleClaimForSync: jest.fn(),
      markClaimed: jest.fn().mockResolvedValue(undefined),
    };
    const nftSubsidyClaimRepository = {
      findClaimForSync: jest.fn(),
      markClaimed: jest.fn().mockResolvedValue(undefined),
    };
    const weeklyRewardRepository = {
      markRewardClaimed: jest.fn().mockResolvedValue(undefined),
    };
    const promotionChainClientService = {
      getRuntimeConfig: jest.fn().mockReturnValue({
        chainId: 97,
        merkleDistributorAddress: '0x9999999999999999999999999999999999999999',
        settlementAddress: '0x8888888888888888888888888888888888888888',
      }),
    };

    return {
      auditSeam,
      claimRecordRepository,
      claimSyncChainRepository,
      nftSubsidyClaimRepository,
      promotionChainClientService,
      service: new ClaimSyncService(
        auditSeam as unknown as AuditSeamService,
        transactionOrchestrator as unknown as TransactionOrchestratorService,
        claimSyncChainRepository as unknown as ClaimSyncChainRepository,
        claimRecordRepository as unknown as ClaimRecordRepository,
        nftSubsidyClaimRepository as unknown as NftSubsidyClaimRepository,
        promotionChainClientService as unknown as PromotionChainClientService,
        weeklyRewardRepository as unknown as WeeklyRewardRepository,
      ),
      weeklyRewardRepository,
    };
  };

  it('syncs a confirmed merkle claim and marks the reward claimed', async () => {
    const {
      auditSeam,
      claimRecordRepository,
      claimSyncChainRepository,
      service,
      weeklyRewardRepository,
    } = createService();
    const claimedAt = new Date('2026-03-12T10:00:00.000Z');

    claimRecordRepository.findMerkleClaimForSync.mockResolvedValue({
      chainId: 97,
      claimType: ClaimType.MERKLE_LOTTERY,
      claimedAt: null,
      contractAddress: '0x9999999999999999999999999999999999999999',
      epoch: { epochNo: 5 },
      id: 'claim_1',
      merkleIndex: 12,
      rewardId: 'reward_1',
      status: ClaimStatus.CLAIMABLE,
      txHash: null,
    });
    claimSyncChainRepository.verifyMerkleClaim.mockResolvedValue({
      claimedAt,
      txHash: merkleTxHash,
    });

    const result = await service.syncClaimForUser(user as never, {
      claimRecordId: 'claim_1',
      txHash: merkleTxHash,
    });

    expect(claimRecordRepository.markClaimed).toHaveBeenCalledWith(
      {
        claimRecordId: 'claim_1',
        claimedAt,
        txHash: merkleTxHash,
        txHashKey: `97:${merkleTxHash}`,
      },
      expect.any(Object),
    );
    expect(weeklyRewardRepository.markRewardClaimed).toHaveBeenCalledWith(
      {
        claimedAt,
        rewardId: 'reward_1',
      },
      expect.any(Object),
    );
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'claims.sync.merkle' }),
    );
    expect(result).toEqual({
      chainId: 97,
      claimRecordId: 'claim_1',
      claimedAt,
      status: ClaimStatus.CLAIMED,
      txHash: merkleTxHash,
    });
  });

  it('returns the existing claim result for the same txHash', async () => {
    const { claimRecordRepository, service } = createService();
    const claimedAt = new Date('2026-03-12T10:00:00.000Z');

    claimRecordRepository.findMerkleClaimForSync.mockResolvedValue({
      chainId: 97,
      claimType: ClaimType.MERKLE_RANKING,
      claimedAt,
      contractAddress: '0x9999999999999999999999999999999999999999',
      epoch: { epochNo: 5 },
      id: 'claim_1',
      merkleIndex: 9,
      rewardId: 'reward_1',
      status: ClaimStatus.CLAIMED,
      txHash: merkleTxHash,
    });

    await expect(
      service.syncClaimForUser(user as never, {
        claimRecordId: 'claim_1',
        txHash: merkleTxHash,
      }),
    ).resolves.toEqual({
      chainId: 97,
      claimRecordId: 'claim_1',
      claimedAt,
      status: ClaimStatus.CLAIMED,
      txHash: merkleTxHash,
    });
  });

  it('rejects a different txHash for an already-synced claim', async () => {
    const { claimRecordRepository, service } = createService();

    claimRecordRepository.findMerkleClaimForSync.mockResolvedValue({
      chainId: 97,
      claimType: ClaimType.MERKLE_LOTTERY,
      claimedAt: new Date('2026-03-12T10:00:00.000Z'),
      contractAddress: '0x9999999999999999999999999999999999999999',
      epoch: { epochNo: 5 },
      id: 'claim_1',
      merkleIndex: 12,
      rewardId: 'reward_1',
      status: ClaimStatus.CLAIMED,
      txHash: merkleTxHash,
    });

    await expect(
      service.syncClaimForUser(user as never, {
        claimRecordId: 'claim_1',
        txHash: subsidyTxHash,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('syncs a confirmed subsidy claim', async () => {
    const {
      auditSeam,
      claimSyncChainRepository,
      nftSubsidyClaimRepository,
      service,
    } = createService();
    const claimedAt = new Date('2026-03-12T11:00:00.000Z');

    nftSubsidyClaimRepository.findClaimForSync.mockResolvedValue({
      chainId: 97,
      claimedAt: null,
      contractAddress: '0x8888888888888888888888888888888888888888',
      epoch: { epochNo: 3 },
      id: 'subsidy_1',
      nftHolding: { tokenId: 21n },
      status: ClaimStatus.PENDING,
      txHash: null,
    });
    claimSyncChainRepository.verifySubsidyClaim.mockResolvedValue({
      claimedAt,
      txHash: subsidyTxHash,
    });

    const result = await service.syncClaimForUser(user as never, {
      subsidyClaimId: 'subsidy_1',
      txHash: subsidyTxHash,
    });

    expect(nftSubsidyClaimRepository.markClaimed).toHaveBeenCalledWith({
      claimedAt,
      subsidyClaimId: 'subsidy_1',
      txHash: subsidyTxHash,
      txHashKey: `97:${subsidyTxHash}`,
    }, expect.any(Object));
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'claims.sync.subsidy' }),
    );
    expect(result).toEqual({
      chainId: 97,
      claimedAt,
      status: ClaimStatus.CLAIMED,
      subsidyClaimId: 'subsidy_1',
      txHash: subsidyTxHash,
    });
  });

  it('throws not found when the claim row does not exist', async () => {
    const { claimRecordRepository, service } = createService();
    claimRecordRepository.findMerkleClaimForSync.mockResolvedValue(null);

    await expect(
      service.syncClaimForUser(user as never, {
        claimRecordId: 'missing',
        txHash: merkleTxHash,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
