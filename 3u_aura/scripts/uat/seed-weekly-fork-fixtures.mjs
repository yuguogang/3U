import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { loadBaseEnv, loadManifest, REPO_ROOT } from '../promotion-env/lib.mjs';

const requireFromServer = createRequire(
  new URL('../../apps/server/package.json', import.meta.url),
);
const { Client } = requireFromServer('pg');

function readArg(name, argv = process.argv) {
  const flag = `--${name}`;
  const index = argv.indexOf(flag);
  if (index !== -1) {
    return argv[index + 1];
  }

  const inline = argv.find((value) => value.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : undefined;
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function buildDatabaseConnectionConfig(manifest) {
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

export function buildSyntheticWallet(epochNo, index) {
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

export function buildWeeklyForkParticipantWallets({
  observerWallet,
  syntheticParticipantCount,
  targetEpochNo,
}) {
  return Array.from(
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
  );
}

function buildParticipantIncrements(qualifiedRankingCount) {
  return [
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
    '3000000000',
    '2800000000',
    '2600000000',
    '2400000000',
    '2200000000',
    '2000000000',
    '1900000000',
    '1800000000',
    '1700000000',
    '1600000000',
    '1500000000',
    '1400000000',
    '1300000000',
  ].map((value, index) => (index < qualifiedRankingCount ? value : '100000000'));
}

function buildPoolSeeds(participantWallets, poolContributorCount) {
  return [
    ['60000000', participantWallets[0]],
    ['45000000', participantWallets[1]],
    ['30000000', participantWallets[2]],
    ['25000000', participantWallets[3]],
    ['20000000', participantWallets[4]],
    ['18000000', participantWallets[5]],
    ['16000000', participantWallets[6]],
    ['14000000', participantWallets[7]],
    ['12000000', participantWallets[8]],
    ['10000000', participantWallets[9]],
    ['8000000', participantWallets[10]],
    ['6000000', participantWallets[11]],
    ['5000000', participantWallets[12]],
    ['4000000', participantWallets[13]],
    ['3000000', participantWallets[14]],
  ]
    .filter(([, contributorWallet]) => Boolean(contributorWallet))
    .slice(0, poolContributorCount)
    .map(([lotteryAmountUsdt, contributorWallet]) => ({
      contributorWallet,
      lotteryAmountUsdt,
      totalAmountUsdt: lotteryAmountUsdt,
      treasuryAmountUsdt: '0',
    }));
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
        "checkinTimes",
        "countedCheckinDays",
        "smallLegVolumeUsdt",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT ("userId", "dateKey")
      DO UPDATE SET
        "checkinTimes" = EXCLUDED."checkinTimes",
        "countedCheckinDays" = EXCLUDED."countedCheckinDays",
        "smallLegVolumeUsdt" = EXCLUDED."smallLegVolumeUsdt",
        "updatedAt" = NOW()
    `,
    [
      data.id,
      data.userId,
      data.dateKey,
      data.checkinTimes,
      data.countedCheckinDays,
      data.smallLegVolumeUsdt,
    ],
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

export async function seedWeeklyForkFixtures(params) {
  const manifest = loadManifest(params.envName);
  const schema = manifest.infra.database.schema;
  const client = new Client(buildDatabaseConnectionConfig(manifest));
  const targetStart = new Date(params.targetStartAt);
  const targetEnd = new Date(params.targetEndAt);
  const dateKeys = buildEpochDateKeys(
    targetStart,
    targetEnd,
    manifest.promotion.timezone,
  );

  if (!dateKeys.length) {
    throw new Error('No epoch date keys generated for weekly fork fixture seeding');
  }

  const participantWallets = buildWeeklyForkParticipantWallets({
    observerWallet: params.observerWallet,
    syntheticParticipantCount: params.syntheticParticipantCount,
    targetEpochNo: params.targetEpochNo,
  });
  const participantIncrements = buildParticipantIncrements(
    params.qualifiedRankingCount,
  );
  const poolSeeds = buildPoolSeeds(
    participantWallets,
    params.poolContributorCount,
  );

  await client.connect();

  try {
    await client.query('BEGIN');

    const participants = [];
    const userIdsByWallet = new Map();

    for (let index = 0; index < participantWallets.length; index += 1) {
      const walletAddress = participantWallets[index];
      const syntheticId = `wf03_epoch_${params.targetEpochNo}_user_${String(index + 1).padStart(2, '0')}`;
      const userId =
        index === 0 && params.observerUserId
          ? await activateExistingUser(client, schema, {
              userId: params.observerUserId,
            })
          : await upsertUser(client, schema, {
              id: syntheticId,
              inviteCode: `WF03${params.targetEpochNo}${String(index + 1).padStart(2, '0')}`,
              walletAddress,
            });
      userIdsByWallet.set(walletAddress, userId);
      participants.push({ userId, walletAddress });

      for (let dayIndex = 0; dayIndex < dateKeys.length; dayIndex += 1) {
        await upsertDailyStat(client, schema, {
          checkinTimes: 1,
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
      const txHash = `0x${`${params.targetEpochNo}${index + 1}`.padStart(64, '0')}`;
      await upsertCheckinBundle(client, schema, {
        chainId: manifest.chain.id,
        checkinCountToday: 500 + index,
        checkinId: `wf03_epoch_${params.targetEpochNo}_checkin_${index + 1}`,
        dateKey,
        payerAddress: walletAddress,
        paymentReceiptId: `wf03_epoch_${params.targetEpochNo}_payment_${index + 1}`,
        poolSplitFactId: `wf03_epoch_${params.targetEpochNo}_pool_${index + 1}`,
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

    return {
      dateKeys,
      minimumParticipants: manifest.promotion.minimumParticipants,
      observerWallet: params.observerWallet,
      participantCount: participantWallets.length,
      participantWallets,
      participants,
      poolContributionAtomic: poolSeeds.reduce(
        (sum, item) => sum + BigInt(item.lotteryAmountUsdt),
        0n,
      ).toString(),
      referenceAt: params.referenceAt,
      targetEpochNo: params.targetEpochNo,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

function parseCliArgs(argv = process.argv.slice(2)) {
  const envName = readArg('env', argv) ?? process.env.PROMOTION_ENV ?? 'fork-anvil';
  const observerWallet = readArg('observer-wallet', argv);
  const observerUserId = readArg('observer-user-id', argv);
  const poolContributorCount = clampInteger(
    readArg('pool-contributor-count', argv),
    10,
    1,
    15,
  );
  const qualifiedRankingCount = clampInteger(
    readArg('qualified-ranking-count', argv),
    15,
    1,
    15,
  );
  const referenceAt = readArg('reference-at', argv);
  const syntheticParticipantCount = clampInteger(
    readArg('synthetic-participant-count', argv),
    18,
    0,
    20,
  );
  const targetEpochNo = Number(readArg('target-epoch-no', argv));
  const targetStartAt = readArg('target-start-at', argv);
  const targetEndAt = readArg('target-end-at', argv);

  if (
    !observerWallet ||
    !referenceAt ||
    !targetEpochNo ||
    !targetStartAt ||
    !targetEndAt
  ) {
    throw new Error(
      'Usage: node scripts/uat/seed-weekly-fork-fixtures.mjs --env <env> --observer-wallet <wallet> --reference-at <iso> --target-epoch-no <n> --target-start-at <iso> --target-end-at <iso>',
    );
  }

  return {
    envName,
    observerUserId,
    observerWallet,
    poolContributorCount,
    qualifiedRankingCount,
    referenceAt,
    syntheticParticipantCount,
    targetEndAt,
    targetEpochNo,
    targetStartAt,
  };
}

async function main() {
  const result = await seedWeeklyForkFixtures(parseCliArgs());
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
