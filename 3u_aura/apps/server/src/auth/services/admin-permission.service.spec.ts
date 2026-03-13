import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ConfigOptions } from '@/configuration';
import { getAddress } from 'viem';
import { AdminPermissionService } from './admin-permission.service';

describe('AdminPermissionService', () => {
  const createService = (allowlistWallets: string[] = []) => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'admin') {
          return { allowlistWallets };
        }

        return undefined;
      }),
    };

    return {
      configService,
      service: new AdminPermissionService(
        configService as unknown as ConfigService<ConfigOptions>,
      ),
    };
  };

  it('matches allowlisted wallets case-insensitively after checksum normalization', () => {
    const wallet = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const checksummedWallet = getAddress(wallet);
    const { service } = createService([checksummedWallet]);

    expect(service.isAdminWallet(wallet)).toBe(true);
    expect(service.isAdminWallet(checksummedWallet)).toBe(true);
  });

  it('returns false for empty wallets and non-allowlisted wallets', () => {
    const { service } = createService([
      '0x1111111111111111111111111111111111111111',
    ]);

    expect(service.isAdminWallet(undefined)).toBe(false);
    expect(
      service.isAdminWallet('0x2222222222222222222222222222222222222222'),
    ).toBe(false);
  });

  it('throws forbidden when asserting a wallet outside the allowlist', () => {
    const { service } = createService([
      '0x1111111111111111111111111111111111111111',
    ]);

    expect(() =>
      service.assertAdminWallet('0x2222222222222222222222222222222222222222'),
    ).toThrow(ForbiddenException);
  });
});
