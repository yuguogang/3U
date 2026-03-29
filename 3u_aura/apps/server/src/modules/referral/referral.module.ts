import { forwardRef, Module } from '@nestjs/common';
import { SharedDomainModule } from '../shared';
import { TreeModule } from '../tree';
import { ReferralController } from './referral.controller';
import { ReferralPolicyEngine } from './engines/referral-policy.engine';
import { ReferralRepository } from './repositories/referral.repository';
import { ReferralOnboardingService } from './services/referral-onboarding.service';
import { ReferralService } from './services/referral.service';

@Module({
  imports: [SharedDomainModule, forwardRef(() => TreeModule)],
  controllers: [ReferralController],
  providers: [
    ReferralService,
    ReferralOnboardingService,
    ReferralPolicyEngine,
    ReferralRepository,
  ],
  exports: [
    ReferralService,
    ReferralOnboardingService,
    ReferralPolicyEngine,
    ReferralRepository,
  ],
})
export class ReferralModule {}
