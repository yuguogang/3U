import { BadRequestException } from '@nestjs/common';
import { encodeAbiParameters, encodeEventTopics } from 'viem';
import { PromotionChainClientService } from '../../shared';
import { PaymentVerificationRepository } from './payment-verification.repository';

const TRANSFER_EVENT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
] as const;

describe('PaymentVerificationRepository', () => {
  const paymentTokenAddress =
    '0x2222222222222222222222222222222222222222' as const;
  const checkinReceiverAddress =
    '0x3333333333333333333333333333333333333333' as const;
  const preparedReceipt = {
    amountAtomic: '3000000',
    chainId: 97,
    confirmedAt: new Date('2026-03-11T00:00:00.000Z'),
    payerAddress: '0x1111111111111111111111111111111111111111' as const,
    tokenSymbol: 'USDT',
    txHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    txHashKey:
      '97:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };

  const createRepository = () => {
    const publicClient = {
      getBlock: jest.fn().mockResolvedValue({
        timestamp: 1_773_319_200n,
      }),
      getTransactionReceipt: jest.fn(),
    };
    const promotionChainClientService = {
      assertSupportedChain: jest.fn(),
      getPublicClient: jest.fn().mockReturnValue(publicClient),
      getRuntimeConfig: jest.fn().mockReturnValue({
        chainId: 97,
        checkinReceiverAddress,
        merkleDistributorAddress: undefined,
        nftSaleAddress: undefined,
        paymentTokenAddress,
        rpcUrl: 'http://127.0.0.1:8545',
        settlementAddress: undefined,
      }),
    };

    return {
      promotionChainClientService,
      publicClient,
      repository: new PaymentVerificationRepository(
        promotionChainClientService as unknown as PromotionChainClientService,
      ),
    };
  };

  it('accepts a matching transfer log and returns the chain confirmation time', async () => {
    const { publicClient, repository } = createRepository();
    const transferLog = {
      data: encodeAbiParameters([{ type: 'uint256' }], [3_000_000n]),
      topics: encodeEventTopics({
        abi: TRANSFER_EVENT_ABI,
        eventName: 'Transfer',
        args: {
          from: preparedReceipt.payerAddress,
          to: checkinReceiverAddress,
        },
      }),
    };

    publicClient.getTransactionReceipt.mockResolvedValue({
      blockNumber: 123n,
      logs: [
        {
          ...transferLog,
          address: paymentTokenAddress,
        },
      ],
      status: 'success',
    });

    await expect(
      repository.verifyCheckinPayment(preparedReceipt),
    ).resolves.toEqual({
      ...preparedReceipt,
      confirmedAt: new Date('2026-03-12T12:40:00.000Z'),
      receiverAddress: checkinReceiverAddress,
    });
  });

  it('rejects receipts without a matching payment transfer', async () => {
    const { publicClient, repository } = createRepository();
    const transferLog = {
      data: encodeAbiParameters([{ type: 'uint256' }], [3_000_000n]),
      topics: encodeEventTopics({
        abi: TRANSFER_EVENT_ABI,
        eventName: 'Transfer',
        args: {
          from: preparedReceipt.payerAddress,
          to: '0x4444444444444444444444444444444444444444' as const,
        },
      }),
    };

    publicClient.getTransactionReceipt.mockResolvedValue({
      blockNumber: 123n,
      logs: [
        {
          ...transferLog,
          address: paymentTokenAddress,
        },
      ],
      status: 'success',
    });

    await expect(
      repository.verifyCheckinPayment(preparedReceipt),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
