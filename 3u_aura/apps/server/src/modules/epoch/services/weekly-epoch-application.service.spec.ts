import { Prisma } from '@/db';
import { EpochStatus, EpochType } from '3u-aura-common';
import { WeeklyEpochApplicationService } from './weekly-epoch-application.service';

describe('WeeklyEpochApplicationService', () => {
  const createService = () => {
    const auditSeam = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const statsRepository = {
      aggregateEpochLotteryPool: jest
        .fn()
        .mockResolvedValue(new Prisma.Decimal(0)),
    };
    const transactionOrchestrator = {
      run: jest.fn(async (operation: (tx: object) => Promise<unknown>) =>
        operation({}),
      ),
    };
    const weeklyEpochPolicyEngine = {
      buildEpochStatus: jest.fn(),
      buildPoolSplit: jest.fn(),
      normalizeBoundaryQuery: jest.fn(
        (query: { referenceAt?: string; status?: EpochStatus }) => ({
          epochType: EpochType.WEEKLY_PROMOTION,
          referenceAt: query.referenceAt,
          status: query.status,
        }),
      ),
      projectBoundary: jest.fn(),
      projectEpochByNo: jest.fn(),
      shouldRollover: jest.fn(),
      toDateKey: jest.fn(),
    };
    const weeklyEpochRepository = {
      ensureEpoch: jest.fn(),
      finalizeEpochPreparation: jest.fn(),
      findByEpochNo: jest.fn(),
      findById: jest.fn(),
      incrementRolloverPool: jest.fn(),
      updateStatus: jest.fn(),
    };

    const service = new WeeklyEpochApplicationService(
      auditSeam as any,
      statsRepository as any,
      transactionOrchestrator as any,
      weeklyEpochPolicyEngine as any,
      weeklyEpochRepository as any,
    );

    return {
      auditSeam,
      service,
      statsRepository,
      transactionOrchestrator,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
    };
  };

  it('creates historical calculating epochs and returns the current boundary', async () => {
    const { service, weeklyEpochPolicyEngine, weeklyEpochRepository } =
      createService();

    weeklyEpochPolicyEngine.projectBoundary.mockReturnValue({
      endAt: new Date('2026-03-15T16:00:00.000Z'),
      epochNo: 3,
      epochType: EpochType.WEEKLY_PROMOTION,
      referenceAt: new Date('2026-03-12T00:00:00.000Z'),
      startAt: new Date('2026-03-08T16:00:00.000Z'),
      status: EpochStatus.OPEN,
    });
    weeklyEpochPolicyEngine.projectEpochByNo
      .mockReturnValueOnce({
        endAt: new Date('2026-03-01T16:00:00.000Z'),
        epochNo: 1,
        epochType: EpochType.WEEKLY_PROMOTION,
        referenceAt: new Date('2026-03-12T00:00:00.000Z'),
        startAt: new Date('2026-02-22T16:00:00.000Z'),
        status: EpochStatus.CALCULATING,
      })
      .mockReturnValueOnce({
        endAt: new Date('2026-03-08T16:00:00.000Z'),
        epochNo: 2,
        epochType: EpochType.WEEKLY_PROMOTION,
        referenceAt: new Date('2026-03-12T00:00:00.000Z'),
        startAt: new Date('2026-03-01T16:00:00.000Z'),
        status: EpochStatus.CALCULATING,
      })
      .mockReturnValueOnce({
        endAt: new Date('2026-03-15T16:00:00.000Z'),
        epochNo: 3,
        epochType: EpochType.WEEKLY_PROMOTION,
        referenceAt: new Date('2026-03-12T00:00:00.000Z'),
        startAt: new Date('2026-03-08T16:00:00.000Z'),
        status: EpochStatus.OPEN,
      });
    weeklyEpochPolicyEngine.buildEpochStatus
      .mockReturnValueOnce(EpochStatus.CALCULATING)
      .mockReturnValueOnce(EpochStatus.CALCULATING)
      .mockReturnValueOnce(EpochStatus.OPEN);
    weeklyEpochRepository.ensureEpoch
      .mockResolvedValueOnce({
        epochNo: 1,
        id: 'epoch_1',
        status: 'CALCULATING',
      })
      .mockResolvedValueOnce({
        epochNo: 2,
        id: 'epoch_2',
        status: 'CALCULATING',
      })
      .mockResolvedValueOnce({
        epochNo: 3,
        id: 'epoch_3',
        snapshotAt: null,
        startAt: new Date('2026-03-08T16:00:00.000Z'),
        endAt: new Date('2026-03-15T16:00:00.000Z'),
        status: 'OPEN',
        epochType: 'WEEKLY_PROMOTION',
      });
    weeklyEpochRepository.findByEpochNo.mockResolvedValue({
      epochNo: 3,
      id: 'epoch_3',
      snapshotAt: null,
      startAt: new Date('2026-03-08T16:00:00.000Z'),
      endAt: new Date('2026-03-15T16:00:00.000Z'),
      status: 'OPEN',
      epochType: 'WEEKLY_PROMOTION',
    });

    const result = await service.syncEpochLifecycle(
      '2026-03-12T08:00:00+08:00',
    );

    expect(result.epochsReadyForQualification).toEqual(['epoch_1', 'epoch_2']);
    expect(result.currentEpoch.epochId).toBe('epoch_3');
    expect(result.currentEpoch.status).toBe(EpochStatus.OPEN);
  });

  it('prepares rollover when participants are below the minimum threshold', async () => {
    const {
      service,
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
    } = createService();

    weeklyEpochRepository.findById.mockResolvedValue({
      calculationRemark: null,
      endAt: new Date('2026-03-08T16:00:00.000Z'),
      epochNo: 1,
      id: 'epoch_1',
      participantCount: 8,
      rankingPoolUsdt: new Prisma.Decimal(0),
      rolloverUsdt: new Prisma.Decimal(100),
      lotteryPoolUsdt: new Prisma.Decimal(0),
      status: 'CALCULATING',
      startAt: new Date('2026-03-01T16:00:00.000Z'),
    });
    weeklyEpochPolicyEngine.toDateKey
      .mockReturnValueOnce('2026-03-02')
      .mockReturnValueOnce('2026-03-09');
    statsRepository.aggregateEpochLotteryPool.mockResolvedValue(
      new Prisma.Decimal(300),
    );
    weeklyEpochPolicyEngine.buildPoolSplit.mockReturnValue({
      lotteryPoolAtomic: '280',
      rankingPoolAtomic: '120',
    });
    weeklyEpochPolicyEngine.shouldRollover.mockReturnValue(true);
    weeklyEpochPolicyEngine.projectEpochByNo.mockReturnValue({
      endAt: new Date('2026-03-15T16:00:00.000Z'),
      epochNo: 2,
      epochType: EpochType.WEEKLY_PROMOTION,
      referenceAt: new Date('2026-03-08T16:00:00.000Z'),
      startAt: new Date('2026-03-08T16:00:00.000Z'),
      status: EpochStatus.OPEN,
    });
    weeklyEpochRepository.ensureEpoch.mockResolvedValue({
      id: 'epoch_2',
    });
    weeklyEpochRepository.incrementRolloverPool.mockResolvedValue(undefined);
    weeklyEpochRepository.finalizeEpochPreparation.mockResolvedValue(undefined);

    const result = await service.prepareRolloverForEpoch('epoch_1');

    expect(weeklyEpochRepository.incrementRolloverPool).toHaveBeenCalledWith(
      'epoch_2',
      expect.any(Prisma.Decimal),
      expect.any(Object),
    );
    expect(result).toEqual({
      epochId: 'epoch_1',
      nextEpochId: 'epoch_2',
      rolledOver: true,
      totalPromotionPoolUsdt: '400',
    });
  });
});
