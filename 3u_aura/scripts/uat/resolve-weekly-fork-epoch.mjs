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
  const epochNo = Number(readArg('epoch-no'));

  if (!epochNo) {
    throw new Error(
      'Usage: node scripts/uat/resolve-weekly-fork-epoch.mjs --env <env> --epoch-no <n>',
    );
  }

  const manifest = loadManifest(envName);
  const schema = manifest.infra.database.schema;
  const client = new Client(buildDatabaseConnectionConfig(manifest));

  await client.connect();

  try {
    const result = await client.query(
      `
        SELECT "id", "epochNo", "status"
        FROM ${quoteIdentifier(schema)}."WeeklyEpoch"
        WHERE "epochType" = 'WEEKLY_PROMOTION'
          AND "epochNo" = $1
        LIMIT 1
      `,
      [epochNo],
    );
    const row = result.rows[0];

    if (!row) {
      throw new Error(`Weekly epoch not found for epochNo=${epochNo}`);
    }

    console.log(JSON.stringify(row, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
