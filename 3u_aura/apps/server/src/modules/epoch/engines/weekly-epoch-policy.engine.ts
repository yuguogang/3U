import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { ConfigOptions } from '@/configuration';
import {
  EpochStatus,
  EpochType,
  WeeklyEpochBoundaryQuery,
} from '3u-aura-common';

export interface WeeklyEpochSettings {
  epochLengthDays: number;
  minimumParticipants: number;
  startAt: string;
  ticketStreakDays: number;
  timezone: string;
}

export interface WeeklyEpochProjection {
  endAt: Date;
  epochNo: number;
  epochType: EpochType;
  referenceAt: Date;
  startAt: Date;
  status: EpochStatus;
}

@Injectable()
export class WeeklyEpochPolicyEngine {
  constructor(private readonly configService: ConfigService<ConfigOptions>) {}

  normalizeBoundaryQuery(
    query: WeeklyEpochBoundaryQuery,
  ): WeeklyEpochBoundaryQuery {
    return {
      epochType: query.epochType ?? EpochType.WEEKLY_PROMOTION,
      referenceAt: query.referenceAt,
      status: query.status,
    };
  }

  getSettings(): WeeklyEpochSettings {
    const promotion =
      this.configService.get<ConfigOptions['promotion']>('promotion');

    return {
      epochLengthDays: promotion?.epochLengthDays ?? 7,
      minimumParticipants: promotion?.minimumParticipants ?? 12,
      startAt: promotion?.startAt ?? '2026-03-11T00:00:00',
      ticketStreakDays: promotion?.ticketStreakDays ?? 7,
      timezone: promotion?.timezone ?? 'Asia/Shanghai',
    };
  }

  projectBoundary(query: WeeklyEpochBoundaryQuery): WeeklyEpochProjection {
    const normalized = this.normalizeBoundaryQuery(query);
    const settings = this.getSettings();
    const reference = normalized.referenceAt
      ? new Date(normalized.referenceAt)
      : new Date();
    const anchor = new Date(settings.startAt);
    const intervalMs = settings.epochLengthDays * 24 * 60 * 60 * 1000;
    const elapsedMs = Math.max(reference.getTime() - anchor.getTime(), 0);
    const epochNo = Math.floor(elapsedMs / intervalMs) + 1;
    const startAt = new Date(anchor.getTime() + (epochNo - 1) * intervalMs);
    const endAt = new Date(startAt.getTime() + intervalMs);
    const status =
      reference.getTime() < startAt.getTime()
        ? EpochStatus.PENDING
        : reference.getTime() < endAt.getTime()
          ? EpochStatus.OPEN
          : EpochStatus.CALCULATING;

    return {
      endAt,
      epochNo,
      epochType: normalized.epochType ?? EpochType.WEEKLY_PROMOTION,
      referenceAt: reference,
      startAt,
      status,
    };
  }

  projectEpochByNo(
    epochNo: number,
    epochType: EpochType,
    referenceAt?: Date,
  ): WeeklyEpochProjection {
    const settings = this.getSettings();
    const anchor = new Date(settings.startAt);
    const reference = referenceAt ? new Date(referenceAt) : new Date();
    const intervalMs = settings.epochLengthDays * 24 * 60 * 60 * 1000;
    const startAt = new Date(anchor.getTime() + (epochNo - 1) * intervalMs);
    const endAt = new Date(startAt.getTime() + intervalMs);
    const status =
      reference.getTime() < startAt.getTime()
        ? EpochStatus.PENDING
        : reference.getTime() < endAt.getTime()
          ? EpochStatus.OPEN
          : EpochStatus.CALCULATING;

    return {
      endAt,
      epochNo,
      epochType,
      referenceAt: reference,
      startAt,
      status,
    };
  }

  buildEpochStatus(
    epochNo: number,
    currentEpochNo: number,
    currentBoundaryStatus: EpochStatus,
  ): EpochStatus {
    if (epochNo < currentEpochNo) {
      return EpochStatus.CALCULATING;
    }

    return currentBoundaryStatus;
  }

  buildPoolSplit(totalPromotionPoolAtomic: string): {
    lotteryPoolAtomic: string;
    rankingPoolAtomic: string;
  } {
    const total = BigInt(totalPromotionPoolAtomic);
    const lotteryPoolAtomic = ((total * 50n) / 100n).toString();
    const rankingPoolAtomic = (total - BigInt(lotteryPoolAtomic)).toString();

    return {
      lotteryPoolAtomic,
      rankingPoolAtomic,
    };
  }

  shouldRollover(participantCount: number): boolean {
    return participantCount < this.getSettings().minimumParticipants;
  }

  toDateKey(value: Date): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone: this.getSettings().timezone,
      year: 'numeric',
    });
    const parts = formatter.formatToParts(value);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }
}
