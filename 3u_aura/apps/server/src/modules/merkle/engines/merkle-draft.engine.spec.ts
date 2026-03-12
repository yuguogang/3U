import { MerkleDraftEngine } from './merkle-draft.engine';

describe('MerkleDraftEngine', () => {
  const engine = new MerkleDraftEngine();

  it('builds reproducible leaves and proofs for weekly reward claims', () => {
    const draft = engine.buildDraft([
      {
        amount: '25000000',
        rewardId: 'reward_1',
        rewardType: 'LOTTERY_USDT',
        userId: 'user_1',
        walletAddress: '0x0000000000000000000000000000000000000001',
      },
      {
        amount: '15000000',
        rewardId: 'reward_2',
        rewardType: 'RANKING_USDT',
        userId: 'user_2',
        walletAddress: '0x0000000000000000000000000000000000000002',
      },
      {
        amount: '10000000',
        rewardId: 'reward_3',
        rewardType: 'LOTTERY_USDT',
        userId: 'user_3',
        walletAddress: '0x0000000000000000000000000000000000000003',
      },
    ]);

    expect(draft.merkleRoot).toMatch(/^0x[a-f0-9]{64}$/);
    expect(draft.leaves).toHaveLength(3);

    for (const leaf of draft.leaves) {
      expect(
        engine.verifyLeafProof({
          leafHash: leaf.leafHash,
          merkleRoot: draft.merkleRoot,
          proof: leaf.proof,
        }),
      ).toBe(true);
    }
  });
});
