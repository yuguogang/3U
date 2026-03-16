import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  erc20Abi,
  getAddress,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { parseAccount, privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { loadRuntimeConfig, loadWalletFixture, type WalletFixture } from "./runtime";

const mockUsdtMintAbi = [
  ...erc20Abi,
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const founderNftReadAbi = [
  {
    inputs: [],
    name: "purchasedMinted",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const settlementAbi = [
  {
    inputs: [],
    name: "maxSubsidyEpochs",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "epochId", type: "uint256" }],
    name: "subsidyEpochs",
    outputs: [
      { name: "claimDeadline", type: "uint64" },
      { name: "publishedAt", type: "uint64" },
      { name: "eligiblePurchasedSupply", type: "uint32" },
      { name: "claimedPurchasedSupply", type: "uint32" },
      { name: "maxEligibleTokenId", type: "uint32" },
      { name: "subsidyAmount", type: "uint128" },
      { name: "remainingBudget", type: "uint128" },
      { name: "published", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "subsidyAmount", type: "uint128" },
      { name: "claimDeadline", type: "uint64" },
    ],
    name: "publishSubsidyEpoch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "claimPurchasedSubsidy",
    outputs: [{ name: "amount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "isClaimed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type PublishedSubsidyEpochResult = {
  claimDeadline: Date;
  epochId: number;
  publishHash: `0x${string}`;
  publisherAddress: `0x${string}`;
  purchasedSupply: bigint;
  subsidyAmountAtomic: string;
};

type MintMockUsdtParams = {
  amount: bigint;
  recipient: `0x${string}`;
};

function createForkPublicClient() {
  const runtime = loadRuntimeConfig();
  return createPublicClient({
    chain: bscTestnet,
    transport: http(runtime.manifest.chain.rpcUrl),
  });
}

function createForkTestClient() {
  const runtime = loadRuntimeConfig();
  return createTestClient({
    chain: bscTestnet,
    mode: "anvil",
    transport: http(runtime.manifest.chain.rpcUrl),
  });
}

function createWalletClientForFixture(wallet: WalletFixture) {
  const runtime = loadRuntimeConfig();
  const account = privateKeyToAccount(wallet.privateKey);

  return createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(runtime.manifest.chain.rpcUrl),
  });
}

async function getNextUnpublishedEpochId() {
  const runtime = loadRuntimeConfig();
  const publicClient = createForkPublicClient();
  const maxEpochs = await publicClient.readContract({
    abi: settlementAbi,
    address: runtime.manifest.contracts.settlementAddress,
    functionName: "maxSubsidyEpochs",
  });

  for (let epochId = 1; epochId <= Number(maxEpochs); epochId += 1) {
    const epoch = await publicClient.readContract({
      abi: settlementAbi,
      address: runtime.manifest.contracts.settlementAddress,
      args: [BigInt(epochId)],
      functionName: "subsidyEpochs",
    });

    if (!epoch[7]) {
      return epochId;
    }
  }

  throw new Error(`No unpublished subsidy epoch remains within maxSubsidyEpochs=${maxEpochs}`);
}

async function mintMockUsdtToAddress({
  amount,
  recipient,
}: MintMockUsdtParams) {
  const runtime = loadRuntimeConfig();
  const adminWallet = loadWalletFixture("admin", runtime.environment);
  const publicClient = createForkPublicClient();
  const walletClient = createWalletClientForFixture(adminWallet);
  const hash = await walletClient.writeContract({
    abi: mockUsdtMintAbi,
    address: runtime.manifest.contracts.paymentTokenAddress,
    args: [recipient, amount],
    functionName: "mint",
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function publishSubsidyEpochOnFork({
  claimWindowSeconds = 7 * 24 * 60 * 60,
  publisherAddress,
  subsidyAmountUsdt = "5",
}: {
  claimWindowSeconds?: number;
  publisherAddress?: `0x${string}`;
  subsidyAmountUsdt?: string;
} = {}): Promise<PublishedSubsidyEpochResult> {
  const runtime = loadRuntimeConfig();
  const publicClient = createForkPublicClient();
  const testClient = createForkTestClient();
  const publisher = getAddress(
    publisherAddress ??
      runtime.manifest.roles.settlementPublisher ??
      runtime.manifest.roles.owner,
  ) as `0x${string}`;
  const settlementAddress = runtime.manifest.contracts.settlementAddress;
  const paymentTokenAddress = runtime.manifest.contracts.paymentTokenAddress;
  const founderNftAddress = runtime.manifest.contracts.founderNftAddress;
  const subsidyAmount = parseUnits(subsidyAmountUsdt, 6);
  const epochId = await getNextUnpublishedEpochId();
  const purchasedSupply = await publicClient.readContract({
    abi: founderNftReadAbi,
    address: founderNftAddress,
    functionName: "purchasedMinted",
  });

  if (purchasedSupply === 0n) {
    throw new Error("Cannot publish subsidy epoch before at least one purchased NFT exists");
  }

  const latestBlock = await publicClient.getBlock({ blockTag: "latest" });
  const claimDeadline = Number(latestBlock.timestamp) + claimWindowSeconds;
  const requiredFunding = subsidyAmount * purchasedSupply;

  await mintMockUsdtToAddress({
    amount: requiredFunding,
    recipient: publisher,
  });

  await testClient.setBalance({
    address: publisher,
    value: parseEther("10"),
  });
  await testClient.impersonateAccount({
    address: publisher,
  });

  try {
    const publisherWalletClient = createWalletClient({
      account: parseAccount(publisher),
      chain: bscTestnet,
      transport: http(runtime.manifest.chain.rpcUrl),
    });
    const allowance = await publicClient.readContract({
      abi: erc20Abi,
      address: paymentTokenAddress,
      args: [publisher, settlementAddress],
      functionName: "allowance",
    });

    if (allowance < requiredFunding) {
      const approveHash = await publisherWalletClient.writeContract({
        abi: erc20Abi,
        address: paymentTokenAddress,
        args: [settlementAddress, requiredFunding],
        functionName: "approve",
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const publishHash = await publisherWalletClient.writeContract({
      abi: settlementAbi,
      address: settlementAddress,
      args: [BigInt(epochId), subsidyAmount, BigInt(claimDeadline)],
      functionName: "publishSubsidyEpoch",
    });
    await publicClient.waitForTransactionReceipt({ hash: publishHash });

    return {
      claimDeadline: new Date(claimDeadline * 1000),
      epochId,
      publishHash,
      publisherAddress: publisher,
      purchasedSupply,
      subsidyAmountAtomic: subsidyAmount.toString(),
    };
  } finally {
    await testClient.stopImpersonatingAccount({
      address: publisher,
    });
  }
}

export async function claimPurchasedSubsidyOnFork({
  epochId,
  tokenId,
  wallet,
}: {
  epochId: number;
  tokenId: string | number;
  wallet: WalletFixture;
}) {
  const runtime = loadRuntimeConfig();
  const publicClient = createForkPublicClient();
  const walletClient = createWalletClientForFixture(wallet);
  const hash = await walletClient.writeContract({
    abi: settlementAbi,
    address: runtime.manifest.contracts.settlementAddress,
    args: [BigInt(epochId), BigInt(tokenId)],
    functionName: "claimPurchasedSubsidy",
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const claimed = await publicClient.readContract({
    abi: settlementAbi,
    address: runtime.manifest.contracts.settlementAddress,
    args: [BigInt(epochId), BigInt(tokenId)],
    functionName: "isClaimed",
  });

  if (!claimed) {
    throw new Error(
      `Settlement claim state is still false for epoch=${epochId} tokenId=${tokenId}`,
    );
  }

  return {
    claimed,
    txHash: hash,
  };
}
