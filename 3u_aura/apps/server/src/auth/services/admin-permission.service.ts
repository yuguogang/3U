import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAddress } from 'viem';
import type { ConfigOptions } from '@/configuration';

@Injectable()
export class AdminPermissionService {
  constructor(private readonly configService: ConfigService<ConfigOptions>) {}

  isAdminWallet(walletAddress?: string | null): boolean {
    if (!walletAddress) {
      return false;
    }

    const allowlist =
      this.configService.get<ConfigOptions['admin']>('admin')
        ?.allowlistWallets ?? [];
    const normalizedWallet = getAddress(walletAddress);

    return allowlist.some(
      (candidate) => getAddress(candidate) === normalizedWallet,
    );
  }

  assertAdminWallet(walletAddress?: string | null): void {
    if (!this.isAdminWallet(walletAddress)) {
      throw new ForbiddenException(
        'Admin access is not allowed for this wallet',
      );
    }
  }
}
