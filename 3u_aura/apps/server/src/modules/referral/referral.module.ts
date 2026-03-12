import { Module } from '@nestjs/common';
import { SharedDomainModule } from '../shared';
import { ReferralController } from './referral.controller';
import { ReferralPolicyEngine } from './engines/referral-policy.engine';
import { ReferralRepository } from './repositories/referral.repository';
import { ReferralService } from './services/referral.service';

@Module({
  imports: [SharedDomainModule],
  controllers: [ReferralController],
  providers: [ReferralService, ReferralPolicyEngine, ReferralRepository],
  exports: [ReferralService, ReferralPolicyEngine, ReferralRepository],
})
export class ReferralModule {}
