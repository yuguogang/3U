import { Test } from '@nestjs/testing';
import { DbService } from '@/db';
import { ConfigService } from '@nestjs/config';
import { CheckinApplicationService } from './checkin';
import { WeeklyEpochApplicationService } from './epoch';
import { NftEligibilityApplicationService } from './nft-eligibility';
import { ReferralService } from './referral';
import { AuraDomainModule } from './aura-domain.module';
import { TransactionOrchestratorService } from './shared';

describe('AuraDomainModule', () => {
  it('wires the core domain services', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuraDomainModule],
    })
      .overrideProvider(DbService)
      .useValue({
        $transaction: jest.fn(),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue({
          claimChainId: 97,
          referralRpcUrl: 'http://127.0.0.1:8545',
          rpcUrl: 'http://127.0.0.1:8545',
        }),
      })
      .compile();

    expect(moduleRef.get(TransactionOrchestratorService)).toBeDefined();
    expect(moduleRef.get(CheckinApplicationService)).toBeDefined();
    expect(moduleRef.get(ReferralService)).toBeDefined();
    expect(moduleRef.get(WeeklyEpochApplicationService)).toBeDefined();
    expect(moduleRef.get(NftEligibilityApplicationService)).toBeDefined();
  });
});
