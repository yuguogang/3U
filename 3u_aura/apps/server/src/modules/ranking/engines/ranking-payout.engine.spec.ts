import { RankingPayoutEngine } from './ranking-payout.engine';

describe('RankingPayoutEngine', () => {
  const engine = new RankingPayoutEngine();

  it('allocates fixed rank percentages and rolls unused ranks forward', () => {
    const projection = engine.projectPayout({
      candidates: [
        { incrementUsdt: '900000000', userId: 'user_c' },
        { incrementUsdt: '1200000000', userId: 'user_a' },
        { incrementUsdt: '1200000000', userId: 'user_b' },
        { incrementUsdt: '299999999', userId: 'user_d' },
      ],
      rankingPoolUsdt: '1000',
    });

    expect(projection.allocations).toEqual([
      expect.objectContaining({
        amountUsdt: '250',
        rank: 1,
        userId: 'user_a',
      }),
      expect.objectContaining({
        amountUsdt: '150',
        rank: 2,
        userId: 'user_b',
      }),
      expect.objectContaining({
        amountUsdt: '120',
        rank: 3,
        userId: 'user_c',
      }),
    ]);
    expect(projection.rolloverUsdt).toBe('480');
  });

  it('keeps deterministic top10 dust on the last allocated rank only', () => {
    const projection = engine.projectPayout({
      candidates: Array.from({ length: 10 }, (_, index) => ({
        incrementUsdt: `${1_000_000_000 - index}`,
        userId: `user_${index + 1}`,
      })),
      rankingPoolUsdt: '101',
    });

    expect(projection.allocations).toHaveLength(10);
    expect(
      projection.allocations.reduce(
        (sum, allocation) => sum + BigInt(allocation.amountUsdt),
        0n,
      ),
    ).toBe(101n);
    expect(projection.rolloverUsdt).toBe('0');
  });
});
