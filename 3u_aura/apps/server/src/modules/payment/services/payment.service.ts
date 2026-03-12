import type { PaymentReceipt, Prisma, User } from '@/db';
import { Injectable } from '@nestjs/common';
import type { PromotionCheckinRequest } from '3u-aura-common';
import {
  PaymentPolicyEngine,
  type PreparedCheckinReceipt,
} from '../engines/payment-policy.engine';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentVerificationRepository } from '../repositories/payment-verification.repository';

type PaymentReceiptWithCheckin = Awaited<
  ReturnType<PaymentRepository['findByTxHashKey']>
>;

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentPolicyEngine: PaymentPolicyEngine,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentVerificationRepository: PaymentVerificationRepository,
  ) {}

  async prepareSubmittedCheckin(
    user: Pick<User, 'walletAddress'>,
    command: PromotionCheckinRequest,
  ): Promise<PreparedCheckinReceipt> {
    const preparedReceipt = this.paymentPolicyEngine.prepareSubmittedCheckin(
      user.walletAddress,
      command,
    );

    return this.paymentVerificationRepository.verifyCheckinPayment(
      preparedReceipt,
    );
  }

  async findByTxHashKey(
    txHashKey: string,
    executor?: Prisma.TransactionClient,
  ): Promise<PaymentReceiptWithCheckin> {
    return this.paymentRepository.findByTxHashKey(txHashKey, executor);
  }

  async createConfirmedCheckinReceipt(
    data: {
      amount: Prisma.Decimal;
      chainId: number;
      checkinId: string;
      confirmedAt: Date;
      payerAddress: string;
      receiverAddress?: string;
      tokenSymbol: string;
      txHash: string;
      txHashKey: string;
      userId: string;
    },
    executor: Prisma.TransactionClient,
  ): Promise<PaymentReceipt> {
    return this.paymentRepository.createConfirmedCheckinReceipt(data, executor);
  }

  async attachConfirmedCheckin(
    receiptId: string,
    data: {
      checkinId: string;
      confirmedAt: Date;
      receiverAddress?: string;
    },
    executor: Prisma.TransactionClient,
  ): Promise<PaymentReceipt> {
    return this.paymentRepository.attachConfirmedCheckin(
      receiptId,
      data,
      executor,
    );
  }
}
