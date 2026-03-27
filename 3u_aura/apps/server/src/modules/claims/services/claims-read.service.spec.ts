import { ClaimsReadService } from './claims-read.service';
import { ClaimStatus, ClaimType, EpochStatus } from '3u-aura-common';

describe('ClaimsReadService', () => {
  const createService = () => {
    const claimRecordRepository = {
      listMerkleClaimsForUser: jest.fn().mockResolvedValue([]),
    };
    const lotteryTicketRepository = {
      listUnrevealedParticipatingEpochIdsForUser: jest
        .fn()
        .mockResolvedValue([]),
    };
    const nftSubsidyClaimRepository = {
      listClaimsForUser: jest.fn().mockResolvedValue([]),
    };
    const purchasedNftChainRepository = {
      getCurrentChainTimestamp: jest
        .fn()
        .mockResolvedValue(new Date('2026-03-31T16:37:13.000Z')),
      listPublishedSubsidyEpochs: jest.fn().mockResolvedValue([]),
    };

    return {
      claimRecordRepository,
      lotteryTicketRepository,
      nftSubsidyClaimRepository,
      purchasedNftChainRepository,
      service: new ClaimsReadService(
        claimRecordRepository as never,
        lotteryTicketRepository as never,
        nftSubsidyClaimRepository as never,
        purchasedNftChainRepository as never,
      ),
    };
  };

  it('hides claimable merkle claims when epoch is not root-posted yet', async () => {
    const { claimRecordRepository, service } = createService();

    claimRecordRepository.listMerkleClaimsForUser.mockResolvedValue([
      {
        amount: { toFixed: () => '18750000' },
        chainId: 97,
        claimType: ClaimType.MERKLE_RANKING,
        claimedAt: null,
        contractAddress: '0x1111111111111111111111111111111111111111',
        epoch: {
          epochNo: 3,
          status: EpochStatus.CALCULATING,
        },
        epochId: 'epoch_3',
        id: 'claim_1',
        merkleIndex: 0,
        merkleProofJson: [],
        root: '0xabc',
        status: ClaimStatus.CLAIMABLE,
        tokenSymbol: 'USDT',
        txHash: null,
      },
    ]);

    const result = await service.listClaimsForUser({
      id: 'user_1',
      walletAddress: '0x1111111111111111111111111111111111111111',
    });

    expect(result.merkleClaims).toEqual([]);
  });

  it('keeps claimed merkle claims visible after root posted', async () => {
    const { claimRecordRepository, service } = createService();

    claimRecordRepository.listMerkleClaimsForUser.mockResolvedValue([
      {
        amount: { toFixed: () => '18750000' },
        chainId: 97,
        claimType: ClaimType.MERKLE_RANKING,
        claimedAt: new Date('2026-04-01T12:43:18.000Z'),
        contractAddress: '0x1111111111111111111111111111111111111111',
        epoch: {
          epochNo: 3,
          status: EpochStatus.ROOT_POSTED,
        },
        epochId: 'epoch_3',
        id: 'claim_1',
        merkleIndex: 0,
        merkleProofJson: ['0xproof'],
        root: '0xabc',
        status: ClaimStatus.CLAIMED,
        tokenSymbol: 'USDT',
        txHash: '0xtx',
      },
    ]);

    const result = await service.listClaimsForUser({
      id: 'user_1',
      walletAddress: '0x1111111111111111111111111111111111111111',
    });

    expect(result.merkleClaims).toEqual([
      expect.objectContaining({
        claimRecordId: 'claim_1',
        status: ClaimStatus.CLAIMED,
      }),
    ]);
  });

  it('maps expired nft subsidy claims to voided', async () => {
    const {
      nftSubsidyClaimRepository,
      purchasedNftChainRepository,
      service,
    } = createService();

    nftSubsidyClaimRepository.listClaimsForUser.mockResolvedValue([
      {
        amountUsdt: { toFixed: () => '30000000' },
        chainId: 97,
        claimedAt: null,
        contractAddress: '0x3333333333333333333333333333333333333333',
        epoch: {
          epochNo: 1,
        },
        epochId: 'epoch_1',
        id: 'subsidy_1',
        nftHolding: {
          tokenId: 2n,
        },
        status: ClaimStatus.PENDING,
        txHash: null,
      },
      {
        amountUsdt: { toFixed: () => '30000000' },
        chainId: 97,
        claimedAt: null,
        contractAddress: '0x3333333333333333333333333333333333333333',
        epoch: {
          epochNo: 2,
        },
        epochId: 'epoch_2',
        id: 'subsidy_2',
        nftHolding: {
          tokenId: 2n,
        },
        status: ClaimStatus.PENDING,
        txHash: null,
      },
    ]);
    purchasedNftChainRepository.listPublishedSubsidyEpochs.mockResolvedValue([
      {
        chainId: 97,
        claimDeadline: new Date('2026-03-26T07:48:51.000Z'),
        contractAddress: '0x3333333333333333333333333333333333333333',
        epochNo: 1,
        maxEligibleTokenId: 2n,
        publishedAt: new Date('2026-03-19T00:00:00.000Z'),
        subsidyAmountUsdt: '30000000',
      },
      {
        chainId: 97,
        claimDeadline: new Date('2026-04-02T07:48:51.000Z'),
        contractAddress: '0x3333333333333333333333333333333333333333',
        epochNo: 2,
        maxEligibleTokenId: 2n,
        publishedAt: new Date('2026-03-26T00:00:00.000Z'),
        subsidyAmountUsdt: '30000000',
      },
    ]);

    const result = await service.listClaimsForUser({
      id: 'user_1',
      walletAddress: '0x1111111111111111111111111111111111111111',
    });

    expect(result.nftSubsidyClaims).toEqual([
      expect.objectContaining({
        epochNo: 1,
        status: ClaimStatus.VOIDED,
      }),
      expect.objectContaining({
        epochNo: 2,
        status: ClaimStatus.PENDING,
      }),
    ]);
  });
});
