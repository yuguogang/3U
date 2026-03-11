import type { ConfigOptions } from './config.types';
import axios from 'axios';

import { HttpsProxyAgent } from 'https-proxy-agent';

export const isDev = () => {
  return process.env.NODE_ENV === 'development';
};
let agent: any;
const proxyUrl =
  process.env.https_proxy ||
  process.env.HTTPS_PROXY ||
  process.env.http_proxy ||
  process.env.HTTP_PROXY ||
  process.env.all_proxy ||
  process.env.ALL_PROXY;

if (isDev() && proxyUrl) {
  agent = new HttpsProxyAgent(proxyUrl);
  axios.defaults.httpsAgent = agent;
  axios.defaults.httpAgent = agent;
}

export const configuration = () => {
  const config: ConfigOptions = {
    prod: !isDev(),
    host: (process.env.HOST as string) || 'http://localhost:4000',
    port: Number.parseInt(`${process.env.PORT || 4000}`),
    api: {
      prefix: process.env.API_PREFIX,
    },
    cors: {
      credentials: process.env.CORS_CREDENTIALS !== 'false',
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.includes(',')
          ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
          : process.env.CORS_ORIGIN
        : '*',
    },
    db: {
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    },
    cache: {
      url: process.env.CACHE_URL || 'redis://localhost:6379',
      password: process.env.CACHE_PASSWORD,
    },
    bull: {
      connection: {
        host: process.env.BULL_HOST,
        port: Number.parseInt(process.env.BULL_PORT || '6379'),
      },
    },
    throttler: {
      throttlers: [
        {
          ttl: Number.parseInt(
            `${(process.env.THROTTLER_TTL as string) || 60}`,
          ), // 默认 时间窗口60秒
          limit: Number.parseInt(
            `${(process.env.THROTTLER_LIMIT as string) || 60}`,
          ), // 默认 最大请求次数60次
        },
      ],
      redis: (process.env.THROTTLER_REDIS as string) || undefined,
    },
    auth: {
      jwt: {
        secret: process.env.AUTH_JWT_SECRET as string,
        signOptions: {
          expiresIn: Number.parseInt(
            `${(process.env.AUTH_JWT_SECRET_EXPIRES_SECONDS as string) || 3600 * 24 * 7}`,
          ), // 默认7天
        },
        refresh: {
          secret: process.env.AUTH_JWT_REFRESH_SECRET as string,
          signOptions: {
            expiresIn: Number.parseInt(
              `${(process.env.AUTH_JWT_SECRET_EXPIRES_SECONDS as string) || 3600 * 24 * 30}`, // 默认30天
            ),
          },
        },
      },
    },
    dataSync: {
      startDate: process.env.DATA_SYNC_START_DATE || '2026-01-01T00:00:00Z',
      timeoutHours: Number.parseInt(
        process.env.DATA_SYNC_TIMEOUT_HOURS || '24',
      ),
      coreSymbols: (process.env.DATA_SYNC_CORE_SYMBOLS || 'BTC,ETH,TRX').split(
        ',',
      ),
    },
  };

  return config;
};
