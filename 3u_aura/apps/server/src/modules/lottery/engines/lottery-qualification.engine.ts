import { ConfigOptions } from '@/configuration';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LotteryQualificationEngine {
  constructor(private readonly configService: ConfigService<ConfigOptions>) {}

  qualifiesForTicket(streakDays: number): boolean {
    return streakDays >= this.getTicketStreakDays();
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
