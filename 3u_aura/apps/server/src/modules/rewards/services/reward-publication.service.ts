import { EpochStatus, EpochType, Prisma } from '@/db';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminRewardPublicationExecuteView,
  AdminRewardPublicationPreviewView,
} from '3u-aura-common';
import { type Address, erc20Abi, getAddress } from 'viem';
import { WeeklyEpochRepository } from '../../epoch';
import { MerkleDraftService } from '../../merkle';
import { TransactionOrchestratorService } from '../../shared/services/transaction-orchestrator.service';
import { PromotionChainClientService } from '../../shared/services/promotion-chain-client.service';
import { WeeklyRewardRepository } from '../repositories/weekly-reward.repository';
import { RewardsService } from './rewards.service';

const merkleFundingAbi = [
  {
    inputs: [{ name: 'epochId', type: 'uint256' }],
    name: 'epochRootById',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rewardFunder',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

@Injectable()
export class RewardPublicationService {
  constructor(
    private readonly merkleDraftService: MerkleDraftService,
    private readonly promotionChainClientService: PromotionChainClientService,
    private readonly rewardsService: RewardsService,
    private readonly transactionOrchestrator: TransactionOrchestratorService,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
    private readonly weeklyRewardRepository: WeeklyRewardRepository,
  ) {}

  async previewEpochRewardPublication(
    epochNo: number,
  ): Promise<AdminRewardPublicationPreviewView> {
    const prepared = await this.transactionOrchestrator.run(async (tx) => {
      const epoch = await this.weeklyEpochRepository.findByEpochNo(
        EpochType.WEEKLY_PROMOTION,
        epochNo,
        tx,
      );
      if (!epoch) {
        throw new NotFoundException(`Weekly promotion epoch #${epochNo} not found`);
      }

      const [merkle, rewards] = await Promise.all([
        this.merkleDraftService.inspectDraftForEpoch(epoch.id, tx),
        this.weeklyRewardRepository.listRewardsByTypes(
          {
            epochId: epoch.id,
            rewardTypes: ['LOTTERY_USDT', 'RANKING_USDT'],
          },
          tx,
        ),
      ]);

      const totalRewardAmountAtomic = rewards.reduce(
        (sum, reward) => sum + BigInt(reward.amountUsdt.toFixed(0)),
        0n,
      );

      return {
        claimCount: merkle.claimCount,
        draftMerkleRoot: merkle.merkleRoot,
        epoch,
        totalRewardAmountAtomic,
      };
    });

    const chainConfig = this.promotionChainClientService.getRuntimeConfig();
    const publicClient = this.promotionChainClientService.getPublicClient();
    const distributorAddress = chainConfig.merkleDistributorAddress
      ? (getAddress(chainConfig.merkleDistributorAddress) as Address)
      : undefined;
    const paymentTokenAddress = chainConfig.paymentTokenAddress
      ? (getAddress(chainConfig.paymentTokenAddress) as Address)
      : undefined;
    const expectedRewardFunderAddress = chainConfig.rewardFunderAddress;

    let rewardFunderAddress: Address | undefined;
    let rewardFunderAllowanceAtomic = 0n;
    let rewardFunderBalanceAtomic = 0n;
    let distributorBalanceAtomic = 0n;
    let onChainMerkleRoot: string | undefined;

    if (distributorAddress) {
      rewardFunderAddress = await publicClient.readContract({
        abi: merkleFundingAbi,
        address: distributorAddress,
        functionName: 'rewardFunder',
      });

      onChainMerkleRoot = await publicClient.readContract({
        abi: merkleFundingAbi,
        address: distributorAddress,
        args: [BigInt(prepared.epoch.epochNo)],
        functionName: 'epochRootById',
      });
    }

    if (paymentTokenAddress && distributorAddress) {
      distributorBalanceAtomic = await publicClient.readContract({
        abi: erc20Abi,
        address: paymentTokenAddress,
        args: [distributorAddress],
        functionName: 'balanceOf',
      });
    }

    if (paymentTokenAddress && distributorAddress && rewardFunderAddress) {
      rewardFunderBalanceAtomic = await publicClient.readContract({
        abi: erc20Abi,
        address: paymentTokenAddress,
        args: [rewardFunderAddress],
        functionName: 'balanceOf',
      });
      rewardFunderAllowanceAtomic = await publicClient.readContract({
        abi: erc20Abi,
        address: paymentTokenAddress,
        args: [rewardFunderAddress, distributorAddress],
        functionName: 'allowance',
      });
    }

    const dbActivated =
      prepared.epoch.status === EpochStatus.ROOT_POSTED ||
      prepared.epoch.status === EpochStatus.SETTLED ||
      (prepared.epoch.status === EpochStatus.CANCELLED &&
        prepared.epoch.lotteryStatus === EpochStatus.CANCELLED &&
        prepared.epoch.rankingStatus === EpochStatus.CANCELLED);
    const normalizedDraftRoot = prepared.draftMerkleRoot.toLowerCase();
    const normalizedOnChainRoot = onChainMerkleRoot?.toLowerCase();
    const rootPublished =
      Boolean(normalizedOnChainRoot) &&
      normalizedOnChainRoot === normalizedDraftRoot;
    const balanceSatisfied =
      distributorBalanceAtomic >= prepared.totalRewardAmountAtomic;
    const allowanceSatisfied =
      rewardFunderAllowanceAtomic >= prepared.totalRewardAmountAtomic;
    const fundingSatisfied =
      prepared.totalRewardAmountAtomic === 0n || balanceSatisfied;

    const blockers: string[] = [];
    if (expectedRewardFunderAddress && rewardFunderAddress) {
      const normalizedExpected = getAddress(expectedRewardFunderAddress);
      if (getAddress(rewardFunderAddress) !== normalizedExpected) {
        blockers.push('configured reward funder does not match on-chain rewardFunder');
      }
    }
    if (!rootPublished) {
      blockers.push('weekly root is not published on-chain with the draft merkle root');
    }
    if (!fundingSatisfied) {
      blockers.push('merkle distributor balance is lower than the total weekly reward amount');
    }
    if (dbActivated) {
      blockers.push('weekly epoch is already activated in the database');
    }

    return {
      allowanceSatisfied,
      balanceSatisfied,
      blockers,
      canActivate: blockers.length === 0,
      claimCount: prepared.claimCount,
      dbActivated,
      distributorBalanceAtomic: distributorBalanceAtomic.toString(),
      draftMerkleRoot: prepared.draftMerkleRoot,
      epochId: prepared.epoch.id,
      epochNo: prepared.epoch.epochNo,
      epochStatus: prepared.epoch.status as AdminRewardPublicationPreviewView['epochStatus'],
      expectedRewardFunderAddress,
      fundingSatisfied,
      fundingSourceKind: 'CHECKIN_RECEIVER',
      onChainMerkleRoot,
      rewardFunderAddress,
      rewardFunderAllowanceAtomic: rewardFunderAllowanceAtomic.toString(),
      rewardFunderBalanceAtomic: rewardFunderBalanceAtomic.toString(),
      rootPublished,
      totalRewardAmountAtomic: prepared.totalRewardAmountAtomic.toString(),
      totalRewardAmountUsdt: formatUsdtAtomic(prepared.totalRewardAmountAtomic),
    };
  }

  async materializeEpochRewardDraft(epochNo: number) {
    const epoch = await this.weeklyEpochRepository.findByEpochNo(
      EpochType.WEEKLY_PROMOTION,
      epochNo,
    );
    if (!epoch) {
      throw new NotFoundException(`Weekly promotion epoch #${epochNo} not found`);
    }

    const result = await this.rewardsService.materializeEpochRewards(epoch.id);

    return {
      ...result,
      epochNo: epoch.epochNo,
    };
  }

  async publishEpochRewardDraft(epochNo: number) {
    const epoch = await this.weeklyEpochRepository.findByEpochNo(
      EpochType.WEEKLY_PROMOTION,
      epochNo,
    );
    if (!epoch) {
      throw new NotFoundException(`Weekly promotion epoch #${epochNo} not found`);
    }

    const result = await this.rewardsService.publishEpochRewards(epoch.id);

    return {
      ...result,
      epochNo: epoch.epochNo,
    };
  }

  async activateEpochRewardPublication(
    epochNo: number,
    rewardJsonUri?: string,
  ): Promise<AdminRewardPublicationExecuteView> {
    const preview = await this.previewEpochRewardPublication(epochNo);
    if (!preview.canActivate) {
      throw new ConflictException(
        preview.blockers.join('; ') || 'Reward publication activation is blocked',
      );
    }

    await this.rewardsService.activateEpochRewards(preview.epochId, rewardJsonUri);

    return {
      ...preview,
      activated: true,
      rewardJsonUri,
    };
  }
}

function formatUsdtAtomic(amountAtomic: bigint): string {
  const major = amountAtomic / 1_000_000n;
  const minor = amountAtomic % 1_000_000n;
  const paddedMinor = minor.toString().padStart(6, '0').replace(/0+$/, '');

  return paddedMinor ? `${major}.${paddedMinor}` : major.toString();
}
