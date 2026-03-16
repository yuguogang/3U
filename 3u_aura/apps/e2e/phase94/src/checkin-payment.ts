import { createPublicClient, createWalletClient, erc20Abi, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import type { WalletFixture } from "./runtime";
import { loadRuntimeConfig } from "./runtime";

const CHECKIN_PAYMENT_ATOMIC = 3_000_000n;

function getPromotionChain() {
  const runtime = loadRuntimeConfig();

  return {
    ...bscTestnet,
    id: runtime.manifest.chain.id,
    rpcUrls: {
      default: {
        http: [runtime.manifest.chain.rpcUrl],
      },
      public: {
        http: [runtime.manifest.chain.rpcUrl],
      },
    },
  };
}

export async function sendCheckinPayment(wallet: WalletFixture) {
  const runtime = loadRuntimeConfig();
  const chain = getPromotionChain();
  const account = privateKeyToAccount(wallet.privateKey);
  const transport = http(runtime.manifest.chain.rpcUrl);
  const publicClient = createPublicClient({
    chain,
    transport,
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const hash = await walletClient.writeContract({
    abi: erc20Abi,
    account,
    address: runtime.manifest.contracts.paymentTokenAddress,
    args: [
      runtime.manifest.roles.checkinReceiverAddress,
      CHECKIN_PAYMENT_ATOMIC,
    ],
    functionName: "transfer",
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 120_000,
  });

  if (receipt.status !== "success") {
    throw new Error(`Check-in payment tx failed: ${hash}`);
  }

  return {
    amountAtomic: CHECKIN_PAYMENT_ATOMIC.toString(),
    hash,
    receipt,
  };
}
