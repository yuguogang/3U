import { Module } from '@nestjs/common';
import { StatsModule } from '../stats';
import { SharedDomainModule } from '../shared';
import { TreeModule } from '../tree';
import { VolumePropagationEngine } from './engines/volume-propagation.engine';
import { VolumeSnapshotRepository } from './repositories/volume-snapshot.repository';
import { VolumePropagationService } from './services/volume-propagation.service';

@Module({
  imports: [SharedDomainModule, StatsModule, TreeModule],
  providers: [
    VolumePropagationService,
    VolumePropagationEngine,
    VolumeSnapshotRepository,
  ],
  exports: [
    VolumePropagationService,
    VolumePropagationEngine,
    VolumeSnapshotRepository,
  ],
})
export class VolumeModule {}
