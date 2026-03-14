import {
  createPublicClient,
  formatEther,
  formatUnits,
  http,
  parseEther,
  parseUnits,
} from "viem";
import { bscTestnet } from "viem/chains";
import type { WalletFixture } from "./runtime";
import { loadRuntimeConfig } from "./runtime";

const erc20BalanceAbi = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type WalletFundingStatus = {
  wallet: WalletFixture;
  currentBnb: string;
  currentMockUsdt: string;
  meetsBnbTarget: boolean;
  meetsMockUsdtTarget: boolean;
};

export async function collectWalletFundingStatuses(
  wallets: WalletFixture[],
): Promise<WalletFundingStatus[]> {
  const runtime = loadRuntimeConfig();
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(runtime.manifest.chain.rpcUrl),
  });

  const statuses: WalletFundingStatus[] = [];

  for (const wallet of wallets) {
    const bnbBalance = await publicClient.getBalance({
      address: wallet.address,
    });
    const mockUsdtBalance = await publicClient.readContract({
      address: runtime.manifest.contracts.paymentTokenAddress,
      abi: erc20BalanceAbi,
      functionName: "balanceOf",
      args: [wallet.address],
    });

    const bnbTarget = parseEther(wallet.funding.targetBnb);
    const mockUsdtTarget = parseUnits(wallet.funding.targetMockUsdt, 6);

    statuses.push({
      wallet,
      currentBnb: formatEther(bnbBalance),
      currentMockUsdt: formatUnits(mockUsdtBalance, 6),
      meetsBnbTarget: bnbBalance >= bnbTarget,
      meetsMockUsdtTarget: mockUsdtBalance >= mockUsdtTarget,
    });
  }

  return statuses;
}
