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

async function main() {
  const envName = readArg('env') ?? process.env.PROMOTION_ENV ?? 'fork-anvil';
  const epochId = readArg('epoch-id');
  const rewardJsonUri = readArg('reward-json-uri') ?? 'ipfs://phase94-wave4/mock.json';
  const merkleRoot = readArg('merkle-root');

  if (!epochId || !merkleRoot) {
    throw new Error(
      'Usage: node scripts/uat/activate-weekly-fork-claims.mjs --env <env> --epoch-id <id> --merkle-root <root> [--reward-json-uri <uri>]',
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
        SELECT "id", "epochNo", "status"
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
    if (epoch.status !== 'ROOT_POSTED' && epoch.status !== 'CALCULATING') {
      throw new Error(
        `Weekly epoch ${epochId} must be CALCULATING or ROOT_POSTED, got ${epoch.status}`,
      );
    }

    await client.query(
      `
        UPDATE ${quoteIdentifier(schema)}."ClaimRecord"
        SET "status" = 'CLAIMABLE',
            "updatedAt" = NOW()
        WHERE "epochId" = $1
          AND "claimType" IN ('MERKLE_LOTTERY', 'MERKLE_RANKING')
      `,
      [epochId],
    );
    await client.query(
      `
        UPDATE ${quoteIdentifier(schema)}."WeeklyReward"
        SET "status" = 'CLAIMABLE',
            "updatedAt" = NOW()
        WHERE "epochId" = $1
          AND "rewardType" IN ('LOTTERY_USDT', 'RANKING_USDT')
      `,
      [epochId],
    );
    await client.query(
      `
        UPDATE ${quoteIdentifier(schema)}."WeeklyEpoch"
        SET "merkleRoot" = $2,
            "rewardJsonUri" = $3,
            "status" = 'ROOT_POSTED',
            "updatedAt" = NOW()
        WHERE "id" = $1
      `,
      [epochId, merkleRoot, rewardJsonUri],
    );

    await client.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          epochId,
          epochNo: epoch.epochNo,
          merkleRoot,
          mode: 'activate',
          rewardJsonUri,
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
