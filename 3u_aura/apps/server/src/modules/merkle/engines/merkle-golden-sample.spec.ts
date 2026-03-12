import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MerkleDraftEngine } from './merkle-draft.engine';

describe('MerkleDraftEngine golden sample', () => {
  const engine = new MerkleDraftEngine();

  it('matches the shared weekly merkle golden sample fixture', () => {
    const fixturePath = resolve(
      process.cwd(),
      '../../packages/common/fixtures/weekly-merkle-golden-sample.json',
    );
    const fixture = JSON.parse(
      readFileSync(fixturePath, 'utf8'),
    ) as {
      leaves: Array<{
        account: string;
        amount: number;
        index: number;
        leafHash: string;
        proof: string[];
        rewardId: string;
        rewardType: 'LOTTERY_USDT' | 'RANKING_USDT';
        rewardTypeCode: number;
        userId: string;
      }>;
      merkleRoot: string;
    };

    const draft = engine.buildDraft(
      fixture.leaves.map((leaf) => ({
        amount: String(leaf.amount),
        rewardId: leaf.rewardId,
        rewardType: leaf.rewardType,
        userId: leaf.userId,
        walletAddress: leaf.account,
      })),
    );

    expect(draft.merkleRoot).toBe(fixture.merkleRoot);
    expect(draft.leaves).toHaveLength(fixture.leaves.length);

    draft.leaves.forEach((leaf, index) => {
      const expected = fixture.leaves[index];

      expect(leaf.leafIndex).toBe(expected.index);
      expect(leaf.leafHash).toBe(expected.leafHash);
      expect(leaf.payloadJson.account).toBe(expected.account);
      expect(leaf.payloadJson.amount).toBe(String(expected.amount));
      expect(leaf.payloadJson.rewardTypeCode).toBe(expected.rewardTypeCode);
      expect(leaf.proof).toEqual(expected.proof);
    });
  });
});
