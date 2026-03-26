import { Prisma, PrismaClient } from 'generated/prisma/client';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPrismaPgAdapter,
  splitPrismaPgPoolConfig,
} from './prisma-pg-config';

@Injectable()
export class DbService extends PrismaClient {
  constructor(configService: ConfigService) {
    const database = configService.getOrThrow<any>('db');
    const { poolConfig, schema } = splitPrismaPgPoolConfig(database);
    const { adapter } = createPrismaPgAdapter(poolConfig, schema);
    const options: Prisma.PrismaClientOptions = { adapter };

    const isProd = configService.get<boolean>('prod');
    if (isProd) {
      super(options);
    } else {
      options.log = ['query', 'info', 'warn', 'error'];
      super(options);

      // @ts-expect-error - $on('query') is available when log includes 'query'
      this.$on('query', (e: any) => {
        console.log('SQL:', e.query); // 模板 SQL
        console.log('Params:', e.params); // 参数数组
        console.log('Duration:', e.duration, 'ms');
      });
    }
  }
}
