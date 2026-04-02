import { ConfigOptions } from '@/configuration';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LotteryQualificationEngine {
  constructor(private readonly configService: ConfigService<ConfigOptions>) {}

  qualifiesForTicket(checkinCount: number): boolean {
    return this.calculateTicketCount(checkinCount) > 0;
  }

  calculateTicketCount(checkinCount: number): number {
    return Math.floor(checkinCount / this.getTicketStreakDays());
  }

  getRemainingCheckinsUntilNextTicket(checkinCount: number): number {
    const perTicket = this.getTicketStreakDays();
    const remainder = checkinCount % perTicket;

    return remainder === 0 ? 0 : perTicket - remainder;
  }

  getCheckinsPerTicket(): number {
    return this.getTicketStreakDays();
  }

  toDateKey(value: Date): string {
    const promotion =
      this.configService.get<ConfigOptions['promotion']>('promotion');
    const formatter = new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone: promotion?.timezone || 'Asia/Shanghai',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(value);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private getTicketStreakDays(): number {
    const promotion =
      this.configService.get<ConfigOptions['promotion']>('promotion');

    return promotion?.ticketStreakDays || 7;
  }
}
