import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { DbService } from '../../src/db';
import { PurchasedNftSyncService } from '../../src/modules/claims/services/purchased-nft-sync.service';

function readArg(name: string) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index !== -1) {
    return process.argv[index + 1];
  }

  const inline = process.argv.find((value) => value.startsWith(`${flag}=`));
  return inline ? inline.slice(flag.length + 1) : undefined;
}

async function main() {
  const walletAddress = readArg('wallet');
  if (!walletAddress) {
    throw new Error(
      'Usage: pnpm --dir apps/server exec tsx scripts/uat/sync-purchased-nft-state.ts --wallet <address>',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const db = app.get(DbService);
    const purchasedNftSyncService = app.get(PurchasedNftSyncService);
    const user = await db.user.findUnique({
      where: {
        walletAddress,
      },
      select: {
        id: true,
        walletAddress: true,
      },
    });

    if (!user) {
      throw new Error(`User not found for wallet ${walletAddress}`);
    }

    const result = await purchasedNftSyncService.syncStateForUser(user);
    process.stdout.write(
      `${JSON.stringify(
        {
          ...result,
          activePurchasedTokenIds: result.activePurchasedTokenIds.map((tokenId) =>
            tokenId.toString(),
          ),
          userId: user.id,
          walletAddress: user.walletAddress,
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
