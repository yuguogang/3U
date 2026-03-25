import { ClaimsReadService } from './claims-read.service';
import { ClaimStatus, ClaimType, EpochStatus } from '3u-aura-common';

describe('ClaimsReadService', () => {
  const createService = () => {
    const claimRecordRepository = {
      listMerkleClaimsForUser: jest.fn(),
    };
    const lotteryTicketRepository = {
      listUnrevealedParticipatingEpochIdsForUser: jest
        .fn()
        .mockResolvedValue([]),
    };
    const nftSubsidyClaimRepository = {
      listClaimsForUser: jest.fn().mockResolvedValue([]),
    };

    return {
      claimRecordRepository,
      lotteryTicketRepository,
      nftSubsidyClaimRepository,
      service: new ClaimsReadService(
        claimRecordRepository as never,
        lotteryTicketRepository as never,
        nftSubsidyClaimRepository as never,
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
});
