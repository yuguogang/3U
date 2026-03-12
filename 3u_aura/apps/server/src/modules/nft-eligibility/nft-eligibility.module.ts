import { Module } from '@nestjs/common';
import { SharedDomainModule } from '../shared';
import { NftEligibilityController } from './nft-eligibility.controller';
import { NftEligibilityPolicyEngine } from './engines/nft-eligibility-policy.engine';
import { NftEligibilityRepository } from './repositories/nft-eligibility.repository';
import { NftEligibilityApplicationService } from './services/nft-eligibility-application.service';

@Module({
  imports: [SharedDomainModule],
  controllers: [NftEligibilityController],
  providers: [
    NftEligibilityApplicationService,
    NftEligibilityPolicyEngine,
    NftEligibilityRepository,
  ],
  exports: [
    NftEligibilityApplicationService,
    NftEligibilityPolicyEngine,
    NftEligibilityRepository,
  ],
})
export class NftEligibilityModule {}
