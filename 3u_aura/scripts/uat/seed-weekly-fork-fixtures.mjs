import { createRequire } from 'node:module';
import { loadBaseEnv, loadManifest, REPO_ROOT } from '../promotion-env/lib.mjs';

const requireFromServer = createRequire(
  new URL('../../apps/server/package.json', import.meta.url),
);
const { Client } = requireFromServer('pg');

function readArg(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index !== -1) {
    return process.argv[index + 1];
  }

  const inline = process.argv.find((value) => value.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : undefined;
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function buildDatabaseConnectionConfig(manifest) {
  const baseEnv = loadBaseEnv(REPO_ROOT);

  return {
    database: manifest.infra.database.name,
    host: manifest.infra.database.host,
    password:
      process.env.DATABASE_PASSWORD || baseEnv.DATABASE_PASSWORD || 'password',
    port: manifest.infra.database.port,
    user: process.env.DATABASE_USER || baseEnv.DATABASE_USER || 'postgres',
  };
}

function buildSyntheticWallet(epochNo, index) {
  const suffix = (epochNo * 100 + index).toString(16).padStart(40, '0');
  return `0x${suffix}`;
}

function clampInteger(value, fallback, minimum, maximum) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}

function toDateKey(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function buildEpochDateKeys(startAt, endAt, timeZone) {
  const result = [];
  let cursor = new Date(startAt);

  while (cursor.getTime() < endAt.getTime()) {
    result.push(toDateKey(cursor, timeZone));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return result;
}

async function upsertUser(client, schema, data) {
  const result = await client.query(
    `
      INSERT INTO ${quoteIdentifier(schema)}."User" (
        "id",
        "walletAddress",
        "inviteCode",
        "status",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())
      ON CONFLICT ("walletAddress")
      DO UPDATE SET
        "status" = 'ACTIVE',
        "updatedAt" = NOW()
      RETURNING "id"
    `,
    [data.id, data.walletAddress, data.inviteCode],
  );

  return result.rows[0].id;
}

async function activateExistingUser(client, schema, data) {
  const result = await client.query(
    `
      UPDATE ${quoteIdentifier(schema)}."User"
      SET "status" = 'ACTIVE',
          "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING "id"
    `,
    [data.userId],
  );

  if (!result.rows[0]?.id) {
    throw new Error(`Observer user not found: ${data.userId}`);
  }

  return result.rows[0].id;
}

async function upsertDailyStat(client, schema, data) {
  await client.query(
    `
      INSERT INTO ${quoteIdentifier(schema)}."UserDailyStat" (
        "id",
        "userId",
        "dateKey",
        "countedCheckinDays",
        "smallLegVolumeUsdt",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT ("userId", "dateKey")
      DO UPDATE SET
        "countedCheckinDays" = EXCLUDED."countedCheckinDays",
        "smallLegVolumeUsdt" = EXCLUDED."smallLegVolumeUsdt",
        "updatedAt" = NOW()
    `,
    [data.id, data.userId, data.dateKey, data.countedCheckinDays, data.smallLegVolumeUsdt],
  );
}

async function upsertCheckinBundle(client, schema, data) {
  await client.query(
    `
      INSERT INTO ${quoteIdentifier(schema)}."Checkin" (
        "id",
        "userId",
        "dateKey",
        "checkinCountToday",
        "isCountedForStreak",
        "payToken",
        "payAmountUsdt",
        "rewardAuraAmount",
        "chainId",
        "txHash",
        "txHashKey",
        "blockNumber",
        "status",
        "confirmedAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, TRUE, 'USDT', $5, 0, $6, $7, $8, 0, 'CONFIRMED', NOW(), NOW(), NOW()
      )
      ON CONFLICT ("userId", "dateKey", "checkinCountToday")
      DO UPDATE SET
        "payAmountUsdt" = EXCLUDED."payAmountUsdt",
        "txHash" = EXCLUDED."txHash",
        "txHashKey" = EXCLUDED."txHashKey",
        "status" = 'CONFIRMED',
        "confirmedAt" = NOW(),
        "updatedAt" = NOW()
    `,
    [
      data.checkinId,
      data.userId,
      data.dateKey,
      data.checkinCountToday,
      data.totalAmountUsdt,
      data.chainId,
      data.txHash,
      data.txHashKey,
    ],
  );

  await client.query(
    `
      INSERT INTO ${quoteIdentifier(schema)}."PaymentReceipt" (
        "id",
        "userId",
        "checkinId",
        "purpose",
        "tokenSymbol",
        "amount",
        "payerAddress",
        "receiverAddress",
        "chainId",
        "txHash",
        "txHashKey",
        "blockNumber",
        "status",
        "confirmedAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, 'CHECKIN', 'USDT', $4, $5, $6, $7, $8, $9, 0, 'CONFIRMED', NOW(), NOW(), NOW()
      )
      ON CONFLICT ("txHashKey")
      DO UPDATE SET
        "amount" = EXCLUDED."amount",
        "status" = 'CONFIRMED',
        "confirmedAt" = NOW(),
        "updatedAt" = NOW()
    `,
    [
      data.paymentReceiptId,
      data.userId,
      data.checkinId,
      data.totalAmountUsdt,
      data.payerAddress,
      data.receiverAddress,
      data.chainId,
      data.txHash,
      data.txHashKey,
    ],
  );

  await client.query(
    `
      INSERT INTO ${quoteIdentifier(schema)}."PoolSplitFact" (
        "id",
        "userId",
        "checkinId",
        "paymentReceiptId",
        "dateKey",
        "totalAmountUsdt",
        "lotteryAmountUsdt",
        "treasuryAmountUsdt",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT ("checkinId")
      DO UPDATE SET
        "totalAmountUsdt" = EXCLUDED."totalAmountUsdt",
        "lotteryAmountUsdt" = EXCLUDED."lotteryAmountUsdt",
        "treasuryAmountUsdt" = EXCLUDED."treasuryAmountUsdt",
        "updatedAt" = NOW()
    `,
    [
      data.poolSplitFactId,
      data.userId,
      data.checkinId,
      data.paymentReceiptId,
      data.dateKey,
      data.totalAmountUsdt,
      data.lotteryAmountUsdt,
      data.treasuryAmountUsdt,
    ],
  );
}

async function main() {
  const envName = readArg('env') ?? process.env.PROMOTION_ENV ?? 'fork-anvil';
  const observerWallet = readArg('observer-wallet');
  const observerUserId = readArg('observer-user-id');
  const poolContributorCount = clampInteger(readArg('pool-contributor-count'), 3, 1, 3);
  const qualifiedRankingCount = clampInteger(readArg('qualified-ranking-count'), 12, 1, 12);
  const referenceAt = readArg('reference-at');
  const syntheticParticipantCount = clampInteger(
    readArg('synthetic-participant-count'),
    7,
    0,
    7,
  );
  const targetEpochNo = Number(readArg('target-epoch-no'));
  const targetStartAt = readArg('target-start-at');
  const targetEndAt = readArg('target-end-at');

  if (!observerWallet || !referenceAt || !targetEpochNo || !targetStartAt || !targetEndAt) {
    throw new Error(
      'Usage: node scripts/uat/seed-weekly-fork-fixtures.mjs --env <env> --observer-wallet <wallet> --reference-at <iso> --target-epoch-no <n> --target-start-at <iso> --target-end-at <iso>',
    );
  }

  const manifest = loadManifest(envName);
  const schema = manifest.infra.database.schema;
  const client = new Client(buildDatabaseConnectionConfig(manifest));
  const targetStart = new Date(targetStartAt);
  const targetEnd = new Date(targetEndAt);
  const dateKeys = buildEpochDateKeys(
    targetStart,
    targetEnd,
    manifest.promotion.timezone,
  );

  if (!dateKeys.length) {
    throw new Error('No epoch date keys generated for weekly fork fixture seeding');
  }

  const participantWallets = Array.from(
    new Set([
      observerWallet,
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      ...Array.from({ length: syntheticParticipantCount }, (_, index) =>
        buildSyntheticWallet(targetEpochNo, index + 1),
      ),
    ]),
  ).slice(0, 12);
  const participantIncrements = [
    '9000000000',
    '7500000000',
    '6800000000',
    '6200000000',
    '5800000000',
    '5200000000',
    '4800000000',
    '4400000000',
    '4000000000',
    '3600000000',
    '3400000000',
    '3200000000',
  ].map((value, index) => (index < qualifiedRankingCount ? value : '100000000'));
  const poolSeeds = [
    {
      contributorWallet: participantWallets[0],
      lotteryAmountUsdt: '60000000',
      totalAmountUsdt: '60000000',
      treasuryAmountUsdt: '0',
    },
    {
      contributorWallet: participantWallets[1],
      lotteryAmountUsdt: '45000000',
      totalAmountUsdt: '45000000',
      treasuryAmountUsdt: '0',
    },
    {
      contributorWallet: participantWallets[2],
      lotteryAmountUsdt: '30000000',
      totalAmountUsdt: '30000000',
      treasuryAmountUsdt: '0',
    },
  ].slice(0, poolContributorCount);

  await client.connect();

  try {
    await client.query('BEGIN');

    const userIdsByWallet = new Map();

    for (let index = 0; index < participantWallets.length; index += 1) {
      const walletAddress = participantWallets[index];
      const syntheticId = `wf03_epoch_${targetEpochNo}_user_${String(index + 1).padStart(2, '0')}`;
      const userId =
        index === 0 && observerUserId
          ? await activateExistingUser(client, schema, {
              userId: observerUserId,
            })
          : await upsertUser(client, schema, {
              id: syntheticId,
              inviteCode: `WF03${targetEpochNo}${String(index + 1).padStart(2, '0')}`,
              walletAddress,
            });
      userIdsByWallet.set(walletAddress, userId);

      for (let dayIndex = 0; dayIndex < dateKeys.length; dayIndex += 1) {
        await upsertDailyStat(client, schema, {
          countedCheckinDays: 1,
          dateKey: dateKeys[dayIndex],
          id: `${syntheticId}_stat_${dayIndex + 1}`,
          smallLegVolumeUsdt:
            dayIndex === dateKeys.length - 1 ? participantIncrements[index] : '0',
          userId,
        });
      }
    }

    for (let index = 0; index < poolSeeds.length; index += 1) {
      const poolSeed = poolSeeds[index];
      const walletAddress = poolSeed.contributorWallet;
      const userId = userIdsByWallet.get(walletAddress);

      if (!userId) {
        throw new Error(`Missing seeded user for pool contributor ${walletAddress}`);
      }

      const dateKey = dateKeys[Math.min(index, dateKeys.length - 1)];
      const txHash = `0x${`${targetEpochNo}${index + 1}`.padStart(64, '0')}`;
      await upsertCheckinBundle(client, schema, {
        chainId: manifest.chain.id,
        checkinCountToday: 500 + index,
        checkinId: `wf03_epoch_${targetEpochNo}_checkin_${index + 1}`,
        dateKey,
        payerAddress: walletAddress,
        paymentReceiptId: `wf03_epoch_${targetEpochNo}_payment_${index + 1}`,
        poolSplitFactId: `wf03_epoch_${targetEpochNo}_pool_${index + 1}`,
        receiverAddress: manifest.roles.checkinReceiverAddress,
        totalAmountUsdt: poolSeed.totalAmountUsdt,
        lotteryAmountUsdt: poolSeed.lotteryAmountUsdt,
        treasuryAmountUsdt: poolSeed.treasuryAmountUsdt,
        txHash,
        txHashKey: `${manifest.chain.id}:${txHash.toLowerCase()}`,
        userId,
      });
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  console.log(
    JSON.stringify(
      {
        dateKeys,
        minimumParticipants: manifest.promotion.minimumParticipants,
        observerWallet,
        participantCount: participantWallets.length,
        poolContributionAtomic: poolSeeds.reduce(
          (sum, item) => sum + BigInt(item.lotteryAmountUsdt),
          0n,
        ).toString(),
        referenceAt,
        targetEpochNo,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
