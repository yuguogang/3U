import { BadRequestException, Injectable } from '@nestjs/common';
import { getAddress, parseEventLogs } from 'viem';
import { PromotionChainClientService } from '../../shared';

const NFT_SALE_REFERRAL_EVENT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'nonce', type: 'uint256' },
      { indexed: false, name: 'digest', type: 'bytes32' },
    ],
    name: 'ReferralNFTMinted',
    type: 'event',
  },
] as const;

const NFT_SALE_REFERRAL_READ_ABI = [
  {
    inputs: [],
    name: 'founderNFT',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export type ReferralMintOnChain = {
  chainId: number;
  contractAddress: string;
  digest?: string;
  mintTxHash: string;
  mintedAt: Date;
  nonce?: number;
  tokenId: bigint;
};

@Injectable()
export class ReferralNftChainRepository {
  constructor(
    private readonly promotionChainClientService: PromotionChainClientService,
  ) {}

  async getReferralMintByTxHash(params: {
    recipient: string;
    txHash: string;
  }): Promise<ReferralMintOnChain> {
    const runtime = this.promotionChainClientService.getRuntimeConfig();
    if (!runtime.nftSaleAddress) {
      throw new BadRequestException(
        'Promotion NFT sale contract is not configured',
      );
    }

    const publicClient = this.promotionChainClientService.getPublicClient();
    const saleAddress = getAddress(runtime.nftSaleAddress);
    const recipientAddress = getAddress(params.recipient);
    const normalizedTxHash = params.txHash.toLowerCase() as `0x${string}`;
    const receipt = await publicClient.getTransactionReceipt({
      hash: normalizedTxHash,
    });

    if (receipt.status !== 'success') {
      throw new BadRequestException(
        'Referral NFT mint transaction is not confirmed successfully on-chain',
      );
    }
    if (!receipt.to || getAddress(receipt.to) !== saleAddress) {
      throw new BadRequestException(
        'Referral NFT mint transaction target contract does not match',
      );
    }
    if (getAddress(receipt.from) !== recipientAddress) {
      throw new BadRequestException(
        'Referral NFT mint transaction sender does not match the authenticated wallet',
      );
    }

    const matchingLog = parseEventLogs({
      abi: NFT_SALE_REFERRAL_EVENT_ABI,
      eventName: 'ReferralNFTMinted',
      logs: receipt.logs,
      strict: false,
    }).find((log) => {
      if (!log.args.recipient || log.args.tokenId === undefined) {
        return false;
      }

      return (
        getAddress(log.address) === saleAddress &&
        getAddress(log.args.recipient) === recipientAddress
      );
    });

    if (!matchingLog || matchingLog.args.tokenId === undefined) {
      throw new BadRequestException(
        'Referral NFT mint transaction does not emit a matching mint event',
      );
    }

    const [founderNftAddress, block] = await Promise.all([
      publicClient.readContract({
        abi: NFT_SALE_REFERRAL_READ_ABI,
        address: saleAddress,
        functionName: 'founderNFT',
      }),
      publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      }),
    ]);

    return {
      chainId: runtime.chainId,
      contractAddress: founderNftAddress,
      digest: matchingLog.args.digest,
      mintTxHash: normalizedTxHash,
      mintedAt: new Date(Number(block.timestamp) * 1000),
      nonce:
        matchingLog.args.nonce !== undefined
          ? Number(matchingLog.args.nonce)
          : undefined,
      tokenId: matchingLog.args.tokenId,
    };
  }
}
