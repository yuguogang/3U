import { BadRequestException, Injectable } from '@nestjs/common';
import { getAddress, parseEventLogs } from 'viem';
import { PromotionChainClientService } from '../../shared';

const NFT_SALE_EVENT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'price', type: 'uint256' },
      { indexed: true, name: 'financeWallet', type: 'address' },
    ],
    name: 'PurchasedNFTBought',
    type: 'event',
  },
] as const;

const SETTLEMENT_READ_ABI = [
  {
    inputs: [],
    name: 'founderNFT',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxSubsidyEpochs',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'epochId', type: 'uint256' }],
    name: 'subsidyEpochs',
    outputs: [
      { name: 'claimDeadline', type: 'uint64' },
      { name: 'publishedAt', type: 'uint64' },
      { name: 'eligiblePurchasedSupply', type: 'uint32' },
      { name: 'claimedPurchasedSupply', type: 'uint32' },
      { name: 'maxEligibleTokenId', type: 'uint32' },
      { name: 'subsidyAmount', type: 'uint128' },
      { name: 'remainingBudget', type: 'uint128' },
      { name: 'published', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const FOUNDER_NFT_READ_ABI = [
  {
    inputs: [],
    name: 'purchasedMinted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export type PurchasedMintOnChain = {
  chainId: number;
  contractAddress: string;
  mintTxHash: string;
  mintedAt: Date;
  purchasedPriceUsdt: string;
  tokenId: bigint;
};

export type PublishedSubsidyEpochOnChain = {
  claimedPurchasedSupply: number;
  chainId: number;
  claimDeadline: Date;
  contractAddress: string;
  epochNo: number;
  eligiblePurchasedSupply: number;
  maxEligibleTokenId: bigint;
  publishedFundingAmountUsdt: string;
  publishedAt: Date;
  remainingBudgetUsdt: string;
  subsidyAmountUsdt: string;
};

export type SubsidyPublishPreflightOnChain = {
  contractAddress: string;
  existingEpoch?: PublishedSubsidyEpochOnChain;
  founderNftAddress: string;
  maxSubsidyEpochs: number;
  purchasedSupply: number;
};

type PurchasedNftBoughtLog = {
  args: {
    buyer?: `0x${string}`;
    price?: bigint;
    tokenId?: bigint;
  };
  blockNumber: bigint;
  transactionHash: `0x${string}`;
};

@Injectable()
export class PurchasedNftChainRepository {
  private static readonly LOG_SCAN_BLOCK_RANGE = 5_000n;
  private promotionStartBlock?: bigint;

  constructor(
    private readonly promotionChainClientService: PromotionChainClientService,
  ) {}

  async getPurchasedMintByTxHash(params: {
    buyer: string;
    txHash: string;
  }): Promise<PurchasedMintOnChain> {
    const runtime = this.promotionChainClientService.getRuntimeConfig();
    if (!runtime.nftSaleAddress || !runtime.settlementAddress) {
      throw new BadRequestException(
        'Promotion NFT sale or settlement contract is not configured',
      );
    }

    const publicClient = this.promotionChainClientService.getPublicClient();
    const saleAddress = getAddress(runtime.nftSaleAddress);
    const buyerAddress = getAddress(params.buyer);
    const normalizedTxHash = params.txHash.toLowerCase() as `0x${string}`;
    const receipt = await publicClient.getTransactionReceipt({
      hash: normalizedTxHash,
    });

    if (receipt.status !== 'success') {
      throw new BadRequestException(
        'Purchased NFT transaction is not confirmed successfully on-chain',
      );
    }
    if (!receipt.to || getAddress(receipt.to) !== saleAddress) {
      throw new BadRequestException(
        'Purchased NFT transaction target contract does not match',
      );
    }
    if (getAddress(receipt.from) !== buyerAddress) {
      throw new BadRequestException(
        'Purchased NFT transaction sender does not match the authenticated wallet',
      );
    }

    const matchingLog = parseEventLogs({
      abi: NFT_SALE_EVENT_ABI,
      eventName: 'PurchasedNFTBought',
      logs: receipt.logs,
      strict: false,
    }).find((log) => {
      if (
        !log.args.buyer ||
        log.args.price === undefined ||
        log.args.tokenId === undefined
      ) {
        return false;
      }

      return (
        getAddress(log.address) === saleAddress &&
        getAddress(log.args.buyer) === buyerAddress
      );
    });

    if (
      !matchingLog ||
      matchingLog.args.price === undefined ||
      matchingLog.args.tokenId === undefined
    ) {
      throw new BadRequestException(
        'Purchased NFT transaction does not emit a matching purchase event',
      );
    }

    const [founderNftAddress, block] = await Promise.all([
      publicClient.readContract({
        abi: SETTLEMENT_READ_ABI,
        address: getAddress(runtime.settlementAddress),
        functionName: 'founderNFT',
      }),
      publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      }),
    ]);

    return {
      chainId: runtime.chainId,
      contractAddress: founderNftAddress,
      mintTxHash: normalizedTxHash,
      mintedAt: new Date(Number(block.timestamp) * 1000),
      purchasedPriceUsdt: matchingLog.args.price.toString(),
      tokenId: matchingLog.args.tokenId,
    };
  }

  async listPurchasedMintsForOwner(
    ownerWalletAddress: string,
  ): Promise<PurchasedMintOnChain[]> {
    const runtime = this.promotionChainClientService.getRuntimeConfig();
    if (!runtime.nftSaleAddress || !runtime.settlementAddress) {
      return [];
    }

    const publicClient = this.promotionChainClientService.getPublicClient();
    const fromBlock = await this.resolvePromotionStartBlock();
    const latestBlock = await publicClient.getBlockNumber();
    const [founderNftAddress, logs] = await Promise.all([
      publicClient.readContract({
        abi: SETTLEMENT_READ_ABI,
        address: getAddress(runtime.settlementAddress),
        functionName: 'founderNFT',
      }),
      this.scanPurchasedLogs({
        buyer: getAddress(ownerWalletAddress),
        fromBlock,
        latestBlock,
        saleAddress: getAddress(runtime.nftSaleAddress),
      }),
    ]);
    const blockTimestamps = await this.resolveBlockTimestamps(
      logs.map((log) => log.blockNumber),
    );

    return logs
      .flatMap((log) => {
        if (log.args.price === undefined || log.args.tokenId === undefined) {
          return [];
        }

        return [
          {
            chainId: runtime.chainId,
            contractAddress: founderNftAddress,
            mintTxHash: log.transactionHash,
            mintedAt: blockTimestamps.get(log.blockNumber)!,
            purchasedPriceUsdt: log.args.price.toString(),
            tokenId: log.args.tokenId,
          },
        ];
      })
      .sort((left, right) =>
        left.tokenId < right.tokenId ? -1 : left.tokenId > right.tokenId ? 1 : 0,
      );
  }

  async listPublishedSubsidyEpochs(): Promise<PublishedSubsidyEpochOnChain[]> {
    const runtime = this.promotionChainClientService.getRuntimeConfig();
    if (!runtime.settlementAddress) {
      return [];
    }

    const publicClient = this.promotionChainClientService.getPublicClient();
    const settlementAddress = getAddress(runtime.settlementAddress);
    const maxSubsidyEpochs = await publicClient.readContract({
      abi: SETTLEMENT_READ_ABI,
      address: settlementAddress,
      functionName: 'maxSubsidyEpochs',
    });

    const epochs = await Promise.all(
      Array.from({ length: Number(maxSubsidyEpochs) }, (_, index) =>
        publicClient.readContract({
          abi: SETTLEMENT_READ_ABI,
          address: settlementAddress,
          functionName: 'subsidyEpochs',
          args: [BigInt(index + 1)],
        }),
      ),
    );

    return epochs.flatMap((epoch, index) => {
      if (!epoch[7] || epoch[0] === 0n || epoch[1] === 0n) {
        return [];
      }

      return [
        {
          claimedPurchasedSupply: Number(epoch[3]),
          chainId: runtime.chainId,
          claimDeadline: new Date(Number(epoch[0]) * 1000),
          contractAddress: settlementAddress,
          epochNo: index + 1,
          eligiblePurchasedSupply: Number(epoch[2]),
          maxEligibleTokenId: BigInt(epoch[4]),
          publishedFundingAmountUsdt: (
            BigInt(epoch[5]) * BigInt(epoch[2])
          ).toString(),
          publishedAt: new Date(Number(epoch[1]) * 1000),
          remainingBudgetUsdt: epoch[6].toString(),
          subsidyAmountUsdt: epoch[5].toString(),
        },
      ];
    });
  }

  async getCurrentChainTimestamp(): Promise<Date> {
    const publicClient = this.promotionChainClientService.getPublicClient();
    const block = await publicClient.getBlock({ blockTag: 'latest' });
    return new Date(Number(block.timestamp) * 1000);
  }

  async previewSubsidyEpochPublication(
    epochNo: number,
  ): Promise<SubsidyPublishPreflightOnChain> {
    const runtime = this.promotionChainClientService.getRuntimeConfig();
    if (!runtime.settlementAddress) {
      throw new BadRequestException(
        'Promotion settlement contract is not configured',
      );
    }

    const publicClient = this.promotionChainClientService.getPublicClient();
    const settlementAddress = getAddress(runtime.settlementAddress);
    const [founderNftAddress, maxSubsidyEpochs, epoch] = await Promise.all([
      publicClient.readContract({
        abi: SETTLEMENT_READ_ABI,
        address: settlementAddress,
        functionName: 'founderNFT',
      }),
      publicClient.readContract({
        abi: SETTLEMENT_READ_ABI,
        address: settlementAddress,
        functionName: 'maxSubsidyEpochs',
      }),
      publicClient.readContract({
        abi: SETTLEMENT_READ_ABI,
        address: settlementAddress,
        functionName: 'subsidyEpochs',
        args: [BigInt(epochNo)],
      }),
    ]);

    const purchasedSupply = await publicClient.readContract({
      abi: FOUNDER_NFT_READ_ABI,
      address: getAddress(founderNftAddress),
      functionName: 'purchasedMinted',
    });

    return {
      contractAddress: settlementAddress,
      existingEpoch:
        epoch[7] && epoch[0] > 0n && epoch[1] > 0n
          ? {
              claimedPurchasedSupply: Number(epoch[3]),
              chainId: runtime.chainId,
              claimDeadline: new Date(Number(epoch[0]) * 1000),
              contractAddress: settlementAddress,
              eligiblePurchasedSupply: Number(epoch[2]),
              epochNo,
              maxEligibleTokenId: BigInt(epoch[4]),
              publishedFundingAmountUsdt: (
                BigInt(epoch[5]) * BigInt(epoch[2])
              ).toString(),
              publishedAt: new Date(Number(epoch[1]) * 1000),
              remainingBudgetUsdt: epoch[6].toString(),
              subsidyAmountUsdt: epoch[5].toString(),
            }
          : undefined,
      founderNftAddress: getAddress(founderNftAddress),
      maxSubsidyEpochs: Number(maxSubsidyEpochs),
      purchasedSupply: Number(purchasedSupply),
    };
  }

  private async resolveBlockTimestamps(
    blockNumbers: bigint[],
  ): Promise<Map<bigint, Date>> {
    const timestamps = new Map<bigint, Date>();
    const publicClient = this.promotionChainClientService.getPublicClient();

    for (const blockNumber of new Set(blockNumbers)) {
      const block = await publicClient.getBlock({ blockNumber });
      timestamps.set(blockNumber, new Date(Number(block.timestamp) * 1000));
    }

    return timestamps;
  }

  private async resolvePromotionStartBlock(): Promise<bigint> {
    if (this.promotionStartBlock !== undefined) {
      return this.promotionStartBlock;
    }

    const publicClient = this.promotionChainClientService.getPublicClient();
    const targetTimestampMs = new Date(
      this.promotionChainClientService.getRuntimeConfig().startAt,
    ).getTime();
    let low = 0n;
    let high = await publicClient.getBlockNumber();

    while (low < high) {
      const mid = low + (high - low) / 2n;
      const block = await publicClient.getBlock({ blockNumber: mid });
      const blockTimestampMs = Number(block.timestamp) * 1000;

      if (blockTimestampMs < targetTimestampMs) {
        low = mid + 1n;
      } else {
        high = mid;
      }
    }

    this.promotionStartBlock = low;
    return low;
  }

  private async scanPurchasedLogs(params: {
    buyer: `0x${string}`;
    fromBlock: bigint;
    latestBlock: bigint;
    saleAddress: `0x${string}`;
  }) {
    if (params.fromBlock > params.latestBlock) {
      return [];
    }

    const publicClient = this.promotionChainClientService.getPublicClient();
    const logs: PurchasedNftBoughtLog[] = [];
    let rangeSize = PurchasedNftChainRepository.LOG_SCAN_BLOCK_RANGE;
    let rangeStart = params.fromBlock;

    while (rangeStart <= params.latestBlock) {
      const rangeEnd = this.minBlock(
        rangeStart + rangeSize - 1n,
        params.latestBlock,
      );

      try {
        const batch = await publicClient.getLogs({
          address: params.saleAddress,
          args: {
            buyer: params.buyer,
          },
          event: NFT_SALE_EVENT_ABI[0],
          fromBlock: rangeStart,
          toBlock: rangeEnd,
        });
        logs.push(...(batch as PurchasedNftBoughtLog[]));
        rangeStart = rangeEnd + 1n;
      } catch (error) {
        if (!this.isLimitExceeded(error) || rangeSize === 1n) {
          throw error;
        }

        rangeSize = this.maxBlockRange(rangeSize / 2n, 1n);
      }
    }

    return logs;
  }

  private minBlock(left: bigint, right: bigint): bigint {
    return left < right ? left : right;
  }

  private maxBlockRange(left: bigint, right: bigint): bigint {
    return left > right ? left : right;
  }

  private isLimitExceeded(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === -32005
    ) || String(error).toLowerCase().includes('limit exceeded');
  }
}
