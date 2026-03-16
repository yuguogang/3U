"use client";

import { useQuery } from "@tanstack/react-query";
import {
  type EvmAddress,
  promotionContracts,
} from "@/lib/promotion-contracts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const promotionRpcUrl =
  process.env.NEXT_PUBLIC_PROMOTION_RPC_URL ||
  "http://127.0.0.1:8545";

const PURCHASE_PRICE_SELECTOR = "0xa7c715e3";
const GET_REMAINING_NFT_SELECTOR = "0x8f97e485";
const REFERRAL_NONCES_SELECTOR = "0x14346d07";
const ALLOWANCE_SELECTOR = "0xdd62ed3e";
const BALANCE_OF_SELECTOR = "0x70a08231";

function stripHexPrefix(value: string) {
  return value.startsWith("0x") ? value.slice(2) : value;
}

function padAddress(address: EvmAddress) {
  return stripHexPrefix(address).padStart(64, "0");
}

function encodeSingleAddressCall(selector: string, address: EvmAddress) {
  return `${selector}${padAddress(address)}`;
}

function encodeTwoAddressCall(
  selector: string,
  first: EvmAddress,
  second: EvmAddress,
) {
  return `${selector}${padAddress(first)}${padAddress(second)}`;
}

function decodeSingleUint256(rawResult: string) {
  return BigInt(rawResult);
}

function decodeUint256Tuple(rawResult: string, size: number) {
  const compact = stripHexPrefix(rawResult);
  return Array.from({ length: size }, (_, index) =>
    BigInt(`0x${compact.slice(index * 64, (index + 1) * 64) || "0"}`),
  );
}

function decodeRemainingSupply(rawResult: string) {
  const values = decodeUint256Tuple(rawResult, 3);
  return [values[0], values[1], values[2]] as const;
}

async function ethCall(to: EvmAddress, data: string) {
  const response = await fetch(promotionRpcUrl, {
    body: JSON.stringify({
      id: `${to}:${data.slice(0, 10)}`,
      jsonrpc: "2.0",
      method: "eth_call",
      params: [
        {
          data,
          to,
        },
        "latest",
      ],
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`eth_call failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    error?: { message?: string };
    result?: string;
  };

  if (payload.error) {
    throw new Error(payload.error.message ?? "eth_call returned an error");
  }

  if (!payload.result) {
    throw new Error("eth_call returned no result");
  }

  return payload.result;
}

export function usePromotionContractState(accountAddress?: EvmAddress) {
  const address = accountAddress ?? undefined;

  const purchasePriceQuery = useQuery({
    enabled: Boolean(promotionContracts.nftSaleAddress),
    queryFn: async () =>
      decodeSingleUint256(
        await ethCall(
          promotionContracts.nftSaleAddress ?? ZERO_ADDRESS,
          PURCHASE_PRICE_SELECTOR,
        ),
      ),
    queryKey: [
      "promotion",
      "contracts",
      "purchase-price",
      promotionContracts.nftSaleAddress,
      promotionRpcUrl,
    ],
  });

  const remainingSupplyQuery = useQuery({
    enabled: Boolean(promotionContracts.nftSaleAddress),
    queryFn: async () =>
      decodeRemainingSupply(
        await ethCall(
          promotionContracts.nftSaleAddress ?? ZERO_ADDRESS,
          GET_REMAINING_NFT_SELECTOR,
        ),
      ),
    queryKey: [
      "promotion",
      "contracts",
      "remaining-supply",
      promotionContracts.nftSaleAddress,
      promotionRpcUrl,
    ],
  });

  const referralNonceQuery = useQuery({
    enabled: Boolean(address && promotionContracts.nftSaleAddress),
    queryFn: async () =>
      decodeSingleUint256(
        await ethCall(
          promotionContracts.nftSaleAddress ?? ZERO_ADDRESS,
          encodeSingleAddressCall(
            REFERRAL_NONCES_SELECTOR,
            address ?? ZERO_ADDRESS,
          ),
        ),
      ),
    queryKey: [
      "promotion",
      "contracts",
      "referral-nonce",
      promotionContracts.nftSaleAddress,
      address ?? null,
      promotionRpcUrl,
    ],
  });

  const allowanceQuery = useQuery({
    enabled: Boolean(
      address &&
        promotionContracts.paymentTokenAddress &&
        promotionContracts.nftSaleAddress,
    ),
    queryFn: async () =>
      decodeSingleUint256(
        await ethCall(
          promotionContracts.paymentTokenAddress ?? ZERO_ADDRESS,
          encodeTwoAddressCall(
            ALLOWANCE_SELECTOR,
            address ?? ZERO_ADDRESS,
            promotionContracts.nftSaleAddress ?? ZERO_ADDRESS,
          ),
        ),
      ),
    queryKey: [
      "promotion",
      "contracts",
      "allowance",
      promotionContracts.paymentTokenAddress,
      promotionContracts.nftSaleAddress,
      address ?? null,
      promotionRpcUrl,
    ],
  });

  const usdtBalanceQuery = useQuery({
    enabled: Boolean(address && promotionContracts.paymentTokenAddress),
    queryFn: async () =>
      decodeSingleUint256(
        await ethCall(
          promotionContracts.paymentTokenAddress ?? ZERO_ADDRESS,
          encodeSingleAddressCall(BALANCE_OF_SELECTOR, address ?? ZERO_ADDRESS),
        ),
      ),
    queryKey: [
      "promotion",
      "contracts",
      "balance",
      promotionContracts.paymentTokenAddress,
      address ?? null,
      promotionRpcUrl,
    ],
  });

  const remainingSupply = remainingSupplyQuery.data;

  return {
    allowance: allowanceQuery.data,
    hasNftSaleConfig: Boolean(promotionContracts.nftSaleAddress),
    hasPaymentTokenConfig: Boolean(promotionContracts.paymentTokenAddress),
    purchasePrice: purchasePriceQuery.data,
    referralNonce: referralNonceQuery.data,
    refetchAllowance: allowanceQuery.refetch,
    refetchRemainingSupply: remainingSupplyQuery.refetch,
    remainingSupply: remainingSupply
      ? {
          purchasedRemaining: remainingSupply[0],
          referralRemaining: remainingSupply[1],
          totalRemaining: remainingSupply[2],
        }
      : undefined,
    usdtBalance: usdtBalanceQuery.data,
  };
}
