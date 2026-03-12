import { Injectable } from '@nestjs/common';

export interface IdempotentExecutionOptions {
  key: string;
}

@Injectable()
export class IdempotencySeamService {
  async run<T>(
    _options: IdempotentExecutionOptions,
    operation: () => Promise<T>,
  ): Promise<T> {
    return operation();
  }
}
