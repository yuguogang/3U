import { DbService, PaymentReceipt, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;
type PaymentReceiptWithCheckin = Prisma.PaymentReceiptGetPayload<{
  include: { checkin: true };
}>;

@Injectable()
export class PaymentRepository {
  constructor(private readonly db: DbService) {}

  async findByTxHashKey(
    txHashKey: string,
    executor: DbExecutor = this.db,
  ): Promise<PaymentReceiptWithCheckin | null> {
    return executor.paymentReceipt.findUnique({
      where: { txHashKey },
      include: { checkin: true },
    });
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
    executor: DbExecutor = this.db,
  ): Promise<PaymentReceipt> {
    return executor.paymentReceipt.create({
      data: {
        amount: data.amount,
        chainId: data.chainId,
        checkinId: data.checkinId,
        confirmedAt: data.confirmedAt,
        payerAddress: data.payerAddress,
        purpose: 'CHECKIN',
        receiverAddress: data.receiverAddress,
        status: 'CONFIRMED',
        tokenSymbol: data.tokenSymbol,
        txHash: data.txHash,
        txHashKey: data.txHashKey,
        userId: data.userId,
      },
    });
  }

  async attachConfirmedCheckin(
    receiptId: string,
    data: {
      checkinId: string;
      confirmedAt: Date;
      receiverAddress?: string;
    },
    executor: DbExecutor = this.db,
  ): Promise<PaymentReceipt> {
    return executor.paymentReceipt.update({
      where: { id: receiptId },
      data: {
        checkinId: data.checkinId,
        confirmedAt: data.confirmedAt,
        receiverAddress: data.receiverAddress,
        status: 'CONFIRMED',
      },
    });
  }
}
