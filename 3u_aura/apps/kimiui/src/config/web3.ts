import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc, bscTestnet } from 'wagmi/chains';
import { http } from 'wagmi';

// 3U AURA DApp Web3 Configuration
export const chains = [bsc, bscTestnet] as const;

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3u-aura-dapp-2024';

export const config = getDefaultConfig({
  appName: '3U AURA DApp',
  projectId,
  chains: chains,
  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(import.meta.env.VITE_PROMOTION_RPC_URL),
  },
});

// Contract Addresses
export const CONTRACTS = {
  paymentToken: (import.meta.env.VITE_PAYMENT_TOKEN_ADDRESS as `0x${string}`) || '0x...',
  nftSale: (import.meta.env.VITE_NFT_SALE_ADDRESS as `0x${string}`) || '0x...',
  merkleClaim: (import.meta.env.VITE_MERKLE_CLAIM_ADDRESS as `0x${string}`) || '0x...',
  settlement: (import.meta.env.VITE_SETTLEMENT_ADDRESS as `0x${string}`) || '0x...',
};

// Placeholder for legacy structure if needed
export const LEGACY_CONTRACTS = {
  bsc: {
    founderNFT: '0x...',
    nftSale: '0x...',
    settlement: '0x...',
    merkleClaim: '0x...',
    auraToken: '0x...',
    usdt: '0x55d398326f99059fF775485246999027B3197955',
  },
  bscTestnet: {
    founderNFT: '0x...',
    nftSale: '0x...',
    settlement: '0x...',
    merkleClaim: '0x...',
    auraToken: '0x...',
    usdt: '0x...',
  },
};

// Token Constants
export const TOKENS = {
  USDT: {
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD',
  },
  AURA: {
    symbol: 'AURA',
    decimals: 18,
    name: 'AURA Token',
    totalSupply: '1000000000', // 1 billion
  },
};

// Check-in Constants
export const CHECKIN = {
  cost: '3000000', // 3 USDT in atomic units
  auraReward: '1000', // 1000 AURA per check-in
  lotteryPoolPercentage: 30, // 30%
  treasuryPoolPercentage: 70, // 70%
};

// NFT Constants
export const NFT = {
  purchasePrice: '1000000000', // 1000 USDT in atomic units
  maxPurchasedSupply: 30,
  maxReferralSupply: 70,
  weeklySubsidy: '30000000', // 30 USDT in atomic units
};

// Referral Rewards
export const REFERRAL = {
  directPercentage: 10, // 10%
  indirectPercentage: 5, // 5%
};

// Lottery Constants
export const LOTTERY = {
  cycleDays: 7,
  minParticipants: 12,
  winRate: 50, // 50%
  consolationPrize: '100', // 100 AURA
  prizeDistribution: {
    first: 25, // 25%
    second: 20, // 20%
    third: 15, // 15%
    lucky: 40, // 40%
  },
};
