import { ClaimType, RewardType } from '@/db';
import { Injectable } from '@nestjs/common';
import {
  WEEKLY_MERKLE_EMPTY_ROOT,
  WEEKLY_MERKLE_REWARD_TYPE_CODES,
} from '3u-aura-common';
import { concatHex, encodeAbiParameters, getAddress, keccak256 } from 'viem';

type MerkleRewardType = 'LOTTERY_USDT' | 'RANKING_USDT';

const CLAIM_TYPE_BY_REWARD: Record<MerkleRewardType, ClaimType> = {
  LOTTERY_USDT: ClaimType.MERKLE_LOTTERY,
  RANKING_USDT: ClaimType.MERKLE_RANKING,
};

const REWARD_CODE_BY_REWARD: Record<MerkleRewardType, number> = {
  LOTTERY_USDT: WEEKLY_MERKLE_REWARD_TYPE_CODES.LOTTERY_USDT,
  RANKING_USDT: WEEKLY_MERKLE_REWARD_TYPE_CODES.RANKING_USDT,
};

export interface MerkleDraftRewardInput {
  amount: string;
  rewardId: string;
  rewardType: MerkleRewardType;
  userId: string;
  walletAddress: string;
}

export interface MerkleDraftLeaf {
  amount: string;
  claimType: ClaimType;
  leafHash: string;
  leafIndex: number;
  payloadJson: {
    account: string;
    amount: string;
    rewardType: RewardType;
    rewardTypeCode: number;
  };
  proof: string[];
  rewardId: string;
  rewardType: MerkleRewardType;
  tokenSymbol: 'USDT';
  userId: string;
}

export interface MerkleDraftProjection {
  leaves: MerkleDraftLeaf[];
  merkleRoot: string;
}

@Injectable()
export class MerkleDraftEngine {
  buildDraft(rewards: MerkleDraftRewardInput[]): MerkleDraftProjection {
    if (!rewards.length) {
      return {
        leaves: [],
        merkleRoot: WEEKLY_MERKLE_EMPTY_ROOT,
      };
    }

    const leafHashes = rewards.map((reward) => this.encodeLeaf(reward));
    const levels = this.buildLevels(leafHashes);
    const merkleRoot = levels.at(-1)?.[0] ?? WEEKLY_MERKLE_EMPTY_ROOT;
    const leaves = rewards.map((reward, leafIndex) => ({
      amount: reward.amount,
      claimType: CLAIM_TYPE_BY_REWARD[reward.rewardType],
      leafHash: leafHashes[leafIndex],
      leafIndex,
      payloadJson: {
        account: getAddress(reward.walletAddress),
        amount: reward.amount,
        rewardType: reward.rewardType,
        rewardTypeCode: REWARD_CODE_BY_REWARD[reward.rewardType],
      },
      proof: this.buildProof(levels, leafIndex),
      rewardId: reward.rewardId,
      rewardType: reward.rewardType,
      tokenSymbol: 'USDT' as const,
      userId: reward.userId,
    }));

    return {
      leaves,
      merkleRoot,
    };
  }

  verifyLeafProof(data: {
    leafHash: string;
    merkleRoot: string;
    proof: string[];
  }): boolean {
    let current = data.leafHash;

    for (const sibling of data.proof) {
      current = this.hashPair(current, sibling);
    }

    return current.toLowerCase() === data.merkleRoot.toLowerCase();
  }

  private buildLevels(leafHashes: string[]): string[][] {
    const levels = [leafHashes];

    while (levels.at(-1) && levels.at(-1)!.length > 1) {
      const current = levels.at(-1)!;
      const next: string[] = [];

      for (let index = 0; index < current.length; index += 2) {
        const left = current[index];
        const right = current[index + 1];

        next.push(right ? this.hashPair(left, right) : left);
      }

      levels.push(next);
    }

    return levels;
  }

  private buildProof(levels: string[][], leafIndex: number): string[] {
    const proof: string[] = [];
    let currentIndex = leafIndex;

    for (const level of levels.slice(0, -1)) {
      const siblingIndex =
        currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;

      if (siblingIndex < level.length) {
        proof.push(level[siblingIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  private encodeLeaf(reward: MerkleDraftRewardInput): string {
    const encoded = encodeAbiParameters(
      [
        { name: 'account', type: 'address' },
        { name: 'rewardTypeCode', type: 'uint8' },
        { name: 'amount', type: 'uint256' },
      ],
      [
        getAddress(reward.walletAddress),
        REWARD_CODE_BY_REWARD[reward.rewardType],
        BigInt(reward.amount),
      ],
    );

    return keccak256(encoded);
  }

  private hashPair(left: string, right: string): string {
    const [first, second] =
      left.toLowerCase() <= right.toLowerCase() ? [left, right] : [right, left];

    return keccak256(
      concatHex([first as `0x${string}`, second as `0x${string}`]),
    );
  }
}
