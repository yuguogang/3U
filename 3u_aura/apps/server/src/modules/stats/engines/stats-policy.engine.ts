import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsPolicyEngine {
  toDateKey(input: Date): string {
    return input.toISOString().slice(0, 10);
  }
}
