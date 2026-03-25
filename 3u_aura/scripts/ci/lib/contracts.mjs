import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  erc20Abi,
  http,
  parseEther,
  parseUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';
import {
  loadManifest,
  loadWalletFixture,
  loadWalletFixtureByAddress,
} from './manifest.mjs';

const mockUsdtMintAbi = [
  ...erc20Abi,
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
];

const founderNftAbi = [
  {
    inputs: [],
    name: 'purchasedMinted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'referralMinted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'quantity', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const nftSaleAbi = [
  {
    inputs: [],
    name: 'PURCHASE_PRICE',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'buyNFT',
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRemainingNFT',
    outputs: [
      { name: 'purchased', type: 'uint256' },
      { name: 'referral', type: 'uint256' },
      { name: 'total', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const settlementAbi = [
  {
    inputs: [],
    name: 'maxSubsidyEpochs',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'epochId', type: 'uint256' }],
    name: 'subsidyEpochs',
    outputs: [
      { name: 'claimDeadline', type: 'uint64' },
      { name: 'publishedAt', type: 'uint64' },
      { name: 'eligiblePurchasedSupply', type: 'uint32' },
      { name: 'claimedPurchasedSupply', type: 'uint32' },
      { name: 'maxEligibleTokenId', type: 'uint32' },
      { name: 'subsidyAmount', type: 'uint128' },
      { name: 'remainingBudget', type: 'uint128' },
      { name: 'published', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'subsidyAmount', type: 'uint128' },
      { name: 'claimDeadline', type: 'uint64' },
    ],
    name: 'publishSubsidyEpoch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'claimPurchasedSubsidy',
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const merkleAbi = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'depositRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'depositRewardsFromFunder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'merkleRoot', type: 'bytes32' },
    ],
    name: 'publishRoot',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'index', type: 'uint256' },
      { name: 'rewardTypeCode', type: 'uint8' },
      { name: 'amount', type: 'uint256' },
      { name: 'merkleProof', type: 'bytes32[]' },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'epochId', type: 'uint256' }, { name: 'index', type: 'uint256' }],
    name: 'isClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rewardFunder',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'epochId', type: 'uint256' }],
    name: 'epochRootById',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export function createPublicClientForFork(envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  return createPublicClient({
    chain: bscTestnet,
    transport: http(manifest.chain.rpcUrl),
  });
}

export function createTestClientForFork(envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  return createTestClient({
    chain: bscTestnet,
    mode: 'anvil',
    transport: http(manifest.chain.rpcUrl),
  });
}

export function createWalletClientForFixture(fixture, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const account = privateKeyToAccount(fixture.privateKey);

  return createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(manifest.chain.rpcUrl),
  });
}

export async function increaseForkTime(seconds, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const response = await fetch(manifest.chain.rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: Date.now(),
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [Number(seconds)],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to increase fork time: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(`Failed to increase fork time: ${payload.error.message}`);
  }

  const testClient = createTestClientForFork(envName);
  await testClient.mine({ blocks: 1 });

  return payload.result;
}

export async function mintUsdt(to, amount, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const adminFixture = loadWalletFixture('admin', envName);
  const publicClient = createPublicClientForFork(envName);
  const walletClient = createWalletClientForFixture(adminFixture, envName);

  const hash = await walletClient.writeContract({
    abi: mockUsdtMintAbi,
    address: manifest.contracts.paymentTokenAddress,
    args: [to, amount],
    functionName: 'mint',
  });

  await publicClient.waitForTransactionReceipt({ hash });
  
  // Mine a block for the mint to take effect
  const testClient = createTestClientForFork(envName);
  await testClient.mine({ blocks: 1 });
  
  return hash;
}

export async function approveUsdt(owner, spender, amount, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);
  const walletClient = createWalletClientForFixture(owner, envName);

  const hash = await walletClient.writeContract({
    abi: erc20Abi,
    address: manifest.contracts.paymentTokenAddress,
    args: [spender, amount],
    functionName: 'approve',
  });

  await publicClient.waitForTransactionReceipt({ hash });
  
  // Mine a block for the approval to take effect
  const testClient = createTestClientForFork(envName);
  await testClient.mine({ blocks: 1 });
  
  return hash;
}

export async function buyNft(buyer, quantity = 1, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);
  const walletClient = createWalletClientForFixture(buyer, envName);
  const testClient = createTestClientForFork(envName);

  if (quantity !== 1) {
    throw new Error(`buyNft only supports quantity=1, got ${quantity}`);
  }

  const hash = await walletClient.writeContract({
    abi: nftSaleAbi,
    address: manifest.contracts.nftSaleAddress,
    functionName: 'buyNFT',
  });

  await publicClient.waitForTransactionReceipt({ hash });
  
  // Mine a block for the purchase to take effect
  await testClient.mine({ blocks: 1 });
  
  return hash;
}

export async function getNftBalance(address, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: founderNftAbi,
    address: manifest.contracts.founderNftAddress,
    args: [address],
    functionName: 'balanceOf',
  });
}

export async function getPurchasedNftCount(envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: founderNftAbi,
    address: manifest.contracts.founderNftAddress,
    functionName: 'purchasedMinted',
  });
}

export async function claimSubsidy(claimant, epochId, tokenId, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);
  const walletClient = createWalletClientForFixture(claimant, envName);

  const hash = await walletClient.writeContract({
    abi: settlementAbi,
    address: manifest.contracts.settlementAddress,
    args: [BigInt(epochId), BigInt(tokenId)],
    functionName: 'claimPurchasedSubsidy',
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function publishSubsidyEpoch(
  publisher,
  {
    claimDeadline,
    epochId,
    subsidyAmount,
  },
  envName = 'fork-anvil',
) {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);
  const walletClient = createWalletClientForFixture(publisher, envName);

  const hash = await walletClient.writeContract({
    abi: settlementAbi,
    address: manifest.contracts.settlementAddress,
    args: [BigInt(epochId), BigInt(subsidyAmount), BigInt(claimDeadline)],
    functionName: 'publishSubsidyEpoch',
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function isSubsidyClaimed(epochId, tokenId, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: settlementAbi,
    address: manifest.contracts.settlementAddress,
    args: [BigInt(epochId), BigInt(tokenId)],
    functionName: 'isClaimed',
  });
}

export async function getPublishedSubsidyEpoch(epochId, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: settlementAbi,
    address: manifest.contracts.settlementAddress,
    args: [BigInt(epochId)],
    functionName: 'subsidyEpochs',
  });
}

export async function depositMerkleRewards(owner, amount, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);
  const rewardFunderAddress =
    manifest.roles.rewardFunderAddress ||
    manifest.roles.checkinReceiverAddress ||
    manifest.roles.owner;
  const rewardFunder = loadWalletFixtureByAddress(rewardFunderAddress, envName);
  const walletClient = createWalletClientForFixture(owner, envName);

  await approveUsdt(
    rewardFunder,
    manifest.contracts.merkleDistributorAddress,
    BigInt(amount),
    envName,
  );

  const hash = await walletClient.writeContract({
    abi: merkleAbi,
    address: manifest.contracts.merkleDistributorAddress,
    args: [BigInt(amount)],
    functionName: 'depositRewardsFromFunder',
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function publishMerkleRoot(owner, epochId, merkleRoot, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);
  const walletClient = createWalletClientForFixture(owner, envName);

  const hash = await walletClient.writeContract({
    abi: merkleAbi,
    address: manifest.contracts.merkleDistributorAddress,
    args: [BigInt(epochId), merkleRoot],
    functionName: 'publishRoot',
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function claimMerkleReward(
  claimant,
  {
    amount,
    epochId,
    index,
    merkleProof,
    rewardTypeCode,
  },
  envName = 'fork-anvil',
) {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);
  const walletClient = createWalletClientForFixture(claimant, envName);

  const hash = await walletClient.writeContract({
    abi: merkleAbi,
    address: manifest.contracts.merkleDistributorAddress,
    args: [
      BigInt(epochId),
      BigInt(index),
      rewardTypeCode,
      BigInt(amount),
      merkleProof,
    ],
    functionName: 'claim',
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function isMerkleClaimed(epochId, index, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: merkleAbi,
    address: manifest.contracts.merkleDistributorAddress,
    args: [BigInt(epochId), BigInt(index)],
    functionName: 'isClaimed',
  });
}

export async function getMerkleRewardFunder(envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: merkleAbi,
    address: manifest.contracts.merkleDistributorAddress,
    functionName: 'rewardFunder',
  });
}

export async function getMerkleEpochRoot(epochId, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: merkleAbi,
    address: manifest.contracts.merkleDistributorAddress,
    args: [BigInt(epochId)],
    functionName: 'epochRootById',
  });
}

export async function getTokenAllowance(ownerAddress, spenderAddress, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: erc20Abi,
    address: manifest.contracts.paymentTokenAddress,
    args: [ownerAddress, spenderAddress],
    functionName: 'allowance',
  });
}

export async function getTokenBalance(address, envName = 'fork-anvil') {
  const manifest = loadManifest(envName);
  const publicClient = createPublicClientForFork(envName);

  return publicClient.readContract({
    abi: erc20Abi,
    address: manifest.contracts.paymentTokenAddress,
    args: [address],
    functionName: 'balanceOf',
  });
}

export async function impersonateAccount(address, envName = 'fork-anvil') {
  const testClient = createTestClientForFork(envName);
  await testClient.impersonateAccount({
    address: address,
  });
}

export async function stopImpersonating(address, envName = 'fork-anvil') {
  const testClient = createTestClientForFork(envName);
  await testClient.stopImpersonatingAccount({
    address: address,
  });
}

export async function setBalance(address, value, envName = 'fork-anvil') {
  const testClient = createTestClientForFork(envName);
  await testClient.setBalance({
    address: address,
    value,
  });
}

export { erc20Abi, nftSaleAbi, parseUnits, parseEther, bscTestnet };
