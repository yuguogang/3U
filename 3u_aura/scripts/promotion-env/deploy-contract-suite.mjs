#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, loadBaseEnv, loadManifest } from './lib.mjs';

const CONTRACTS_DIR = path.join(REPO_ROOT, 'apps', 'contracts');

function parseArgs(argv) {
  let envName;
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--env') {
      envName = argv[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith('--env=')) {
      envName = value.slice('--env='.length);
      continue;
    }

    if (value === '--force') {
      force = true;
    }
  }

  if (!envName) {
    throw new Error('Missing --env <environment>');
  }

  return { envName, force };
}

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || '');
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function getLatestBroadcastFile(scriptName, chainId) {
  const broadcastDir = path.join(
    CONTRACTS_DIR,
    'broadcast',
    `${scriptName}.s.sol`,
    String(chainId),
  );

  if (!fs.existsSync(broadcastDir)) {
    throw new Error(`Broadcast directory not found: ${broadcastDir}`);
  }

  const latestFile = fs
    .readdirSync(broadcastDir)
    .filter((fileName) => /^run-\d+\.json$/.test(fileName))
    .sort((left, right) => Number(right.slice(4, -5)) - Number(left.slice(4, -5)))[0];

  if (!latestFile) {
    throw new Error(`No timestamped broadcast file found in ${broadcastDir}`);
  }

  return path.join(broadcastDir, latestFile);
}

function readBroadcast(scriptName, chainId) {
  const filePath = getLatestBroadcastFile(scriptName, chainId);
  return {
    data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    filePath,
    relativePath: path.relative(REPO_ROOT, filePath),
  };
}

function pickCreateAddress(runData, { returnKey, contractName }) {
  const returnValue = runData.returns?.[returnKey]?.value;
  if (isAddress(returnValue)) {
    return returnValue;
  }

  const transaction = runData.transactions?.find(
    (item) =>
      item.transactionType === 'CREATE' &&
      item.contractName === contractName &&
      isAddress(item.contractAddress),
  );

  if (transaction) {
    return transaction.contractAddress;
  }

  const receipt = runData.receipts?.find((item) => isAddress(item.contractAddress));
  if (receipt) {
    return receipt.contractAddress;
  }

  throw new Error(`Unable to resolve deployed address for ${contractName}`);
}

function runForgeScript(scriptName, env) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = spawnSync(
      'forge',
      [
        'script',
        `script/${scriptName}.s.sol:${scriptName}`,
        '--rpc-url',
        env.BSC_TESTNET_RPC_URL,
        '--broadcast',
        '--slow',
      ],
      {
        cwd: CONTRACTS_DIR,
        env: { ...process.env, ...env },
        stdio: 'inherit',
        timeout: 60_000,
      },
    );

    if (result.status === 0) {
      return;
    }

    const timedOut = result.error?.code === 'ETIMEDOUT';
    if (attempt < 2) {
      process.stderr.write(
        `[deploy-contract-suite] forge script ${scriptName} failed on attempt ${attempt}${timedOut ? ' (timed out)' : ''}, retrying once...\n`,
      );
      continue;
    }

    throw new Error(
      `forge script failed: ${scriptName}${timedOut ? ' (timed out)' : ''}`,
    );
  }
}

function ensureSecret(baseEnv, key) {
  const value = process.env[key] || baseEnv[key];
  if (!value) {
    throw new Error(`Missing required secret ${key} in apps/contracts/.env or process env`);
  }
  return value;
}

function buildCommonContractsEnv(baseEnv, manifest) {
  return {
    PRIVATE_KEY: ensureSecret(baseEnv, 'PRIVATE_KEY'),
    BSC_TESTNET_RPC_URL: manifest.chain.rpcUrl,
    OWNER: manifest.roles.owner || '',
    FINANCE_WALLET: manifest.roles.financeWallet || '',
    REWARD_FUNDER:
      manifest.roles.rewardFunderAddress ||
      manifest.roles.checkinReceiverAddress ||
      '',
    REFERRAL_SIGNER_ADDRESS: manifest.roles.referralSignerAddress || '',
    NFT_NAME: manifest.contracts.nftName || '3U AURA Founder NFT',
    NFT_SYMBOL: manifest.contracts.nftSymbol || '3UAURA',
    BASE_URI: manifest.contracts.baseUri || '',
    SETTLEMENT_PUBLISHER: manifest.roles.settlementPublisher || '',
    ROOT_PUBLISHER: manifest.roles.rootPublisher || '',
    MAX_SUBSIDY_EPOCHS: String(manifest.contracts.maxSubsidyEpochs || 12),
  };
}

function markActiveIfReady(manifest) {
  const contracts = manifest.contracts;
  const ready =
    isAddress(contracts.paymentTokenAddress) &&
    isAddress(contracts.founderNftAddress) &&
    isAddress(contracts.nftSaleAddress) &&
    isAddress(contracts.merkleDistributorAddress) &&
    isAddress(contracts.settlementAddress);

  if (ready) {
    manifest.status = 'active';
  }
}

function saveManifest(manifestPath, manifest) {
  markActiveIfReady(manifest);
  writeJson(manifestPath, manifest);
}

const { envName, force } = parseArgs(process.argv.slice(2));
const manifestPath = path.join(REPO_ROOT, 'config', 'promotion-envs', envName, 'manifest.json');
const manifest = loadManifest(envName);
const baseEnv = loadBaseEnv(CONTRACTS_DIR);

manifest.artifacts ||= {};
manifest.artifacts.deployMockUsdtBroadcast ||= '';
manifest.artifacts.deployCoreBroadcast ||= manifest.artifacts.deployCoreBroadcast || '';
manifest.artifacts.deploySettlementBroadcast ||= manifest.artifacts.deploySettlementBroadcast || '';

const commonEnv = buildCommonContractsEnv(baseEnv, manifest);

if (
  manifest.contracts.paymentTokenKind === 'mockusdt' &&
  (force || !isAddress(manifest.contracts.paymentTokenAddress))
) {
  runForgeScript('DeployMockUSDT', commonEnv);
  const broadcast = readBroadcast('DeployMockUSDT', manifest.chain.id);
  manifest.contracts.paymentTokenAddress = pickCreateAddress(broadcast.data, {
    returnKey: 'token',
    contractName: 'MockUSDT',
  });
  manifest.artifacts.deployMockUsdtBroadcast = broadcast.relativePath;
  saveManifest(manifestPath, manifest);
  process.stdout.write(
    `deployed MockUSDT ${manifest.contracts.paymentTokenAddress} (${broadcast.relativePath})\n`,
  );
}

if (!isAddress(manifest.contracts.paymentTokenAddress)) {
  throw new Error(`Environment ${envName} is missing paymentTokenAddress`);
}

if (
  force ||
  !isAddress(manifest.contracts.founderNftAddress) ||
  !isAddress(manifest.contracts.nftSaleAddress)
) {
  runForgeScript('DeployNFTCore', {
    ...commonEnv,
    USDT_ADDRESS: manifest.contracts.paymentTokenAddress,
  });
  const broadcast = readBroadcast('DeployNFTCore', manifest.chain.id);
  manifest.contracts.founderNftAddress = pickCreateAddress(broadcast.data, {
    returnKey: 'founderNFT',
    contractName: 'FounderNFT',
  });
  manifest.contracts.nftSaleAddress = pickCreateAddress(broadcast.data, {
    returnKey: 'sale',
    contractName: 'NFTSale',
  });
  manifest.artifacts.deployCoreBroadcast = broadcast.relativePath;
  saveManifest(manifestPath, manifest);
  process.stdout.write(
    `deployed NFTCore founderNFT=${manifest.contracts.founderNftAddress} sale=${manifest.contracts.nftSaleAddress} (${broadcast.relativePath})\n`,
  );
}

if (
  !isAddress(manifest.contracts.founderNftAddress) ||
  !isAddress(manifest.contracts.nftSaleAddress)
) {
  throw new Error(`Environment ${envName} is missing NFT core addresses`);
}

if (
  force ||
  !isAddress(manifest.contracts.settlementAddress) ||
  !isAddress(manifest.contracts.merkleDistributorAddress)
) {
  runForgeScript('DeploySettlementClaim', {
    ...commonEnv,
    FOUNDER_NFT_ADDRESS: manifest.contracts.founderNftAddress,
    USDT_ADDRESS: manifest.contracts.paymentTokenAddress,
  });
  const broadcast = readBroadcast('DeploySettlementClaim', manifest.chain.id);
  manifest.contracts.settlementAddress = pickCreateAddress(broadcast.data, {
    returnKey: 'settlement',
    contractName: 'Settlement',
  });
  manifest.contracts.merkleDistributorAddress = pickCreateAddress(broadcast.data, {
    returnKey: 'merkleClaim',
    contractName: 'MerkleClaim',
  });
  manifest.artifacts.deploySettlementBroadcast = broadcast.relativePath;
  saveManifest(manifestPath, manifest);
  process.stdout.write(
    `deployed SettlementClaim settlement=${manifest.contracts.settlementAddress} merkle=${manifest.contracts.merkleDistributorAddress} (${broadcast.relativePath})\n`,
  );
}

saveManifest(manifestPath, manifest);

const syncResult = spawnSync(process.execPath, ['scripts/promotion-env/sync-public-envs.mjs'], {
  cwd: REPO_ROOT,
  env: process.env,
  stdio: 'inherit',
});

if (syncResult.status !== 0) {
  throw new Error('Failed to sync public env files after deployment');
}

process.stdout.write(`environment ${envName} status=${manifest.status}\n`);
