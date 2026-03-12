import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

export interface LotteryWinnerAllocation {
  amountUsdt: string;
  distributionKey: string;
  prizeLabel: 'FIRST' | 'SECOND' | 'THIRD' | 'LUCKY';
  userId: string;
}

export interface LotteryPayoutProjection {
  consolationUserIds: string[];
  rolloverUsdt: string;
  winners: LotteryWinnerAllocation[];
}

@Injectable()
export class LotteryPayoutEngine {
  projectPayout(params: {
    epochId: string;
    lotteryPoolUsdt: string;
    participantUserIds: string[];
  }): LotteryPayoutProjection {
    const participants = [...params.participantUserIds].sort((left, right) =>
      this.buildDeterministicTicketKey(params.epochId, left).localeCompare(
        this.buildDeterministicTicketKey(params.epochId, right),
      ),
    );
    const winnerCount = Math.floor(participants.length / 2);
    const winners = participants.slice(0, winnerCount);
    const consolationUserIds = participants.slice(winnerCount);
    const pool = BigInt(params.lotteryPoolUsdt);

    const firstPool = (pool * 25n) / 100n;
    const secondPool = (pool * 20n) / 100n;
    const thirdPool = (pool * 15n) / 100n;
    const luckyPool = (pool * 40n) / 100n;

    const allocations: LotteryWinnerAllocation[] = [];
    let carry = 0n;

    if (winners[0]) {
      allocations.push({
        amountUsdt: firstPool.toString(),
        distributionKey: 'LOTTERY_FIRST_PRIZE',
        prizeLabel: 'FIRST',
        userId: winners[0],
      });
    } else {
      carry += firstPool;
    }

    carry += this.allocatePrizeBucket({
      allocations,
      distributionKeyPrefix: 'LOTTERY_SECOND_PRIZE',
      pool: secondPool,
      prizeLabel: 'SECOND',
      users: winners.slice(1, 3),
    });
    carry += this.allocatePrizeBucket({
      allocations,
      distributionKeyPrefix: 'LOTTERY_THIRD_PRIZE',
      pool: thirdPool,
      prizeLabel: 'THIRD',
      users: winners.slice(3, 6),
    });
    carry += this.allocatePrizeBucket({
      allocations,
      distributionKeyPrefix: 'LOTTERY_LUCKY_PRIZE',
      pool: luckyPool,
      prizeLabel: 'LUCKY',
      users: winners.slice(6),
    });

    return {
      consolationUserIds,
      rolloverUsdt: carry.toString(),
      winners: allocations,
    };
  }

  private allocatePrizeBucket(params: {
    allocations: LotteryWinnerAllocation[];
    distributionKeyPrefix: string;
    pool: bigint;
    prizeLabel: LotteryWinnerAllocation['prizeLabel'];
    users: string[];
  }): bigint {
    if (!params.users.length) {
      return params.pool;
    }

    const share = params.pool / BigInt(params.users.length);
    const remainder = params.pool % BigInt(params.users.length);

    params.users.forEach((userId, index) => {
      params.allocations.push({
        amountUsdt: (share + (index === 0 ? remainder : 0n)).toString(),
        distributionKey: `${params.distributionKeyPrefix}_${index + 1}`,
        prizeLabel: params.prizeLabel,
        userId,
      });
    });

    return 0n;
  }

  private buildDeterministicTicketKey(epochId: string, userId: string): string {
    return createHash('sha256').update(`${epochId}:${userId}`).digest('hex');
  }
}
