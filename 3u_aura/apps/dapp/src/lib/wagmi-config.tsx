"use client";

import { injected } from "@wagmi/core";
import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";

const promotionRpcUrl =
  process.env.NEXT_PUBLIC_PROMOTION_RPC_URL || bscTestnet.rpcUrls.default.http[0];
export const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  ssr: true,
  transports: {
    [bsc.id]: http(bsc.rpcUrls.default.http[0]),
    [bscTestnet.id]: http(promotionRpcUrl),
  },
});
