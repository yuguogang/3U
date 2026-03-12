import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LotteryTicketService } from '../src/modules/lottery';
import { WeeklyEpochApplicationService } from '../src/modules/epoch';

function readArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const referenceAt = readArg('reference-at');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const weeklyEpochService = app.get(WeeklyEpochApplicationService);
    const lotteryTicketService = app.get(LotteryTicketService);

    const lifecycle = await weeklyEpochService.syncEpochLifecycle(referenceAt);
    const processedEpochs: Array<{
      epochId: string;
      rollover: Awaited<
        ReturnType<WeeklyEpochApplicationService['prepareRolloverForEpoch']>
      >;
      ticketRefresh: Awaited<
        ReturnType<LotteryTicketService['refreshEligibilityForEpoch']>
      >;
    }> = [];

    for (const epochId of lifecycle.epochsReadyForQualification) {
      const ticketRefresh =
        await lotteryTicketService.refreshEligibilityForEpoch(epochId);
      const rollover =
        await weeklyEpochService.prepareRolloverForEpoch(epochId);
      processedEpochs.push({
        epochId,
        rollover,
        ticketRefresh,
      });
    }

    console.log(
      JSON.stringify(
        {
          currentEpoch: lifecycle.currentEpoch,
          processedEpochs,
          referenceAt: referenceAt ?? new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
