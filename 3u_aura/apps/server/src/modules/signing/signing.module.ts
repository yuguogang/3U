import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NftEligibilityModule } from '../nft-eligibility';
import { SharedDomainModule } from '../shared';
import { Eip712PayloadEngine } from './engines/eip712-payload.engine';
import { SigningController } from './signing.controller';
import { SigningNonceRepository } from './repositories/signing-nonce.repository';
import { SigningService } from './services/signing.service';

@Module({
  imports: [ConfigModule, SharedDomainModule, NftEligibilityModule],
  controllers: [SigningController],
  providers: [SigningService, Eip712PayloadEngine, SigningNonceRepository],
  exports: [SigningService, Eip712PayloadEngine, SigningNonceRepository],
})
export class SigningModule {}
