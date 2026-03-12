import { CheckinPolicyEngine } from './checkin-policy.engine';

describe('CheckinPolicyEngine', () => {
  const engine = new CheckinPolicyEngine();

  it('splits check-in funds into lottery and treasury pools', () => {
    expect(engine.buildPoolSplit('3000000')).toEqual({
      lotteryAmountAtomic: '900000',
      treasuryAmountAtomic: '2100000',
    });
  });

  it('does not increment streak metrics on the second same-day check-in', () => {
    const projection = engine.projectConfirmedCheckin(
      {
        currentStreakDays: 5,
        lastCheckinDate: new Date('2026-03-11T08:00:00.000Z'),
        maxStreakDays: 7,
      } as any,
      { checkinCountToday: 1 } as any,
      new Date('2026-03-11T10:00:00.000Z'),
    );

    expect(projection.isCountedForStreak).toBe(false);
    expect(projection.countedCheckinDaysIncrement).toBe(0);
    expect(projection.currentStreakDays).toBe(5);
    expect(projection.maxStreakDays).toBe(7);
  });
});
