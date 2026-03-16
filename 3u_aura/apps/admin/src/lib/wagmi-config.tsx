"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";
const promotionRpcUrl =
  process.env.NEXT_PUBLIC_PROMOTION_RPC_URL || bscTestnet.rpcUrls.default.http[0];
const useInjectedWalletForAutomation =
  process.env.NEXT_PUBLIC_E2E_INJECTED_WALLET === "true";

export const config = getDefaultConfig({
  appName: "3U AURA Admin",
  chains: [bscTestnet, bsc],
  projectId,
  ssr: true,
  transports: {
    [bsc.id]: http(bsc.rpcUrls.default.http[0]),
    [bscTestnet.id]: http(promotionRpcUrl),
  },
  wallets: useInjectedWalletForAutomation
    ? [
        {
          groupName: "Automation",
          wallets: [injectedWallet],
        },
      ]
    : undefined,
});
