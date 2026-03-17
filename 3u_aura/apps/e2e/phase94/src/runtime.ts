import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PromotionManifest = {
  environment: string;
  status: string;
  chain: {
    id: number;
    rpcUrl: string;
  };
  contracts: {
    founderNftAddress: `0x${string}`;
    merkleDistributorAddress: `0x${string}`;
    nftSaleAddress: `0x${string}`;
    paymentTokenAddress: `0x${string}`;
    settlementAddress: `0x${string}`;
  };
  roles: {
    checkinReceiverAddress: `0x${string}`;
    owner: `0x${string}`;
    settlementPublisher?: `0x${string}`;
    rootPublisher?: `0x${string}`;
    financeWallet?: `0x${string}`;
    referralSignerAddress?: `0x${string}`;
    adminAllowlistWallets?: `0x${string}`[];
  };
  infra: {
    server: {
      publicApiBaseUrl: string;
    };
    dapp: {
      baseUrl: string;
    };
    admin: {
      baseUrl: string;
    };
    database: {
      host: string;
      name: string;
      port: number;
      schema: string;
    };
  };
};

export type WalletFixture = {
  environment: string;
  chainId: number;
  name: string;
  role: string;
  address: `0x${string}`;
  privateKey: `0x${string}`;
  privateKeyEnv: string;
  funding: {
    targetBnb: string;
    targetMockUsdt: string;
  };
};

export type RuntimeConfig = {
  environment: string;
  runId: string;
  projectRoot: string;
  repoRoot: string;
  environmentDir: string;
  walletsDir: string;
  reportsDir: string;
  artifactsDir: string;
  uatReportPath: string;
  manifest: PromotionManifest;
};

export type WeeklyForkRuntime = {
  adminBaseUrl: string;
  anvilArgs: string[];
  anvilBinary: string;
  anvilLogPath: string;
  anvilRpcUrl: string;
  blockNumberHex: string;
  chainIdHex: string;
  dappBaseUrl: string;
  envName: string;
  manifestPath: string;
  pid: number;
  serverBaseUrl: string;
  sourceEnvName: string;
  startedAt: string;
};

const FILE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(FILE_DIR, "..");
const REPO_ROOT = path.resolve(PROJECT_ROOT, "../../..");

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function resolveEnvironmentName() {
  return (
    process.env.PROMOTION_E2E_ENV ||
    process.env.PROMOTION_ENV ||
    "uat-mockusdt"
  );
}

function resolveRunId() {
  const existingRunId = process.env.PROMOTION_E2E_RUN_ID;
  if (existingRunId) {
    return existingRunId;
  }

  return new Date().toISOString().replaceAll(":", "-");
}

export function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function loadManifest(
  environment = resolveEnvironmentName(),
): PromotionManifest {
  return readJsonFile<PromotionManifest>(
    path.join(
      REPO_ROOT,
      "config",
      "promotion-envs",
      environment,
      "manifest.json",
    ),
  );
}

export function getWalletsDir(environment = resolveEnvironmentName()) {
  return path.join(
    REPO_ROOT,
    "config",
    "promotion-envs",
    environment,
    "wallets",
  );
}

export function loadWalletFixtures(
  environment = resolveEnvironmentName(),
): WalletFixture[] {
  const walletsDir = getWalletsDir(environment);
  const walletFiles = fs
    .readdirSync(walletsDir)
    .filter(
      (entry) =>
        entry.endsWith(".json") &&
        entry !== "funding-report.json" &&
        entry !== "wallets.example.json",
    )
    .sort();

  return walletFiles.map((entry) =>
    readJsonFile<WalletFixture>(path.join(walletsDir, entry)),
  );
}

export function loadWalletFixture(
  walletName: string,
  environment = resolveEnvironmentName(),
): WalletFixture {
  return readJsonFile<WalletFixture>(
    path.join(getWalletsDir(environment), `${walletName}.json`),
  );
}

export function loadRuntimeConfig(): RuntimeConfig {
  const environment = resolveEnvironmentName();
  const runId = resolveRunId();
  const reportsDir = path.join(PROJECT_ROOT, "reports");
  const artifactsDir = path.join(reportsDir, "artifacts", runId);

  return {
    environment,
    runId,
    projectRoot: PROJECT_ROOT,
    repoRoot: REPO_ROOT,
    environmentDir: path.join(
      REPO_ROOT,
      "config",
      "promotion-envs",
      environment,
    ),
    walletsDir: getWalletsDir(environment),
    reportsDir,
    artifactsDir,
    uatReportPath: path.join(reportsDir, "uat-report.json"),
    manifest: loadManifest(environment),
  };
}

export function loadWeeklyForkRuntime(
  environment = resolveEnvironmentName(),
): WeeklyForkRuntime | null {
  const runtimePath = path.join(
    REPO_ROOT,
    "config",
    "promotion-envs",
    environment,
    "runtime.json",
  );

  if (!fs.existsSync(runtimePath)) {
    return null;
  }

  return readJsonFile<WeeklyForkRuntime>(runtimePath);
}
