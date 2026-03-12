import { Prisma } from '@/db';
import { ConflictException } from '@nestjs/common';
import type {
  AuditSeamService,
  IdempotencySeamService,
  TransactionOrchestratorService,
} from '../../shared';
import type { LedgerRepository } from '../../ledger';
import type { PaymentService } from '../../payment';
import type { RewardsService } from '../../rewards';
import type { StatsRepository } from '../../stats';
import type { VolumePropagationService } from '../../volume';
import { CheckinApplicationService } from './checkin-application.service';
import { CheckinPolicyEngine } from '../engines/checkin-policy.engine';
import type { CheckinRepository } from '../repositories/checkin.repository';

type CheckinActor = Parameters<
  CheckinApplicationService['submitCheckinForUser']
>[0];
type CheckinCommand = Parameters<
  CheckinApplicationService['submitCheckinForUser']
>[1];
type PreparedReceipt = Awaited<
  ReturnType<PaymentService['prepareSubmittedCheckin']>
>;
type PoolSplitFactInput = Parameters<StatsRepository['createPoolSplitFact']>[0];

describe('CheckinApplicationService', () => {
  const user: CheckinActor = {
    id: 'user_1',
    walletAddress: '0x1111111111111111111111111111111111111111',
  };
  const command: CheckinCommand = {
    amountAtomic: '3000000',
    chainId: 97,
    payerAddress: user.walletAddress,
    tokenSymbol: 'USDT',
    txHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };
  const preparedReceipt: PreparedReceipt = {
    amountAtomic: '3000000',
    chainId: 97,
    confirmedAt: new Date('2026-03-11T09:00:00.000Z'),
    payerAddress: user.walletAddress,
    tokenSymbol: 'USDT',
    txHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    txHashKey:
      '97:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };

  const createService = () => {
    const auditSeam = {
      record: jest.fn().mockResolvedValue(undefined),
    } satisfies Pick<AuditSeamService, 'record'>;
    const idempotencySeam = {
      run: jest.fn(
        <T>(_options: { key: string }, operation: () => Promise<T>) =>
          operation(),
      ),
    } satisfies Pick<IdempotencySeamService, 'run'>;
    const transactionOrchestrator = {
      run: jest.fn(
        <T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) =>
          operation({} as Prisma.TransactionClient),
      ),
    } satisfies Pick<TransactionOrchestratorService, 'run'>;
    const checkinPolicyEngine = new CheckinPolicyEngine();
    const checkinRepository = {
      createConfirmedCheckin: jest.fn(),
      findLatestForDate: jest.fn(),
    } satisfies Pick<
      CheckinRepository,
      'createConfirmedCheckin' | 'findLatestForDate'
    >;
    const paymentService = {
      attachConfirmedCheckin: jest.fn(),
      createConfirmedCheckinReceipt: jest.fn(),
      findByTxHashKey: jest.fn(),
      prepareSubmittedCheckin: jest.fn().mockResolvedValue(preparedReceipt),
    } satisfies Pick<
      PaymentService,
      | 'attachConfirmedCheckin'
      | 'createConfirmedCheckinReceipt'
      | 'findByTxHashKey'
      | 'prepareSubmittedCheckin'
    >;
    const ledgerRepository = {
      createCheckinReward: jest.fn().mockResolvedValue(undefined),
    } satisfies Pick<LedgerRepository, 'createCheckinReward'>;
    const rewardsService = {
      applyReferralRewardsForCheckin: jest.fn().mockResolvedValue(undefined),
    } satisfies Pick<RewardsService, 'applyReferralRewardsForCheckin'>;
    const statsRepository = {
      applyProfileCheckinProjection: jest.fn().mockResolvedValue(undefined),
      createPoolSplitFact: jest.fn().mockResolvedValue(undefined),
      ensureUserProfile: jest.fn(),
      upsertDailyProjectionForCheckin: jest.fn().mockResolvedValue(undefined),
    } satisfies Pick<
      StatsRepository,
      | 'applyProfileCheckinProjection'
      | 'createPoolSplitFact'
      | 'ensureUserProfile'
      | 'upsertDailyProjectionForCheckin'
    >;
    const volumePropagationService = {
      propagateConfirmedCheckin: jest.fn().mockResolvedValue(undefined),
    } satisfies Pick<VolumePropagationService, 'propagateConfirmedCheckin'>;

    const service = new CheckinApplicationService(
      auditSeam as AuditSeamService,
      idempotencySeam as IdempotencySeamService,
      transactionOrchestrator as unknown as TransactionOrchestratorService,
      checkinPolicyEngine,
      checkinRepository as unknown as CheckinRepository,
      paymentService as unknown as PaymentService,
      ledgerRepository as unknown as LedgerRepository,
      rewardsService as unknown as RewardsService,
      statsRepository as unknown as StatsRepository,
      volumePropagationService as unknown as VolumePropagationService,
    );

    return {
      auditSeam,
      checkinRepository,
      idempotencySeam,
      ledgerRepository,
      paymentService,
      rewardsService,
      service,
      statsRepository,
      transactionOrchestrator,
      volumePropagationService,
    };
  };

  it('returns the existing confirmed check-in for duplicate txHash', async () => {
    const { paymentService, service, transactionOrchestrator } =
      createService();
    paymentService.findByTxHashKey.mockResolvedValueOnce({
      checkin: {
        checkinCountToday: 1,
        dateKey: '2026-03-11',
        id: 'checkin_existing',
        rewardAuraAmount: new Prisma.Decimal('1000000000000000000000'),
        status: 'CONFIRMED',
      },
      id: 'receipt_existing',
      userId: user.id,
    });

    const result = await service.submitCheckinForUser(user, command);

    expect(transactionOrchestrator.run).not.toHaveBeenCalled();
    expect(result).toEqual({
      checkinCountToday: 1,
      checkinId: 'checkin_existing',
      dateKey: '2026-03-11',
      paymentReceiptId: 'receipt_existing',
      rewardAuraAmount: '1000000000000000000000',
      status: 'CONFIRMED',
    });
  });

  it('creates a new confirmed check-in and related records', async () => {
    const {
      auditSeam,
      checkinRepository,
      paymentService,
      rewardsService,
      service,
      statsRepository,
      volumePropagationService,
    } = createService();
    paymentService.findByTxHashKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    statsRepository.ensureUserProfile.mockResolvedValue({
      currentStreakDays: 0,
      lastCheckinDate: null,
      maxStreakDays: 0,
    });
    checkinRepository.findLatestForDate.mockResolvedValue(null);
    checkinRepository.createConfirmedCheckin.mockResolvedValue({
      checkinCountToday: 1,
      dateKey: '2026-03-11',
      id: 'checkin_new',
      rewardAuraAmount: new Prisma.Decimal('1000000000000000000000'),
      status: 'CONFIRMED',
    });
    paymentService.createConfirmedCheckinReceipt.mockResolvedValue({
      id: 'receipt_new',
    });

    const result = await service.submitCheckinForUser(user, command);

    expect(checkinRepository.createConfirmedCheckin).toHaveBeenCalled();
    const [poolSplitFact] = statsRepository.createPoolSplitFact.mock
      .calls[0] as [PoolSplitFactInput, Prisma.TransactionClient];
    expect(poolSplitFact.lotteryAmount.toFixed(0)).toBe('900000');
    expect(poolSplitFact.treasuryAmount.toFixed(0)).toBe('2100000');
    expect(
      volumePropagationService.propagateConfirmedCheckin,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        amountAtomic: preparedReceipt.amountAtomic,
        dateKey: '2026-03-11',
        sourceCheckinId: 'checkin_new',
        userId: user.id,
      }),
      expect.any(Object),
    );
    expect(rewardsService.applyReferralRewardsForCheckin).toHaveBeenCalledWith(
      expect.objectContaining({
        checkinId: 'checkin_new',
        dateKey: '2026-03-11',
        rewardAuraAmountAtomic: '1000000000000000000000',
        userId: user.id,
      }),
      expect.any(Object),
    );
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'checkin.submit.confirmed' }),
    );
    expect(result.checkinId).toBe('checkin_new');
  });

  it('repairs an existing receipt without a linked check-in', async () => {
    const {
      auditSeam,
      checkinRepository,
      paymentService,
      service,
      statsRepository,
    } = createService();
    const danglingReceipt = {
      checkin: null,
      id: 'receipt_dangling',
      userId: user.id,
    };
    paymentService.findByTxHashKey
      .mockResolvedValueOnce(danglingReceipt)
      .mockResolvedValueOnce(danglingReceipt);
    statsRepository.ensureUserProfile.mockResolvedValue({
      currentStreakDays: 1,
      lastCheckinDate: new Date('2026-03-10T09:00:00.000Z'),
      maxStreakDays: 1,
    });
    checkinRepository.findLatestForDate.mockResolvedValue(null);
    checkinRepository.createConfirmedCheckin.mockResolvedValue({
      checkinCountToday: 1,
      dateKey: '2026-03-11',
      id: 'checkin_repaired',
      rewardAuraAmount: new Prisma.Decimal('1000000000000000000000'),
      status: 'CONFIRMED',
    });
    paymentService.attachConfirmedCheckin.mockResolvedValue({
      id: 'receipt_dangling',
    });

    const result = await service.submitCheckinForUser(user, command);

    expect(paymentService.attachConfirmedCheckin).toHaveBeenCalled();
    expect(auditSeam.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'checkin.repair.applied' }),
    );
    expect(result.checkinId).toBe('checkin_repaired');
  });

  it('rejects a txHash already associated with another user', async () => {
    const { paymentService, service } = createService();
    paymentService.findByTxHashKey.mockResolvedValueOnce({
      checkin: null,
      id: 'receipt_foreign',
      userId: 'user_2',
    });

    await expect(
      service.submitCheckinForUser(user, command),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
