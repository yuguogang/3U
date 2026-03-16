import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import {
  REPO_ROOT,
  buildTargetContext,
  formatEnvFile,
  loadBaseEnv,
  loadManifest,
  writeFileIfChanged,
} from '../promotion-env/lib.mjs';

const DEFAULTS = {
  adminPort: 3201,
  anvilHost: '127.0.0.1',
  anvilPort: 18545,
  bullPort: 6379,
  cacheDb: 13,
  dappPort: 3200,
  deploymentMode: process.env.WEEKLY_FORK_DEPLOYMENT_MODE || 'local-deploy',
  envName: 'fork-anvil',
  serverPort: 3210,
  sourceEnvName: 'uat-mockusdt',
  throttlerDb: 14,
};

const TARGETS = ['contracts', 'server', 'dapp', 'admin'];
const requireFromServer = createRequire(
  path.join(REPO_ROOT, 'apps', 'server', 'package.json'),
);
const { Client } = requireFromServer('pg');
const { privateKeyToAccount } = requireFromServer('viem/accounts');
const ANVIL_DEFAULT_PRIVATE_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
];

export function parseWeeklyForkArgs(argv) {
  const result = {
    adminPort: DEFAULTS.adminPort,
    anvilHost: DEFAULTS.anvilHost,
    anvilPort: DEFAULTS.anvilPort,
    bullHost: undefined,
    bullPort: DEFAULTS.bullPort,
    cacheDb: DEFAULTS.cacheDb,
    databaseHost: undefined,
    databaseName: undefined,
    databasePort: undefined,
    databaseSchema: undefined,
    dappPort: DEFAULTS.dappPort,
    deploymentMode: DEFAULTS.deploymentMode,
    envName: DEFAULTS.envName,
    forkBlockNumber: undefined,
    serverPort: DEFAULTS.serverPort,
    sourceEnvName: DEFAULTS.sourceEnvName,
    throttlerDb: DEFAULTS.throttlerDb,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const nextValue = argv[index + 1];

    if (value === '--env') {
      result.envName = nextValue;
      index += 1;
      continue;
    }
    if (value.startsWith('--env=')) {
      result.envName = value.slice('--env='.length);
      continue;
    }
    if (value === '--source-env') {
      result.sourceEnvName = nextValue;
      index += 1;
      continue;
    }
    if (value.startsWith('--source-env=')) {
      result.sourceEnvName = value.slice('--source-env='.length);
      continue;
    }
    if (value === '--deployment-mode') {
      result.deploymentMode = nextValue;
      index += 1;
      continue;
    }
    if (value.startsWith('--deployment-mode=')) {
      result.deploymentMode = value.slice('--deployment-mode='.length);
      continue;
    }
    if (value === '--anvil-host') {
      result.anvilHost = nextValue;
      index += 1;
      continue;
    }
    if (value.startsWith('--anvil-host=')) {
      result.anvilHost = value.slice('--anvil-host='.length);
      continue;
    }
    if (value === '--anvil-port') {
      result.anvilPort = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--anvil-port=')) {
      result.anvilPort = Number(value.slice('--anvil-port='.length));
      continue;
    }
    if (value === '--fork-block-number') {
      result.forkBlockNumber = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--fork-block-number=')) {
      result.forkBlockNumber = Number(
        value.slice('--fork-block-number='.length),
      );
      continue;
    }
    if (value === '--server-port') {
      result.serverPort = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--server-port=')) {
      result.serverPort = Number(value.slice('--server-port='.length));
      continue;
    }
    if (value === '--dapp-port') {
      result.dappPort = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--dapp-port=')) {
      result.dappPort = Number(value.slice('--dapp-port='.length));
      continue;
    }
    if (value === '--admin-port') {
      result.adminPort = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--admin-port=')) {
      result.adminPort = Number(value.slice('--admin-port='.length));
      continue;
    }
    if (value === '--database-host') {
      result.databaseHost = nextValue;
      index += 1;
      continue;
    }
    if (value.startsWith('--database-host=')) {
      result.databaseHost = value.slice('--database-host='.length);
      continue;
    }
    if (value === '--database-port') {
      result.databasePort = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--database-port=')) {
      result.databasePort = Number(value.slice('--database-port='.length));
      continue;
    }
    if (value === '--database-name') {
      result.databaseName = nextValue;
      index += 1;
      continue;
    }
    if (value.startsWith('--database-name=')) {
      result.databaseName = value.slice('--database-name='.length);
      continue;
    }
    if (value === '--database-schema') {
      result.databaseSchema = nextValue;
      index += 1;
      continue;
    }
    if (value.startsWith('--database-schema=')) {
      result.databaseSchema = value.slice('--database-schema='.length);
      continue;
    }
    if (value === '--bull-host') {
      result.bullHost = nextValue;
      index += 1;
      continue;
    }
    if (value.startsWith('--bull-host=')) {
      result.bullHost = value.slice('--bull-host='.length);
      continue;
    }
    if (value === '--bull-port') {
      result.bullPort = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--bull-port=')) {
      result.bullPort = Number(value.slice('--bull-port='.length));
      continue;
    }
    if (value === '--cache-db') {
      result.cacheDb = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--cache-db=')) {
      result.cacheDb = Number(value.slice('--cache-db='.length));
      continue;
    }
    if (value === '--throttler-db') {
      result.throttlerDb = Number(nextValue);
      index += 1;
      continue;
    }
    if (value.startsWith('--throttler-db=')) {
      result.throttlerDb = Number(value.slice('--throttler-db='.length));
      continue;
    }
  }

  return result;
}

export function getWeeklyForkEnvDir(envName) {
  return path.join(REPO_ROOT, 'config', 'promotion-envs', envName);
}

export function getWeeklyForkRuntimePath(envName) {
  return path.join(getWeeklyForkEnvDir(envName), 'runtime.json');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readExistingWeeklyManifest(envName) {
  const manifestPath = path.join(getWeeklyForkEnvDir(envName), 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return readJson(manifestPath);
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function resolveAnvilBinary() {
  if (process.env.ANVIL_BIN) {
    return process.env.ANVIL_BIN;
  }

  const preferredFoundryBin = path.join(os.homedir(), '.foundry', 'bin', 'anvil');
  if (fs.existsSync(preferredFoundryBin)) {
    return preferredFoundryBin;
  }

  return 'anvil';
}

function getAnvilHelpOutput(anvilBinary) {
  const result = spawnSync(anvilBinary, ['--help'], {
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

function supportsAnvilFlag(helpOutput, flag) {
  return helpOutput.includes(flag);
}

function parseRedisUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  return {
    db: parsed.pathname ? Number(parsed.pathname.replace('/', '') || '0') : 0,
    host: parsed.hostname,
    port: Number(parsed.port || '6379'),
    protocol: parsed.protocol,
  };
}

function buildRedisUrl(sourceUrl, dbIndex) {
  const parsed = new URL(sourceUrl);
  parsed.pathname = `/${dbIndex}`;
  return parsed.toString();
}

function defaultForkDatabaseSchema(envName) {
  return envName.replaceAll('-', '_');
}

function cloneWalletTemplate(sourceEnvName, targetEnvName) {
  const sourcePath = path.join(
    REPO_ROOT,
    'config',
    'promotion-envs',
    sourceEnvName,
    'wallets.example.json',
  );
  const targetPath = path.join(
    getWeeklyForkEnvDir(targetEnvName),
    'wallets.example.json',
  );

  writeFileIfChanged(targetPath, fs.readFileSync(sourcePath, 'utf8'));
}

function loadWalletTemplates(sourceEnvName) {
  return readJson(
    path.join(
      REPO_ROOT,
      'config',
      'promotion-envs',
      sourceEnvName,
      'wallets.example.json',
    ),
  );
}

function buildForkWalletFixtures({
  chainId,
  sourceEnvName,
  targetEnvName,
}) {
  const templates = loadWalletTemplates(sourceEnvName);

  if (templates.length > ANVIL_DEFAULT_PRIVATE_KEYS.length) {
    throw new Error(
      `Not enough deterministic anvil wallets. templates=${templates.length} available=${ANVIL_DEFAULT_PRIVATE_KEYS.length}`,
    );
  }

  return templates.map((template, index) => {
    const privateKey = ANVIL_DEFAULT_PRIVATE_KEYS[index];
    const account = privateKeyToAccount(privateKey);

    return {
      address: account.address,
      chainId,
      environment: targetEnvName,
      funding: {
        targetBnb: template.initialBnbMin,
        targetMockUsdt: template.initialUsdtMin,
      },
      name: template.name,
      privateKey,
      privateKeyEnv: template.privateKeyEnv,
      role: template.role,
    };
  });
}

function writeForkWalletFixtures(wallets, targetEnvName) {
  const targetWalletsDir = path.join(getWeeklyForkEnvDir(targetEnvName), 'wallets');
  ensureDir(targetWalletsDir);

  for (const wallet of wallets) {
    writeJson(path.join(targetWalletsDir, `${wallet.name}.json`), wallet);
  }
}

function syncWeeklyForkTargetEnvFiles(envName) {
  for (const target of TARGETS) {
    const context = buildTargetContext({
      cwd: REPO_ROOT,
      envName,
      strict: false,
      target,
    });
    writeFileIfChanged(
      path.join(getWeeklyForkEnvDir(envName), `${target}.public.env`),
      formatEnvFile(context.derivedEnv),
    );
  }
}

function getLocalDeployControllerAddress(sourceManifest, forkWallets) {
  return (
    forkWallets.find((wallet) => wallet.role === 'admin')?.address ??
    forkWallets[0]?.address ??
    sourceManifest.roles.owner
  );
}

function deriveManifest(options, sourceManifest, forkWallets) {
  const existingManifest = readExistingWeeklyManifest(options.envName);
  const sourceRedis = parseRedisUrl(sourceManifest.infra.redis.cacheUrl);
  const sourceThrottlerRedis = parseRedisUrl(
    sourceManifest.infra.redis.throttlerUrl,
  );
  const databaseSchema =
    options.databaseSchema ?? defaultForkDatabaseSchema(options.envName);
  const adminWallet = forkWallets.find((wallet) => wallet.role === 'admin');
  const localDeployControllerAddress = getLocalDeployControllerAddress(
    sourceManifest,
    forkWallets,
  );
  const adminAllowlistWallets = Array.from(
    new Set([
      ...(sourceManifest.roles.adminAllowlistWallets ?? []),
      ...(adminWallet ? [adminWallet.address] : []),
    ]),
  );
  const useLocalDeploy = options.deploymentMode === 'local-deploy';
  const contracts =
    useLocalDeploy && existingManifest?.fork?.deploymentMode === 'local-deploy'
      ? existingManifest.contracts
      : sourceManifest.contracts;
  const roles = useLocalDeploy
    ? {
        ...sourceManifest.roles,
        adminAllowlistWallets,
        checkinReceiverAddress: localDeployControllerAddress,
        financeWallet: localDeployControllerAddress,
        owner: localDeployControllerAddress,
        referralSignerAddress: localDeployControllerAddress,
        rootPublisher: localDeployControllerAddress,
        settlementPublisher: localDeployControllerAddress,
      }
    : {
        ...sourceManifest.roles,
        adminAllowlistWallets,
      };

  return {
    ...sourceManifest,
    environment: options.envName,
    status: 'active',
    chain: {
      ...sourceManifest.chain,
      rpcUrl: `http://${options.anvilHost}:${options.anvilPort}`,
      referralRpcUrl: `http://${options.anvilHost}:${options.anvilPort}`,
    },
    contracts,
    infra: {
      ...sourceManifest.infra,
      server: {
        host: `http://127.0.0.1:${options.serverPort}`,
        port: options.serverPort,
        publicApiBaseUrl: `http://127.0.0.1:${options.serverPort}`,
      },
      dapp: {
        baseUrl: `http://127.0.0.1:${options.dappPort}`,
      },
      admin: {
        baseUrl: `http://127.0.0.1:${options.adminPort}`,
      },
      database: {
        ...sourceManifest.infra.database,
        host: options.databaseHost ?? sourceManifest.infra.database.host,
        port: options.databasePort ?? sourceManifest.infra.database.port,
        name: options.databaseName ?? sourceManifest.infra.database.name,
        schema: databaseSchema,
      },
      redis: {
        ...sourceManifest.infra.redis,
        cacheUrl: buildRedisUrl(
          sourceManifest.infra.redis.cacheUrl,
          options.cacheDb ?? sourceRedis.db,
        ),
        throttlerUrl: buildRedisUrl(
          sourceManifest.infra.redis.throttlerUrl,
          options.throttlerDb ?? sourceThrottlerRedis.db,
        ),
        bullHost: options.bullHost ?? sourceManifest.infra.redis.bullHost,
        bullPort: options.bullPort ?? sourceManifest.infra.redis.bullPort,
        bullPrefix: `${sourceManifest.infra.redis.bullPrefix}:${options.envName}`,
        instanceId: `${options.envName.replaceAll('-', '_')}_01`,
      },
    },
    roles,
    fork: {
      anvilHost: options.anvilHost,
      anvilPort: options.anvilPort,
      createdAt: new Date().toISOString(),
      deploymentMode: options.deploymentMode,
      forkBlockNumber: options.forkBlockNumber ?? null,
      sourceEnvironment: options.sourceEnvName,
      sourceRpcUrl: sourceManifest.chain.rpcUrl,
    },
  };
}

export function createWeeklyForkEnvironment(options) {
  const envDir = getWeeklyForkEnvDir(options.envName);
  ensureDir(envDir);
  ensureDir(path.join(envDir, 'wallets'));
  const sourceManifest = loadManifest(options.sourceEnvName);
  const forkWallets = buildForkWalletFixtures({
    chainId: sourceManifest.chain.id,
    sourceEnvName: options.sourceEnvName,
    targetEnvName: options.envName,
  });
  const manifest = deriveManifest(options, sourceManifest, forkWallets);
  const manifestPath = path.join(envDir, 'manifest.json');
  writeJson(manifestPath, manifest);

  cloneWalletTemplate(options.sourceEnvName, options.envName);
  writeForkWalletFixtures(forkWallets, options.envName);
  syncWeeklyForkTargetEnvFiles(options.envName);

  return {
    adminBaseUrl: manifest.infra.admin.baseUrl,
    anvilRpcUrl: manifest.chain.rpcUrl,
    dappBaseUrl: manifest.infra.dapp.baseUrl,
    envName: options.envName,
    manifestPath,
    serverBaseUrl: manifest.infra.server.publicApiBaseUrl,
    sourceEnvName: options.sourceEnvName,
  };
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

async function ensureWeeklyForkSchema({
  envName,
  reset = false,
}) {
  const manifest = loadManifest(envName);
  const schema = manifest.infra.database.schema;
  const client = new Client(buildDatabaseConnectionConfig(manifest));

  await client.connect();

  try {
    if (reset) {
      await client.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(schema)} CASCADE`);
    }

    await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schema)}`);
  } finally {
    await client.end();
  }

  return {
    databaseName: manifest.infra.database.name,
    host: manifest.infra.database.host,
    port: manifest.infra.database.port,
    schema,
  };
}

async function cloneWeeklyForkSchemaBaseline({
  envName,
  reset = false,
  sourceSchema = 'public',
}) {
  const manifest = loadManifest(envName);
  const targetSchema = manifest.infra.database.schema;
  const client = new Client(buildDatabaseConnectionConfig(manifest));

  await client.connect();

  try {
    if (reset) {
      await client.query(
        `DROP SCHEMA IF EXISTS ${quoteIdentifier(targetSchema)} CASCADE`,
      );
    }

    await client.query(
      `CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(targetSchema)}`,
    );

    const enumResult = await client.query(
      `
        SELECT
          type_info.typname AS enum_name,
          enum_info.enum_values AS enum_values
        FROM (
          SELECT
            pg_type.oid,
            pg_type.typname
          FROM pg_type
          INNER JOIN pg_namespace
            ON pg_namespace.oid = pg_type.typnamespace
          WHERE pg_namespace.nspname = $1
            AND pg_type.typtype = 'e'
        ) AS type_info
        INNER JOIN (
          SELECT
            pg_enum.enumtypid,
            json_agg(pg_enum.enumlabel ORDER BY pg_enum.enumsortorder) AS enum_values
          FROM pg_enum
          GROUP BY pg_enum.enumtypid
        ) AS enum_info
          ON enum_info.enumtypid = type_info.oid
        ORDER BY type_info.typname ASC
      `,
      [sourceSchema],
    );

    for (const row of enumResult.rows) {
      const enumValues = Array.isArray(row.enum_values)
        ? row.enum_values
        : JSON.parse(String(row.enum_values));
      const enumValuesSql = enumValues
        .map((value) => `'${String(value).replaceAll("'", "''")}'`)
        .join(', ');
      await client.query(
        `CREATE TYPE ${quoteIdentifier(targetSchema)}.${quoteIdentifier(
          row.enum_name,
        )} AS ENUM (${enumValuesSql})`,
      );
    }

    const tableResult = await client.query(
      `
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = $1
        ORDER BY tablename ASC
      `,
      [sourceSchema],
    );
    const tableNames = tableResult.rows.map((row) => row.tablename);

    if (tableNames.length === 0) {
      throw new Error(
        `Source schema ${sourceSchema} is empty; cannot bootstrap ${targetSchema}`,
      );
    }

    for (const tableName of tableNames) {
      await client.query(
        `CREATE TABLE ${quoteIdentifier(targetSchema)}.${quoteIdentifier(
          tableName,
        )} (LIKE ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(
          tableName,
        )} INCLUDING ALL)`,
      );
    }

    const enumColumnResult = await client.query(
      `
        SELECT
          table_name,
          column_name,
          column_default,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = $1
          AND data_type = 'USER-DEFINED'
          AND udt_schema = $2
        ORDER BY table_name ASC, ordinal_position ASC
      `,
      [targetSchema, sourceSchema],
    );

    for (const row of enumColumnResult.rows) {
      const qualifiedTableName = `${quoteIdentifier(targetSchema)}.${quoteIdentifier(
        row.table_name,
      )}`;
      const quotedColumnName = quoteIdentifier(row.column_name);
      const qualifiedEnumName = `${quoteIdentifier(targetSchema)}.${quoteIdentifier(
        row.udt_name,
      )}`;

      if (row.column_default) {
        await client.query(
          `ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${quotedColumnName} DROP DEFAULT`,
        );
      }

      await client.query(
        `ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${quotedColumnName} TYPE ${qualifiedEnumName} USING ${quotedColumnName}::text::${qualifiedEnumName}`,
      );

      const defaultEnumLabel = extractEnumDefaultLabel(row.column_default);
      if (defaultEnumLabel !== null) {
        await client.query(
          `ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${quotedColumnName} SET DEFAULT ${quoteLiteral(
            defaultEnumLabel,
          )}::${qualifiedEnumName}`,
        );
      }
    }

    if (tableNames.includes('_prisma_migrations')) {
      await client.query(
        `INSERT INTO ${quoteIdentifier(targetSchema)}."_prisma_migrations" SELECT * FROM ${quoteIdentifier(sourceSchema)}."_prisma_migrations"`,
      );
    }

    return {
      sourceSchema,
      tableCount: tableNames.length,
      targetSchema,
    };
  } finally {
    await client.end();
  }
}

function extractEnumDefaultLabel(columnDefault) {
  if (!columnDefault) {
    return null;
  }

  const match = String(columnDefault).match(/^'((?:''|[^'])*)'::/);
  if (!match) {
    throw new Error(`Unsupported enum default expression: ${columnDefault}`);
  }

  return match[1].replaceAll("''", "'");
}

function runPrismaCommand({
  envName,
  prismaArgs,
}) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(REPO_ROOT, 'scripts', 'promotion-env', 'run-with-env.mjs'),
      '--target',
      'server',
      '--env',
      envName,
      '--',
      'pnpm',
      '--dir',
      'apps/server',
      'exec',
      'prisma',
      ...prismaArgs,
    ],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    },
  );

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `Prisma ${prismaArgs.join(' ')} failed for ${envName}${
        output ? `:\n${output}` : ''
      }`,
    );
  }

  return {
    stderr: result.stderr.trim(),
    stdout: result.stdout.trim(),
  };
}

export async function prepareWeeklyForkDatabase(options) {
  createWeeklyForkEnvironment(options);
  const database = await ensureWeeklyForkSchema({
    envName: options.envName,
    reset: false,
  });
  let prismaDeploy = 'skipped: existing isolated schema baseline reused';
  let status;

  try {
    status = runPrismaCommand({
      envName: options.envName,
      prismaArgs: ['migrate', 'status'],
    });
  } catch {
    const cloned = await cloneWeeklyForkSchemaBaseline({
      envName: options.envName,
      reset: true,
    });
    prismaDeploy = `skipped: cloned ${cloned.sourceSchema} schema baseline (${cloned.tableCount} tables)`;
    status = runPrismaCommand({
      envName: options.envName,
      prismaArgs: ['migrate', 'status'],
    });
  }

  return {
    database,
    envName: options.envName,
    prismaDeploy,
    prismaStatus: status.stdout,
    reset: false,
  };
}

export async function resetWeeklyForkDatabase(options) {
  createWeeklyForkEnvironment(options);
  const cloned = await cloneWeeklyForkSchemaBaseline({
    envName: options.envName,
    reset: true,
  });
  const database = {
    databaseName: loadManifest(options.envName).infra.database.name,
    host: loadManifest(options.envName).infra.database.host,
    port: loadManifest(options.envName).infra.database.port,
    schema: cloned.targetSchema,
  };
  const status = runPrismaCommand({
    envName: options.envName,
    prismaArgs: ['migrate', 'status'],
  });

  return {
    database,
    envName: options.envName,
    prismaDeploy: `skipped: cloned ${cloned.sourceSchema} schema baseline (${cloned.tableCount} tables)`,
    prismaStatus: status.stdout,
    reset: true,
    clonedTableCount: cloned.tableCount,
  };
}

function isProcessAlive(pid) {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function jsonRpc(url, method, params = []) {
  const response = await fetch(url, {
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method,
      params,
    }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(
      `RPC ${method} failed: ${payload.error.message ?? JSON.stringify(payload.error)}`,
    );
  }

  return payload.result;
}

async function waitForAnvil(url, chainId) {
  const expectedChainIdHex = `0x${Number(chainId).toString(16)}`;
  let lastError = null;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const currentChainId = await jsonRpc(url, 'eth_chainId');
      if (currentChainId?.toLowerCase() === expectedChainIdHex) {
        return {
          blockNumberHex: await jsonRpc(url, 'eth_blockNumber'),
          chainIdHex: currentChainId,
        };
      }
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  if (lastError instanceof Error) {
    throw new Error(`Timed out waiting for anvil RPC at ${url}: ${lastError.message}`);
  }

  throw new Error(`Timed out waiting for anvil RPC at ${url}`);
}

export function readWeeklyForkRuntime(envName) {
  const runtimePath = getWeeklyForkRuntimePath(envName);
  if (!fs.existsSync(runtimePath)) {
    return null;
  }

  return readJson(runtimePath);
}

export async function startWeeklyFork(options) {
  const setup = createWeeklyForkEnvironment(options);
  const manifest = loadManifest(options.envName);
  const runtimePath = getWeeklyForkRuntimePath(options.envName);
  const existingRuntime = readWeeklyForkRuntime(options.envName);
  const useLocalDeploy = options.deploymentMode === 'local-deploy';

  if (existingRuntime?.pid && isProcessAlive(existingRuntime.pid)) {
    if (!useLocalDeploy) {
      return {
        ...existingRuntime,
        alreadyRunning: true,
        manifestPath: setup.manifestPath,
      };
    }

    await stopWeeklyFork(options.envName);
  }

  const anvilLogPath = path.join(getWeeklyForkEnvDir(options.envName), 'anvil.log');
  const logFd = fs.openSync(anvilLogPath, 'a');
  const anvilBinary = resolveAnvilBinary();
  const anvilHelpOutput = getAnvilHelpOutput(anvilBinary);
  const anvilArgs = [
    '--host',
    options.anvilHost,
    '--port',
    String(options.anvilPort),
    '--chain-id',
    String(manifest.chain.id),
  ];

  if (!useLocalDeploy) {
    anvilArgs.unshift(
      loadManifest(options.sourceEnvName).chain.rpcUrl,
    );
    anvilArgs.unshift('--fork-url');
  }

  if (!useLocalDeploy && supportsAnvilFlag(anvilHelpOutput, '--auto-impersonate')) {
    anvilArgs.push('--auto-impersonate');
  }

  if (!useLocalDeploy && supportsAnvilFlag(anvilHelpOutput, '--no-rate-limit')) {
    anvilArgs.push('--no-rate-limit');
  }

  if (supportsAnvilFlag(anvilHelpOutput, '--allow-origin')) {
    anvilArgs.push('--allow-origin', '*');
  }

  if (!useLocalDeploy && options.forkBlockNumber) {
    anvilArgs.push('--fork-block-number', String(options.forkBlockNumber));
  }

  const child = spawn(anvilBinary, anvilArgs, {
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  child.unref();
  fs.closeSync(logFd);

  let rpcState;
  try {
    rpcState = await waitForAnvil(manifest.chain.rpcUrl, manifest.chain.id);
  } catch (error) {
    if (child.pid && isProcessAlive(child.pid)) {
      process.kill(child.pid, 'SIGKILL');
    }
    throw new Error(
      `Failed to start anvil (${anvilBinary}) for ${options.envName}. See ${anvilLogPath}. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (useLocalDeploy) {
    const adminWallet = readJson(
      path.join(getWeeklyForkEnvDir(options.envName), 'wallets', 'admin.json'),
    );
    const deployResult = spawnSync(
      process.execPath,
      [
        path.join(
          REPO_ROOT,
          'scripts',
          'promotion-env',
          'deploy-contract-suite.mjs',
        ),
        '--env',
        options.envName,
        '--force',
      ],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        env: {
          ...process.env,
          PRIVATE_KEY: String(adminWallet.privateKey).replace(/^0x/, ''),
        },
      },
    );

    if (deployResult.status !== 0) {
      if (child.pid && isProcessAlive(child.pid)) {
        process.kill(child.pid, 'SIGKILL');
      }
      const deployOutput = [deployResult.stdout, deployResult.stderr]
        .filter(Boolean)
        .join('\n')
        .trim();
      throw new Error(
        `Failed to deploy local weekly-fork contracts for ${options.envName}${
          deployOutput ? `:\n${deployOutput}` : ''
        }`,
      );
    }

    syncWeeklyForkTargetEnvFiles(options.envName);
  }

  const runtime = {
    adminBaseUrl: manifest.infra.admin.baseUrl,
    anvilArgs,
    anvilBinary,
    anvilLogPath,
    anvilRpcUrl: manifest.chain.rpcUrl,
    blockNumberHex: rpcState.blockNumberHex,
    chainIdHex: rpcState.chainIdHex,
    dappBaseUrl: manifest.infra.dapp.baseUrl,
    deploymentMode: options.deploymentMode,
    envName: options.envName,
    manifestPath: setup.manifestPath,
    pid: child.pid,
    serverBaseUrl: manifest.infra.server.publicApiBaseUrl,
    sourceEnvName: options.sourceEnvName,
    startedAt: new Date().toISOString(),
  };

  writeJson(runtimePath, runtime);
  return runtime;
}

export async function stopWeeklyFork(envName) {
  const runtimePath = getWeeklyForkRuntimePath(envName);
  const runtime = readWeeklyForkRuntime(envName);
  if (!runtime) {
    return {
      envName,
      stopped: false,
      reason: 'runtime-not-found',
    };
  }

  if (runtime.pid && isProcessAlive(runtime.pid)) {
    process.kill(runtime.pid, 'SIGTERM');

    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (!isProcessAlive(runtime.pid)) {
        break;
      }
      await delay(200);
    }

    if (isProcessAlive(runtime.pid)) {
      process.kill(runtime.pid, 'SIGKILL');
    }
  }

  if (fs.existsSync(runtimePath)) {
    fs.unlinkSync(runtimePath);
  }

  return {
    envName,
    pid: runtime.pid,
    stopped: true,
  };
}

export async function increaseWeeklyForkTime({
  envName,
  seconds,
}) {
  const runtime = readWeeklyForkRuntime(envName);
  if (!runtime) {
    throw new Error(`Fork runtime for ${envName} is not running`);
  }

  const deltaSeconds = Number(seconds);
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    throw new Error(`Invalid --seconds value: ${seconds}`);
  }

  await jsonRpc(runtime.anvilRpcUrl, 'evm_increaseTime', [deltaSeconds]);
  await jsonRpc(runtime.anvilRpcUrl, 'evm_mine', []);

  const blockNumberHex = await jsonRpc(runtime.anvilRpcUrl, 'eth_blockNumber');
  const latestBlock = await jsonRpc(runtime.anvilRpcUrl, 'eth_getBlockByNumber', [
    'latest',
    false,
  ]);
  const nextRuntime = {
    ...runtime,
    blockNumberHex,
    latestBlockTimestampHex: latestBlock?.timestamp ?? null,
    timeAdvancedAt: new Date().toISOString(),
    totalTimeIncreaseSeconds: (runtime.totalTimeIncreaseSeconds ?? 0) + deltaSeconds,
  };

  writeJson(getWeeklyForkRuntimePath(envName), nextRuntime);

  return {
    blockNumberHex,
    envName,
    latestBlockTimestampHex: nextRuntime.latestBlockTimestampHex,
    seconds: deltaSeconds,
    totalTimeIncreaseSeconds: nextRuntime.totalTimeIncreaseSeconds,
  };
}
