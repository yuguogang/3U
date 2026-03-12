import { Injectable } from '@nestjs/common';

@Injectable()
export class RewardAllocationEngine {
  buildDistributionKey(kind: string, value: string): string {
    return `${kind}:${value}`;
  }

  buildReferralRewardAmounts(checkinAuraAtomic: string): {
    directAuraAtomic: string;
    indirectAuraAtomic: string;
  } {
    const total = BigInt(checkinAuraAtomic);

    return {
      directAuraAtomic: (total / 10n).toString(),
      indirectAuraAtomic: (total / 20n).toString(),
    };
  }
}
