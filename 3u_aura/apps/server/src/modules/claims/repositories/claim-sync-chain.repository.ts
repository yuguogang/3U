import { BadRequestException, Injectable } from '@nestjs/common';
import { getAddress } from 'viem';
import { PromotionChainClientService } from '../../shared';

const MERKLE_CLAIM_READ_ABI = [
  {
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const SETTLEMENT_READ_ABI = [
  {
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

@Injectable()
export class ClaimSyncChainRepository {
  constructor(
    private readonly promotionChainClientService: PromotionChainClientService,
  ) {}

  async verifyMerkleClaim(params: {
    account: string;
    chainId: number;
    contractAddress: string;
    epochNo: number;
    merkleIndex: number;
    txHash: string;
  }): Promise<{ claimedAt: Date; txHash: string }> {
    return this.verifyClaimBase({
      account: params.account,
      chainId: params.chainId,
      contractAddress: params.contractAddress,
      contractCall: async () =>
        this.promotionChainClientService.getPublicClient().readContract({
          abi: MERKLE_CLAIM_READ_ABI,
          address: getAddress(params.contractAddress),
          args: [BigInt(params.epochNo), BigInt(params.merkleIndex)],
          functionName: 'isClaimed',
        }),
      txHash: params.txHash,
    });
  }

  async verifySubsidyClaim(params: {
    account: string;
    chainId: number;
    contractAddress: string;
    epochNo: number;
    tokenId: string;
    txHash: string;
  }): Promise<{ claimedAt: Date; txHash: string }> {
    return this.verifyClaimBase({
      account: params.account,
      chainId: params.chainId,
      contractAddress: params.contractAddress,
      contractCall: async () =>
        this.promotionChainClientService.getPublicClient().readContract({
          abi: SETTLEMENT_READ_ABI,
          address: getAddress(params.contractAddress),
          args: [BigInt(params.epochNo), BigInt(params.tokenId)],
          functionName: 'isClaimed',
        }),
      txHash: params.txHash,
    });
  }

  private async verifyClaimBase(params: {
    account: string;
    chainId: number;
    contractAddress: string;
    contractCall: () => Promise<boolean>;
    txHash: string;
  }): Promise<{ claimedAt: Date; txHash: string }> {
    this.promotionChainClientService.assertSupportedChain(params.chainId);

    const publicClient = this.promotionChainClientService.getPublicClient();
    const account = getAddress(params.account);
    const contractAddress = getAddress(params.contractAddress);
    const txHash = params.txHash.toLowerCase() as `0x${string}`;
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (receipt.status !== 'success') {
      throw new BadRequestException(
        'Claim transaction is not confirmed successfully on-chain',
      );
    }
    if (!receipt.to || getAddress(receipt.to) !== contractAddress) {
      throw new BadRequestException(
        'Claim transaction target contract does not match',
      );
    }
    if (getAddress(receipt.from) !== account) {
      throw new BadRequestException(
        'Claim transaction sender does not match the authenticated wallet',
      );
    }

    const isClaimed = await params.contractCall();
    if (!isClaimed) {
      throw new BadRequestException(
        'Claim transaction is confirmed but claim state is still unclaimed on-chain',
      );
    }

    const block = await publicClient.getBlock({
      blockNumber: receipt.blockNumber,
    });

    return {
      claimedAt: new Date(Number(block.timestamp) * 1000),
      txHash,
    };
  }
}
