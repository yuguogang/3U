export const WEEKLY_MERKLE_EMPTY_ROOT =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const WEEKLY_MERKLE_REWARD_TYPE_CODES = {
  LOTTERY_USDT: 1,
  RANKING_USDT: 2,
} as const;

export type WeeklyMerkleRewardTypeCode =
  (typeof WEEKLY_MERKLE_REWARD_TYPE_CODES)[keyof typeof WEEKLY_MERKLE_REWARD_TYPE_CODES];

export const WEEKLY_MERKLE_LEAF_ENCODING = [
  'address account',
  'uint8 rewardTypeCode',
  'uint256 amount',
] as const;
