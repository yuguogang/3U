import { Prisma } from '@/db';
import { Injectable, NotFoundException } from '@nestjs/common';
import { StatsRepository } from '../../stats';
import { AuditSeamService, TransactionOrchestratorService } from '../../shared';
import { VolumePropagationEngine } from '../engines/volume-propagation.engine';
import { VolumeSnapshotRepository } from '../repositories/volume-snapshot.repository';

@Injectable()
export class VolumePropagationService {
  constructor(
    private readonly auditSeam: AuditSeamService,
    private readonly statsRepository: StatsRepository,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly volumePropagationEngine: VolumePropagationEngine,
    private readonly volumeSnapshotRepository: VolumeSnapshotRepository,
  ) {}

  async propagateForCheckin(sourceCheckinId: string): Promise<void> {
    await this.auditSeam.record({
      action: 'volume.propagate.requested',
      targetId: sourceCheckinId,
      targetType: 'Checkin',
    });

    await this.transactionOrchestrator.run(async (tx) => {
      const source = await this.volumeSnapshotRepository.findCheckinSource(
        sourceCheckinId,
        tx,
      );
      if (!source) {
        throw new NotFoundException('Checkin not found');
      }

      await this.propagateConfirmedCheckin(
        {
          amountAtomic: source.payAmountUsdt.toFixed(0),
          dateKey: source.dateKey,
          sourceCheckinId: source.id,
          userId: source.userId,
        },
        tx,
      );
    });
  }

  async propagateConfirmedCheckin(
    data: {
      amountAtomic: string;
      dateKey: string;
      sourceCheckinId: string;
      userId: string;
    },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const pathRows = await this.volumeSnapshotRepository.listPropagationPath(
      data.userId,
      tx,
    );
    const targets = this.volumePropagationEngine.buildPropagationTargets(
      pathRows,
      data.amountAtomic,
    );

    for (const target of targets) {
      const profile = await this.statsRepository.ensureUserProfile(
        target.ancestorId,
        tx,
      );
      const dailyStat = await this.statsRepository.findDailyStat(
        target.ancestorId,
        data.dateKey,
        tx,
      );
      const profileProjection = this.volumePropagationEngine.applyBranchVolume({
        amountAtomic: target.amountAtomic,
        branch: target.branch,
        currentLeftAtomic: profile.leftTeamVolume.toFixed(0),
        currentRightAtomic: profile.rightTeamVolume.toFixed(0),
      });
      const dailyProjection = this.volumePropagationEngine.applyBranchVolume({
        amountAtomic: target.amountAtomic,
        branch: target.branch,
        currentLeftAtomic: dailyStat?.leftVolumeUsdt.toFixed(0) ?? '0',
        currentRightAtomic: dailyStat?.rightVolumeUsdt.toFixed(0) ?? '0',
      });

      await this.statsRepository.applyProfileTeamVolumeProjection(
        {
          leftTeamVolume: new Prisma.Decimal(profileProjection.leftAtomic),
          rightTeamVolume: new Prisma.Decimal(profileProjection.rightAtomic),
          smallLegVolume: new Prisma.Decimal(profileProjection.smallLegAtomic),
          userId: target.ancestorId,
        },
        tx,
      );
      await this.statsRepository.upsertDailyTeamVolumeProjection(
        {
          dateKey: data.dateKey,
          leftVolumeUsdt: new Prisma.Decimal(dailyProjection.leftAtomic),
          rightVolumeUsdt: new Prisma.Decimal(dailyProjection.rightAtomic),
          smallLegVolumeUsdt: new Prisma.Decimal(
            dailyProjection.smallLegAtomic,
          ),
          userId: target.ancestorId,
        },
        tx,
      );
    }
  }
}
