import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DbModule } from './db';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from './configuration';
import { RedisOptions } from 'ioredis';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerOptions } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth';
import { UserModule } from './user';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ['.env.local', '.env'],
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const { throttlers, redis } = configService.get<{
          redis: RedisOptions;
          throttlers: ThrottlerOptions[];
        }>('throttler')!;

        return {
          throttlers,
          storage: new ThrottlerStorageRedisService(new Redis(redis)),
        };
      },
    }),
    DbModule,
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,

      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const options = configService.get('cache');
        return {
          stores: [createKeyv(options)],
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const options = configService.get('bull');

        return options;
      },
    }),

    // 业务模块
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule { }
