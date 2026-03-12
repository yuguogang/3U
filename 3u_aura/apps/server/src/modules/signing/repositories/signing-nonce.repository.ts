import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getAddress } from 'viem';
import { PromotionChainClientService } from '../../shared';

const NFT_SALE_READ_ABI = [
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'referralNonces',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'referralSigner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

@Injectable()
export class SigningNonceRepository {
  constructor(
    private readonly promotionChainClientService: PromotionChainClientService,
  ) {}

  async readSigningState(params: {
    contractAddress: string;
    recipient: string;
  }): Promise<{ nonce: number; referralSigner: string }> {
    const contractAddress = getAddress(params.contractAddress);
    const recipient = getAddress(params.recipient);
    const publicClient = this.promotionChainClientService.getPublicClient();

    const [nonce, referralSigner] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi: NFT_SALE_READ_ABI,
        functionName: 'referralNonces',
        args: [recipient],
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: NFT_SALE_READ_ABI,
        functionName: 'referralSigner',
      }),
    ]);

    const nonceNumber = Number(nonce);
    if (!Number.isSafeInteger(nonceNumber) || nonceNumber < 0) {
      throw new InternalServerErrorException(
        'Referral nonce exceeds supported safe integer range',
      );
    }

    return {
      nonce: nonceNumber,
      referralSigner: getAddress(referralSigner),
    };
  }
}
