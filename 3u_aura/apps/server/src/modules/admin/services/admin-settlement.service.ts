import {
  EpochStatus as DbEpochStatus,
  EpochType as DbEpochType,
  type User,
} from '@/db';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type AdminOperationResultEnvelope,
  type AdminOperatorCheckView,
  type AdminPromotionRoleView,
  type AdminPurchasedNftSubsidyCenterView,
  type AdminPurchasedNftSubsidyEpochView,
  type AdminSubsidyCenterQuery,
  type AdminSubsidyPublicationPreviewView,
  type AdminSubsidyPublicationRequest,
  type AdminWeeklySettlementCenterView,
  type AdminWeeklySettlementEpochRequest,
  type AdminWeeklySettlementQuery,
  EpochStatus,
  EpochType,
} from '3u-aura-common';
import { erc20Abi, getAddress } from 'viem';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  type PublishedSubsidyEpochOnChain,
  PurchasedNftChainRepository,
} from '../../claims/repositories/purchased-nft-chain.repository';
import { WeeklyEpochPolicyEngine } from '../../epoch/engines/weekly-epoch-policy.engine';
import { WeeklyEpochApplicationService } from '../../epoch/services/weekly-epoch-application.service';
import { WeeklyEpochRepository } from '../../epoch/repositories/weekly-epoch.repository';
import { RewardPublicationService } from '../../rewards/services/reward-publication.service';
import { RewardsService } from '../../rewards/services/rewards.service';
import { PromotionChainClientService } from '../../shared/services/promotion-chain-client.service';
import { AdminConsoleRepository } from '../repositories/admin-console.repository';

const EMPTY_MERKLE_ROOT =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

type AdminOperator = Pick<User, 'id' | 'walletAddress'>;

function toCommonEpochStatus(status: string): EpochStatus {
  return EpochStatus[status as keyof typeof EpochStatus];
}

function isSameAddress(left?: string, right?: string): boolean {
  if (!left || !right) {
    return false;
  }

  return left.toLowerCase() === right.toLowerCase();
}

function formatUsdtAtomic(amountAtomic: bigint | string): string {
  const atomic =
    typeof amountAtomic === 'bigint' ? amountAtomic : BigInt(amountAtomic);
  const major = atomic / 1_000_000n;
  const minor = atomic % 1_000_000n;
  const paddedMinor = minor.toString().padStart(6, '0').replace(/0+$/, '');

  return paddedMinor ? `${major}.${paddedMinor}` : major.toString();
}

@Injectable()
export class AdminSettlementService {
  constructor(
    private readonly adminConsoleRepository: AdminConsoleRepository,
    private readonly auditTrailService: AuditTrailService,
    private readonly promotionChainClientService: PromotionChainClientService,
    private readonly purchasedNftChainRepository: PurchasedNftChainRepository,
    private readonly rewardPublicationService: RewardPublicationService,
    private readonly rewardsService: RewardsService,
    private readonly weeklyEpochApplicationService: WeeklyEpochApplicationService,
    private readonly weeklyEpochPolicyEngine: WeeklyEpochPolicyEngine,
    private readonly weeklyEpochRepository: WeeklyEpochRepository,
  ) {}

  async getWeeklySettlement(
    operator: AdminOperator,
    query: AdminWeeklySettlementQuery,
  ): Promise<AdminWeeklySettlementCenterView> {
    const runtime = this.promotionChainClientService.getRuntimeConfig();
    const settings = this.weeklyEpochPolicyEngine.getSettings();
    const currentBoundary =
      await this.weeklyEpochApplicationService.getBoundary({
        epochType: EpochType.WEEKLY_PROMOTION,
        referenceAt: query.referenceAt,
      });
    const latestEpochs =
      await this.adminConsoleRepository.listLatestPromotionEpochs(6);
    const selectedEpochNo = query.epochNo ?? currentBoundary.epochNo ?? 1;
    const selectedEpoch = await this.weeklyEpochRepository.findByEpochNo(
      DbEpochType.WEEKLY_PROMOTION,
      selectedEpochNo,
    );
    const publication = selectedEpoch
      ? await this.rewardPublicationService
          .previewEpochRewardPublication(selectedEpochNo)
          .catch(() => undefined)
      : undefined;

    const roles = this.buildRoleViews(operator.walletAddress, runtime);
    const selectedEpochView = selectedEpoch
      ? this.toWeeklySettlementEpochView(selectedEpoch)
      : undefined;
    const totalRewardAmountAtomic = publication?.totalRewardAmountAtomic ?? '0';
    const distributorBalanceAtomic =
      publication?.distributorBalanceAtomic ?? '0';
    const fundingShortfallAtomic =
      BigInt(distributorBalanceAtomic) >= BigInt(totalRewardAmountAtomic)
        ? '0'
        : (
            BigInt(totalRewardAmountAtomic) - BigInt(distributorBalanceAtomic)
          ).toString();
    const draftMerkleRoot = publication?.draftMerkleRoot ?? EMPTY_MERKLE_ROOT;
    const draftGenerated =
      (publication?.claimCount ?? 0) > 0 &&
      draftMerkleRoot !== EMPTY_MERKLE_ROOT;

    return {
      chainId: runtime.chainId,
      checks: this.buildWeeklyChecks({
        currentBoundary,
        draftGenerated,
        publication,
        selectedEpoch,
        settings,
      }),
      currentBoundary,
      distributorBalanceAtomic,
      draftMerkleRoot,
      fundingShortfallAtomic,
      latestEpochs: latestEpochs.map((epoch) => ({
        epochId: epoch.id,
        epochNo: epoch.epochNo,
        participantCount: epoch.participantCount,
        qualifiedTicketCount: epoch.qualifiedTicketCount,
        status: toCommonEpochStatus(epoch.status),
      })),
      merkleDistributorAddress: runtime.merkleDistributorAddress,
      onChainMerkleRoot: publication?.onChainMerkleRoot,
      operatorWallet: operator.walletAddress,
      paymentTokenAddress: runtime.paymentTokenAddress,
      rewardFunderAddress: runtime.rewardFunderAddress,
      rewardFunderAllowanceAtomic:
        publication?.rewardFunderAllowanceAtomic ?? '0',
      rewardFunderBalanceAtomic: publication?.rewardFunderBalanceAtomic ?? '0',
      roles,
      selectedEpoch: selectedEpochView,
      steps: this.buildWeeklySteps({
        draftGenerated,
        draftMerkleRoot,
        publication,
        runtime,
        selectedEpoch,
        totalRewardAmountAtomic,
      }),
      totalRewardAmountAtomic,
      totalRewardAmountUsdt:
        publication?.totalRewardAmountUsdt ??
        formatUsdtAtomic(totalRewardAmountAtomic),
    };
  }

  async executeWeeklySettlementDraft(
    operator: AdminOperator,
    command: AdminWeeklySettlementEpochRequest,
  ): Promise<AdminOperationResultEnvelope<Record<string, unknown>>> {
    const epoch = await this.weeklyEpochRepository.findByEpochNo(
      DbEpochType.WEEKLY_PROMOTION,
      command.epochNo,
    );
    if (!epoch) {
      throw new NotFoundException(
        `Weekly promotion epoch #${command.epochNo} not found`,
      );
    }

    const result = await this.rewardsService.materializeEpochRewards(epoch.id);

    await this.auditTrailService.record({
      action: 'admin.ops.weekly-settlement.draft.execute',
      operatorWallet: operator.walletAddress,
      payload: command,
      targetId: epoch.id,
      targetType: 'WeeklyEpoch',
    });

    return {
      action: 'admin.ops.weekly-settlement.draft.execute',
      dryRun: false,
      result: result as Record<string, unknown>,
    };
  }

  async executeWeeklySettlementPublish(
    operator: AdminOperator,
    command: AdminWeeklySettlementEpochRequest,
  ): Promise<AdminOperationResultEnvelope<Record<string, unknown>>> {
    const epoch = await this.weeklyEpochRepository.findByEpochNo(
      DbEpochType.WEEKLY_PROMOTION,
      command.epochNo,
    );
    if (!epoch) {
      throw new NotFoundException(
        `Weekly promotion epoch #${command.epochNo} not found`,
      );
    }

    const result = await this.rewardsService.publishEpochRewards(epoch.id);

    await this.auditTrailService.record({
      action: 'admin.ops.weekly-settlement.publish.execute',
      operatorWallet: operator.walletAddress,
      payload: command,
      targetId: epoch.id,
      targetType: 'WeeklyEpoch',
    });

    return {
      action: 'admin.ops.weekly-settlement.publish.execute',
      dryRun: false,
      result: result as Record<string, unknown>,
    };
  }

  async getPurchasedNftSubsidyCenter(
    operator: AdminOperator,
    query: AdminSubsidyCenterQuery,
  ): Promise<AdminPurchasedNftSubsidyCenterView> {
    void query;

    const runtime = this.promotionChainClientService.getRuntimeConfig();
    const [currentChainTime, publishedEpochs] = await Promise.all([
      this.purchasedNftChainRepository.getCurrentChainTimestamp(),
      this.purchasedNftChainRepository.listPublishedSubsidyEpochs(),
    ]);

    return {
      chainId: runtime.chainId,
      currentChainTime,
      operatorWallet: operator.walletAddress,
      paymentTokenAddress: runtime.paymentTokenAddress,
      publishedEpochs: publishedEpochs.map((epoch) =>
        this.toPurchasedNftSubsidyEpochView(epoch),
      ),
      roles: this.buildRoleViews(operator.walletAddress, runtime),
      settlementAddress: runtime.settlementAddress,
    };
  }

  async previewSubsidyPublication(
    operator: AdminOperator,
    command: AdminSubsidyPublicationRequest,
  ): Promise<AdminOperationResultEnvelope<AdminSubsidyPublicationPreviewView>> {
    const runtime = this.promotionChainClientService.getRuntimeConfig();
    const roles = this.buildRoleViews(operator.walletAddress, runtime);
    const blockers: string[] = [];

    if (!runtime.settlementAddress) {
      blockers.push('settlement contract is not configured');
    }
    if (!runtime.paymentTokenAddress) {
      blockers.push('payment token is not configured');
    }

    const currentChainTime =
      await this.purchasedNftChainRepository.getCurrentChainTimestamp();
    const claimDeadline = new Date(command.claimDeadline);
    if (Number.isNaN(claimDeadline.getTime())) {
      blockers.push('claim deadline is invalid');
    } else if (claimDeadline.getTime() <= currentChainTime.getTime()) {
      blockers.push('claim deadline must be later than the current chain time');
    }

    const preview = runtime.settlementAddress
      ? await this.purchasedNftChainRepository
          .previewSubsidyEpochPublication(command.epochNo)
          .catch(() => undefined)
      : undefined;
    if (preview) {
      if (command.epochNo > preview.maxSubsidyEpochs) {
        blockers.push(
          `epochNo exceeds maxSubsidyEpochs (${preview.maxSubsidyEpochs})`,
        );
      }
      if (preview.existingEpoch) {
        blockers.push('selected subsidy epoch is already published on-chain');
      }
      if (preview.purchasedSupply <= 0) {
        blockers.push('no purchased NFT supply exists for subsidy publication');
      }
    }

    const estimatedFundingAmountAtomic = preview
      ? (
          BigInt(command.subsidyAmountAtomic) * BigInt(preview.purchasedSupply)
        ).toString()
      : '0';
    const operatorMatchesOwner = isSameAddress(
      operator.walletAddress,
      runtime.ownerAddress,
    );
    const operatorMatchesSettlementPublisher = isSameAddress(
      operator.walletAddress,
      runtime.settlementPublisherAddress,
    );

    let operatorBalanceAtomic = '0';
    let operatorAllowanceAtomic = '0';
    if (runtime.paymentTokenAddress && runtime.settlementAddress) {
      const publicClient = this.promotionChainClientService.getPublicClient();
      const paymentTokenAddress = getAddress(runtime.paymentTokenAddress);
      const settlementAddress = getAddress(runtime.settlementAddress);
      const operatorAddress = getAddress(operator.walletAddress);
      const [balance, allowance] = await Promise.all([
        publicClient.readContract({
          abi: erc20Abi,
          address: paymentTokenAddress,
          args: [operatorAddress],
          functionName: 'balanceOf',
        }),
        publicClient.readContract({
          abi: erc20Abi,
          address: paymentTokenAddress,
          args: [operatorAddress, settlementAddress],
          functionName: 'allowance',
        }),
      ]);
      operatorBalanceAtomic = balance.toString();
      operatorAllowanceAtomic = allowance.toString();
    }

    if (!(operatorMatchesOwner || operatorMatchesSettlementPublisher)) {
      blockers.push(
        'current operator is not the owner or settlement publisher wallet',
      );
    }
    if (BigInt(operatorBalanceAtomic) < BigInt(estimatedFundingAmountAtomic)) {
      blockers.push(
        'operator MockUSDT balance is lower than the required funding amount',
      );
    }
    if (
      BigInt(operatorAllowanceAtomic) < BigInt(estimatedFundingAmountAtomic)
    ) {
      blockers.push(
        'operator allowance to the settlement contract is lower than the required funding amount',
      );
    }

    return {
      action: 'admin.ops.subsidy.publish.preview',
      dryRun: true,
      result: {
        blockers,
        canPublish: blockers.length === 0,
        chainId: runtime.chainId,
        claimDeadline,
        currentChainTime,
        estimatedFundingAmountAtomic,
        financeWalletAddress: runtime.financeWalletAddress,
        operatorAllowanceAtomic,
        operatorBalanceAtomic,
        operatorMatchesOwner,
        operatorMatchesSettlementPublisher,
        operatorWallet: operator.walletAddress,
        paymentTokenAddress: runtime.paymentTokenAddress,
        roles,
        settlementAddress: runtime.settlementAddress,
        settlementPublisherAddress: runtime.settlementPublisherAddress,
        subsidyAmountAtomic: command.subsidyAmountAtomic,
        subsidyAmountUsdt: formatUsdtAtomic(command.subsidyAmountAtomic),
        walletAction: {
          args: [
            String(command.epochNo),
            command.subsidyAmountAtomic,
            String(Math.floor(claimDeadline.getTime() / 1000)),
          ],
          blockers,
          contractAddress: runtime.settlementAddress,
          enabled: blockers.length === 0,
          functionName: 'publishSubsidyEpoch',
          label: 'Publish subsidy epoch',
        },
        epochNo: command.epochNo,
      },
    };
  }

  private buildRoleViews(
    operatorWallet: string,
    runtime: ReturnType<PromotionChainClientService['getRuntimeConfig']>,
  ): AdminPromotionRoleView[] {
    return [
      {
        address: operatorWallet,
        key: 'OPERATOR',
        label: 'Current operator',
        matchesOperator: true,
      },
      {
        address: runtime.ownerAddress,
        key: 'OWNER',
        label: 'Contract owner',
        matchesOperator: isSameAddress(operatorWallet, runtime.ownerAddress),
      },
      {
        address: runtime.rootPublisherAddress,
        key: 'ROOT_PUBLISHER',
        label: 'Merkle root publisher',
        matchesOperator: isSameAddress(
          operatorWallet,
          runtime.rootPublisherAddress,
        ),
      },
      {
        address: runtime.rewardFunderAddress,
        key: 'REWARD_FUNDER',
        label: 'Reward funder',
        matchesOperator: isSameAddress(
          operatorWallet,
          runtime.rewardFunderAddress,
        ),
      },
      {
        address: runtime.checkinReceiverAddress,
        key: 'CHECKIN_RECEIVER',
        label: 'Check-in receiver',
        matchesOperator: isSameAddress(
          operatorWallet,
          runtime.checkinReceiverAddress,
        ),
      },
      {
        address: runtime.financeWalletAddress,
        key: 'FINANCE_WALLET',
        label: 'Finance wallet',
        matchesOperator: isSameAddress(
          operatorWallet,
          runtime.financeWalletAddress,
        ),
      },
      {
        address: runtime.settlementPublisherAddress,
        key: 'SETTLEMENT_PUBLISHER',
        label: 'Subsidy publisher',
        matchesOperator: isSameAddress(
          operatorWallet,
          runtime.settlementPublisherAddress,
        ),
      },
    ];
  }

  private buildWeeklyChecks(params: {
    currentBoundary: {
      endAt?: Date;
    };
    draftGenerated: boolean;
    publication?: Awaited<
      ReturnType<RewardPublicationService['previewEpochRewardPublication']>
    >;
    selectedEpoch: Awaited<
      ReturnType<WeeklyEpochRepository['findByEpochNo']>
    > | null;
    settings: ReturnType<WeeklyEpochPolicyEngine['getSettings']>;
  }): AdminOperatorCheckView[] {
    const checks: AdminOperatorCheckView[] = [];
    const selectedEpoch = params.selectedEpoch;
    const participantCount = selectedEpoch?.participantCount ?? 0;
    const timeBlockers =
      selectedEpoch &&
      selectedEpoch.endAt.getTime() <=
        (params.currentBoundary.endAt?.getTime() ?? Date.now())
        ? []
        : ['selected weekly epoch has not reached endAt yet'];

    checks.push({
      blockers: timeBlockers,
      description:
        'The selected epoch must be fully ended before sync, draft, and publish steps are meaningful.',
      key: 'SETTLEMENT_WINDOW',
      label: 'Settlement window',
      status: timeBlockers.length ? 'BLOCKED' : 'COMPLETED',
      value: selectedEpoch
        ? `${selectedEpoch.startAt.toISOString()} -> ${selectedEpoch.endAt.toISOString()}`
        : undefined,
    });

    const participantBlockers =
      participantCount >= params.settings.minimumParticipants
        ? []
        : [
            `participantCount ${participantCount} < minimumParticipants ${params.settings.minimumParticipants}`,
          ];
    checks.push({
      blockers: participantBlockers,
      description:
        'If participants stay below the minimum threshold, this epoch will roll over instead of producing a normal weekly reward set.',
      key: 'MINIMUM_PARTICIPANTS',
      label: 'Minimum participants',
      status: participantBlockers.length ? 'BLOCKED' : 'COMPLETED',
      value: String(participantCount),
    });

    const draftBlockers = params.draftGenerated
      ? []
      : ['draft merkle claims are not generated yet'];
    checks.push({
      blockers: draftBlockers,
      description:
        'Weekly rewards must be materialized before any funding or root publication can happen.',
      key: 'DRAFT_STATE',
      label: 'Draft state',
      status: params.draftGenerated
        ? 'COMPLETED'
        : selectedEpoch?.status === DbEpochStatus.CALCULATING
          ? 'READY'
          : 'BLOCKED',
      value: params.publication?.draftMerkleRoot,
    });

    const fundingBlockers =
      params.publication && !params.publication.fundingSatisfied
        ? [
            'merkle distributor balance is lower than the total weekly reward amount',
          ]
        : [];
    checks.push({
      blockers: fundingBlockers,
      description:
        'The merkle distributor must already hold enough MockUSDT before root publish and activation.',
      key: 'DISTRIBUTOR_FUNDING',
      label: 'Distributor funding',
      status: params.publication?.fundingSatisfied ? 'COMPLETED' : 'BLOCKED',
      value: params.publication?.totalRewardAmountUsdt,
    });

    const rootBlockers =
      params.publication && !params.publication.rootPublished
        ? ['draft merkle root is not published on-chain']
        : [];
    checks.push({
      blockers: rootBlockers,
      description:
        'Users cannot claim until the exact draft merkle root is published on-chain.',
      key: 'MERKLE_ROOT',
      label: 'Merkle root',
      status: params.publication?.rootPublished ? 'COMPLETED' : 'BLOCKED',
      value: params.publication?.onChainMerkleRoot,
    });

    const activationBlockers =
      params.publication && !params.publication.dbActivated
        ? [...params.publication.blockers]
        : [];
    checks.push({
      blockers: activationBlockers,
      description:
        'Database activation is the final gate that opens claimability after funding and root publication are satisfied.',
      key: 'CLAIM_ACTIVATION',
      label: 'Claims activation',
      status: params.publication?.dbActivated
        ? 'COMPLETED'
        : params.publication?.canActivate
          ? 'READY'
          : 'BLOCKED',
      value: params.publication?.epochStatus,
    });

    return checks;
  }

  private buildWeeklySteps(params: {
    draftGenerated: boolean;
    draftMerkleRoot: string;
    publication?: Awaited<
      ReturnType<RewardPublicationService['previewEpochRewardPublication']>
    >;
    runtime: ReturnType<PromotionChainClientService['getRuntimeConfig']>;
    selectedEpoch: Awaited<
      ReturnType<WeeklyEpochRepository['findByEpochNo']>
    > | null;
    totalRewardAmountAtomic: string;
  }): AdminWeeklySettlementCenterView['steps'] {
    const selectedEpoch = params.selectedEpoch;
    const epochSyncBlockers: string[] = [];
    const generateDraftBlockers: string[] = [];
    const publishDraftBlockers: string[] = [];
    const fundDistributorBlockers: string[] = [];
    const publishRootBlockers: string[] = [];
    const activateClaimsBlockers = [...(params.publication?.blockers ?? [])];

    if (!selectedEpoch) {
      epochSyncBlockers.push('selected weekly epoch is not materialized yet');
      generateDraftBlockers.push(
        'selected weekly epoch is not materialized yet',
      );
      publishDraftBlockers.push(
        'selected weekly epoch is not materialized yet',
      );
    } else if (selectedEpoch.status === DbEpochStatus.OPEN) {
      epochSyncBlockers.push('selected weekly epoch is still OPEN');
    }

    if (!selectedEpoch || selectedEpoch.status !== DbEpochStatus.CALCULATING) {
      generateDraftBlockers.push('weekly epoch is not in CALCULATING state');
    }

    if (!params.draftGenerated) {
      publishDraftBlockers.push('draft merkle claims are not generated yet');
      fundDistributorBlockers.push('draft merkle claims are not generated yet');
      publishRootBlockers.push('draft merkle claims are not generated yet');
    }

    if (!params.publication?.fundingSatisfied) {
      fundDistributorBlockers.push(
        'merkle distributor does not hold enough reward funding yet',
      );
      publishRootBlockers.push(
        'merkle distributor does not hold enough reward funding yet',
      );
    }

    return [
      {
        blockers: epochSyncBlockers,
        description:
          'Sync ended epochs into CALCULATING so the weekly reward pipeline can start from a stable boundary.',
        key: 'EPOCH_SYNC',
        label: 'Epoch Sync',
        status:
          selectedEpoch &&
          selectedEpoch.status !== DbEpochStatus.OPEN &&
          selectedEpoch.status !== DbEpochStatus.PENDING
            ? 'COMPLETED'
            : epochSyncBlockers.length
              ? 'BLOCKED'
              : 'READY',
      },
      {
        blockers: generateDraftBlockers,
        description:
          'Calculate lottery rewards, ranking rewards, merkle claims, and draft root for the selected epoch.',
        key: 'GENERATE_DRAFT',
        label: 'Generate Draft',
        status: params.draftGenerated
          ? 'COMPLETED'
          : generateDraftBlockers.length
            ? 'BLOCKED'
            : 'READY',
        value: params.publication
          ? `${params.publication.claimCount} claims`
          : undefined,
      },
      {
        blockers: publishDraftBlockers,
        description:
          'Persist rollover, consolation, and publish-ready reward state in the database.',
        key: 'PUBLISH_DRAFT',
        label: 'Publish Draft',
        status:
          selectedEpoch &&
          (selectedEpoch.status === DbEpochStatus.ROOT_POSTED ||
            selectedEpoch.status === DbEpochStatus.SETTLED ||
            selectedEpoch.status === DbEpochStatus.CANCELLED)
            ? 'COMPLETED'
            : publishDraftBlockers.length
              ? 'BLOCKED'
              : 'READY',
      },
      {
        action: {
          args: [params.totalRewardAmountAtomic],
          blockers: fundDistributorBlockers,
          contractAddress: params.runtime.merkleDistributorAddress,
          enabled:
            fundDistributorBlockers.length === 1 &&
            fundDistributorBlockers[0] ===
              'merkle distributor does not hold enough reward funding yet' &&
            BigInt(params.totalRewardAmountAtomic) > 0n,
          functionName: 'depositRewardsFromFunder',
          label: 'Fund distributor',
        },
        blockers: fundDistributorBlockers,
        description:
          'Transfer MockUSDT into the merkle distributor when its balance is lower than the weekly total reward amount.',
        key: 'FUND_DISTRIBUTOR',
        label: 'Fund Distributor',
        status: params.publication?.fundingSatisfied
          ? 'COMPLETED'
          : fundDistributorBlockers.length === 1 &&
              fundDistributorBlockers[0] ===
                'merkle distributor does not hold enough reward funding yet'
            ? 'READY'
            : 'BLOCKED',
        value: formatUsdtAtomic(params.totalRewardAmountAtomic),
      },
      {
        action: {
          args: [String(selectedEpoch?.epochNo ?? 0), params.draftMerkleRoot],
          blockers: publishRootBlockers,
          contractAddress: params.runtime.merkleDistributorAddress,
          enabled:
            publishRootBlockers.length === 0 &&
            Boolean(params.runtime.merkleDistributorAddress) &&
            Boolean(selectedEpoch),
          functionName: 'publishRoot',
          label: 'Publish root',
        },
        blockers: publishRootBlockers,
        description:
          'Publish the exact draft merkle root on-chain so activation can later open claimability.',
        key: 'PUBLISH_ROOT',
        label: 'Publish Root',
        status: params.publication?.rootPublished
          ? 'COMPLETED'
          : publishRootBlockers.length
            ? 'BLOCKED'
            : 'READY',
        value: params.draftMerkleRoot,
      },
      {
        blockers: activateClaimsBlockers,
        description:
          'Activate claims in the database only after on-chain root and funding checks both pass.',
        key: 'ACTIVATE_CLAIMS',
        label: 'Activate Claims',
        status: params.publication?.dbActivated
          ? 'COMPLETED'
          : params.publication?.canActivate
            ? 'READY'
            : 'BLOCKED',
      },
    ];
  }

  private toPurchasedNftSubsidyEpochView(
    epoch: PublishedSubsidyEpochOnChain,
  ): AdminPurchasedNftSubsidyEpochView {
    return {
      chainId: epoch.chainId,
      claimDeadline: epoch.claimDeadline,
      claimedPurchasedSupply: epoch.claimedPurchasedSupply,
      contractAddress: epoch.contractAddress,
      eligiblePurchasedSupply: epoch.eligiblePurchasedSupply,
      epochNo: epoch.epochNo,
      maxEligibleTokenId: epoch.maxEligibleTokenId.toString(),
      publishedAt: epoch.publishedAt,
      publishedFundingAmountAtomic: epoch.publishedFundingAmountUsdt,
      remainingBudgetAtomic: epoch.remainingBudgetUsdt,
      subsidyAmountAtomic: epoch.subsidyAmountUsdt,
      subsidyAmountUsdt: formatUsdtAtomic(epoch.subsidyAmountUsdt),
    };
  }

  private toWeeklySettlementEpochView(epoch: {
    endAt: Date;
    epochNo: number;
    id: string;
    lotteryPoolUsdt: { toFixed: (digits?: number) => string };
    merkleRoot: string | null;
    participantCount: number;
    qualifiedTicketCount: number;
    rankingPoolUsdt: { toFixed: (digits?: number) => string };
    rewardJsonUri: string | null;
    rolloverUsdt: { toFixed: (digits?: number) => string };
    snapshotAt: Date | null;
    startAt: Date;
    status: string;
  }): AdminWeeklySettlementCenterView['selectedEpoch'] {
    return {
      endAt: epoch.endAt,
      epochId: epoch.id,
      epochNo: epoch.epochNo,
      lotteryPoolUsdt: epoch.lotteryPoolUsdt.toFixed(0),
      merkleRoot: epoch.merkleRoot ?? undefined,
      participantCount: epoch.participantCount,
      qualifiedTicketCount: epoch.qualifiedTicketCount,
      rankingPoolUsdt: epoch.rankingPoolUsdt.toFixed(0),
      rewardJsonUri: epoch.rewardJsonUri ?? undefined,
      rolloverUsdt: epoch.rolloverUsdt.toFixed(0),
      snapshotAt: epoch.snapshotAt ?? undefined,
      startAt: epoch.startAt,
      status: toCommonEpochStatus(epoch.status),
    };
  }
}
