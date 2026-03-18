import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCiManifest } from './runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadManifest(envName = 'fork-anvil') {
  const ciManifest = loadCiManifest(envName);
  if (ciManifest) {
    return ciManifest;
  }

  return readJsonFile(
    path.join(REPO_ROOT, 'config', 'promotion-envs', envName, 'manifest.json'),
  );
}

export function loadWalletFixture(name, envName = 'fork-anvil') {
  return readJsonFile(
    path.join(REPO_ROOT, 'config', 'promotion-envs', envName, 'wallets', `${name}.json`),
  );
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
