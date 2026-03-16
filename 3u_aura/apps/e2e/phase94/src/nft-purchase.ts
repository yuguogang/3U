import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import type { WalletFixture } from "./runtime";
import { loadRuntimeConfig } from "./runtime";

const nftSaleAbi = [
  {
    inputs: [],
    name: "PURCHASE_PRICE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "buyNFT",
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getRemainingNFT",
    outputs: [
      { name: "purchasedRemaining", type: "uint256" },
      { name: "referralRemaining", type: "uint256" },
      { name: "totalRemaining", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const founderNftAbi = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "purchasedMinted",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type RemainingSupply = {
  purchasedRemaining: bigint;
  referralRemaining: bigint;
  totalRemaining: bigint;
};

export type PurchasedNftResult = {
  approvedHash?: `0x${string}`;
  balanceAfter: bigint;
  balanceBefore: bigint;
  buyHash: `0x${string}`;
  nftBalanceAfter: bigint;
  nftBalanceBefore: bigint;
  price: bigint;
  purchasedMintedAfter: bigint;
  purchasedMintedBefore: bigint;
  remainingAfter: RemainingSupply;
  remainingBefore: RemainingSupply;
};

function toRemainingSupply(
  value: readonly [bigint, bigint, bigint],
): RemainingSupply {
  return {
    purchasedRemaining: value[0],
    referralRemaining: value[1],
    totalRemaining: value[2],
  };
}

export async function buyPurchasedNft(
  wallet: WalletFixture,
): Promise<PurchasedNftResult> {
  const runtime = loadRuntimeConfig();
  const account = privateKeyToAccount(wallet.privateKey);
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(runtime.manifest.chain.rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(runtime.manifest.chain.rpcUrl),
  });
  const paymentTokenAddress = runtime.manifest.contracts.paymentTokenAddress;
  const nftSaleAddress = runtime.manifest.contracts.nftSaleAddress;
  const founderNftAddress = runtime.manifest.contracts.founderNftAddress;
  const price = await publicClient.readContract({
    abi: nftSaleAbi,
    address: nftSaleAddress,
    functionName: "PURCHASE_PRICE",
  });
  const allowanceBefore = await publicClient.readContract({
    abi: erc20Abi,
    address: paymentTokenAddress,
    args: [account.address, nftSaleAddress],
    functionName: "allowance",
  });
  const balanceBefore = await publicClient.readContract({
    abi: erc20Abi,
    address: paymentTokenAddress,
    args: [account.address],
    functionName: "balanceOf",
  });
  const remainingBefore = toRemainingSupply(
    await publicClient.readContract({
      abi: nftSaleAbi,
      address: nftSaleAddress,
      functionName: "getRemainingNFT",
    }),
  );
  const nftBalanceBefore = await publicClient.readContract({
    abi: founderNftAbi,
    address: founderNftAddress,
    args: [account.address],
    functionName: "balanceOf",
  });
  const purchasedMintedBefore = await publicClient.readContract({
    abi: founderNftAbi,
    address: founderNftAddress,
    functionName: "purchasedMinted",
  });

  if (balanceBefore < price) {
    throw new Error(
      `Wallet ${wallet.name} has insufficient MockUSDT for NFT purchase: balance=${balanceBefore.toString()} price=${price.toString()}`,
    );
  }

  let approvedHash: `0x${string}` | undefined;
  if (allowanceBefore < price) {
    approvedHash = await walletClient.writeContract({
      abi: erc20Abi,
      account,
      address: paymentTokenAddress,
      args: [nftSaleAddress, price],
      functionName: "approve",
    });
    await publicClient.waitForTransactionReceipt({ hash: approvedHash });
  }

  const buyHash = await walletClient.writeContract({
    abi: nftSaleAbi,
    account,
    address: nftSaleAddress,
    functionName: "buyNFT",
  });
  await publicClient.waitForTransactionReceipt({ hash: buyHash });

  const balanceAfter = await publicClient.readContract({
    abi: erc20Abi,
    address: paymentTokenAddress,
    args: [account.address],
    functionName: "balanceOf",
  });
  const remainingAfter = toRemainingSupply(
    await publicClient.readContract({
      abi: nftSaleAbi,
      address: nftSaleAddress,
      functionName: "getRemainingNFT",
    }),
  );
  const nftBalanceAfter = await publicClient.readContract({
    abi: founderNftAbi,
    address: founderNftAddress,
    args: [account.address],
    functionName: "balanceOf",
  });
  const purchasedMintedAfter = await publicClient.readContract({
    abi: founderNftAbi,
    address: founderNftAddress,
    functionName: "purchasedMinted",
  });

  return {
    approvedHash,
    balanceAfter,
    balanceBefore,
    buyHash,
    nftBalanceAfter,
    nftBalanceBefore,
    price,
    purchasedMintedAfter,
    purchasedMintedBefore,
    remainingAfter,
    remainingBefore,
  };
}
