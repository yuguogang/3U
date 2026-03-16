#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { REPO_ROOT, loadBaseEnv, loadManifest } from './lib.mjs';

const requireFromServer = createRequire(
  path.join(REPO_ROOT, 'apps', 'server', 'package.json'),
);
const {
  createPublicClient,
  createWalletClient,
  formatEther,
  formatUnits,
  http,
  parseEther,
  parseUnits,
} = requireFromServer('viem');
const { generatePrivateKey, privateKeyToAccount } = requireFromServer(
  'viem/accounts',
);
const { bscTestnet } = requireFromServer('viem/chains');

const MOCK_USDT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

function parseArgs(argv) {
  let envName;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--env') {
      envName = argv[index + 1];
      index += 1;
      continue;
    }
    if (value.startsWith('--env=')) {
      envName = value.slice('--env='.length);
    }
  }

  if (!envName) {
    throw new Error('Missing --env <environment>');
  }

  return { envName };
}

function ensureHexPrivateKey(value) {
  if (!value) {
    throw new Error('Missing owner PRIVATE_KEY');
  }
  return value.startsWith('0x') ? value : `0x${value}`;
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

function toMockUsdtUnits(amount) {
  return parseUnits(String(amount), 6);
}

function toPlainMockUsdt(amount) {
  return formatUnits(amount, 6);
}

function buildWalletRecord({ manifest, template, account }) {
  return {
    environment: manifest.environment,
    chainId: manifest.chain.id,
    name: template.name,
    role: template.role,
    address: account.address,
    privateKey: account.source,
    privateKeyEnv: template.privateKeyEnv,
    funding: {
      targetBnb: template.initialBnbMin,
      targetMockUsdt: template.initialUsdtMin,
    },
  };
}

function isForkEnvironment(manifest) {
  return Boolean(manifest.fork) || manifest.environment.startsWith('fork-');
}

function resolveFundingAccount({ baseEnv, manifest, walletRecords }) {
  if (isForkEnvironment(manifest)) {
    const fundingWallet =
      walletRecords.find((wallet) => wallet.role === 'admin') ?? walletRecords[0];

    if (!fundingWallet?.privateKey) {
      throw new Error(
        `Fork environment ${manifest.environment} is missing a local funding wallet`,
      );
    }

    return privateKeyToAccount(ensureHexPrivateKey(fundingWallet.privateKey));
  }

  const ownerPrivateKey = ensureHexPrivateKey(
    process.env.PRIVATE_KEY || baseEnv.PRIVATE_KEY,
  );
  const ownerAccount = privateKeyToAccount(ownerPrivateKey);

  if (ownerAccount.address.toLowerCase() !== manifest.roles.owner.toLowerCase()) {
    throw new Error(
      `Owner private key address ${ownerAccount.address} does not match manifest owner ${manifest.roles.owner}`,
    );
  }

  return ownerAccount;
}

async function main() {
  const { envName } = parseArgs(process.argv.slice(2));
  const envDir = path.join(REPO_ROOT, 'config', 'promotion-envs', envName);
  const walletsDir = path.join(envDir, 'wallets');
  const reportPath = path.join(walletsDir, 'funding-report.json');
  const manifest = loadManifest(envName);
  const templatePath = path.join(envDir, 'wallets.example.json');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Wallet template not found: ${templatePath}`);
  }

  const baseEnv = loadBaseEnv(path.join(REPO_ROOT, 'apps', 'contracts'));

  ensureDir(walletsDir);

  const walletTemplates = readJson(templatePath);
  const walletRecords = [];
  const generatedNames = [];

  for (const template of walletTemplates) {
    const walletPath = path.join(walletsDir, `${template.name}.json`);
    if (fs.existsSync(walletPath)) {
      walletRecords.push(readJson(walletPath));
      continue;
    }

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const record = buildWalletRecord({
      manifest,
      template,
      account: {
        address: account.address,
        source: privateKey,
      },
    });
    writeJson(walletPath, record);
    walletRecords.push(record);
    generatedNames.push(template.name);
  }

  const fundingAccount = resolveFundingAccount({
    baseEnv,
    manifest,
    walletRecords,
  });

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(manifest.chain.rpcUrl),
  });
  const walletClient = createWalletClient({
    account: fundingAccount,
    chain: bscTestnet,
    transport: http(manifest.chain.rpcUrl),
  });

  const report = {
    environment: envName,
    chainId: manifest.chain.id,
    funderAddress: fundingAccount.address,
    ownerAddress: manifest.roles.owner,
    paymentTokenAddress: manifest.contracts.paymentTokenAddress,
    generatedWallets: generatedNames,
    wallets: [],
  };

  for (const wallet of walletRecords) {
    const targetBnb = parseEther(wallet.funding.targetBnb);
    const targetMockUsdt = toMockUsdtUnits(wallet.funding.targetMockUsdt);
    const address = wallet.address;

    const currentBnb = await publicClient.getBalance({ address });
    const currentMockUsdt = await publicClient.readContract({
      address: manifest.contracts.paymentTokenAddress,
      abi: MOCK_USDT_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    const entry = {
      name: wallet.name,
      role: wallet.role,
      address,
      targetBnb: wallet.funding.targetBnb,
      targetMockUsdt: wallet.funding.targetMockUsdt,
      bnbTopUpTxHash: null,
      mockUsdtMintTxHash: null,
      finalBnb: null,
      finalMockUsdt: null,
    };

    if (currentBnb < targetBnb) {
      const bnbHash = await walletClient.sendTransaction({
        account: fundingAccount,
        to: address,
        value: targetBnb - currentBnb,
      });
      await publicClient.waitForTransactionReceipt({ hash: bnbHash });
      entry.bnbTopUpTxHash = bnbHash;
    }

    if (currentMockUsdt < targetMockUsdt) {
      const mintHash = await walletClient.writeContract({
        account: fundingAccount,
        address: manifest.contracts.paymentTokenAddress,
        abi: MOCK_USDT_ABI,
        functionName: 'mint',
        args: [address, targetMockUsdt - currentMockUsdt],
      });
      await publicClient.waitForTransactionReceipt({ hash: mintHash });
      entry.mockUsdtMintTxHash = mintHash;
    }

    const finalBnb = await publicClient.getBalance({ address });
    const finalMockUsdt = await publicClient.readContract({
      address: manifest.contracts.paymentTokenAddress,
      abi: MOCK_USDT_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    entry.finalBnb = formatEther(finalBnb);
    entry.finalMockUsdt = toPlainMockUsdt(finalMockUsdt);
    report.wallets.push(entry);
  }

  writeJson(reportPath, report);

  process.stdout.write(
    `${JSON.stringify(
      {
        environment: envName,
        funderAddress: fundingAccount.address,
        ownerAddress: manifest.roles.owner,
        generatedWallets: generatedNames,
        wallets: report.wallets,
      },
      null,
      2,
    )}\n`,
  );
}

await main();
