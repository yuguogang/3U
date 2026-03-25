import type { RedisClientOptions } from '@keyv/redis';
import type {
  CorsOptions,
  CorsOptionsDelegate,
} from '@nestjs/common/interfaces/external/cors-options.interface';
import type { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import type { ThrottlerOptions } from '@nestjs/throttler';
import type { QueueOptions } from 'bullmq';

import { RedisOptions } from 'ioredis';
import type { PrismaPgPoolConfig } from '@/db/prisma-pg-config';

export type ConfigOptions = {
  api: {
    prefix?: string;
  };
  admin: {
    allowlistWallets: string[];
  };
  auth: {
    jwt: JwtModuleOptions & {
      refresh: {
        secret?: string;
        signOptions?: JwtSignOptions;
      };
    };
  };
  cache: RedisClientOptions;
  cors: CorsOptions | CorsOptionsDelegate<any>;
  db: PrismaPgPoolConfig;
  host: string;
  bull: QueueOptions;
  port: number;
  prod: boolean;
  throttler: {
    redis?: RedisOptions | string;
    throttlers: Array<ThrottlerOptions>;
  };
  dataSync: {
    startDate: string;
    timeoutHours: number;
    coreSymbols: string[];
  };
  promotion: {
    claimChainId: number;
    startAt: string;
    checkinReceiverAddress?: string;
    rewardFunderAddress?: string;
    merkleDistributorAddress?: string;
    nftSaleAddress?: string;
    paymentTokenAddress?: string;
    rpcUrl?: string;
    referralRpcUrl?: string;
    referralSignerPrivateKey?: string;
    referralSignatureTtlSeconds: number;
    settlementAddress?: string;
    timezone: string;
    epochLengthDays: number;
    ticketStreakDays: number;
    minimumParticipants: number;
  };
};
