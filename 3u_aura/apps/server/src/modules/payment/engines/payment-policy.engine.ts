import { BadRequestException, Injectable } from '@nestjs/common';
import type { PromotionCheckinRequest } from '3u-aura-common';
import { getAddress, isAddress } from 'viem';

export interface PreparedCheckinReceipt {
  amountAtomic: string;
  chainId: number;
  confirmedAt: Date;
  payerAddress: string;
  receiverAddress?: string;
  tokenSymbol: string;
  txHash: string;
  txHashKey: string;
}

const CHECKIN_PAYMENT_ATOMIC = '3000000';
const CHECKIN_TOKEN_SYMBOL = 'USDT';

@Injectable()
export class PaymentPolicyEngine {
  normalizeTxHashKey(chainId: number, txHash: string): string {
    return `${chainId}:${txHash.toLowerCase()}`;
  }

  prepareSubmittedCheckin(
    walletAddress: string,
    command: PromotionCheckinRequest,
  ): PreparedCheckinReceipt {
    if (!isAddress(walletAddress) || !isAddress(command.payerAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    const normalizedWallet = getAddress(walletAddress);
    const normalizedPayer = getAddress(command.payerAddress);
    if (normalizedWallet !== normalizedPayer) {
      throw new BadRequestException(
        'Payer address must match the authenticated user wallet',
      );
    }

    const tokenSymbol = command.tokenSymbol.toUpperCase();
    if (tokenSymbol !== CHECKIN_TOKEN_SYMBOL) {
      throw new BadRequestException(
        'Only USDT check-in payments are supported',
      );
    }

    if (command.amountAtomic !== CHECKIN_PAYMENT_ATOMIC) {
      throw new BadRequestException('Check-in amount must equal 3 USDT');
    }

    return {
      amountAtomic: command.amountAtomic,
      chainId: command.chainId,
      confirmedAt: new Date(),
      payerAddress: normalizedPayer,
      tokenSymbol,
      txHash: command.txHash.toLowerCase(),
      txHashKey: this.normalizeTxHashKey(command.chainId, command.txHash),
    };
  }
}
