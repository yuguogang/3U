import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getAddress } from 'viem';
import { AppModule } from '../src/app.module';
import { DbService, PaymentPurpose } from '../src/db';
import { PurchasedNftSyncService } from '../src/modules/claims/services/purchased-nft-sync.service';

type SyncActor = {
  id: string;
  walletAddress: string;
};

function readArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index !== -1) {
    return process.argv[index + 1];
  }

  const inline = process.argv.find((value) => value.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : undefined;
}

function hasFlag(name: string): boolean {
  const flag = `--${name}`;
  return process.argv.includes(flag);
}

async function resolveTargets(db: DbService): Promise<SyncActor[]> {
  const walletAddress = readArg('wallet');
  const userId = readArg('user-id');
  const purchaseReceiptUsers = hasFlag('purchase-receipt-users');
  const allUsers = hasFlag('all-users');
  const limitValue = readArg('limit');
  const limit = limitValue ? Number.parseInt(limitValue, 10) : undefined;

  if (walletAddress) {
    const user = await db.user.findUnique({
      where: {
        walletAddress: getAddress(walletAddress),
      },
      select: {
        id: true,
        walletAddress: true,
      },
    });

    if (!user) {
      throw new Error(`User not found for wallet ${walletAddress}`);
    }

    return [user];
  }

  if (userId) {
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        walletAddress: true,
      },
    });

    if (!user) {
      throw new Error(`User not found for id ${userId}`);
    }

    return [user];
  }

  if (!purchaseReceiptUsers && !allUsers) {
    throw new Error(
      'Usage: pnpm --dir apps/server exec tsx scripts/reconcile-purchased-nft-state.ts [--wallet <address> | --user-id <id> | --purchase-receipt-users | --all-users] [--limit <n>]',
    );
  }

  return db.user.findMany({
    orderBy: [
      {
        createdAt: 'asc',
      },
      {
        id: 'asc',
      },
    ],
    select: {
      id: true,
      walletAddress: true,
    },
    take: Number.isFinite(limit) ? limit : undefined,
    where: purchaseReceiptUsers
      ? {
          OR: [
            {
              paymentReceipts: {
                some: {
                  purpose: PaymentPurpose.NFT_PURCHASE,
                },
              },
            },
            {
              profile: {
                is: {
                  hasPurchasedNft: true,
                },
              },
            },
          ],
        }
      : undefined,
  });
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const db = app.get(DbService);
    const purchasedNftSyncService = app.get(PurchasedNftSyncService);
    const targets = await resolveTargets(db);

    const summary = {
      claimsCreated: 0,
      claimsUpdated: 0,
      holdingsCreated: 0,
      mutatedUsers: 0,
      processedUsers: 0,
    };
    const users: Array<{
      activePurchasedTokenIds: string[];
      claimsCreated: number;
      claimsUpdated: number;
      hasPurchasedNft: boolean;
      holdingsCreated: number;
      publishedSubsidyEpochs: number;
      userId: string;
      walletAddress: string;
    }> = [];

    for (const user of targets) {
      const result = await purchasedNftSyncService.syncStateForUser(user);
      summary.processedUsers += 1;
      summary.holdingsCreated += result.holdingsCreated;
      summary.claimsCreated += result.claimsCreated;
      summary.claimsUpdated += result.claimsUpdated;

      if (
        result.holdingsCreated > 0 ||
        result.claimsCreated > 0 ||
        result.claimsUpdated > 0
      ) {
        summary.mutatedUsers += 1;
      }

      users.push({
        activePurchasedTokenIds: result.activePurchasedTokenIds,
        claimsCreated: result.claimsCreated,
        claimsUpdated: result.claimsUpdated,
        hasPurchasedNft: result.hasPurchasedNft,
        holdingsCreated: result.holdingsCreated,
        publishedSubsidyEpochs: result.publishedSubsidyEpochs,
        userId: user.id,
        walletAddress: user.walletAddress,
      });
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          scope:
            readArg('wallet') ??
            readArg('user-id') ??
            (hasFlag('purchase-receipt-users')
              ? 'purchase-receipt-users'
              : 'all-users'),
          summary,
          users,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
