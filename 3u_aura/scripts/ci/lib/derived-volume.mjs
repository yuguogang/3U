import path from 'node:path';
import { buildTargetContext, REPO_ROOT } from '../../promotion-env/lib.mjs';
import { loadCiRuntime } from './runtime.mjs';

export async function propagateDerivedTeamVolume({
  amountAtomic,
  dateKey,
  envName = 'fork-anvil',
  userId,
}) {
  const runtime = loadCiRuntime(envName);
  const serverRoot = path.join(REPO_ROOT, 'apps', 'server');
  const context = buildTargetContext({
    cwd: serverRoot,
    envName,
    strict: true,
    target: 'server',
  });
  const serverOverrides = runtime?.harness?.serviceEnvOverrides?.server ?? {};
  const previousEnv = { ...process.env };

  Object.assign(process.env, context.env, serverOverrides);

  console.log(`   [derived-volume] bootstrapping app context for userId=${userId}, dateKey=${dateKey}, amountAtomic=${amountAtomic}`);
  await import(new URL('../../../apps/server/node_modules/reflect-metadata/Reflect.js', import.meta.url));
  const { NestFactory } = await import(
    new URL('../../../apps/server/node_modules/@nestjs/core/index.js', import.meta.url)
  );
  const { AppModule } = await import(
    new URL('../../../apps/server/dist/src/app.module.js', import.meta.url)
  );
  const { TransactionOrchestratorService } = await import(
    new URL('../../../apps/server/dist/src/modules/shared/index.js', import.meta.url)
  );
  const { VolumePropagationService } = await import(
    new URL('../../../apps/server/dist/src/modules/volume/index.js', import.meta.url)
  );

  let app;
  try {
    app = await NestFactory.createApplicationContext(AppModule, {
      abortOnError: false,
      logger: ['error', 'warn'],
    });
  } catch (error) {
    throw new Error(
      `Failed to create derived volume app context: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  try {
    console.log(`   [derived-volume] app context ready for userId=${userId}`);
    const transactionOrchestrator = app.get(TransactionOrchestratorService);
    const volumePropagationService = app.get(VolumePropagationService);

    await transactionOrchestrator.run(async (tx) => {
      await volumePropagationService.propagateConfirmedCheckin(
        {
          amountAtomic,
          dateKey,
          sourceCheckinId: `ci-derived:${userId}:${dateKey}:${amountAtomic}`,
          userId,
        },
        tx,
      );
    });
    console.log(`   [derived-volume] propagation committed for userId=${userId}`);

    return {
      amountAtomic,
      dateKey,
      propagated: true,
      userId,
    };
  } finally {
    if (app) {
      await app.close();
    }
    for (const key of Object.keys(process.env)) {
      if (!(key in previousEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, previousEnv);
  }
}
