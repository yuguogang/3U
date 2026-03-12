import { Module } from '@nestjs/common';
import { SharedDomainModule } from '../shared';
import { PaymentPolicyEngine } from './engines/payment-policy.engine';
import { PaymentRepository } from './repositories/payment.repository';
import { PaymentVerificationRepository } from './repositories/payment-verification.repository';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [SharedDomainModule],
  providers: [
    PaymentService,
    PaymentPolicyEngine,
    PaymentRepository,
    PaymentVerificationRepository,
  ],
  exports: [
    PaymentService,
    PaymentPolicyEngine,
    PaymentRepository,
    PaymentVerificationRepository,
  ],
})
export class PaymentModule {}
