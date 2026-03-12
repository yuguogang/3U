import { Prisma } from '@/db';
import type { Checkin, PaymentReceipt, UserProfile } from '@/db';
import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CheckinStatus,
  PromotionCheckinRequest,
  PromotionCheckinResult,
} from '3u-aura-common';
import * as dayjs from 'dayjs';

const CHECKIN_REWARD_AURA_ATOMIC = (1000n * 10n ** 18n).toString();

export interface CheckinProgressProjection {
  checkinCountToday: number;
  countedCheckinDaysIncrement: number;
  currentStreakDays: number;
  dateKey: string;
  isCountedForStreak: boolean;
  maxStreakDays: number;
  rewardAuraAmountAtomic: string;
  totalCheckinDaysIncrement: number;
}

type ExistingCheckinRecord = Checkin & {
  paymentReceipt?: PaymentReceipt | null;
};

@Injectable()
export class CheckinPolicyEngine {
  assertCommandBoundary(command: PromotionCheckinRequest): void {
    if (!command.chainId || !command.txHash) {
      throw new BadRequestException('chainId and txHash are required');
    }
  }

  projectConfirmedCheckin(
    profile: UserProfile,
    latestCheckinToday: Pick<Checkin, 'checkinCountToday'> | null,
    occurredAt: Date,
  ): CheckinProgressProjection {
    const dateKey = dayjs(occurredAt).format('YYYY-MM-DD');
    const checkinCountToday = (latestCheckinToday?.checkinCountToday ?? 0) + 1;
    const isCountedForStreak = checkinCountToday === 1;

    if (!isCountedForStreak) {
      return {
        checkinCountToday,
        countedCheckinDaysIncrement: 0,
        currentStreakDays: profile.currentStreakDays,
        dateKey,
        isCountedForStreak,
        maxStreakDays: profile.maxStreakDays,
        rewardAuraAmountAtomic: CHECKIN_REWARD_AURA_ATOMIC,
        totalCheckinDaysIncrement: 0,
      };
    }

    const lastCheckinDateKey = profile.lastCheckinDate
      ? dayjs(profile.lastCheckinDate).format('YYYY-MM-DD')
      : undefined;

    let currentStreakDays = 1;
    let totalCheckinDaysIncrement = 1;

    if (lastCheckinDateKey === dateKey) {
      currentStreakDays = profile.currentStreakDays;
      totalCheckinDaysIncrement = 0;
    } else if (
      lastCheckinDateKey &&
      dayjs(occurredAt)
        .startOf('day')
        .diff(dayjs(profile.lastCheckinDate).startOf('day'), 'day') === 1
    ) {
      currentStreakDays = profile.currentStreakDays + 1;
    }

    return {
      checkinCountToday,
      countedCheckinDaysIncrement: totalCheckinDaysIncrement,
      currentStreakDays,
      dateKey,
      isCountedForStreak,
      maxStreakDays: Math.max(profile.maxStreakDays, currentStreakDays),
      rewardAuraAmountAtomic: CHECKIN_REWARD_AURA_ATOMIC,
      totalCheckinDaysIncrement,
    };
  }

  buildPoolSplit(totalAmountAtomic: string): {
    lotteryAmountAtomic: string;
    treasuryAmountAtomic: string;
  } {
    const total = BigInt(totalAmountAtomic);
    const lotteryAmountAtomic = ((total * 30n) / 100n).toString();
    const treasuryAmountAtomic = (
      total - BigInt(lotteryAmountAtomic)
    ).toString();

    return { lotteryAmountAtomic, treasuryAmountAtomic };
  }

  toResult(
    checkin: ExistingCheckinRecord,
    paymentReceiptId?: string,
  ): PromotionCheckinResult {
    return {
      checkinCountToday: checkin.checkinCountToday,
      checkinId: checkin.id,
      dateKey: checkin.dateKey,
      paymentReceiptId: paymentReceiptId ?? checkin.paymentReceipt?.id,
      rewardAuraAmount: this.toAtomicString(checkin.rewardAuraAmount),
      status: checkin.status as CheckinStatus,
    };
  }

  toDecimal(value: string): Prisma.Decimal {
    return new Prisma.Decimal(value);
  }

  private toAtomicString(value: Prisma.Decimal): string {
    return value.toFixed(0);
  }
}
