import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DbService } from '../src/db';
import { CheckinApplicationService } from '../src/modules/checkin';
import { UserService } from '../src/user';

function readArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const userId = readArg('user-id');
  const chainId = readArg('chain-id');
  const txHash = readArg('tx-hash');
  const payerAddress = readArg('payer-address');
  const amountAtomic = readArg('amount-atomic') || '3000000';
  const operatorWallet = readArg('operator-wallet');

  if (!userId || !chainId || !txHash || !payerAddress) {
    throw new Error(
      'Usage: pnpm tsx apps/server/scripts/repair-checkin.ts --user-id <id> --chain-id <chainId> --tx-hash <txHash> --payer-address <address> [--amount-atomic 3000000] [--operator-wallet <wallet>]',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userService = app.get(UserService);
    const checkinService = app.get(CheckinApplicationService);
    const db = app.get(DbService);

    const user = await userService.findById(userId, false);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const result = await checkinService.submitCheckinForUser(
      {
        id: user.id,
        walletAddress: user.walletAddress,
      },
      {
        amountAtomic,
        chainId: Number(chainId),
        payerAddress,
        tokenSymbol: 'USDT',
        txHash,
      },
    );

    await db.adminAuditLog.create({
      data: {
        action: 'checkin.repair.script',
        operatorWallet,
        payload: {
          amountAtomic,
          chainId: Number(chainId),
          result,
          txHash,
          userId,
        },
        targetId: result.checkinId,
        targetType: 'Checkin',
      },
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
