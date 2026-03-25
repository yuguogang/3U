import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  archiveBroadcastFile,
  getCiRuntimePath,
  writeCiManifest,
  writeCiRuntime,
} from './runtime.mjs';

const execAsync = promisify(exec);

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export async function startAnvil(envName = 'fork-anvil') {
  const manifestPath = path.join(REPO_ROOT, 'config', 'promotion-envs', envName, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const rpcUrl = manifest.chain.rpcUrl;

  if (await isAnvilReady(rpcUrl, manifest.chain.id)) {
    console.log(`✓ Reusing running anvil at ${rpcUrl}`);
    return;
  }

  console.log('REPO_ROOT:', REPO_ROOT);
  const { stdout } = await execAsync(
    `node scripts/uat/start-weekly-fork.mjs --env ${envName}`,
    { cwd: REPO_ROOT },
  );
  console.log(`✓ Anvil started: ${stdout.trim()}`);
}

export async function ensureFreshContracts(envName = 'fork-anvil') {
  console.log('Ensuring fresh contracts...');
  
  const manifestPath = path.join(REPO_ROOT, 'config', 'promotion-envs', envName, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  const rpcUrl = manifest.chain.rpcUrl;
  const adminPk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const owner = manifest.roles.owner || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const financeWallet = manifest.roles.financeWallet || owner;
  const rewardFunderAddress =
    manifest.roles.rewardFunderAddress ||
    manifest.roles.checkinReceiverAddress ||
    owner;
  const settlementPublisher = manifest.roles.settlementPublisher || financeWallet;
  const rootPublisher = manifest.roles.rootPublisher || owner;
  const referralSignerPrivateKey = adminPk;
  const referralSignerAddress = manifest.roles.referralSignerAddress || owner;
  
  // Deploy MockUSDT
  console.log('  Deploying MockUSDT...');
  let result = await execAsync(
    `PRIVATE_KEY=${adminPk} OWNER=${owner} forge script DeployMockUSDT --rpc-url ${rpcUrl} --broadcast 2>&1 | tail -20`,
    { cwd: path.join(REPO_ROOT, 'apps/contracts') },
  );
  
  // Get MockUSDT address from broadcast
  const broadcastDir = path.join(REPO_ROOT, 'apps/contracts/broadcast/DeployMockUSDT.s.sol/97');
  const files = fs.readdirSync(broadcastDir).filter(f => f.startsWith('run-') && f.endsWith('.json'));
  const latestFile = files.sort().pop();
  const mockUsdtSourcePath = path.join(broadcastDir, latestFile);
  const mockUsdtData = JSON.parse(fs.readFileSync(mockUsdtSourcePath, 'utf-8'));
  const mockUsdtAddr = mockUsdtData.transactions[mockUsdtData.transactions.length - 1].contractAddress;
  console.log(`    MockUSDT: ${mockUsdtAddr}`);
  
  // Deploy NFTSale (FounderNFT + NFTSale)
  console.log('  Deploying NFTSale...');
  result = await execAsync(
    `PRIVATE_KEY=${adminPk} OWNER=${owner} USDT_ADDRESS=${mockUsdtAddr} FINANCE_WALLET=${financeWallet} REFERRAL_SIGNER_ADDRESS=${referralSignerAddress} forge script DeployNFTCore --rpc-url ${rpcUrl} --broadcast 2>&1 | tail -20`,
    { cwd: path.join(REPO_ROOT, 'apps/contracts') },
  );
  
  const nftCoreFiles = fs.readdirSync(path.join(REPO_ROOT, 'apps/contracts/broadcast/DeployNFTCore.s.sol/97')).filter(f => f.startsWith('run-') && f.endsWith('.json'));
  const nftCoreLatest = nftCoreFiles.sort().pop();
  const nftCoreSourcePath = path.join(REPO_ROOT, 'apps/contracts/broadcast/DeployNFTCore.s.sol/97', nftCoreLatest);
  const nftCoreData = JSON.parse(fs.readFileSync(nftCoreSourcePath, 'utf-8'));
  const founderNftAddr = nftCoreData.transactions.find(t => t.contractName === 'FounderNFT')?.contractAddress;
  const nftSaleAddr = nftCoreData.transactions.find(t => t.contractName === 'NFTSale')?.contractAddress;
  console.log(`    FounderNFT: ${founderNftAddr}`);
  console.log(`    NFTSale: ${nftSaleAddr}`);
  
  // Deploy Settlement
  console.log('  Deploying Settlement...');
  result = await execAsync(
    `PRIVATE_KEY=${adminPk} OWNER=${owner} REWARD_FUNDER=${rewardFunderAddress} FOUNDER_NFT_ADDRESS=${founderNftAddr} USDT_ADDRESS=${mockUsdtAddr} SETTLEMENT_PUBLISHER=${settlementPublisher} ROOT_PUBLISHER=${rootPublisher} forge script DeploySettlementClaim --rpc-url ${rpcUrl} --broadcast 2>&1 | tail -20`,
    { cwd: path.join(REPO_ROOT, 'apps/contracts') },
  );
  
  const settlementFiles = fs.readdirSync(path.join(REPO_ROOT, 'apps/contracts/broadcast/DeploySettlementClaim.s.sol/97')).filter(f => f.startsWith('run-') && f.endsWith('.json'));
  const settlementLatest = settlementFiles.sort().pop();
  const settlementSourcePath = path.join(REPO_ROOT, 'apps/contracts/broadcast/DeploySettlementClaim.s.sol/97', settlementLatest);
  const settlementData = JSON.parse(fs.readFileSync(settlementSourcePath, 'utf-8'));
  const settlementAddr = settlementData.transactions.find(t => t.contractName === 'Settlement')?.contractAddress || settlementData.transactions.find(t => t.contractName === 'Settlement' && t.transactionType === 'CREATE')?.contractAddress;
  const merkleAddr = settlementData.transactions.find(t => t.contractName === 'MerkleClaim')?.contractAddress || settlementData.transactions.find(t => t.contractName === 'MerkleClaim' && t.transactionType === 'CREATE')?.contractAddress;
  console.log(`    Settlement: ${settlementAddr}`);
  console.log(`    MerkleDistributor: ${merkleAddr}`);
  
  // Update manifest
  manifest.contracts.paymentTokenAddress = mockUsdtAddr;
  manifest.contracts.founderNftAddress = founderNftAddr;
  manifest.contracts.nftSaleAddress = nftSaleAddr;
  manifest.contracts.settlementAddress = settlementAddr;
  manifest.contracts.merkleDistributorAddress = merkleAddr;
  manifest.infra.server.promotionMerkleDistributorAddress = merkleAddr;
  manifest.roles.rewardFunderAddress = rewardFunderAddress;
  manifest.roles.referralSignerAddress = referralSignerAddress;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('  Manifest updated');

  const archivedBroadcasts = {
    deployMockUsdtBroadcast: archiveBroadcastFile(envName, mockUsdtSourcePath, 'DeployMockUSDT.s.sol'),
    deployCoreBroadcast: archiveBroadcastFile(envName, nftCoreSourcePath, 'DeployNFTCore.s.sol'),
    deploySettlementBroadcast: archiveBroadcastFile(envName, settlementSourcePath, 'DeploySettlementClaim.s.sol'),
  };

  manifest.artifacts = {
    ...(manifest.artifacts ?? {}),
    ...archivedBroadcasts,
  };
  writeCiManifest(envName, manifest);
  writeCiRuntime(envName, {
    archivedBroadcasts,
    envName,
    latestContractConfig: {
      nftSaleAddress: nftSaleAddr,
      paymentTokenAddress: mockUsdtAddr,
      referralSignerAddress,
      referralSignerPrivateKey,
    },
    latestContractDeploymentAt: new Date().toISOString(),
    manifest,
    runtimePath: getCiRuntimePath(envName),
  });
  
  // Set saleContract on FounderNFT
  console.log('  Setting saleContract...');
  await execAsync(
    `cast send ${founderNftAddr} "setSaleContract(address)" ${nftSaleAddr} --private-key ${adminPk} --rpc-url ${rpcUrl} 2>&1`,
  );
  console.log('  Done!');
  
  return {
    archivedBroadcasts,
    founderNftAddr,
    merkleAddr,
    mockUsdtAddr,
    nftSaleAddr,
    referralSignerAddress,
    referralSignerPrivateKey,
    settlementAddr,
  };
}

export async function stopAnvil(envName = 'fork-anvil') {
  try {
    const { stdout } = await execAsync(
      `node scripts/uat/stop-weekly-fork.mjs --env ${envName}`,
      { cwd: REPO_ROOT },
    );
    console.log(`✓ Anvil stopped: ${stdout.trim()}`);
  } catch (e) {
    console.log('Anvil stop: no running instance or already stopped');
  }
}

async function isAnvilReady(rpcUrl, chainId) {
  try {
    const response = await fetch(rpcUrl, {
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    const currentChainId = Number.parseInt(payload.result, 16);
    return currentChainId === Number(chainId);
  } catch {
    return false;
  }
}

export async function resetDb(envName = 'fork-anvil') {
  const { stdout } = await execAsync(
    `node scripts/uat/reset-weekly-fork-db.mjs --env ${envName}`,
    { cwd: REPO_ROOT },
  );
  console.log(`✓ DB reset: ${stdout.trim()}`);
}

export async function advanceTime(seconds, envName = 'fork-anvil') {
  const { stdout } = await execAsync(
    `node scripts/uat/advance-weekly-fork-time.mjs --env ${envName} --seconds ${seconds}`,
    { cwd: REPO_ROOT },
  );
  console.log(`✓ Time advanced: ${stdout.trim()}`);
}

export function getRuntimePath(envName) {
  return getCiRuntimePath(envName);
}

export function getRuntime(envName) {
  const runtimePath = getRuntimePath(envName);
  if (fs.existsSync(runtimePath)) {
    return JSON.parse(fs.readFileSync(runtimePath, 'utf-8'));
  }
  return null;
}
