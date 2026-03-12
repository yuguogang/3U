import { ConfigOptions } from '@/configuration';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, getAddress, http, type PublicClient } from 'viem';

export type PromotionChainRuntimeConfig = {
  chainId: number;
  checkinReceiverAddress?: string;
  merkleDistributorAddress?: string;
  nftSaleAddress?: string;
  paymentTokenAddress?: string;
  rpcUrl: string;
  settlementAddress?: string;
};

@Injectable()
export class PromotionChainClientService {
  private publicClient?: PublicClient;

  constructor(private readonly configService: ConfigService<ConfigOptions>) {}

  assertSupportedChain(chainId: number): void {
    const config = this.getRuntimeConfig();
    if (chainId !== config.chainId) {
      throw new BadRequestException('Unsupported promotion chainId');
    }
  }

  getPublicClient(): PublicClient {
    if (this.publicClient) {
      return this.publicClient;
    }

    const config = this.getRuntimeConfig();
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
    });

    return this.publicClient;
  }

  getRuntimeConfig(): PromotionChainRuntimeConfig {
    const promotion =
      this.configService.get<ConfigOptions['promotion']>('promotion');
    const rpcUrl = promotion?.rpcUrl ?? promotion?.referralRpcUrl;
    if (!rpcUrl) {
      throw new InternalServerErrorException(
        'Promotion chain RPC is not configured',
      );
    }

    return {
      chainId: promotion?.claimChainId ?? 97,
      checkinReceiverAddress: this.normalizeOptionalAddress(
        promotion?.checkinReceiverAddress,
      ),
      merkleDistributorAddress: this.normalizeOptionalAddress(
        promotion?.merkleDistributorAddress,
      ),
      nftSaleAddress: this.normalizeOptionalAddress(promotion?.nftSaleAddress),
      paymentTokenAddress: this.normalizeOptionalAddress(
        promotion?.paymentTokenAddress,
      ),
      rpcUrl,
      settlementAddress: this.normalizeOptionalAddress(
        promotion?.settlementAddress,
      ),
    };
  }

  private normalizeOptionalAddress(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    return getAddress(value);
  }
}
