import { ClaimType } from "3u-aura-common";

export type EvmAddress = `0x${string}`;

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function asAddress(value?: string): EvmAddress | undefined {
  if (!value || !EVM_ADDRESS_PATTERN.test(value)) {
    return undefined;
  }

  return value as EvmAddress;
}

export const promotionChainId = Number.parseInt(
  process.env.NEXT_PUBLIC_PROMOTION_CHAIN_ID || "97",
  10,
);

export const promotionContracts = {
  founderNftAddress: asAddress(process.env.NEXT_PUBLIC_FOUNDER_NFT_ADDRESS),
  merkleClaimAddress: asAddress(process.env.NEXT_PUBLIC_MERKLE_CLAIM_ADDRESS),
  nftSaleAddress: asAddress(process.env.NEXT_PUBLIC_NFT_SALE_ADDRESS),
  paymentTokenAddress: asAddress(process.env.NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS),
  settlementAddress: asAddress(process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS),
};

export function isPromotionChain(chainId?: number | null) {
  return Boolean(chainId) && chainId === promotionChainId;
}

export function rewardTypeCodeFromClaimType(claimType: ClaimType) {
  switch (claimType) {
    case ClaimType.MERKLE_LOTTERY:
      return 1;
    case ClaimType.MERKLE_RANKING:
      return 2;
    default:
      return undefined;
  }
}

export const erc20Abi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const nftSaleAbi = [
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
  {
    inputs: [{ name: "", type: "address" }],
    name: "referralNonces",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "nonce", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    name: "mintNFTByReferral",
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const merkleClaimAbi = [
  {
    inputs: [{ name: "epochId", type: "uint256" }, { name: "index", type: "uint256" }],
    name: "isClaimed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "index", type: "uint256" },
      { name: "rewardTypeCode", type: "uint8" },
      { name: "amount", type: "uint256" },
      { name: "merkleProof", type: "bytes32[]" },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const settlementAbi = [
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
      { name: "tokenIds", type: "uint256[]" },
    ],
    name: "claimPurchasedSubsidyBatch",
    outputs: [{ name: "totalAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
