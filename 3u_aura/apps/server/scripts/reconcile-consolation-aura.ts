import 'reflect-metadata';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import {
  resolveDatabaseSchemaFromEnv,
  splitPrismaPgPoolConfig,
} from '../src/db/prisma-pg-config';

function readArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index !== -1) {
    return process.argv[index + 1];
  }

  const inline = process.argv.find((value) => value.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : undefined;
}

function buildDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    const parsed = new URL(databaseUrl);

    return {
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      host: parsed.hostname,
      password: decodeURIComponent(parsed.password || ''),
      port: Number.parseInt(parsed.port || '5432', 10),
      schema:
        parsed.searchParams.get('schema') || resolveDatabaseSchemaFromEnv(),
      user: decodeURIComponent(parsed.username || 'postgres'),
    };
  }

  const schema = resolveDatabaseSchemaFromEnv();
  return {
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    password: process.env.DATABASE_PASSWORD ?? '',
    port: Number.parseInt(process.env.DATABASE_PORT || '5432', 10),
    schema,
    user: process.env.DATABASE_USER,
  };
}

function toDateKey(value: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  });
  const parts = formatter.formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

async function main() {
  const walletAddress = readArg('wallet');
  const userId = readArg('user-id');
  const epochId = readArg('epoch-id');

  if (!walletAddress && !userId && !epochId) {
    throw new Error(
      'Usage: pnpm --dir apps/server exec tsx scripts/reconcile-consolation-aura.ts [--wallet <address>] [--user-id <id>] [--epoch-id <id>]',
    );
  }

  const { poolConfig, schema } = splitPrismaPgPoolConfig(buildDatabaseConfig());
  const pool = new Pool(poolConfig);
  const adapter = new PrismaPg(pool, schema ? { schema } : undefined);
  const prisma = new PrismaClient({ adapter });
  const timezone = process.env.PROMOTION_TIMEZONE || 'Asia/Shanghai';

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rewards = await tx.weeklyReward.findMany({
        where: {
          epochId,
          rewardType: 'CONSOLATION_AURA',
          userId,
          user: walletAddress
            ? {
                walletAddress,
              }
            : undefined,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          amountAura: true,
          epoch: {
            select: {
              endAt: true,
            },
          },
          epochId: true,
          id: true,
          user: {
            select: {
              walletAddress: true,
            },
          },
          userId: true,
        },
      });

      let processedRewards = 0;
      let skippedRewardsWithoutLedger = 0;
      const wallets = new Set<string>();

      for (const reward of rewards) {
        wallets.add(reward.user.walletAddress);
        const existingLedger = await tx.auraLedger.findFirst({
          where: {
            sourceRefId: reward.id,
            sourceType: 'CONSOLATION',
            status: 'CONFIRMED',
            userId: reward.userId,
          },
          select: {
            id: true,
          },
        });

        if (!existingLedger) {
          await tx.auraLedger.create({
            data: {
              amount: reward.amountAura,
              assetType: 'AURA',
              epochId: reward.epochId,
              notes: `weekly consolation reward for ${reward.id}`,
              sourceRefId: reward.id,
              sourceRefType: 'WEEKLY_REWARD',
              sourceType: 'CONSOLATION',
              status: 'CONFIRMED',
              userId: reward.userId,
            },
          });
        }

        const [epochAmountResult, totalAmountResult] = await Promise.all([
          tx.auraLedger.aggregate({
            where: {
              epochId: reward.epochId,
              sourceType: 'CONSOLATION',
              status: 'CONFIRMED',
              userId: reward.userId,
            },
            _sum: {
              amount: true,
            },
          }),
          tx.auraLedger.aggregate({
            where: {
              sourceType: 'CONSOLATION',
              status: 'CONFIRMED',
              userId: reward.userId,
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

        const epochAmount = epochAmountResult._sum.amount;
        const totalAmount = totalAmountResult._sum.amount;

        if (!epochAmount || epochAmount.eq(0)) {
          skippedRewardsWithoutLedger += 1;
          continue;
        }

        const settlementDateKey = toDateKey(
          new Date(reward.epoch.endAt.getTime() - 1),
          timezone,
        );

        await tx.userProfile.upsert({
          where: {
            userId: reward.userId,
          },
          create: {
            totalAuraFromConsolation: totalAmount ?? epochAmount,
            userId: reward.userId,
          },
          update: {
            totalAuraFromConsolation: totalAmount ?? epochAmount,
          },
        });
        await tx.userDailyStat.upsert({
          where: {
            userId_dateKey: {
              dateKey: settlementDateKey,
              userId: reward.userId,
            },
          },
          create: {
            consolationAura: epochAmount,
            dateKey: settlementDateKey,
            userId: reward.userId,
          },
          update: {
            consolationAura: epochAmount,
          },
        });

        processedRewards += 1;
      }

      return {
        processedRewards,
        skippedRewardsWithoutLedger,
        userCount: wallets.size,
        walletAddresses: [...wallets].sort(),
      };
    });

    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
