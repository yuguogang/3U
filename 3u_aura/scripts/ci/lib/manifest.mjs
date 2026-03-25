import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCiManifest } from './runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function normalizeAddress(value) {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

function assertManifestConsistency(envName, ciManifest, configManifest) {
  const mismatches = [];
  const fields = [
    ['chain.id', ciManifest.chain?.id, configManifest.chain?.id],
    ['chain.rpcUrl', ciManifest.chain?.rpcUrl, configManifest.chain?.rpcUrl],
    [
      'contracts.paymentTokenAddress',
      normalizeAddress(ciManifest.contracts?.paymentTokenAddress),
      normalizeAddress(configManifest.contracts?.paymentTokenAddress),
    ],
    [
      'contracts.founderNftAddress',
      normalizeAddress(ciManifest.contracts?.founderNftAddress),
      normalizeAddress(configManifest.contracts?.founderNftAddress),
    ],
    [
      'contracts.nftSaleAddress',
      normalizeAddress(ciManifest.contracts?.nftSaleAddress),
      normalizeAddress(configManifest.contracts?.nftSaleAddress),
    ],
    [
      'contracts.settlementAddress',
      normalizeAddress(ciManifest.contracts?.settlementAddress),
      normalizeAddress(configManifest.contracts?.settlementAddress),
    ],
    [
      'contracts.merkleDistributorAddress',
      normalizeAddress(ciManifest.contracts?.merkleDistributorAddress),
      normalizeAddress(configManifest.contracts?.merkleDistributorAddress),
    ],
    [
      'roles.rewardFunderAddress',
      normalizeAddress(ciManifest.roles?.rewardFunderAddress),
      normalizeAddress(configManifest.roles?.rewardFunderAddress),
    ],
    [
      'roles.checkinReceiverAddress',
      normalizeAddress(ciManifest.roles?.checkinReceiverAddress),
      normalizeAddress(configManifest.roles?.checkinReceiverAddress),
    ],
    [
      'roles.financeWallet',
      normalizeAddress(ciManifest.roles?.financeWallet),
      normalizeAddress(configManifest.roles?.financeWallet),
    ],
  ];

  for (const [label, left, right] of fields) {
    if (left !== right) {
      mismatches.push(`${label}: ci=${left} config=${right}`);
    }
  }

  if (mismatches.length) {
    throw new Error(
      `Manifest mismatch detected for ${envName}. Sync config/promotion-envs and scripts/ci/.runtime before continuing.\n${mismatches.join('\n')}`,
    );
  }
}

export function loadManifest(envName = 'fork-anvil') {
  const ciManifest = loadCiManifest(envName);
  const configManifestPath = path.join(
    REPO_ROOT,
    'config',
    'promotion-envs',
    envName,
    'manifest.json',
  );
  const configManifest = readJsonFile(configManifestPath);
  if (ciManifest) {
    assertManifestConsistency(envName, ciManifest, configManifest);
    return ciManifest;
  }

  return configManifest;
}

export function loadWalletFixture(name, envName = 'fork-anvil') {
  return readJsonFile(
    path.join(REPO_ROOT, 'config', 'promotion-envs', envName, 'wallets', `${name}.json`),
  );
}

export function loadWalletFixtureByAddress(address, envName = 'fork-anvil') {
  const normalized = String(address).toLowerCase();
  const walletDir = path.join(
    REPO_ROOT,
    'config',
    'promotion-envs',
    envName,
    'wallets',
  );

  for (const walletFile of fs.readdirSync(walletDir)) {
    if (!walletFile.endsWith('.json')) {
      continue;
    }

    const fixture = readJsonFile(path.join(walletDir, walletFile));
    if (String(fixture.address).toLowerCase() === normalized) {
      return fixture;
    }
  }

  throw new Error(`Wallet fixture not found for ${address} in ${envName}`);
}

export const FORK_ANVIL_CONFIG = {
  rpcUrl: 'http://127.0.0.1:18545',
  chainId: 97,
  anvilPort: 18545,
};

export function getServerBaseUrl(envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  return manifest.infra.server.publicApiBaseUrl;
}

export function getDappBaseUrl(envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  return manifest.infra.dapp.baseUrl;
}
