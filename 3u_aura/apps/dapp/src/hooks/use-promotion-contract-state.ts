"use client";

import { useAccount, useReadContract } from "wagmi";
import {
  erc20Abi,
  nftSaleAbi,
  promotionContracts,
} from "@/lib/promotion-contracts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export function usePromotionContractState() {
  const { address } = useAccount();

  const purchasePriceQuery = useReadContract({
    abi: nftSaleAbi,
    address: promotionContracts.nftSaleAddress ?? ZERO_ADDRESS,
    functionName: "PURCHASE_PRICE",
    query: {
      enabled: Boolean(promotionContracts.nftSaleAddress),
    },
  });

  const remainingSupplyQuery = useReadContract({
    abi: nftSaleAbi,
    address: promotionContracts.nftSaleAddress ?? ZERO_ADDRESS,
    functionName: "getRemainingNFT",
    query: {
      enabled: Boolean(promotionContracts.nftSaleAddress),
    },
  });

  const referralNonceQuery = useReadContract({
    abi: nftSaleAbi,
    address: promotionContracts.nftSaleAddress ?? ZERO_ADDRESS,
    args: [address ?? ZERO_ADDRESS],
    functionName: "referralNonces",
    query: {
      enabled: Boolean(address && promotionContracts.nftSaleAddress),
    },
  });

  const allowanceQuery = useReadContract({
    abi: erc20Abi,
    address: promotionContracts.paymentTokenAddress ?? ZERO_ADDRESS,
    args: [address ?? ZERO_ADDRESS, promotionContracts.nftSaleAddress ?? ZERO_ADDRESS],
    functionName: "allowance",
    query: {
      enabled: Boolean(
        address &&
          promotionContracts.paymentTokenAddress &&
          promotionContracts.nftSaleAddress,
      ),
    },
  });

  const usdtBalanceQuery = useReadContract({
    abi: erc20Abi,
    address: promotionContracts.paymentTokenAddress ?? ZERO_ADDRESS,
    args: [address ?? ZERO_ADDRESS],
    functionName: "balanceOf",
    query: {
      enabled: Boolean(address && promotionContracts.paymentTokenAddress),
    },
  });

  const remainingSupply = remainingSupplyQuery.data as
    | readonly [bigint, bigint, bigint]
    | undefined;

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
