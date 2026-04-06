import { ConfigOptions } from '@/configuration';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, getAddress, http, type PublicClient } from 'viem';

export type PromotionChainRuntimeConfig = {
  adminAllowlistWallets: string[];
  chainId: number;
  checkinReceiverAddress?: string;
  environment?: string;
  financeWalletAddress?: string;
  rewardFunderAddress?: string;
  ownerAddress?: string;
  rootPublisherAddress?: string;
  settlementPublisherAddress?: string;
  merkleDistributorAddress?: string;
  nftSaleAddress?: string;
  paymentTokenAddress?: string;
  rpcUrl: string;
  startAt: string;
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
      adminAllowlistWallets: [
        ...(this.configService.get<ConfigOptions['admin']>('admin')
          ?.allowlistWallets ?? []),
      ].map((wallet) => getAddress(wallet)),
      chainId: promotion?.claimChainId ?? 97,
      checkinReceiverAddress: this.normalizeOptionalAddress(
        promotion?.checkinReceiverAddress,
      ),
      environment: promotion?.environment,
      financeWalletAddress: this.normalizeOptionalAddress(
        promotion?.financeWalletAddress,
      ),
      ownerAddress: this.normalizeOptionalAddress(promotion?.ownerAddress),
      rewardFunderAddress: this.normalizeOptionalAddress(
        promotion?.rewardFunderAddress || promotion?.checkinReceiverAddress,
      ),
      rootPublisherAddress: this.normalizeOptionalAddress(
        promotion?.rootPublisherAddress || promotion?.ownerAddress,
      ),
      settlementPublisherAddress: this.normalizeOptionalAddress(
        promotion?.settlementPublisherAddress ||
          promotion?.financeWalletAddress ||
          promotion?.ownerAddress,
      ),
      merkleDistributorAddress: this.normalizeOptionalAddress(
        promotion?.merkleDistributorAddress,
      ),
      nftSaleAddress: this.normalizeOptionalAddress(promotion?.nftSaleAddress),
      paymentTokenAddress: this.normalizeOptionalAddress(
        promotion?.paymentTokenAddress,
      ),
      rpcUrl,
      startAt: promotion?.startAt ?? '2026-03-11T00:00:00+08:00',
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
