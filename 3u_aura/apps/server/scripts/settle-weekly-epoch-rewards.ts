import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RewardsService } from '../src/modules/rewards';

function readArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const epochId = readArg('epoch-id');
  const mode = readArg('mode') ?? 'draft';
  const rewardJsonUri = readArg('reward-json-uri');

  if (!epochId) {
    throw new Error(
      'Usage: pnpm tsx scripts/settle-weekly-epoch-rewards.ts --epoch-id <id> [--mode <draft|publish>] [--reward-json-uri <uri>]',
    );
  }
  if (!['draft', 'publish', 'activate'].includes(mode)) {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const rewardsService = app.get(RewardsService);
    const result =
      mode === 'activate'
        ? await rewardsService.activateEpochRewards(epochId, rewardJsonUri)
        : mode === 'publish'
          ? await rewardsService.publishEpochRewards(epochId)
          : await rewardsService.materializeEpochRewards(epochId);

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
