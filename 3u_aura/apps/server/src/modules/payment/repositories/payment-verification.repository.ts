import { BadRequestException, Injectable } from '@nestjs/common';
import { getAddress, parseEventLogs } from 'viem';
import { PreparedCheckinReceipt } from '../engines/payment-policy.engine';
import { PromotionChainClientService } from '../../shared';

const ERC20_TRANSFER_EVENT_ABI = [
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

@Injectable()
export class PaymentVerificationRepository {
  constructor(
    private readonly promotionChainClientService: PromotionChainClientService,
  ) {}

  async verifyCheckinPayment(
    preparedReceipt: PreparedCheckinReceipt,
  ): Promise<PreparedCheckinReceipt> {
    this.promotionChainClientService.assertSupportedChain(
      preparedReceipt.chainId,
    );

    const config = this.promotionChainClientService.getRuntimeConfig();
    if (!config.paymentTokenAddress || !config.checkinReceiverAddress) {
      throw new BadRequestException(
        'Promotion payment token or check-in receiver is not configured',
      );
    }

    const publicClient = this.promotionChainClientService.getPublicClient();
    const receipt = await publicClient.getTransactionReceipt({
      hash: preparedReceipt.txHash as `0x${string}`,
    });

    if (receipt.status !== 'success') {
      throw new BadRequestException(
        'Check-in transaction is not confirmed successfully on-chain',
      );
    }

    const matchingLog = parseEventLogs({
      abi: ERC20_TRANSFER_EVENT_ABI,
      eventName: 'Transfer',
      logs: receipt.logs,
      strict: false,
    }).find((log) => {
      if (!log.args.from || !log.args.to || log.args.value === undefined) {
        return false;
      }

      return (
        getAddress(log.address) === config.paymentTokenAddress &&
        getAddress(log.args.from) === preparedReceipt.payerAddress &&
        getAddress(log.args.to) === config.checkinReceiverAddress &&
        log.args.value.toString() === preparedReceipt.amountAtomic
      );
    });

    if (!matchingLog) {
      throw new BadRequestException(
        'Check-in transaction does not match the configured payment token, receiver, payer, or amount',
      );
    }

    const block = await publicClient.getBlock({
      blockNumber: receipt.blockNumber,
    });

    return {
      ...preparedReceipt,
      confirmedAt: new Date(Number(block.timestamp) * 1000),
      receiverAddress: config.checkinReceiverAddress,
    };
  }
}
