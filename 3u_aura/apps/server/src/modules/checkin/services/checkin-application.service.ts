import { Prisma } from '@/db';
import type { PaymentReceipt, User } from '@/db';
import { ConflictException, Injectable } from '@nestjs/common';
import type {
  PromotionCheckinRequest,
  PromotionCheckinResult,
} from '3u-aura-common';
import { LedgerRepository } from '../../ledger/repositories/ledger.repository';
import { PaymentService } from '../../payment/services/payment.service';
import { RewardsService } from '../../rewards/services/rewards.service';
import { AuditSeamService } from '../../shared/services/audit-seam.service';
import { IdempotencySeamService } from '../../shared/services/idempotency-seam.service';
import { TransactionOrchestratorService } from '../../shared/services/transaction-orchestrator.service';
import { StatsRepository } from '../../stats/repositories/stats.repository';
import { VolumePropagationService } from '../../volume/services/volume-propagation.service';
import { CheckinPolicyEngine } from '../engines/checkin-policy.engine';
import { CheckinRepository } from '../repositories/checkin.repository';

type CheckinActor = Pick<User, 'id' | 'walletAddress'>;
type PreparedReceipt = Awaited<
  ReturnType<PaymentService['prepareSubmittedCheckin']>
>;

@Injectable()
export class CheckinApplicationService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly idempotencySeam: IdempotencySeamService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly checkinPolicyEngine: CheckinPolicyEngine,
    private readonly checkinRepository: CheckinRepository,
    private readonly paymentService: PaymentService,
    private readonly ledgerRepository: LedgerRepository,
    private readonly rewardsService: RewardsService,
    private readonly statsRepository: StatsRepository,
    private readonly volumePropagationService: VolumePropagationService,
  ) {}

  async submitCheckinForUser(
    user: CheckinActor,
    command: PromotionCheckinRequest,
  ): Promise<PromotionCheckinResult> {
    this.checkinPolicyEngine.assertCommandBoundary(command);
    const preparedReceipt = await this.paymentService.prepareSubmittedCheckin(
      user,
      command,
    );

    return this.idempotencySeam.run<PromotionCheckinResult>(
      { key: `checkin:${preparedReceipt.txHashKey}` },
      async (): Promise<PromotionCheckinResult> => {
        const existingReceipt = await this.paymentService.findByTxHashKey(
          preparedReceipt.txHashKey,
        );

        if (existingReceipt) {
          this.assertReceiptOwnership(existingReceipt, user.id);
          if (existingReceipt.checkin) {
            return this.checkinPolicyEngine.toResult(
              existingReceipt.checkin,
              existingReceipt.id,
            );
          }
        }

        const result =
          await this.transactionOrchestrator.run<PromotionCheckinResult>(
            async (tx): Promise<PromotionCheckinResult> => {
              const receiptInsideTransaction =
                await this.paymentService.findByTxHashKey(
                  preparedReceipt.txHashKey,
                  tx,
                );

              if (receiptInsideTransaction) {
                this.assertReceiptOwnership(receiptInsideTransaction, user.id);
                if (receiptInsideTransaction.checkin) {
                  return this.checkinPolicyEngine.toResult(
                    receiptInsideTransaction.checkin,
                    receiptInsideTransaction.id,
                  );
                }
              }

              return this.persistConfirmedCheckin(
                tx,
                user,
                preparedReceipt,
                receiptInsideTransaction,
              );
            },
          );

        await this.auditSeam.record({
          action: existingReceipt
            ? 'checkin.repair.applied'
            : 'checkin.submit.confirmed',
          targetId: result.checkinId,
          targetType: 'Checkin',
          payload: {
            chainId: preparedReceipt.chainId,
            txHash: preparedReceipt.txHash,
            txHashKey: preparedReceipt.txHashKey,
          },
        });

        return result;
      },
    );
  }

  private async persistConfirmedCheckin(
    tx: Prisma.TransactionClient,
    user: CheckinActor,
    preparedReceipt: PreparedReceipt,
    existingReceipt: PaymentReceipt | null,
  ): Promise<PromotionCheckinResult> {
    const profile = await this.statsRepository.ensureUserProfile(user.id, tx);
    const dateKey = this.checkinPolicyEngine.projectConfirmedCheckin(
      profile,
      null,
      preparedReceipt.confirmedAt,
    ).dateKey;
    const latestCheckinToday = await this.checkinRepository.findLatestForDate(
      user.id,
      dateKey,
      tx,
    );
    const projection = this.checkinPolicyEngine.projectConfirmedCheckin(
      profile,
      latestCheckinToday,
      preparedReceipt.confirmedAt,
    );

    const amountDecimal = this.checkinPolicyEngine.toDecimal(
      preparedReceipt.amountAtomic,
    );
    const rewardAuraAmount = this.checkinPolicyEngine.toDecimal(
      projection.rewardAuraAmountAtomic,
    );

    const checkin = await this.checkinRepository.createConfirmedCheckin(
      {
        chainId: preparedReceipt.chainId,
        checkinCountToday: projection.checkinCountToday,
        confirmedAt: preparedReceipt.confirmedAt,
        dateKey: projection.dateKey,
        isCountedForStreak: projection.isCountedForStreak,
        payAmountUsdt: amountDecimal,
        payToken: preparedReceipt.tokenSymbol,
        rewardAuraAmount,
        txHash: preparedReceipt.txHash,
        txHashKey: preparedReceipt.txHashKey,
        userId: user.id,
      },
      tx,
    );

    const paymentReceipt = existingReceipt
      ? await this.paymentService.attachConfirmedCheckin(
          existingReceipt.id,
          {
            checkinId: checkin.id,
            confirmedAt: preparedReceipt.confirmedAt,
            receiverAddress: preparedReceipt.receiverAddress,
          },
          tx,
        )
      : await this.paymentService.createConfirmedCheckinReceipt(
          {
            amount: amountDecimal,
            chainId: preparedReceipt.chainId,
            checkinId: checkin.id,
            confirmedAt: preparedReceipt.confirmedAt,
            payerAddress: preparedReceipt.payerAddress,
            receiverAddress: preparedReceipt.receiverAddress,
            tokenSymbol: preparedReceipt.tokenSymbol,
            txHash: preparedReceipt.txHash,
            txHashKey: preparedReceipt.txHashKey,
            userId: user.id,
          },
          tx,
        );

    await this.ledgerRepository.createCheckinReward(
      {
        amount: rewardAuraAmount,
        checkinId: checkin.id,
        notes: `checkin reward for ${preparedReceipt.txHashKey}`,
        sourceRefId: checkin.id,
        sourceRefType: 'CHECKIN',
        userId: user.id,
      },
      tx,
    );

    const poolSplit = this.checkinPolicyEngine.buildPoolSplit(
      preparedReceipt.amountAtomic,
    );
    await this.statsRepository.upsertDailyProjectionForCheckin(
      {
        countedCheckinDaysIncrement: projection.countedCheckinDaysIncrement,
        dateKey: projection.dateKey,
        rewardAuraAmount,
        userId: user.id,
        volumeAmount: amountDecimal,
      },
      tx,
    );
    await this.statsRepository.applyProfileCheckinProjection(
      {
        currentStreakDays: projection.currentStreakDays,
        lastCheckinDate: preparedReceipt.confirmedAt,
        maxStreakDays: projection.maxStreakDays,
        rewardAuraAmount,
        totalCheckinDaysIncrement: projection.totalCheckinDaysIncrement,
        userId: user.id,
        volumeAmount: amountDecimal,
      },
      tx,
    );
    await this.statsRepository.createPoolSplitFact(
      {
        checkinId: checkin.id,
        dateKey: projection.dateKey,
        lotteryAmount: this.checkinPolicyEngine.toDecimal(
          poolSplit.lotteryAmountAtomic,
        ),
        paymentReceiptId: paymentReceipt.id,
        totalAmount: amountDecimal,
        treasuryAmount: this.checkinPolicyEngine.toDecimal(
          poolSplit.treasuryAmountAtomic,
        ),
        userId: user.id,
      },
      tx,
    );
    await this.volumePropagationService.propagateConfirmedCheckin(
      {
        amountAtomic: preparedReceipt.amountAtomic,
        dateKey: projection.dateKey,
        sourceCheckinId: checkin.id,
        userId: user.id,
      },
      tx,
    );
    await this.rewardsService.applyReferralRewardsForCheckin(
      {
        checkinId: checkin.id,
        dateKey: projection.dateKey,
        rewardAuraAmountAtomic: projection.rewardAuraAmountAtomic,
        userId: user.id,
      },
      tx,
    );

    return this.checkinPolicyEngine.toResult(checkin, paymentReceipt.id);
  }

  private assertReceiptOwnership(
    receipt: Pick<PaymentReceipt, 'userId'>,
    userId: string,
  ): void {
    if (receipt.userId !== userId) {
      throw new ConflictException(
        'Transaction hash is already associated with another user',
      );
    }
  }
}
