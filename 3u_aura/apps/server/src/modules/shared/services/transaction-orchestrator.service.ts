import { Prisma, DbService } from '@/db';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionOrchestratorService {
  constructor(private readonly db: DbService) {}

  async run<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.db.$transaction((tx) => operation(tx));
  }
}
