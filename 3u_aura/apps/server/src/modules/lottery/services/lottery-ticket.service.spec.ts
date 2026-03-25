import { LotteryTicketService } from './lottery-ticket.service';

describe('LotteryTicketService', () => {
  const createService = () => {
    const auditSeam = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const lotteryQualificationEngine = {
      qualifiesForTicket: jest.fn((streakDays: number) => streakDays >= 7),
      toDateKey: jest
        .fn()
        .mockReturnValueOnce('2026-03-01')
        .mockReturnValueOnce('2026-03-08'),
    };
    const lotteryTicketRepository = {
      countEpochTicketState: jest.fn().mockResolvedValue({
        participantCount: 1,
        qualifiedTicketCount: 1,
      }),
      clearTicketsOutsideUserSet: jest.fn().mockResolvedValue(undefined),
      upsertTicket: jest.fn().mockResolvedValue(undefined),
    };
    const statsRepository = {
      summarizeEpochCheckinDays: jest.fn().mockResolvedValue([]),
    };
    const transactionOrchestrator = {
      run: jest.fn(async (operation: (tx: object) => Promise<unknown>) =>
        operation({}),
      ),
    };
    const weeklyEpochRepository = {
      findById: jest.fn(),
      updateTicketCounts: jest.fn().mockResolvedValue(undefined),
    };
    const weeklyEpochPolicyEngine = {
      projectBoundary: jest.fn(),
    };
    const weeklyRewardRepository = {
      listUserRewardsByEpochAndTypes: jest.fn().mockResolvedValue([]),
    };

    const service = new LotteryTicketService(
      auditSeam as any,
      lotteryQualificationEngine as any,
      lotteryTicketRepository as any,
      statsRepository as any,
      transactionOrchestrator as any,
      weeklyEpochPolicyEngine as any,
      weeklyEpochRepository as any,
      weeklyRewardRepository as any,
    );

    return {
      auditSeam,
      lotteryQualificationEngine,
      lotteryTicketRepository,
      service,
      statsRepository,
      weeklyEpochPolicyEngine,
      weeklyEpochRepository,
      weeklyRewardRepository,
    };
  };

  it('materializes one ticket for users with 7 counted check-in days', async () => {
    const {
      lotteryTicketRepository,
      service,
      statsRepository,
      weeklyEpochRepository,
    } = createService();

    weeklyEpochRepository.findById.mockResolvedValue({
      endAt: new Date('2026-03-08T16:00:00.000Z'),
      id: 'epoch_1',
      startAt: new Date('2026-03-01T16:00:00.000Z'),
    });
    statsRepository.summarizeEpochCheckinDays.mockResolvedValue([
      {
        countedCheckinDays: 7,
        userId: 'user_1',
      },
      {
        countedCheckinDays: 6,
        userId: 'user_2',
      },
    ]);

    const result = await service.refreshEligibilityForEpoch('epoch_1');

    expect(lotteryTicketRepository.upsertTicket).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        epochId: 'epoch_1',
        isEligible: true,
        ticketCount: 1,
        userId: 'user_1',
      }),
      expect.any(Object),
    );
    expect(lotteryTicketRepository.upsertTicket).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        epochId: 'epoch_1',
        isEligible: false,
        ticketCount: 0,
        userId: 'user_2',
      }),
      expect.any(Object),
    );
    expect(weeklyEpochRepository.updateTicketCounts).toHaveBeenCalledWith(
      {
        epochId: 'epoch_1',
        participantCount: 1,
        qualifiedTicketCount: 1,
      },
      expect.any(Object),
    );
    expect(result).toEqual({
      eligibleUserIds: ['user_1'],
      epochId: 'epoch_1',
      participantCount: 1,
      qualifiedTicketCount: 1,
    });
  });
});
