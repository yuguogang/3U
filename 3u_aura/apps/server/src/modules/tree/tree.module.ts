import { Module } from '@nestjs/common';
import { ReferralModule } from '../referral';
import { SharedDomainModule } from '../shared';
import { TreeController } from './tree.controller';
import { PlacementPolicyEngine } from './engines/placement-policy.engine';
import { TeamClosureRepository } from './repositories/team-closure.repository';
import { TreeTopologyService } from './services/tree-topology.service';

@Module({
  imports: [SharedDomainModule, ReferralModule],
  controllers: [TreeController],
  providers: [
    TreeTopologyService,
    PlacementPolicyEngine,
    TeamClosureRepository,
  ],
  exports: [TreeTopologyService, PlacementPolicyEngine, TeamClosureRepository],
})
export class TreeModule {}
