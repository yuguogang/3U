import { EpochStatus, EpochType } from '3u-aura-common';
import { WeeklyEpochPolicyEngine } from './weekly-epoch-policy.engine';

describe('WeeklyEpochPolicyEngine', () => {
  const createEngine = () =>
    new WeeklyEpochPolicyEngine({
      get: jest.fn((key: string) => {
        if (key === 'promotion') {
          return {
            epochLengthDays: 7,
            minimumParticipants: 12,
            startAt: '2026-03-01T00:00:00',
            ticketStreakDays: 7,
            timezone: 'Asia/Shanghai',
          };
        }

        return undefined;
      }),
    } as any);

  it('projects the first weekly epoch boundary inside the initial 7-day window', () => {
    const engine = createEngine();

    const result = engine.projectBoundary({
      epochType: EpochType.WEEKLY_PROMOTION,
      referenceAt: '2026-03-05T12:00:00+08:00',
    });

    expect(result.epochNo).toBe(1);
    expect(result.status).toBe(EpochStatus.OPEN);
    expect(result.startAt.toISOString()).toBe('2026-02-28T16:00:00.000Z');
    expect(result.endAt.toISOString()).toBe('2026-03-07T16:00:00.000Z');
  });

  it('moves to the next epoch after each 7-day interval', () => {
    const engine = createEngine();

    const result = engine.projectBoundary({
      epochType: EpochType.WEEKLY_PROMOTION,
      referenceAt: '2026-03-15T08:00:00+08:00',
    });

    expect(result.epochNo).toBe(3);
    expect(result.status).toBe(EpochStatus.OPEN);
  });

  it('marks participants below threshold as rollover eligible', () => {
    const engine = createEngine();

    expect(engine.shouldRollover(11)).toBe(true);
    expect(engine.shouldRollover(12)).toBe(false);
  });

  it('splits the promotion pool evenly between lottery and ranking', () => {
    const engine = createEngine();

    expect(engine.buildPoolSplit('100')).toEqual({
      lotteryPoolAtomic: '50',
      rankingPoolAtomic: '50',
    });
  });
});
