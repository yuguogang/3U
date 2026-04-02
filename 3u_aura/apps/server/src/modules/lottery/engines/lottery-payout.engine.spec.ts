import { LotteryPayoutEngine } from './lottery-payout.engine';

describe('LotteryPayoutEngine', () => {
  const engine = new LotteryPayoutEngine();

  it('selects floor(n/2) winners and rolls unused lucky pool forward', () => {
    const projection = engine.projectPayout({
      epochId: 'epoch_1',
      lotteryPoolUsdt: '1000',
      participantUserIds: Array.from(
        { length: 12 },
        (_, index) => `user_${index + 1}`,
      ),
    });

    expect(projection.winners).toHaveLength(6);
    expect(
      new Set(projection.winners.map((winner) => winner.userId)).size,
    ).toBe(6);
    expect(projection.consolationUserIds).toHaveLength(6);
    expect(projection.rolloverUsdt).toBe('400');
    expect(
      projection.winners.reduce(
        (sum, winner) => sum + BigInt(winner.amountUsdt),
        0n,
      ),
    ).toBe(600n);
  });

  it('splits all four prize buckets when there are enough winners', () => {
    const projection = engine.projectPayout({
      epochId: 'epoch_2',
      lotteryPoolUsdt: '1000',
      participantUserIds: Array.from(
        { length: 20 },
        (_, index) => `user_${index + 1}`,
      ),
    });

    expect(projection.winners).toHaveLength(10);
    expect(
      projection.winners.filter((winner) => winner.prizeLabel === 'FIRST'),
    ).toHaveLength(1);
    expect(
      projection.winners.filter((winner) => winner.prizeLabel === 'SECOND'),
    ).toHaveLength(2);
    expect(
      projection.winners.filter((winner) => winner.prizeLabel === 'THIRD'),
    ).toHaveLength(3);
    expect(
      projection.winners.filter((winner) => winner.prizeLabel === 'LUCKY'),
    ).toHaveLength(4);
    expect(projection.rolloverUsdt).toBe('0');
  });

  it('treats repeated user ids as separate ticket entries', () => {
    const projection = engine.projectPayout({
      epochId: 'epoch_3',
      lotteryPoolUsdt: '1000',
      participantUserIds: ['user_1', 'user_1', 'user_2', 'user_3'],
    });

    expect(projection.winners).toHaveLength(2);
    expect(projection.consolationUserIds).toHaveLength(2);
    expect(
      projection.winners.reduce(
        (sum, winner) => sum + BigInt(winner.amountUsdt),
        0n,
      ) + BigInt(projection.rolloverUsdt),
    ).toBe(1000n);
  });
});
