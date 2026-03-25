#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadManifest, loadWalletFixture, REPO_ROOT } from '../promotion-env/lib.mjs';
import { getAccessToken, syncPurchasedNft } from '../ci/lib/server.mjs';

const requireFromServer = createRequire(
  new URL('../../apps/server/package.json', import.meta.url),
);
const { createPublicClient, getAddress, http, parseAbiItem } =
  requireFromServer('viem');

function readArg(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index !== -1) {
    return process.argv[index + 1];
  }

  const inline = process.argv.find((value) => value.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : undefined;
}

function normalizeAddress(value) {
  return String(value).toLowerCase();
}

function resolveWalletFixtureByAddress(walletAddress, envName) {
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

    const fixture = JSON.parse(
      fs.readFileSync(path.join(walletDir, walletFile), 'utf8'),
    );
    if (normalizeAddress(fixture.address) === normalizeAddress(walletAddress)) {
      return fixture;
    }
  }

  throw new Error(
    `Wallet fixture not found for ${walletAddress}. This sync helper requires a locally managed wallet fixture.`,
  );
}

async function resolveLatestPurchaseTxHash(walletAddress, envName) {
  const manifest = loadManifest(envName);
  const client = createPublicClient({
    transport: http(manifest.chain.rpcUrl),
  });
  const logs = await client.getLogs({
    address: getAddress(manifest.contracts.nftSaleAddress),
    args: {
      buyer: getAddress(walletAddress),
    },
    event: parseAbiItem(
      'event PurchasedNFTBought(address indexed buyer, uint256 indexed tokenId, uint256 price, address indexed financeWallet)',
    ),
    fromBlock: 0n,
    toBlock: 'latest',
  });

  const latestLog = logs.at(-1);
  if (!latestLog?.transactionHash) {
    throw new Error(
      `No PurchasedNFTBought log found for ${walletAddress} on ${envName}`,
    );
  }

  return latestLog.transactionHash;
}

async function main() {
  const envName = readArg('env') ?? process.env.PROMOTION_ENV ?? 'fork-anvil';
  const walletAddress = readArg('wallet');
  const txHash = readArg('tx-hash');

  if (!walletAddress) {
    throw new Error(
      'Usage: node scripts/uat/sync-weekly-fork-purchased-nft-state.mjs --env <env> --wallet <address> [--tx-hash <txHash>]',
    );
  }

  const walletFixture = resolveWalletFixtureByAddress(walletAddress, envName);
  const purchaseTxHash =
    txHash ?? (await resolveLatestPurchaseTxHash(walletAddress, envName));
  const login = await getAccessToken(
    walletFixture.address,
    walletFixture.privateKey,
    envName,
  );
  const result = await syncPurchasedNft(
    login.accessToken,
    purchaseTxHash,
    envName,
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        ...result,
        walletAddress: walletFixture.address,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
