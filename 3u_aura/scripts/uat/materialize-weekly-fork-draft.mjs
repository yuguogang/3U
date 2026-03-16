import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { loadBaseEnv, loadManifest, REPO_ROOT } from '../promotion-env/lib.mjs';

const requireFromServer = createRequire(
  new URL('../../apps/server/package.json', import.meta.url),
);
const { Client } = requireFromServer('pg');
const { concatHex, encodeAbiParameters, getAddress, keccak256 } =
  requireFromServer('viem');

const WEEKLY_MERKLE_EMPTY_ROOT =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
const REWARD_TYPE_CODES = {
  LOTTERY_USDT: 1,
  RANKING_USDT: 2,
};
const RANKING_PERCENTAGES = [25n, 15n, 12n, 10n, 9n, 8n, 7n, 6n, 4n, 4n];
const MINIMUM_RANKING_INCREMENT = 300000000n;

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

function toDateKey(value, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  });
  const parts = formatter.formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = next.getUTCFullYear();
  const nextMonth = String(next.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(next.getUTCDate()).padStart(2, '0');

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function buildDeterministicTicketKey(epochId, userId) {
  return createHash('sha256').update(`${epochId}:${userId}`).digest('hex');
}

function projectLotteryPayout(epochId, lotteryPoolUsdt, participantUserIds) {
  const participants = [...participantUserIds].sort((left, right) =>
    buildDeterministicTicketKey(epochId, left).localeCompare(
      buildDeterministicTicketKey(epochId, right),
    ),
  );
  const winnerCount = Math.floor(participants.length / 2);
  const winners = participants.slice(0, winnerCount);
  const consolationUserIds = participants.slice(winnerCount);
  const pool = BigInt(lotteryPoolUsdt);
  const firstPool = (pool * 25n) / 100n;
  const secondPool = (pool * 20n) / 100n;
  const thirdPool = (pool * 15n) / 100n;
  const luckyPool = (pool * 40n) / 100n;
  const allocations = [];
  let carry = 0n;

  if (winners[0]) {
    allocations.push({
      amountUsdt: firstPool.toString(),
      distributionKey: 'LOTTERY_FIRST_PRIZE',
      prizeLabel: 'FIRST',
      userId: winners[0],
    });
  } else {
    carry += firstPool;
  }

  carry += allocatePrizeBucket(
    allocations,
    'LOTTERY_SECOND_PRIZE',
    secondPool,
    'SECOND',
    winners.slice(1, 3),
  );
  carry += allocatePrizeBucket(
    allocations,
    'LOTTERY_THIRD_PRIZE',
    thirdPool,
    'THIRD',
    winners.slice(3, 6),
  );
  carry += allocatePrizeBucket(
    allocations,
    'LOTTERY_LUCKY_PRIZE',
    luckyPool,
    'LUCKY',
    winners.slice(6),
  );

  return {
    consolationUserIds,
    rolloverUsdt: carry.toString(),
    winners: allocations,
  };
}

function allocatePrizeBucket(
  allocations,
  distributionKeyPrefix,
  pool,
  prizeLabel,
  users,
) {
  if (!users.length) {
    return pool;
  }

  const share = pool / BigInt(users.length);
  const remainder = pool % BigInt(users.length);

  users.forEach((userId, index) => {
    allocations.push({
      amountUsdt: (share + (index === 0 ? remainder : 0n)).toString(),
      distributionKey: `${distributionKeyPrefix}_${index + 1}`,
      prizeLabel,
      userId,
    });
  });

  return 0n;
}

function projectRankingPayout(candidates, rankingPoolUsdt) {
  const qualified = candidates
    .filter((candidate) => BigInt(candidate.incrementUsdt) >= MINIMUM_RANKING_INCREMENT)
    .sort((left, right) => {
      const diff = BigInt(right.incrementUsdt) - BigInt(left.incrementUsdt);
      if (diff !== 0n) {
        return diff > 0n ? 1 : -1;
      }

      return left.userId.localeCompare(right.userId);
    })
    .slice(0, 10);
  const pool = BigInt(rankingPoolUsdt);
  const allocations = [];
  let allocatedBase = 0n;
  let allocatedPercentages = 0n;

  qualified.forEach((candidate, index) => {
    const percentage = RANKING_PERCENTAGES[index];
    const amount = (pool * percentage) / 100n;
    allocatedBase += amount;
    allocatedPercentages += percentage;
    allocations.push({
      amountUsdt: amount.toString(),
      distributionKey: `RANK_${index + 1}`,
      rank: index + 1,
      userId: candidate.userId,
    });
  });

  if (allocations.length) {
    const allocatedCap = (pool * allocatedPercentages) / 100n;
    const dust = allocatedCap - allocatedBase;
    allocations[allocations.length - 1].amountUsdt = (
      BigInt(allocations[allocations.length - 1].amountUsdt) + dust
    ).toString();
  }

  const distributed = allocations.reduce(
    (sum, allocation) => sum + BigInt(allocation.amountUsdt),
    0n,
  );

  return {
    allocations,
    rolloverUsdt: (pool - distributed).toString(),
  };
}

function encodeMerkleLeaf(walletAddress, rewardType, amount) {
  return keccak256(
    encodeAbiParameters(
      [
        { name: 'account', type: 'address' },
        { name: 'rewardTypeCode', type: 'uint8' },
        { name: 'amount', type: 'uint256' },
      ],
      [getAddress(walletAddress), REWARD_TYPE_CODES[rewardType], BigInt(amount)],
    ),
  );
}

function hashPair(left, right) {
  const [first, second] =
    left.toLowerCase() <= right.toLowerCase() ? [left, right] : [right, left];

  return keccak256(concatHex([first, second]));
}

function buildMerkleLevels(leafHashes) {
  const levels = [leafHashes];

  while (levels.at(-1)?.length > 1) {
    const current = levels.at(-1);
    const next = [];

    for (let index = 0; index < current.length; index += 2) {
      const left = current[index];
      const right = current[index + 1];
      next.push(right ? hashPair(left, right) : left);
    }

    levels.push(next);
  }

  return levels;
}

function buildProof(levels, leafIndex) {
  const proof = [];
  let currentIndex = leafIndex;

  for (const level of levels.slice(0, -1)) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    if (siblingIndex < level.length) {
      proof.push(level[siblingIndex]);
    }
    currentIndex = Math.floor(currentIndex / 2);
  }

  return proof;
}

async function main() {
  const envName = readArg('env') ?? process.env.PROMOTION_ENV ?? 'fork-anvil';
  const epochId = readArg('epoch-id');

  if (!epochId) {
    throw new Error(
      'Usage: node scripts/uat/materialize-weekly-fork-draft.mjs --env <env> --epoch-id <id>',
    );
  }

  const manifest = loadManifest(envName);
  const schema = manifest.infra.database.schema;
  const client = new Client(buildDatabaseConnectionConfig(manifest));

  await client.connect();

  try {
    await client.query('BEGIN');

    const epochResult = await client.query(
      `
        SELECT *
        FROM ${quoteIdentifier(schema)}."WeeklyEpoch"
        WHERE "id" = $1
        LIMIT 1
      `,
      [epochId],
    );
    const epoch = epochResult.rows[0];

    if (!epoch) {
      throw new Error(`Weekly epoch not found: ${epochId}`);
    }
    if (epoch.status !== 'CALCULATING') {
      throw new Error(`Weekly epoch ${epochId} must be CALCULATING, got ${epoch.status}`);
    }

    const rewardIdsResult = await client.query(
      `
        SELECT "id"
        FROM ${quoteIdentifier(schema)}."WeeklyReward"
        WHERE "epochId" = $1
          AND "rewardType" IN ('LOTTERY_USDT', 'RANKING_USDT', 'CONSOLATION_AURA')
      `,
      [epochId],
    );
    const rewardIds = rewardIdsResult.rows.map((row) => row.id);

    if (rewardIds.length) {
      await client.query(
        `
          DELETE FROM ${quoteIdentifier(schema)}."ClaimRecord"
          WHERE "rewardId" = ANY($1::text[])
        `,
        [rewardIds],
      );
      await client.query(
        `
          DELETE FROM ${quoteIdentifier(schema)}."MerkleLeaf"
          WHERE "rewardId" = ANY($1::text[])
        `,
        [rewardIds],
      );
    }

    await client.query(
      `
        DELETE FROM ${quoteIdentifier(schema)}."ClaimRecord"
        WHERE "epochId" = $1
          AND "claimType" IN ('MERKLE_LOTTERY', 'MERKLE_RANKING')
      `,
      [epochId],
    );
    await client.query(
      `
        DELETE FROM ${quoteIdentifier(schema)}."MerkleLeaf"
        WHERE "epochId" = $1
          AND "rewardType" IN ('LOTTERY_USDT', 'RANKING_USDT')
      `,
      [epochId],
    );
    await client.query(
      `
        DELETE FROM ${quoteIdentifier(schema)}."WeeklyReward"
        WHERE "epochId" = $1
          AND "rewardType" IN ('LOTTERY_USDT', 'RANKING_USDT', 'CONSOLATION_AURA')
      `,
      [epochId],
    );

    const eligibleTicketsResult = await client.query(
      `
        SELECT "userId"
        FROM ${quoteIdentifier(schema)}."LotteryTicket"
        WHERE "epochId" = $1
          AND "isEligible" = TRUE
          AND "ticketCount" > 0
        ORDER BY "userId" ASC
      `,
      [epochId],
    );
    const lotteryProjection = projectLotteryPayout(
      epochId,
      epoch.lotteryPoolUsdt,
      eligibleTicketsResult.rows.map((row) => row.userId),
    );

    for (const winner of lotteryProjection.winners) {
      await client.query(
        `
          INSERT INTO ${quoteIdentifier(schema)}."WeeklyReward" (
            "id",
            "epochId",
            "userId",
            "rewardType",
            "status",
            "distributionKey",
            "amountUsdt",
            "amountAura",
            "sourceNote",
            "createdAt",
            "updatedAt"
          )
          VALUES ($1, $2, $3, 'LOTTERY_USDT', 'PENDING', $4, $5, 0, $6, NOW(), NOW())
        `,
        [
          `${epochId}_lottery_${winner.distributionKey}`,
          epochId,
          winner.userId,
          winner.distributionKey,
          winner.amountUsdt,
          `Lottery ${winner.prizeLabel.toLowerCase()} winner`,
        ],
      );
    }

    for (const userId of lotteryProjection.consolationUserIds) {
      await client.query(
        `
          INSERT INTO ${quoteIdentifier(schema)}."WeeklyReward" (
            "id",
            "epochId",
            "userId",
            "rewardType",
            "status",
            "distributionKey",
            "amountUsdt",
            "amountAura",
            "sourceNote",
            "createdAt",
            "updatedAt"
          )
          VALUES ($1, $2, $3, 'CONSOLATION_AURA', 'PENDING', 'CONSOLATION_DEFAULT', 0, $4, 'Lottery consolation reward', NOW(), NOW())
        `,
        [`${epochId}_consolation_${userId}`, epochId, userId, '100000000000000000000'],
      );
    }

    let dateKeyFromInclusive = toDateKey(
      new Date(epoch.startAt),
      manifest.promotion.timezone,
    );
    let dateKeyToExclusive = toDateKey(
      new Date(epoch.endAt),
      manifest.promotion.timezone,
    );
    const participantUserIds = eligibleTicketsResult.rows.map((row) => row.userId);
    if (participantUserIds.length) {
      const statsRangeResult = await client.query(
        `
          SELECT
            MIN("dateKey") AS "minDateKey",
            MAX("dateKey") AS "maxDateKey"
          FROM ${quoteIdentifier(schema)}."UserDailyStat"
          WHERE "userId" = ANY($1::text[])
        `,
        [participantUserIds],
      );
      const statsRange = statsRangeResult.rows[0];

      if (statsRange?.minDateKey && statsRange?.maxDateKey) {
        dateKeyFromInclusive = statsRange.minDateKey;
        dateKeyToExclusive = addDaysToDateKey(statsRange.maxDateKey, 1);
      }
    }
    const rankingRows = await client.query(
      `
        SELECT
          "userId",
          "dateKey",
          "smallLegVolumeUsdt"
        FROM ${quoteIdentifier(schema)}."UserDailyStat"
        WHERE "dateKey" < $1
        ORDER BY "userId" ASC, "dateKey" ASC
      `,
      [dateKeyToExclusive],
    );
    const statsByUser = new Map();
    for (const row of rankingRows.rows) {
      const list = statsByUser.get(row.userId) ?? [];
      list.push(row);
      statsByUser.set(row.userId, list);
    }
    const rankingCandidates = Array.from(statsByUser.entries()).map(([userId, rows]) => {
      const baseline = rows.filter((row) => row.dateKey < dateKeyFromInclusive).at(-1);
      const current = rows.filter((row) => row.dateKey < dateKeyToExclusive).at(-1);
      const increment =
        BigInt(current?.smallLegVolumeUsdt ?? '0') -
        BigInt(baseline?.smallLegVolumeUsdt ?? '0');

      return {
        incrementUsdt: increment > 0n ? increment.toString() : '0',
        userId,
      };
    });
    const rankingProjection = projectRankingPayout(
      rankingCandidates,
      epoch.rankingPoolUsdt,
    );

    for (const allocation of rankingProjection.allocations) {
      await client.query(
        `
          INSERT INTO ${quoteIdentifier(schema)}."WeeklyReward" (
            "id",
            "epochId",
            "userId",
            "rewardType",
            "status",
            "distributionKey",
            "rank",
            "amountUsdt",
            "amountAura",
            "sourceNote",
            "createdAt",
            "updatedAt"
          )
          VALUES ($1, $2, $3, 'RANKING_USDT', 'PENDING', $4, $5, $6, 0, $7, NOW(), NOW())
        `,
        [
          `${epochId}_ranking_${allocation.distributionKey}`,
          epochId,
          allocation.userId,
          allocation.distributionKey,
          allocation.rank,
          allocation.amountUsdt,
          `Weekly ranking reward for rank ${allocation.rank}`,
        ],
      );
    }

    const merkleRewardsResult = await client.query(
      `
        SELECT
          reward."id",
          reward."userId",
          reward."rewardType",
          reward."distributionKey",
          reward."amountUsdt",
          "user"."walletAddress"
        FROM ${quoteIdentifier(schema)}."WeeklyReward" AS reward
        INNER JOIN ${quoteIdentifier(schema)}."User" AS "user"
          ON "user"."id" = reward."userId"
        WHERE reward."epochId" = $1
          AND reward."rewardType" IN ('LOTTERY_USDT', 'RANKING_USDT')
        ORDER BY "user"."walletAddress" ASC, reward."rewardType" ASC, reward."distributionKey" ASC
      `,
      [epochId],
    );
    const leafHashes = merkleRewardsResult.rows.map((reward) =>
      encodeMerkleLeaf(reward.walletAddress, reward.rewardType, reward.amountUsdt),
    );
    const levels = buildMerkleLevels(leafHashes);
    const merkleRoot = levels.at(-1)?.[0] ?? WEEKLY_MERKLE_EMPTY_ROOT;

    for (let index = 0; index < merkleRewardsResult.rows.length; index += 1) {
      const reward = merkleRewardsResult.rows[index];
      const proof = buildProof(levels, index);
      const leafHash = leafHashes[index];
      const claimType =
        reward.rewardType === 'LOTTERY_USDT' ? 'MERKLE_LOTTERY' : 'MERKLE_RANKING';

      await client.query(
        `
          UPDATE ${quoteIdentifier(schema)}."WeeklyReward"
          SET "merkleIndex" = $1,
              "merkleLeafHash" = $2,
              "updatedAt" = NOW()
          WHERE "id" = $3
        `,
        [index, leafHash, reward.id],
      );
      await client.query(
        `
          INSERT INTO ${quoteIdentifier(schema)}."MerkleLeaf" (
            "id",
            "epochId",
            "userId",
            "rewardId",
            "rewardType",
            "tokenSymbol",
            "amount",
            "leafIndex",
            "leafHash",
            "proofJson",
            "payloadJson",
            "createdAt"
          )
          VALUES ($1, $2, $3, $4, $5, 'USDT', $6, $7, $8, $9::jsonb, $10::jsonb, NOW())
        `,
        [
          `${reward.id}_leaf`,
          epochId,
          reward.userId,
          reward.id,
          reward.rewardType,
          reward.amountUsdt,
          index,
          leafHash,
          JSON.stringify(proof),
          JSON.stringify({
            account: getAddress(reward.walletAddress),
            amount: reward.amountUsdt,
            rewardType: reward.rewardType,
            rewardTypeCode: REWARD_TYPE_CODES[reward.rewardType],
          }),
        ],
      );
      await client.query(
        `
          INSERT INTO ${quoteIdentifier(schema)}."ClaimRecord" (
            "id",
            "userId",
            "epochId",
            "rewardId",
            "claimType",
            "status",
            "tokenSymbol",
            "amount",
            "merkleIndex",
            "merkleProofJson",
            "root",
            "contractAddress",
            "chainId",
            "createdAt",
            "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, 'PENDING', 'USDT', $6, $7, $8::jsonb, $9, $10, $11, NOW(), NOW())
        `,
        [
          `${reward.id}_claim`,
          reward.userId,
          epochId,
          reward.id,
          claimType,
          reward.amountUsdt,
          index,
          JSON.stringify(proof),
          merkleRoot,
          manifest.contracts.merkleDistributorAddress,
          manifest.chain.id,
        ],
      );
    }

    await client.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          dateKeyFromInclusive,
          dateKeyToExclusive,
          epochId,
          lottery: {
            consolationCount: lotteryProjection.consolationUserIds.length,
            draftRewardCount:
              lotteryProjection.winners.length +
              lotteryProjection.consolationUserIds.length,
            lotteryRolloverUsdt: lotteryProjection.rolloverUsdt,
          },
          merkle: {
            claimCount: merkleRewardsResult.rows.length,
            leafCount: merkleRewardsResult.rows.length,
            merkleRoot,
          },
          mode: 'draft',
          ranking: {
            draftRewardCount: rankingProjection.allocations.length,
            rankingRolloverUsdt: rankingProjection.rolloverUsdt,
          },
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
