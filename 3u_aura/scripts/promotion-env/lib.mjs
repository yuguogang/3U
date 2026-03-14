import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');

const TARGETS = new Set(['contracts', 'server', 'dapp', 'admin']);
const DEFAULT_ENV = 'testnet-live';

function normalizeValue(rawValue) {
  const value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);
    result[key] = normalizeValue(value);
  }

  return result;
}

export function loadBaseEnv(cwd = process.cwd()) {
  const env = {};
  const candidateFiles = ['.env', '.env.local'];

  for (const fileName of candidateFiles) {
    Object.assign(env, parseEnvFile(path.join(cwd, fileName)));
  }

  return env;
}

export function parseArgs(argv) {
  const result = {
    command: [],
    envName: undefined,
    strict: false,
    target: undefined,
  };

  let separatorFound = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (separatorFound) {
      result.command.push(value);
      continue;
    }

    if (value === '--') {
      separatorFound = true;
      continue;
    }

    if (value === '--strict') {
      result.strict = true;
      continue;
    }

    if (value === '--env') {
      result.envName = argv[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith('--env=')) {
      result.envName = value.slice('--env='.length);
      continue;
    }

    if (value === '--target') {
      result.target = argv[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith('--target=')) {
      result.target = value.slice('--target='.length);
      continue;
    }
  }

  return result;
}

function ensureTarget(target) {
  if (!TARGETS.has(target)) {
    throw new Error(
      `Unsupported target "${target}". Expected one of: ${Array.from(TARGETS).join(', ')}`,
    );
  }
}

export function getManifestPath(envName) {
  return path.join(REPO_ROOT, 'config', 'promotion-envs', envName, 'manifest.json');
}

export function loadManifest(envName) {
  const filePath = getManifestPath(envName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Promotion manifest not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildDatabaseUrl(baseEnv, database) {
  const user = process.env.DATABASE_USER || baseEnv.DATABASE_USER || 'postgres';
  const password =
    process.env.DATABASE_PASSWORD || baseEnv.DATABASE_PASSWORD || 'password';
  const host = database.host;
  const port = database.port;
  const name = database.name;
  const schema = database.schema || 'public';
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${name}?schema=${schema}`;
}

function resolvePortFromUrl(url, fallbackPort) {
  try {
    const parsed = new URL(url);
    if (parsed.port) {
      return parsed.port;
    }

    if (parsed.protocol === 'https:') {
      return '443';
    }

    if (parsed.protocol === 'http:') {
      return '80';
    }
  } catch {
    // Ignore malformed URLs and use fallback.
  }

  return String(fallbackPort);
}

function buildCommonPromotionEnv(manifest) {
  return {
    PROMOTION_CLAIM_CHAIN_ID: String(manifest.chain.id),
    PROMOTION_START_AT: manifest.promotion.startAt,
    PROMOTION_TIMEZONE: manifest.promotion.timezone,
    PROMOTION_EPOCH_LENGTH_DAYS: String(manifest.promotion.epochLengthDays),
    PROMOTION_TICKET_STREAK_DAYS: String(manifest.promotion.ticketStreakDays),
    PROMOTION_MINIMUM_PARTICIPANTS: String(manifest.promotion.minimumParticipants),
    PROMOTION_REFERRAL_SIGNATURE_TTL_SECONDS: String(
      manifest.promotion.referralSignatureTtlSeconds,
    ),
    PROMOTION_RPC_URL: manifest.chain.rpcUrl,
    PROMOTION_REFERRAL_RPC_URL:
      manifest.chain.referralRpcUrl || manifest.chain.rpcUrl,
    PROMOTION_CHECKIN_RECEIVER_ADDRESS: manifest.roles.checkinReceiverAddress || '',
    PROMOTION_PAYMENT_TOKEN_ADDRESS: manifest.contracts.paymentTokenAddress || '',
    PROMOTION_NFT_SALE_ADDRESS: manifest.contracts.nftSaleAddress || '',
    PROMOTION_MERKLE_DISTRIBUTOR_ADDRESS:
      manifest.contracts.merkleDistributorAddress || '',
    PROMOTION_SETTLEMENT_ADDRESS: manifest.contracts.settlementAddress || '',
  };
}

function resolveWalletConnectProjectId(baseEnv, manifest) {
  return (
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    baseEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    manifest.frontend.walletConnectProjectId ||
    'YOUR_PROJECT_ID'
  );
}

export function buildDerivedEnv({ manifest, target, baseEnv }) {
  ensureTarget(target);

  const commonPromotionEnv = buildCommonPromotionEnv(manifest);

  switch (target) {
    case 'server':
      return {
        PROMOTION_ENV: manifest.environment,
        PROMOTION_ENV_STATUS: manifest.status,
        PORT: String(manifest.infra.server.port),
        HOST: manifest.infra.server.host,
        DATABASE_HOST: manifest.infra.database.host,
        DATABASE_PORT: String(manifest.infra.database.port),
        DATABASE_NAME: manifest.infra.database.name,
        CACHE_URL: manifest.infra.redis.cacheUrl,
        THROTTLER_REDIS: manifest.infra.redis.throttlerUrl,
        BULL_HOST: manifest.infra.redis.bullHost,
        BULL_PORT: String(manifest.infra.redis.bullPort),
        BULL_PREFIX: manifest.infra.redis.bullPrefix,
        INSTANCE_ID: manifest.infra.redis.instanceId,
        ADMIN_ALLOWLIST_WALLETS: manifest.roles.adminAllowlistWallets.join(','),
        ...commonPromotionEnv,
      };
    case 'dapp':
      return {
        PROMOTION_ENV: manifest.environment,
        PORT: resolvePortFromUrl(
          manifest.infra.dapp.baseUrl,
          manifest.infra.server.port,
        ),
        NEXT_PUBLIC_API_BASE_URL: manifest.infra.server.publicApiBaseUrl,
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: resolveWalletConnectProjectId(
          baseEnv,
          manifest,
        ),
        NEXT_PUBLIC_PROMOTION_CHAIN_ID: String(manifest.chain.id),
        NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS:
          manifest.contracts.paymentTokenAddress || '',
        NEXT_PUBLIC_NFT_SALE_ADDRESS: manifest.contracts.nftSaleAddress || '',
        NEXT_PUBLIC_MERKLE_CLAIM_ADDRESS:
          manifest.contracts.merkleDistributorAddress || '',
        NEXT_PUBLIC_SETTLEMENT_ADDRESS:
          manifest.contracts.settlementAddress || '',
      };
    case 'admin':
      return {
        PROMOTION_ENV: manifest.environment,
        PORT: resolvePortFromUrl(
          manifest.infra.admin.baseUrl,
          manifest.infra.server.port,
        ),
        NEXT_PUBLIC_API_BASE_URL: manifest.infra.server.publicApiBaseUrl,
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: resolveWalletConnectProjectId(
          baseEnv,
          manifest,
        ),
      };
    case 'contracts':
      return {
        PROMOTION_ENV: manifest.environment,
        BSC_TESTNET_RPC_URL: manifest.chain.rpcUrl,
        OWNER: manifest.roles.owner || '',
        USDT_ADDRESS: manifest.contracts.paymentTokenAddress || '',
        FINANCE_WALLET: manifest.roles.financeWallet || '',
        REFERRAL_SIGNER_ADDRESS: manifest.roles.referralSignerAddress || '',
        FOUNDER_NFT_ADDRESS: manifest.contracts.founderNftAddress || '',
        SETTLEMENT_PUBLISHER: manifest.roles.settlementPublisher || '',
        ROOT_PUBLISHER: manifest.roles.rootPublisher || '',
        MAX_SUBSIDY_EPOCHS: String(manifest.contracts.maxSubsidyEpochs || 12),
        NFT_NAME: manifest.contracts.nftName || '3U AURA Founder NFT',
        NFT_SYMBOL: manifest.contracts.nftSymbol || '3UAURA',
        BASE_URI: manifest.contracts.baseUri || '',
      };
    default:
      return {};
  }
}

function isUnsetValue(value) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  return (
    !trimmed ||
    trimmed === 'YOUR_PROJECT_ID' ||
    trimmed === 'http://localhost:0' ||
    trimmed === 'https://example.invalid' ||
    trimmed === '__UNSET__'
  );
}

const REQUIRED_KEYS = {
  admin: ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'],
  contracts: [
    'BSC_TESTNET_RPC_URL',
    'OWNER',
    'USDT_ADDRESS',
    'FINANCE_WALLET',
    'REFERRAL_SIGNER_ADDRESS',
  ],
  dapp: [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
    'NEXT_PUBLIC_PROMOTION_CHAIN_ID',
    'NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS',
    'NEXT_PUBLIC_NFT_SALE_ADDRESS',
    'NEXT_PUBLIC_MERKLE_CLAIM_ADDRESS',
    'NEXT_PUBLIC_SETTLEMENT_ADDRESS',
  ],
  server: [
    'PORT',
    'HOST',
    'DATABASE_URL',
    'CACHE_URL',
    'THROTTLER_REDIS',
    'BULL_HOST',
    'BULL_PORT',
    'BULL_PREFIX',
    'PROMOTION_CLAIM_CHAIN_ID',
    'PROMOTION_RPC_URL',
    'PROMOTION_CHECKIN_RECEIVER_ADDRESS',
    'PROMOTION_PAYMENT_TOKEN_ADDRESS',
    'PROMOTION_NFT_SALE_ADDRESS',
    'PROMOTION_MERKLE_DISTRIBUTOR_ADDRESS',
    'PROMOTION_SETTLEMENT_ADDRESS',
  ],
};

export function assertRunnable({ manifest, target, env }) {
  if (manifest.status !== 'active') {
    throw new Error(
      `Environment "${manifest.environment}" is not runnable. status=${manifest.status}`,
    );
  }

  const missing = REQUIRED_KEYS[target].filter((key) => isUnsetValue(env[key]));
  if (missing.length > 0) {
    throw new Error(
      `Environment "${manifest.environment}" is missing required ${target} keys: ${missing.join(', ')}`,
    );
  }
}

export function resolvePromotionEnv(explicitEnvName, cwd = process.cwd()) {
  const baseEnv = loadBaseEnv(cwd);
  return explicitEnvName || process.env.PROMOTION_ENV || baseEnv.PROMOTION_ENV || DEFAULT_ENV;
}

export function buildTargetContext({
  cwd = process.cwd(),
  envName,
  strict = false,
  target,
} = {}) {
  ensureTarget(target);

  const resolvedEnv = resolvePromotionEnv(envName, cwd);
  const baseEnv = loadBaseEnv(cwd);
  const manifest = loadManifest(resolvedEnv);
  const derivedEnv = buildDerivedEnv({ manifest, target, baseEnv });
  const runtimeEnv = target === 'server'
    ? {
        DATABASE_URL: buildDatabaseUrl({ ...baseEnv, ...process.env }, manifest.infra.database),
      }
    : {};
  const mergedEnv = { ...baseEnv, ...process.env, ...derivedEnv, ...runtimeEnv };

  if (strict) {
    assertRunnable({ manifest, target, env: mergedEnv });
  }

  return {
    baseEnv,
    derivedEnv,
    env: mergedEnv,
    envName: resolvedEnv,
    manifest,
  };
}

export function formatEnvFile(envObject) {
  return `${Object.entries(envObject)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')}\n`;
}

export function writeFileIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content) {
      return false;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}
