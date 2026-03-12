import { Injectable } from '@nestjs/common';

export interface RankingCandidate {
  incrementUsdt: string;
  userId: string;
}

export interface RankingAllocation {
  amountUsdt: string;
  distributionKey: string;
  rank: number;
  userId: string;
}

export interface RankingPayoutProjection {
  allocations: RankingAllocation[];
  rolloverUsdt: string;
}

const MINIMUM_INCREMENT_ATOMIC = '300000000';
const RANKING_PERCENTAGES = [25n, 15n, 12n, 10n, 9n, 8n, 7n, 6n, 4n, 4n];

@Injectable()
export class RankingPayoutEngine {
  projectPayout(params: {
    candidates: RankingCandidate[];
    rankingPoolUsdt: string;
  }): RankingPayoutProjection {
    const qualified = params.candidates
      .filter(
        (candidate) =>
          BigInt(candidate.incrementUsdt) >= BigInt(MINIMUM_INCREMENT_ATOMIC),
      )
      .sort((left, right) => {
        const diff = BigInt(right.incrementUsdt) - BigInt(left.incrementUsdt);
        if (diff !== 0n) {
          return diff > 0n ? 1 : -1;
        }

        return left.userId.localeCompare(right.userId);
      });
    const topTen = qualified.slice(0, 10);
    const pool = BigInt(params.rankingPoolUsdt);
    const allocations: RankingAllocation[] = [];
    let allocatedBase = 0n;
    let allocatedPercentages = 0n;

    topTen.forEach((candidate, index) => {
      const percentage = RANKING_PERCENTAGES[index];
      const amount = (pool * percentage) / 100n;
      allocatedBase += amount;
      allocatedPercentages += percentage;
      allocations.push({
        amountUsdt: amount.toString(),
        distributionKey: `RANK_${index + 1}`,
        rank: index + 1,
        userId: candidate.userId,
      });
    });

    if (allocations.length) {
      const allocatedCap = (pool * allocatedPercentages) / 100n;
      const dust = allocatedCap - allocatedBase;
      const lastAllocation = allocations.at(-1);

      if (lastAllocation && dust > 0n) {
        lastAllocation.amountUsdt = (
          BigInt(lastAllocation.amountUsdt) + dust
        ).toString();
      }
    }

    const distributed = allocations.reduce(
      (sum, allocation) => sum + BigInt(allocation.amountUsdt),
      0n,
    );

    return {
      allocations,
      rolloverUsdt: (pool - distributed).toString(),
    };
  }
}
