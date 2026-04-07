import {
  EpochStatus as DbEpochStatus,
  EpochType as DbEpochType,
  Prisma,
} from '@/db';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EpochStatus,
  EpochType,
  WeeklyEpochBoundaryQuery,
  WeeklyEpochBoundaryView,
} from '3u-aura-common';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { StatsRepository } from '../../stats';
import { WeeklyEpochPolicyEngine } from '../engines/weekly-epoch-policy.engine';
import { WeeklyEpochRepository } from '../repositories/weekly-epoch.repository';

export interface WeeklyEpochLifecycleSyncResult {
  currentEpoch: WeeklyEpochBoundaryView;
  epochsReadyForQualification: string[];
}

export interface WeeklyEpochRolloverPreparationResult {
  epochId: string;
  lotteryRolledOver?: boolean;
  nextEpochId?: string;
  rankingRolledOver?: boolean;
  rolledOver: boolean;
  totalPromotionPoolUsdt: string;
}

@Injectable()
export class WeeklyEpochApplicationService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly statsRepository: StatsRepository,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly weeklyEpochPolicyEngine: WeeklyEpochPolicyEngine,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
  ) {}

  async getBoundary(
    query: WeeklyEpochBoundaryQuery,
  ): Promise<WeeklyEpochBoundaryView> {
    const normalized =
      this.weeklyEpochPolicyEngine.normalizeBoundaryQuery(query);
    const projection = this.weeklyEpochPolicyEngine.projectBoundary(normalized);
    const epoch = await this.weeklyEpochRepository.ensureEpoch({
      endAt: projection.endAt,
      epochNo: projection.epochNo,
      epochType: this.toDbEpochType(projection.epochType),
      startAt: projection.startAt,
      status: this.toDbEpochStatus(projection.status),
    });
    const view = this.toBoundaryView({
      endAt: epoch.endAt,
      epochId: epoch.id,
      epochNo: epoch.epochNo,
      epochType: this.toCommonEpochType(epoch.epochType),
      snapshotAt: epoch.snapshotAt,
      startAt: epoch.startAt,
      status: this.toCommonEpochStatus(epoch.status),
    });

    if (normalized.status && view.status !== normalized.status) {
      throw new NotFoundException('Weekly epoch boundary not found for status');
    }

    return view;
  }

  async syncEpochLifecycle(
    referenceAt?: string,
  ): Promise<WeeklyEpochLifecycleSyncResult> {
    const projection = this.weeklyEpochPolicyEngine.projectBoundary({
      epochType: EpochType.WEEKLY_PROMOTION,
      referenceAt,
    });

    return this.transactionOrchestrator.run(async (tx) => {
      const readyEpochIds: string[] = [];

      for (let epochNo = 1; epochNo <= projection.epochNo; epochNo += 1) {
        const targetProjection = this.weeklyEpochPolicyEngine.projectEpochByNo(
          epochNo,
          EpochType.WEEKLY_PROMOTION,
          projection.referenceAt,
        );
        const targetStatus = this.weeklyEpochPolicyEngine.buildEpochStatus(
          epochNo,
          projection.epochNo,
          projection.status,
        );
        const epoch = await this.weeklyEpochRepository.ensureEpoch(
          {
            endAt: targetProjection.endAt,
            epochNo,
            epochType: DbEpochType.WEEKLY_PROMOTION,
            startAt: targetProjection.startAt,
            status: this.toDbEpochStatus(targetStatus),
          },
          tx,
        );

        if (
          epochNo < projection.epochNo &&
          (epoch.status === DbEpochStatus.OPEN ||
            epoch.status === DbEpochStatus.PENDING)
        ) {
          await this.weeklyEpochRepository.updateStatus(
            epoch.id,
            DbEpochStatus.CALCULATING,
            tx,
          );
          readyEpochIds.push(epoch.id);
          continue;
        }

        if (
          epochNo < projection.epochNo &&
          epoch.status === DbEpochStatus.CALCULATING
        ) {
          readyEpochIds.push(epoch.id);
          continue;
        }

        if (
          epochNo === projection.epochNo &&
          epoch.status === DbEpochStatus.PENDING &&
          targetStatus === EpochStatus.OPEN
        ) {
          await this.weeklyEpochRepository.updateStatus(
            epoch.id,
            DbEpochStatus.OPEN,
            tx,
          );
        }
      }

      const currentEpoch = await this.weeklyEpochRepository.findByEpochNo(
        DbEpochType.WEEKLY_PROMOTION,
        projection.epochNo,
        tx,
      );
      if (!currentEpoch) {
        throw new NotFoundException('Current weekly epoch not found');
      }

      await this.auditSeam.record({
        action: 'epoch.weekly.sync',
        targetId: currentEpoch.id,
        targetType: 'WeeklyEpoch',
        payload: {
          epochNo: currentEpoch.epochNo,
          epochsReadyForQualification: readyEpochIds,
          referenceAt: projection.referenceAt.toISOString(),
        },
      });

      return {
        currentEpoch: this.toBoundaryView({
          endAt: currentEpoch.endAt,
          epochId: currentEpoch.id,
          epochNo: currentEpoch.epochNo,
          epochType: this.toCommonEpochType(currentEpoch.epochType),
          snapshotAt: currentEpoch.snapshotAt,
          startAt: currentEpoch.startAt,
          status: this.toCommonEpochStatus(currentEpoch.status),
        }),
        epochsReadyForQualification: readyEpochIds,
      };
    });
  }

  async prepareRolloverForEpoch(
    epochId: string,
  ): Promise<WeeklyEpochRolloverPreparationResult> {
    return this.transactionOrchestrator.run(async (tx) => {
      const epoch = await this.weeklyEpochRepository.findById(epochId, tx);
      if (!epoch) {
        throw new NotFoundException('Weekly epoch not found');
      }

      if (epoch.status === DbEpochStatus.CANCELLED) {
        return {
          epochId: epoch.id,
          lotteryRolledOver: true,
          nextEpochId: this.readLaneRolloverTarget(
            epoch.calculationRemark,
            'LOTTERY',
          ),
          rankingRolledOver:
            this.readLaneRolloverTarget(epoch.calculationRemark, 'RANKING') !==
            undefined,
          rolledOver: true,
          totalPromotionPoolUsdt: epoch.rolloverUsdt.toFixed(0),
        };
      }

      if (
        epoch.status === DbEpochStatus.SETTLED ||
        epoch.status === DbEpochStatus.ROOT_POSTED
      ) {
        return {
          epochId: epoch.id,
          rolledOver: false,
          totalPromotionPoolUsdt: (
            BigInt(epoch.rolloverUsdt.toFixed(0)) +
            BigInt(epoch.lotteryPoolUsdt.toFixed(0)) +
            BigInt(epoch.rankingPoolUsdt.toFixed(0))
          ).toString(),
        };
      }

      const dateKeyFromInclusive = this.weeklyEpochPolicyEngine.toDateKey(
        epoch.startAt,
      );
      const dateKeyToExclusive = this.weeklyEpochPolicyEngine.toDateKey(
        epoch.endAt,
      );
      const currentWeekPool =
        await this.statsRepository.aggregateEpochLotteryPool(
          {
            dateKeyFromInclusive,
            dateKeyToExclusive,
          },
          tx,
        );
      const legacyCombinedRollover =
        new Prisma.Decimal(epoch.lotteryRolloverUsdt).plus(
          epoch.rankingRolloverUsdt,
        ).equals(0)
          ? new Prisma.Decimal(epoch.rolloverUsdt)
          : new Prisma.Decimal(0);
      const currentWeekSplit = this.weeklyEpochPolicyEngine.buildPoolSplit(
        currentWeekPool.toFixed(0),
      );
      const legacyTotalSplit = this.weeklyEpochPolicyEngine.buildPoolSplit(
        legacyCombinedRollover.plus(currentWeekPool).toFixed(0),
      );
      const preparedLotteryPool = legacyCombinedRollover.equals(0)
        ? new Prisma.Decimal(epoch.lotteryRolloverUsdt).plus(
            currentWeekSplit.lotteryPoolAtomic,
          )
        : new Prisma.Decimal(legacyTotalSplit.lotteryPoolAtomic);
      const preparedRankingPool = legacyCombinedRollover.equals(0)
        ? new Prisma.Decimal(epoch.rankingRolloverUsdt).plus(
            currentWeekSplit.rankingPoolAtomic,
          )
        : new Prisma.Decimal(legacyTotalSplit.rankingPoolAtomic);
      const totalPromotionPool = new Prisma.Decimal(preparedLotteryPool).plus(
        preparedRankingPool,
      );
      const lotteryShouldRollover = this.weeklyEpochPolicyEngine.shouldRollover(
        epoch.participantCount,
      );
      const rankingShouldRollover = false;
      const nextProjection =
        lotteryShouldRollover || rankingShouldRollover
          ? this.weeklyEpochPolicyEngine.projectEpochByNo(
              epoch.epochNo + 1,
              EpochType.WEEKLY_PROMOTION,
              epoch.endAt,
            )
          : null;
      const nextEpoch = nextProjection
        ? await this.weeklyEpochRepository.ensureEpoch(
            {
              endAt: nextProjection.endAt,
              epochNo: nextProjection.epochNo,
              epochType: DbEpochType.WEEKLY_PROMOTION,
              startAt: nextProjection.startAt,
              status: this.toDbEpochStatus(nextProjection.status),
            },
            tx,
          )
        : null;

      if (nextEpoch && (lotteryShouldRollover || rankingShouldRollover)) {
        await this.weeklyEpochRepository.incrementRolloverPools(
          {
            epochId: nextEpoch.id,
            lotteryRolloverUsdt: lotteryShouldRollover
              ? preparedLotteryPool
              : undefined,
            rankingRolloverUsdt: rankingShouldRollover
              ? preparedRankingPool
              : undefined,
          },
          tx,
        );
      }

      const lotteryStatus = lotteryShouldRollover
        ? DbEpochStatus.CANCELLED
        : DbEpochStatus.CALCULATING;
      const rankingStatus = rankingShouldRollover
        ? DbEpochStatus.CANCELLED
        : DbEpochStatus.CALCULATING;
      const aggregateStatus =
        lotteryStatus === DbEpochStatus.CANCELLED &&
        rankingStatus === DbEpochStatus.CANCELLED
          ? DbEpochStatus.CANCELLED
          : DbEpochStatus.CALCULATING;
      const calculationRemark = [
        lotteryShouldRollover && nextEpoch
          ? `LOTTERY_ROLLOVER_TO:${nextEpoch.id}`
          : `LOTTERY_READY:${epoch.participantCount}`,
        rankingShouldRollover && nextEpoch
          ? `RANKING_ROLLOVER_TO:${nextEpoch.id}`
          : 'RANKING_READY',
      ]
        .filter(Boolean)
        .join('|');

      await this.weeklyEpochRepository.finalizeEpochPreparation(
        {
          calculationRemark,
          epochId: epoch.id,
          lotteryPoolUsdt: preparedLotteryPool,
          lotteryStatus,
          rankingPoolUsdt: preparedRankingPool,
          rankingStatus,
          settledAt:
            aggregateStatus === DbEpochStatus.CANCELLED ? new Date() : null,
          snapshotAt: new Date(),
          status: aggregateStatus,
        },
        tx,
      );

      if (lotteryShouldRollover || rankingShouldRollover) {
        await this.auditSeam.record({
          action: 'epoch.weekly.rollover-prepared',
          targetId: epoch.id,
          targetType: 'WeeklyEpoch',
          payload: {
            lotteryRolledOver: lotteryShouldRollover,
            nextEpochId: nextEpoch?.id,
            participantCount: epoch.participantCount,
            rankingRolledOver: rankingShouldRollover,
            totalPromotionPoolUsdt: totalPromotionPool.toFixed(0),
          },
        });

        return {
          epochId: epoch.id,
          lotteryRolledOver: lotteryShouldRollover,
          nextEpochId: nextEpoch?.id,
          rankingRolledOver: rankingShouldRollover,
          rolledOver: lotteryShouldRollover || rankingShouldRollover,
          totalPromotionPoolUsdt: totalPromotionPool.toFixed(0),
        };
      }

      await this.auditSeam.record({
        action: 'epoch.weekly.ready-for-draw',
        targetId: epoch.id,
        targetType: 'WeeklyEpoch',
        payload: {
          participantCount: epoch.participantCount,
          totalPromotionPoolUsdt: totalPromotionPool.toFixed(0),
        },
      });

      return {
        epochId: epoch.id,
        lotteryRolledOver: false,
        rolledOver: false,
        rankingRolledOver: false,
        totalPromotionPoolUsdt: totalPromotionPool.toFixed(0),
      };
    });
  }

  private toBoundaryView(params: {
    endAt: Date;
    epochId: string;
    epochNo: number;
    epochType: EpochType;
    snapshotAt?: Date | null;
    startAt: Date;
    status: EpochStatus;
  }): WeeklyEpochBoundaryView {
    return {
      endAt: params.endAt,
      epochId: params.epochId,
      epochNo: params.epochNo,
      epochType: params.epochType,
      snapshotAt: params.snapshotAt ?? undefined,
      startAt: params.startAt,
      status: params.status,
    };
  }

  private toDbEpochStatus(status: EpochStatus): DbEpochStatus {
    switch (status) {
      case EpochStatus.OPEN:
        return DbEpochStatus.OPEN;
      case EpochStatus.CALCULATING:
        return DbEpochStatus.CALCULATING;
      case EpochStatus.ROOT_POSTED:
        return DbEpochStatus.ROOT_POSTED;
      case EpochStatus.SETTLED:
        return DbEpochStatus.SETTLED;
      case EpochStatus.CANCELLED:
        return DbEpochStatus.CANCELLED;
      case EpochStatus.PENDING:
      default:
        return DbEpochStatus.PENDING;
    }
  }

  private toDbEpochType(type: EpochType): DbEpochType {
    switch (type) {
      case EpochType.NFT_SUBSIDY:
        return DbEpochType.NFT_SUBSIDY;
      case EpochType.TOKEN_DIVIDEND:
        return DbEpochType.TOKEN_DIVIDEND;
      case EpochType.WEEKLY_PROMOTION:
      default:
        return DbEpochType.WEEKLY_PROMOTION;
    }
  }

  private toCommonEpochStatus(status: DbEpochStatus): EpochStatus {
    switch (status) {
      case DbEpochStatus.OPEN:
        return EpochStatus.OPEN;
      case DbEpochStatus.CALCULATING:
        return EpochStatus.CALCULATING;
      case DbEpochStatus.ROOT_POSTED:
        return EpochStatus.ROOT_POSTED;
      case DbEpochStatus.SETTLED:
        return EpochStatus.SETTLED;
      case DbEpochStatus.CANCELLED:
        return EpochStatus.CANCELLED;
      case DbEpochStatus.PENDING:
      default:
        return EpochStatus.PENDING;
    }
  }

  private toCommonEpochType(type: DbEpochType): EpochType {
    switch (type) {
      case DbEpochType.NFT_SUBSIDY:
        return EpochType.NFT_SUBSIDY;
      case DbEpochType.TOKEN_DIVIDEND:
        return EpochType.TOKEN_DIVIDEND;
      case DbEpochType.WEEKLY_PROMOTION:
      default:
        return EpochType.WEEKLY_PROMOTION;
    }
  }

  private readLaneRolloverTarget(
    remark: string | null | undefined,
    lane: 'LOTTERY' | 'RANKING',
  ): string | undefined {
    const marker = `${lane}_ROLLOVER_TO:`;
    const match = (remark ?? '')
      .split('|')
      .map((item) => item.trim())
      .find((item) => item.startsWith(marker));

    return match ? match.replace(marker, '') : undefined;
  }
}
